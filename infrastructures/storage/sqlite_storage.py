import sqlite3
import logging
from pathlib import Path
from typing import Optional, Tuple
from datetime import datetime
import asyncio
import aiosqlite
import base64
import httpx

logger = logging.getLogger(__name__)

class SQLiteFileStorageService:
    """Serviço para armazenamento de arquivos como BLOBs no SQLite"""
    
    def __init__(self, database_url: str):
        self.database_url = database_url
        self._initialized = False
    
    async def _ensure_initialized(self):
        """Garante que as tabelas estão criadas"""
        if self._initialized:
            return
            
        async with aiosqlite.connect(self.database_url) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS file_storage (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    file_key TEXT UNIQUE NOT NULL,
                    filename TEXT NOT NULL,
                    content_type TEXT NOT NULL,
                    file_size INTEGER NOT NULL,
                    file_content BLOB NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Índice para busca rápida por file_key
            await db.execute("""
                CREATE INDEX IF NOT EXISTS idx_file_key 
                ON file_storage(file_key)
            """)
            
            await db.commit()
            
        self._initialized = True
        logger.info(f"SQLite file storage initialized: {self.database_url}")
    
    async def upload_file(self, filename: str, content: bytes, extension: str) -> str:
        """
        Upload de arquivo para o SQLite como BLOB
        
        Args:
            filename: Nome do arquivo
            content: Conteúdo do arquivo em bytes
            extension: Extensão do arquivo (ex: 'pdf', 'docx')
        
        Returns:
            String com a chave do arquivo (formato: sqlite://extension/filename)
        """
        await self._ensure_initialized()
        
        try:
            # Remove o ponto da extensão se houver
            ext_clean = extension.replace('.', '')
            
            # Cria a chave no formato: pdf/arquivo.pdf
            file_key = f"{ext_clean}/{filename}"
            
            # Determina o content-type
            content_type = self._get_content_type(extension)
            
            async with aiosqlite.connect(self.database_url) as db:
                await db.execute("""
                    INSERT OR REPLACE INTO file_storage 
                    (file_key, filename, content_type, file_size, file_content, updated_at)
                    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                """, (file_key, filename, content_type, len(content), content))
                
                await db.commit()
            
            logger.info(f"Arquivo enviado com sucesso para SQLite: {file_key}")
            return f"sqlite://{file_key}"
            
        except Exception as e:
            logger.error(f"Erro ao fazer upload do arquivo {filename}: {e}")
            raise ValueError(f"Falha no upload: {e}")
    
    async def download_file(self, file_key: str) -> bytes:
        """
        Download de arquivo do SQLite
        
        Args:
            file_key: Chave do arquivo (ex: "pdf/arquivo.pdf" ou "sqlite://pdf/arquivo.pdf")
            
        Returns:
            Conteúdo do arquivo em bytes
        """
        await self._ensure_initialized()
        
        # Remove prefixo sqlite:// se presente
        if file_key.startswith("sqlite://"):
            file_key = file_key[9:]  # Remove 'sqlite://'
        
        try:
            async with aiosqlite.connect(self.database_url) as db:
                cursor = await db.execute("""
                    SELECT file_content FROM file_storage 
                    WHERE file_key = ?
                """, (file_key,))
                
                row = await cursor.fetchone()
                
                if not row:
                    raise FileNotFoundError(f"Arquivo não encontrado: {file_key}")
                
                return row[0]  # file_content (BLOB)
                
        except Exception as e:
            if isinstance(e, FileNotFoundError):
                raise
            logger.error(f"Erro ao fazer download do arquivo {file_key}: {e}")
            raise ValueError(f"Falha no download: {e}")
    
    async def file_exists(self, file_key: str) -> bool:
        """Verifica se um arquivo existe no SQLite"""
        await self._ensure_initialized()
        
        # Remove prefixo sqlite:// se presente
        if file_key.startswith("sqlite://"):
            file_key = file_key[9:]
        
        try:
            async with aiosqlite.connect(self.database_url) as db:
                cursor = await db.execute("""
                    SELECT 1 FROM file_storage 
                    WHERE file_key = ? 
                    LIMIT 1
                """, (file_key,))
                
                row = await cursor.fetchone()
                return row is not None
                
        except Exception as e:
            logger.error(f"Erro ao verificar existência do arquivo {file_key}: {e}")
            return False
    
    async def delete_file(self, file_key: str) -> bool:
        """Deleta um arquivo do SQLite"""
        await self._ensure_initialized()
        
        # Remove prefixo sqlite:// se presente
        if file_key.startswith("sqlite://"):
            file_key = file_key[9:]
        
        try:
            async with aiosqlite.connect(self.database_url) as db:
                cursor = await db.execute("""
                    DELETE FROM file_storage 
                    WHERE file_key = ?
                """, (file_key,))
                
                await db.commit()
                
                deleted = cursor.rowcount > 0
                if deleted:
                    logger.info(f"Arquivo deletado com sucesso: {file_key}")
                
                return deleted
                
        except Exception as e:
            logger.error(f"Erro ao deletar arquivo {file_key}: {e}")
            return False
    
    async def get_file_info(self, file_key: str) -> Optional[dict]:
        """Obtém informações do arquivo (sem o conteúdo)"""
        await self._ensure_initialized()
        
        # Remove prefixo sqlite:// se presente
        if file_key.startswith("sqlite://"):
            file_key = file_key[9:]
        
        try:
            async with aiosqlite.connect(self.database_url) as db:
                cursor = await db.execute("""
                    SELECT filename, content_type, file_size, created_at, updated_at
                    FROM file_storage 
                    WHERE file_key = ?
                """, (file_key,))
                
                row = await cursor.fetchone()
                
                if not row:
                    return None
                
                return {
                    "filename": row[0],
                    "content_type": row[1],
                    "file_size": row[2],
                    "created_at": row[3],
                    "updated_at": row[4]
                }
                
        except Exception as e:
            logger.error(f"Erro ao obter informações do arquivo {file_key}: {e}")
            return None
    
    def _get_content_type(self, extension: str) -> str:
        """Retorna o content-type baseado na extensão"""
        content_types = {
            '.pdf': 'application/pdf',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.doc': 'application/msword',
            '.txt': 'text/plain'
        }
        
        if not extension.startswith('.'):
            extension = f'.{extension}'
            
        return content_types.get(extension.lower(), 'application/octet-stream')

class HTTPFileStorageService:
    """Serviço para armazenamento de arquivos via HTTP API no PythonAnywhere"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.client = httpx.AsyncClient(timeout=30.0)
        self._initialized = False
    
    async def _ensure_initialized(self):
        """Testa a conexão com a API"""
        if self._initialized:
            return
            
        try:
            print(f"🔌 Testando conexão com PythonAnywhere: {self.base_url}")
            response = await self.client.get(f"{self.base_url}/")
            response.raise_for_status()
            data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
            logger.info(f"SQLite HTTP API conectada: {self.base_url}")
            print(f"✅ Conexão estabelecida com PythonAnywhere!")
            if data:
                print(f"   Status: {data.get('status', 'OK')}")
                print(f"   Database: {data.get('database', 'N/A')}")
            self._initialized = True
        except Exception as e:
            logger.error(f"Erro ao conectar com API SQLite: {e}")
            print(f"❌ ERRO ao conectar com PythonAnywhere: {e}")
            raise ValueError(f"Não foi possível conectar com {self.base_url}: {e}")
    
    async def upload_file(self, filename: str, content: bytes, extension: str) -> str:
        """Upload de arquivo via HTTP para o PythonAnywhere"""
        await self._ensure_initialized()
        
        try:
            print(f"📤 Enviando {filename} para PythonAnywhere via HTTP...")
            # Remove o ponto da extensão se houver
            ext_clean = extension.replace('.', '')
            
            # Cria a chave no formato: pdf/arquivo.pdf
            file_key = f"{ext_clean}/{filename}"
            
            # Codifica o conteúdo em base64
            content_b64 = base64.b64encode(content).decode()
            
            # Faz a requisição HTTP POST
            response = await self.client.post(
                f"{self.base_url}/files",
                json={
                    "file_key": file_key,
                    "filename": filename,
                    "content_type": self._get_content_type(extension),
                    "file_content": content_b64
                }
            )
            response.raise_for_status()
            
            logger.info(f"Arquivo enviado com sucesso via HTTP: {file_key}")
            print(f"✅ Arquivo enviado com sucesso para PythonAnywhere: {file_key}")
            return f"sqlite://{file_key}"
            
        except Exception as e:
            logger.error(f"Erro ao fazer upload do arquivo {filename}: {e}")
            raise ValueError(f"Falha no upload via HTTP: {e}")
    
    async def download_file(self, file_key: str) -> bytes:
        """Download de arquivo via HTTP do PythonAnywhere"""
        await self._ensure_initialized()
        
        # Remove prefixo sqlite:// se presente
        if file_key.startswith("sqlite://"):
            file_key = file_key[9:]  # Remove 'sqlite://'
        
        try:
            print(f"📥 Baixando {file_key} do PythonAnywhere via HTTP...")
            response = await self.client.get(f"{self.base_url}/files/{file_key}")
            response.raise_for_status()
            print(f"✅ Arquivo baixado com sucesso do PythonAnywhere: {file_key} ({len(response.content)} bytes)")
            return response.content
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise FileNotFoundError(f"Arquivo não encontrado: {file_key}")
            else:
                logger.error(f"Erro HTTP ao fazer download do arquivo {file_key}: {e}")
                raise ValueError(f"Falha no download via HTTP: {e}")
        except Exception as e:
            logger.error(f"Erro ao fazer download do arquivo {file_key}: {e}")
            raise ValueError(f"Falha no download via HTTP: {e}")
    
    async def file_exists(self, file_key: str) -> bool:
        """Verifica se um arquivo existe via HTTP"""
        try:
            # Remove prefixo sqlite:// se presente
            if file_key.startswith("sqlite://"):
                file_key = file_key[9:]
            
            response = await self.client.get(f"{self.base_url}/files/{file_key}")
            return response.status_code == 200
        except Exception:
            return False
    
    async def delete_file(self, file_key: str) -> bool:
        """Deleta um arquivo via HTTP"""
        await self._ensure_initialized()
        
        # Remove prefixo sqlite:// se presente
        if file_key.startswith("sqlite://"):
            file_key = file_key[9:]
        
        try:
            response = await self.client.delete(f"{self.base_url}/files/{file_key}")
            response.raise_for_status()
            
            result = response.json()
            success = result.get('success', False)
            if success:
                logger.info(f"Arquivo deletado com sucesso: {file_key}")
            
            return success
                
        except Exception as e:
            logger.error(f"Erro ao deletar arquivo {file_key}: {e}")
            return False
    
    def _get_content_type(self, extension: str) -> str:
        """Retorna o content-type baseado na extensão"""
        content_types = {
            '.pdf': 'application/pdf',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.doc': 'application/msword',
            '.txt': 'text/plain'
        }
        
        if not extension.startswith('.'):
            extension = f'.{extension}'
            
        return content_types.get(extension.lower(), 'application/octet-stream')