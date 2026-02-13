from typing import Annotated
from pathlib import Path
from uuid import UUID
import os
import logging

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from dishka.integrations.fastapi import FromDishka, inject
from presentation.api.rest.v1.dependencies import get_current_user, CurrentUser

logger = logging.getLogger(__name__)

from application.use_cases.resumes.upload_resumes import UploadResumesUseCase
from application.use_cases.resumes.ensure_upload_user import (
    EnsureResumeUploadUserUseCase,
    RESUME_UPLOAD_USER_ID,
)
from application.use_cases.resumes.list_indexes import ListIndexesUseCase
from application.use_cases.resumes.list_resumes import ListResumesUseCase
from application.use_cases.resumes.delete_resume import DeleteResumeUseCase
from presentation.api.rest.v1.schemas.resumes import (
    UploadResponse, 
    ListIndexesResponse, 
    IndexInfoResponse,
    ListResumesResponse,
    ResumeSchema
)

router = APIRouter(prefix="/resumes", tags=["Resumes"])

@router.get("/debug-user")
@inject
async def debug_current_user(
    current_user: CurrentUser = Depends(get_current_user)
):
    """Endpoint de debug para verificar o usuário atual"""
    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name
    }

@router.post("/upload", response_model=UploadResponse)
@inject
async def upload_resumes(
    files: list[UploadFile] = File(...),
    use_case: FromDishka[UploadResumesUseCase] = None,
    ensure_upload_user: FromDishka[EnsureResumeUploadUserUseCase] = None,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Upload e indexa currículos - até 20 currículos por vez (limite total: 50 por usuário)."""
    
    if len(files) == 0:
        raise HTTPException(
            status_code=400,
            detail="Nenhum arquivo foi enviado"
        )
    if len(files) > 20:
        raise HTTPException(
            status_code=400,
            detail="Máximo de 20 currículos por vez. Limite total: 50 currículos por usuário."
        )
    
    # Converte UploadFile para (filename, bytes)
    file_data = []
    for file in files:
        content = await file.read()
        file_data.append((file.filename, content))
    
    try:
        user_id = UUID(current_user.id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="ID do usuário inválido")
    
    await ensure_upload_user.execute(user_id)
    
    # Adiciona os novos currículos (não remove os existentes; limite total por usuário no use case)
    try:
        result = await use_case.execute(file_data, user_id)
    except Exception as e:
        # Trata erros de negócio e outros
        from application.exceptions import BusinessRuleViolationError
        if isinstance(e, BusinessRuleViolationError):
            raise HTTPException(status_code=400, detail=str(e))
        else:
            # Log do erro e resposta genérica
            logger.error(f"Erro ao fazer upload de currículos: {e}")
            raise HTTPException(status_code=500, detail="Erro interno ao processar os currículos")
    
    return UploadResponse(
        message="Arquivos enviados e indexados com sucesso",
        total_files=result.total_files,
        indexed_files=result.indexed_files,
        vector_index_id=result.vector_index_id,
        resumes=[
            {
                "resume_id": str(r.resume_id),
                "candidate_name": r.candidate_name,
                "file_name": r.file_name,
                "uploaded_at": r.uploaded_at.isoformat(),
                "is_indexed": r.is_indexed
            }
            for r in result.resumes
        ]
    )

@router.get("/indexes", response_model=ListIndexesResponse)
@inject
async def list_indexes(
    use_case: FromDishka[ListIndexesUseCase] = None,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Lista todos os índices vetoriais salvos com seus currículos"""
    try:
        user_id = UUID(current_user.id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="ID do usuário inválido")
    indexes_dict = await use_case.execute(user_id=user_id)
    
    # Converte para o formato de resposta
    indexes_response = {
        index_id: IndexInfoResponse(**info)
        for index_id, info in indexes_dict.items()
    }
    
    return ListIndexesResponse(indexes=indexes_response)

@router.get("", response_model=ListResumesResponse)
@inject
async def list_resumes(
    use_case: FromDishka[ListResumesUseCase] = None,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Lista todos os currículos salvos"""
    try:
        user_id = UUID(current_user.id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="ID do usuário inválido")
    
    print(f"\n{'='*80}")
    print(f"📋 LIST RESUMES REQUEST")
    print(f"   User ID from token: {user_id}")
    print(f"   User type: {current_user.type}")
    print(f"{'='*80}\n")
    
    resumes_dto = await use_case.execute(user_id=user_id)
    
    print(f"📊 CURRÍCULOS ENCONTRADOS: {len(resumes_dto)}")
    for idx, r in enumerate(resumes_dto, 1):
        print(f"   {idx}. Resume ID: {r.resume_id}")
        print(f"      Nome: {r.candidate_name}")
        print(f"      Arquivo: {r.file_name}")
        print(f"      Indexado: {r.is_indexed}")
        print(f"      Vector Index: {r.vector_index_id}")
        print()
    print(f"{'='*80}\n")
    
    resumes_schema = [
        ResumeSchema(
            resume_id=str(r.resume_id),
            candidate_name=r.candidate_name,
            file_name=r.file_name,
            uploaded_at=r.uploaded_at.isoformat(),
            is_indexed=r.is_indexed,
            vector_index_id=r.vector_index_id
        )
        for r in resumes_dto
    ]
    
    return ListResumesResponse(
        resumes=resumes_schema,
        total=len(resumes_schema)
    )

@router.get("/{resume_id}/download")
@inject
async def download_resume(
    resume_id: str,
    use_case: FromDishka[ListResumesUseCase] = None,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Download um currículo específico"""
    try:
        user_id = UUID(current_user.id)
        resume_uuid = UUID(resume_id)
    except (ValueError, TypeError) as e:
        raise HTTPException(status_code=400, detail=f"ID inválido: {str(e)}")
    
    print(f"\n{'='*80}")
    print(f"🔍 DOWNLOAD REQUEST")
    print(f"   User ID: {user_id}")
    print(f"   Resume ID: {resume_uuid}")
    print(f"{'='*80}\n")
    
    # Buscar todos os currículos do usuário
    resumes_dto = await use_case.execute(user_id=user_id)
    
    print(f"📊 CURRÍCULOS DO USUÁRIO: {len(resumes_dto)} encontrado(s)")
    for idx, r in enumerate(resumes_dto, 1):
        print(f"   {idx}. ID: {r.resume_id}")
        print(f"      Nome: {r.candidate_name}")
        print(f"      Arquivo: {r.file_name}")
        print(f"      Path: {r.file_path}")
        print(f"      Indexado: {r.is_indexed}")
        print(f"      Vector Index: {r.vector_index_id}")
        print()
    
    # Buscar o currículo específico
    resume = next((r for r in resumes_dto if r.resume_id == resume_uuid), None)
    
    if not resume:
        print(f"❌ CURRÍCULO NÃO ENCONTRADO!")
        print(f"   Procurado: {resume_uuid}")
        print(f"   Disponíveis: {[r.resume_id for r in resumes_dto]}")
        print(f"{'='*80}\n")
        raise HTTPException(
            status_code=404, 
            detail=f"Currículo {resume_id} não encontrado ou não pertence a você. Total de currículos: {len(resumes_dto)}"
        )
    
    print(f"✅ CURRÍCULO ENCONTRADO:")
    print(f"   Nome: {resume.candidate_name}")
    print(f"   Arquivo: {resume.file_name}")
    print(f"   Path: {resume.file_path}")
    print(f"{'='*80}\n")
    
    file_path_str = str(resume.file_path)
    # No Windows, path pode estar como sqlite:\pdf\...; normalizar para detectar storage remoto
    file_path_norm = file_path_str.replace("\\", "/")
    
    if file_path_norm.startswith("sqlite://") or file_path_norm.startswith("sqlite:/"):
        try:
            from config.ai.ai import AISettings
            from infrastructures.storage.sqlite_storage import SQLiteFileStorageService, HTTPFileStorageService
            from fastapi.responses import StreamingResponse
            import io
            
            ai_settings = AISettings()
            if not ai_settings.use_sqlite_storage:
                raise HTTPException(status_code=500, detail="SQLite storage não configurado")
            
            storage_url = ai_settings.sqlite_storage_url.strip()
            
            if storage_url.startswith(('http://', 'https://')):
                print(f"📥 Download via PythonAnywhere HTTP: {file_path_norm}")
                sqlite_storage = HTTPFileStorageService(storage_url)
            else:
                print(f"📥 Download via SQLite local: {file_path_norm}")
                sqlite_storage = SQLiteFileStorageService(storage_url)
            
            # Chave no formato sqlite://ext/filename (download_file aceita com ou sem prefixo)
            download_key = file_path_norm if file_path_norm.startswith("sqlite://") else "sqlite://" + file_path_norm.lstrip("sqlite:/")
            file_content = await sqlite_storage.download_file(download_key)
            print(f"✅ Download concluído: {len(file_content)} bytes")
            
            return StreamingResponse(
                io.BytesIO(file_content),
                media_type='application/octet-stream',
                headers={"Content-Disposition": f"attachment; filename={resume.file_name}"}
            )
            
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail=f"Arquivo não encontrado no SQLite: {file_path_str}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao fazer download do SQLite: {str(e)}")
    
    elif file_path_str.startswith("s3://"):
        # Download do S3
        try:
            from config.ai.ai import AISettings
            from infrastructures.storage.s3_storage import S3StorageService
            from fastapi.responses import StreamingResponse
            import io
            
            ai_settings = AISettings()
            if not ai_settings.use_s3_storage:
                raise HTTPException(status_code=500, detail="S3 não configurado")
                
            s3_storage = S3StorageService(
                endpoint_url=ai_settings.s3_endpoint_url,
                region=ai_settings.s3_region,
                access_key=ai_settings.s3_access_key,
                secret_key=ai_settings.s3_secret_key,
                bucket_name=ai_settings.s3_bucket_name,
                folder_prefix=ai_settings.s3_folder_prefix
            )
            
            s3_key = file_path_str[5:] 
            file_content = s3_storage.download_file(s3_key)
            
            return StreamingResponse(
                io.BytesIO(file_content),
                media_type='application/octet-stream',
                headers={"Content-Disposition": f"attachment; filename={resume.file_name}"}
            )
            
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail=f"Arquivo não encontrado no S3: {s3_key}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao fazer download do S3: {str(e)}")
    else:
        file_path = Path(file_path_str)
        if not file_path.exists():
            file_path.parent.mkdir(parents=True, exist_ok=True)
            raise HTTPException(status_code=404, detail=f"Arquivo não encontrado: {resume.file_path}")
        
        return FileResponse(
            path=resume.file_path,
            filename=resume.file_name,
            media_type='application/octet-stream'
        )

@router.delete("/{resume_id}")
@inject
async def delete_resume(
    resume_id: str,
    use_case: FromDishka[DeleteResumeUseCase] = None,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Deleta um currículo específico"""
    
    from uuid import UUID
    try:
        uuid_resume_id = UUID(resume_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID do currículo inválido")
    try:
        uuid_user_id = UUID(current_user.id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID do usuário inválido")
    
    deleted = await use_case.execute(uuid_resume_id, uuid_user_id)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Currículo não encontrado")
    
    return {"message": "Currículo deletado com sucesso"}