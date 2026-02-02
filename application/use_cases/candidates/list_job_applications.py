from dataclasses import dataclass
from typing import final
from application.dtos.candidates.job_application import JobApplicationDTO
from application.interfaces.candidates.repositories import JobApplicationRepositoryProtocol


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class ListJobApplicationsUseCase:
    repository: JobApplicationRepositoryProtocol

    async def __call__(self, user_id: str) -> list[JobApplicationDTO]:
        entities = await self.repository.get_by_user_id(user_id)
        return [
            JobApplicationDTO(
                id=e.id,
                user_id=e.user_id,
                company_name=e.company_name,
                job_title=e.job_title,
                application_date=e.application_date,
                description=e.description,
                status=e.status.value,
                created_at=e.created_at,
                updated_at=e.updated_at,
            )
            for e in entities
        ]