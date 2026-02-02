"""Jobs API controller."""
from uuid import UUID
import dataclasses

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Depends, HTTPException, status

from application.dtos.jobs.job import CreateJobDTO, UpdateJobDTO, JobTypeDTO, JobStatusDTO
from application.use_cases.jobs.job import (
    CreateJobUseCase,
    ListJobsUseCase,
    GetJobUseCase,
    UpdateJobUseCase,
    DeleteJobUseCase,
    UpdateJobStatusUseCase,
)
from presentation.api.rest.v1.schemas.requests import CreateJobRequest, UpdateJobRequest
from presentation.api.rest.v1.schemas.responses import JobResponseSchema, JobListResponseSchema


router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post(
    "",
    response_model=JobResponseSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new job",
)
@inject
async def create_job(
    request: CreateJobRequest,
    use_case: FromDishka[CreateJobUseCase] = None,
    # TODO: Add user authentication dependency
) -> JobResponseSchema:
    """Create a new job posting."""
    # TODO: Get user_id from authenticated user
    user_id = UUID("00000000-0000-0000-0000-000000000000")  # Temporary placeholder

    dto = CreateJobDTO(
        title=request.title,
        description=request.description,
        location=request.location,
    )

    job_dto = await use_case(dto, user_id)

    return JobResponseSchema.model_validate(dataclasses.asdict(job_dto))


@router.get(
    "",
    response_model=JobListResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="List jobs",
)
@inject
async def list_jobs(
    user_id: UUID | None = None,  # TODO: Make this come from authenticated user
    use_case: FromDishka[ListJobsUseCase] = None,
) -> JobListResponseSchema:
    """List all jobs. If user_id is provided, list only jobs created by that user."""
    job_list_dto = await use_case(user_id)

    return JobListResponseSchema(
        jobs=[JobResponseSchema.model_validate(dataclasses.asdict(job)) for job in job_list_dto.jobs],
        total=job_list_dto.total
    )


@router.get(
    "/{job_id}",
    response_model=JobResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="Get a specific job",
)
@inject
async def get_job(
    job_id: str,
    use_case: FromDishka[GetJobUseCase] = None,
) -> JobResponseSchema:
    """Get a specific job by ID."""
    try:
        uuid_job_id = UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )

    job_dto = await use_case(uuid_job_id)

    if not job_dto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    return JobResponseSchema.model_validate(dataclasses.asdict(job_dto))


@router.put(
    "/{job_id}",
    response_model=JobResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="Update a job",
)
@inject
async def update_job(
    job_id: str,
    request: UpdateJobRequest,
    use_case: FromDishka[UpdateJobUseCase] = None,
) -> JobResponseSchema:
    """Update an existing job."""
    try:
        uuid_job_id = UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )

    dto = UpdateJobDTO(
        title=request.title,
        description=request.description,
        requirements=request.requirements,
        location=request.location,
        salary=request.salary,
        type=JobTypeDTO(request.type) if request.type else None,
        status=JobStatusDTO(request.status) if request.status else None,
    )

    job_dto = await use_case(uuid_job_id, dto)

    if not job_dto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    return JobResponseSchema.model_validate(dataclasses.asdict(job_dto))


@router.delete(
    "/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a job",
)
@inject
async def delete_job(
    job_id: str,
    use_case: FromDishka[DeleteJobUseCase] = None,
) -> None:
    """Delete a job by ID."""
    try:
        uuid_job_id = UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )

    success = await use_case(uuid_job_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )


@router.patch(
    "/{job_id}/status",
    response_model=JobResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="Update job status",
)
@inject
async def update_job_status(
    job_id: str,
    status: str,
    use_case: FromDishka[UpdateJobStatusUseCase] = None,
) -> JobResponseSchema:
    """Update the status of a job."""
    try:
        uuid_job_id = UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID format"
        )

    # Validate status
    valid_statuses = ["active", "inactive", "filled"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    job_dto = await use_case(uuid_job_id, status)

    if not job_dto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    return JobResponseSchema.model_validate(dataclasses.asdict(job_dto))