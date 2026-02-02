from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from dishka.integrations.fastapi import FromDishka, inject
from presentation.api.rest.v1.schemas.job_application import (
    CreateJobApplicationSchema,
    UpdateJobApplicationStatusSchema,
    JobApplicationSchema,
    ResumeAnalysisSchema,
    StoredResumeAnalysisSchema,
)
from application.dtos.candidates.job_application import CreateJobApplicationDTO
from application.use_cases.candidates.create_job_application import CreateJobApplicationUseCase
from application.use_cases.candidates.list_job_applications import ListJobApplicationsUseCase
from application.use_cases.candidates.update_job_application_status import UpdateJobApplicationStatusUseCase
from application.use_cases.candidates.delete_job_application import DeleteJobApplicationUseCase
from application.use_cases.candidates.analyze_resume import AnalyzeResumeUseCase
from application.use_cases.candidates.analyze_stored_resume import AnalyzeStoredResumeUseCase
from presentation.api.rest.v1.dependencies import get_current_user

router = APIRouter(prefix="/job-applications", tags=["Job Applications"])


@router.post("/", response_model=JobApplicationSchema)
@inject
async def create_job_application(
    dto: CreateJobApplicationSchema,
    use_case: FromDishka[CreateJobApplicationUseCase],
    user=Depends(get_current_user),
):
    from datetime import datetime
    create_dto = CreateJobApplicationDTO(
        company_name=dto.company_name,
        job_title=dto.job_title,
        application_date=datetime.fromisoformat(dto.application_date),
        description=dto.description,
    )
    result = await use_case(create_dto, user.id)
    return JobApplicationSchema(
        id=result.id,
        user_id=result.user_id,
        company_name=result.company_name,
        job_title=result.job_title,
        application_date=result.application_date.isoformat(),
        description=result.description,
        status=result.status,
        created_at=result.created_at.isoformat(),
        updated_at=result.updated_at.isoformat() if result.updated_at else None,
    )


@router.get("/", response_model=list[JobApplicationSchema])
@inject
async def list_job_applications(
    use_case: FromDishka[ListJobApplicationsUseCase],
    user=Depends(get_current_user),
):
    results = await use_case(user.id)
    return [
        JobApplicationSchema(
            id=r.id,
            user_id=r.user_id,
            company_name=r.company_name,
            job_title=r.job_title,
            application_date=r.application_date.isoformat(),
            description=r.description,
            status=r.status,
            created_at=r.created_at.isoformat(),
            updated_at=r.updated_at.isoformat() if r.updated_at else None,
        )
        for r in results
    ]


@router.put("/{id}/status", response_model=JobApplicationSchema)
@inject
async def update_status(
    id: int,
    dto: UpdateJobApplicationStatusSchema,
    use_case: FromDishka[UpdateJobApplicationStatusUseCase],
    user=Depends(get_current_user),
):
    from application.dtos.candidates.job_application import UpdateJobApplicationStatusDTO
    update_dto = UpdateJobApplicationStatusDTO(status=dto.status)
    result = await use_case(id, update_dto, user.id)
    return JobApplicationSchema(
        id=result.id,
        user_id=result.user_id,
        company_name=result.company_name,
        job_title=result.job_title,
        application_date=result.application_date.isoformat(),
        description=result.description,
        status=result.status,
        created_at=result.created_at.isoformat(),
        updated_at=result.updated_at.isoformat() if result.updated_at else None,
    )


@router.delete("/{id}")
@inject
async def delete_job_application(
    id: int,
    use_case: FromDishka[DeleteJobApplicationUseCase],
    user=Depends(get_current_user),
):
    await use_case(id, user.id)
    return {"message": "Job application deleted successfully"}


@router.post("/analyze-stored/{id}", response_model=StoredResumeAnalysisSchema)
@inject
async def analyze_stored_resume(
    id: int,
    use_case: FromDishka[AnalyzeStoredResumeUseCase],
    user=Depends(get_current_user),
):
    result = await use_case(id, user.id)
    return StoredResumeAnalysisSchema(
        match_percentage=result.match_percentage,
        missing_skills=result.missing_skills,
        strengths=result.strengths,
        overall_feedback=result.overall_feedback,
        resume_used=result.resume_used,
        improvement_tips=result.improvement_tips
    )


@router.post("/analyze/{job_id}", response_model=ResumeAnalysisSchema)
@inject
async def analyze_resume(
    job_id: int,
    use_case: FromDishka[AnalyzeResumeUseCase],
    user=Depends(get_current_user),
    resume_file: UploadFile = File(...),
):
    return await use_case(job_id, user.id, resume_file)