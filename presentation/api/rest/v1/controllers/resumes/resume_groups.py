"""Resume groups controller: agrupar currículos para usar na Análise."""
import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends
from dishka.integrations.fastapi import FromDishka, inject

from presentation.api.rest.v1.dependencies import get_current_user, CurrentUser
from presentation.api.rest.v1.schemas.resumes import (
    ResumeGroupSchema,
    ListResumeGroupsResponse,
    CreateResumeGroupRequest,
    SetGroupResumesRequest,
    ListResumesResponse,
    ResumeSchema,
)
from application.use_cases.resumes.list_resume_groups import ListResumeGroupsUseCase
from application.use_cases.resumes.create_resume_group import CreateResumeGroupUseCase
from application.use_cases.resumes.delete_resume_group import DeleteResumeGroupUseCase
from application.use_cases.resumes.list_resumes_by_group import ListResumesByGroupUseCase
from application.use_cases.resumes.set_group_resumes import SetGroupResumesUseCase

router = APIRouter(prefix="/groups", tags=["Resume Groups"])
logger = logging.getLogger(__name__)


def _user_uuid(current_user: CurrentUser) -> UUID:
    try:
        return UUID(current_user.id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="ID do usuário inválido")


@router.get("", response_model=ListResumeGroupsResponse)
@inject
async def list_groups(
    use_case: FromDishka[ListResumeGroupsUseCase] = None,
    current_user: CurrentUser = Depends(get_current_user),
):
    try:
        user_id = _user_uuid(current_user)
        groups = await use_case.execute(user_id)
        return ListResumeGroupsResponse(
            groups=[
                ResumeGroupSchema(
                    group_id=g["group_id"],
                    name=g["name"],
                    created_at=g["created_at"].isoformat() if hasattr(g["created_at"], "isoformat") else str(g["created_at"]),
                    resume_count=g.get("resume_count", 0),
                )
                for g in groups
            ]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("list_groups failed: %s", e)
        detail = "Erro ao listar grupos."
        if "resume_groups" in str(e).lower() or "does not exist" in str(e).lower():
            detail = "Tabela de grupos não encontrada. Execute a migração: alembic upgrade head"
        raise HTTPException(status_code=500, detail=detail)


@router.post("", response_model=ResumeGroupSchema)
@inject
async def create_group(
    request: CreateResumeGroupRequest,
    use_case: FromDishka[CreateResumeGroupUseCase] = None,
    current_user: CurrentUser = Depends(get_current_user),
):
    user_id = _user_uuid(current_user)
    g = await use_case.execute(user_id, request.name)
    return ResumeGroupSchema(
        group_id=g["group_id"],
        name=g["name"],
        created_at=g["created_at"].isoformat() if hasattr(g["created_at"], "isoformat") else str(g["created_at"]),
        resume_count=0,
    )


@router.delete("/{group_id}")
@inject
async def delete_group(
    group_id: str,
    use_case: FromDishka[DeleteResumeGroupUseCase] = None,
    current_user: CurrentUser = Depends(get_current_user),
):
    user_id = _user_uuid(current_user)
    ok = await use_case.execute(group_id, user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Grupo não encontrado ou você não é o dono.")
    return {"message": "Grupo excluído"}


@router.get("/{group_id}/resumes", response_model=ListResumesResponse)
@inject
async def list_group_resumes(
    group_id: str,
    use_case: FromDishka[ListResumesByGroupUseCase] = None,
    current_user: CurrentUser = Depends(get_current_user),
):
    user_id = _user_uuid(current_user)
    resumes_dto = await use_case.execute(group_id, user_id)
    return ListResumesResponse(
        resumes=[
            ResumeSchema(
                resume_id=str(r.resume_id),
                candidate_name=r.candidate_name,
                file_name=r.file_name,
                uploaded_at=r.uploaded_at.isoformat(),
                is_indexed=r.is_indexed,
                vector_index_id=r.vector_index_id,
            )
            for r in resumes_dto
        ],
        total=len(resumes_dto),
    )


@router.put("/{group_id}/resumes")
@inject
async def set_group_resumes(
    group_id: str,
    request: SetGroupResumesRequest,
    use_case: FromDishka[SetGroupResumesUseCase] = None,
    current_user: CurrentUser = Depends(get_current_user),
):
    user_id = _user_uuid(current_user)
    ok = await use_case.execute(group_id, request.resume_ids, user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Grupo não encontrado ou você não é o dono.")
    return {"message": "Currículos do grupo atualizados"}
