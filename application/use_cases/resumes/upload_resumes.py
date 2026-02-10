from dataclasses import dataclass
from pathlib import Path
from typing import final, Optional
from uuid import UUID, uuid4
import tempfile
import shutil

from application.dtos.resumes.resume import UploadResultDTO, ResumeDTO
from application.interfaces.ai.indexer import IndexerProtocol
from application.interfaces.users.uow import UnitOfWorkProtocol
from application.interfaces.resumes.repositories import ResumeRepositoryProtocol
from domain.entities.resumes.resume import ResumeEntity

@final
@dataclass(frozen=True, slots=True, kw_only=True)
class UploadResumesUseCase:
    uow: UnitOfWorkProtocol
    repository: ResumeRepositoryProtocol
    indexer: IndexerProtocol
    storage_dir: Path
    s3_storage: Optional[object] = None  # S3StorageService
    sqlite_storage: Optional[object] = None  # SQLiteFileStorageService
    
    async def execute(
        self, 
        files: list[tuple[str, bytes]], 
        user_id: UUID
    ) -> UploadResultDTO:
        """
        1. Salva arquivos no storage
        2. Indexa no vector store
        3. Persiste metadados no DB
        """
        # Verificar limite de 50 currículos por usuário
        existing_resumes_count = await self.repository.count_by_user_id(user_id)
        if existing_resumes_count >= 50:
            from application.exceptions import BusinessRuleViolationError
            raise BusinessRuleViolationError("Limite máximo de 50 currículos por usuário atingido")

        # Não permitir currículos com o mesmo nome de arquivo (por usuário)
        existing_resumes = await self.repository.get_by_user_id(user_id)
        existing_names = {r.file_name.lower().strip() for r in existing_resumes}
        seen_in_request: set[str] = set()
        for filename, _ in files:
            if not (filename and filename.strip()):
                continue
            key = filename.strip().lower()
            if key in seen_in_request:
                from application.exceptions import BusinessRuleViolationError
                raise BusinessRuleViolationError(
                    f"Não envie o mesmo arquivo mais de uma vez. Nome duplicado: '{filename}'."
                )
            seen_in_request.add(key)
            if key in existing_names:
                from application.exceptions import BusinessRuleViolationError
                raise BusinessRuleViolationError(
                    f"Já existe um currículo com o nome '{filename}'. "
                    "Não é permitido ter mais de um currículo com o mesmo nome. "
                    "Renomeie o arquivo ou exclua o currículo existente."
                )
        
        saved_paths = []
        
        # 1. Salva arquivos
        for filename, content in files:
            file_path = await self._save_file(filename, content)
            saved_paths.append(file_path)
        
        # 2. Prepara arquivos para indexação (baixa do SQLite se necessário)
        print(f"🔍 Preparando {len(saved_paths)} arquivos para indexação...")
        print(f"   Paths salvos: {[str(p) for p in saved_paths]}")
        files_for_indexing, temp_dir = await self._prepare_files_for_indexing(saved_paths)
        print(f"   Paths para indexação: {[str(p) for p in files_for_indexing]}")
        
        try:
            # 3. Indexa documentos
            vector_index_id = await self.indexer.index_documents(files_for_indexing)
        finally:
            # Limpa arquivos temporários se foram criados
            if temp_dir and temp_dir.exists():
                print(f"🧹 Limpando diretório temporário: {temp_dir}")
                shutil.rmtree(temp_dir, ignore_errors=True)
        
        # 3. Cria entidades e persiste
        resume_entities = []
        for path in saved_paths:
            entity = ResumeEntity(
                resume_id=uuid4(),
                candidate_name=self._extract_name(path),
                file_name=path.name,
                file_path=str(path),
                uploaded_by_user_id=user_id,
                vector_index_id=vector_index_id,
                is_indexed=True
            )
            resume_entities.append(entity)
        
        async with self.uow:
            for entity in resume_entities:
                await self.repository.add(entity)
        
        # 4. Retorna DTO
        resume_dtos = [
            ResumeDTO(
                resume_id=e.resume_id,
                candidate_name=e.candidate_name,
                file_name=e.file_name,
                file_path=e.file_path,
                uploaded_at=e.uploaded_at,
                is_indexed=e.is_indexed
            )
            for e in resume_entities
        ]
        
        return UploadResultDTO(
            total_files=len(files),
            indexed_files=len(resume_dtos),
            vector_index_id=vector_index_id,
            resumes=resume_dtos
        )
    
    async def _save_file(self, filename: str, content: bytes) -> Path:
        """Salva arquivo usando SQLite, S3 se disponível, senão usa armazenamento local"""
        ext = Path(filename).suffix.lower()
        
        if self.sqlite_storage:
            # Upload para SQLite (PythonAnywhere)
            print(f"📤 Fazendo upload para SQLite: {filename} ({len(content)} bytes)")
            sqlite_path = await self.sqlite_storage.upload_file(filename, content, ext)
            print(f"✅ Upload concluído: {sqlite_path}")
            return Path(sqlite_path)
            
        elif self.s3_storage:
            # Upload para S3/DigitalOcean Spaces
            s3_key = self.s3_storage.upload_file(filename, content, ext)
            # Retorna um Path "virtual" com a chave S3
            return Path(f"s3://{s3_key}")
        else:
            # Armazenamento local (fallback)
            subdir = self.storage_dir / ext.replace('.', '')
            subdir.mkdir(parents=True, exist_ok=True)
            file_path = subdir / filename
            file_path.write_bytes(content)
            return file_path
    
    async def _prepare_files_for_indexing(self, saved_paths: list[Path]) -> tuple[list[Path], Optional[Path]]:
        """
        Prepara arquivos para indexação. Se os arquivos estão no SQLite,
        baixa para um diretório temporário local.
        
        Returns:
            tuple: (lista de paths locais para indexação, diretório temporário ou None)
        """
        temp_dir = None
        local_paths = []
        
        for path in saved_paths:
            path_str = str(path)
            # No Windows, Path("sqlite://pdf/x.pdf") vira "sqlite:\pdf\x.pdf"; normalizar para detectar
            path_str_norm = path_str.replace("\\", "/")
            print(f"🔍 Verificando path: {path_str_norm} (tipo: {type(path)})")
            
            # Se é um arquivo SQLite (local ou HTTP), precisa baixar para temp para indexar
            if path_str_norm.startswith("sqlite://") or path_str_norm.startswith("sqlite:/"):
                if not self.sqlite_storage:
                    raise ValueError("SQLite storage não disponível para baixar arquivos")
                
                # Cria diretório temporário na primeira vez
                if temp_dir is None:
                    temp_dir = Path(tempfile.mkdtemp(prefix="sqlite_index_"))
                    print(f"📁 Criado diretório temporário para indexação: {temp_dir}")
                
                # Chave para download: sempre no formato sqlite://ext/filename
                if path_str_norm.startswith("sqlite:/") and not path_str_norm.startswith("sqlite://"):
                    path_str_norm = "sqlite://" + path_str_norm[len("sqlite:"):].lstrip("/")
                
                # Baixa o arquivo do SQLite (ou via HTTP PythonAnywhere)
                print(f"📥 Baixando {path_str_norm} do storage para indexação...")
                file_content = await self.sqlite_storage.download_file(path_str_norm)
                
                # Extrai o nome do arquivo: sqlite://pdf/arquivo.pdf -> arquivo.pdf
                file_key = path_str_norm.replace("sqlite://", "").replace("sqlite:/", "").lstrip("/")
                filename = file_key.split("/")[-1] if "/" in file_key else file_key
                
                # Salva no diretório temporário
                local_path = temp_dir / filename
                local_path.write_bytes(file_content)
                local_paths.append(local_path)
                print(f"✅ Arquivo baixado: {local_path} ({len(file_content)} bytes)")
            else:
                # Arquivo já está local, usa diretamente
                local_paths.append(path)
        
        return local_paths, temp_dir
    
    def _extract_name(self, path: Path) -> str:
        # Implementar extração de nome do PDF/DOCX
        return path.stem