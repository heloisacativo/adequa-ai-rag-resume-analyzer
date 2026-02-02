from typing import Annotated
from pathlib import Path
import os

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from dishka.integrations.fastapi import FromDishka, inject
from presentation.api.rest.v1.dependencies import get_current_user, CurrentUser

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

@router.post("/upload", response_model=UploadResponse)
@inject
async def upload_resumes(
    files: list[UploadFile] = File(...),
    use_case: FromDishka[UploadResumesUseCase] = None,
    ensure_upload_user: FromDishka[EnsureResumeUploadUserUseCase] = None,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Upload e indexa currículos - até 20 currículos por vez (acumulativo por usuário)."""
    
    if len(files) == 0:
        raise HTTPException(
            status_code=400,
            detail="Nenhum arquivo foi enviado"
        )
    if len(files) > 20:
        raise HTTPException(
            status_code=400,
            detail="Máximo de 20 currículos por vez. Envie no máximo 20 arquivos."
        )
    
    # Converte UploadFile para (filename, bytes)
    file_data = []
    for file in files:
        content = await file.read()
        file_data.append((file.filename, content))
    
    # TODO: quando auth estiver ativo, usar current_user.user_id em vez de RESUME_UPLOAD_USER_ID
    user_id = current_user.id
    await ensure_upload_user.execute(user_id)
    
    # Adiciona os novos currículos (não remove os existentes; limite total por usuário no use case)
    result = await use_case.execute(file_data, user_id)
    
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
    
    indexes_dict = await use_case.execute(user_id=current_user.id)
    
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
    
    resumes_dto = await use_case.execute(user_id=current_user.id)
    
    resumes_schema = [
        ResumeSchema(
            resume_id=str(r.resume_id),
            candidate_name=r.candidate_name,
            file_name=r.file_name,
            uploaded_at=r.uploaded_at.isoformat(),
            is_indexed=r.is_indexed
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
    # TODO: current_user: User = Depends(get_current_user)
):
    """Download um currículo específico"""
    
    # TODO: Pegar user_id do token
    user_id = None
    
    resumes_dto = await use_case.execute(user_id=user_id)
    
    # Encontra o currículo específico
    resume = next((r for r in resumes_dto if str(r.resume_id) == resume_id), None)
    
    if not resume:
        raise HTTPException(status_code=404, detail="Currículo não encontrado")
    
    # Verifica se o arquivo existe
    file_path = Path(resume.file_path)
    if not file_path.exists():
        # Cria o diretório pai se não existir
        file_path.parent.mkdir(parents=True, exist_ok=True)
        raise HTTPException(status_code=404, detail=f"Arquivo não encontrado: {resume.file_path}")
    
    # Retorna o arquivo
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
    # TODO: current_user: User = Depends(get_current_user)
):
    """Deleta um currículo específico"""
    
    from uuid import UUID
    try:
        uuid_resume_id = UUID(resume_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID do currículo inválido")
    
    # TODO: Pegar user_id do token
    user_id = None
    
    deleted = await use_case.execute(uuid_resume_id, user_id)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Currículo não encontrado")
    
    return {"message": "Currículo deletado com sucesso"}