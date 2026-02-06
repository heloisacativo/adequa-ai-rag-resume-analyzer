"""List resumes that belong to a group (full resume data for analysis)."""
from dataclasses import dataclass
from typing import final
from uuid import UUID

from application.dtos.resumes.resume import ResumeDTO
from application.interfaces.resumes.resume_group_repository import ResumeGroupRepositoryProtocol
from application.interfaces.resumes.repositories import ResumeRepositoryProtocol


@final
@dataclass(frozen=True, slots=True, kw_only=True)
class ListResumesByGroupUseCase:
    group_repository: ResumeGroupRepositoryProtocol
    resume_repository: ResumeRepositoryProtocol

    async def execute(self, group_id: str, user_id: UUID) -> list[ResumeDTO]:
        resume_ids = await self.group_repository.get_resume_ids(group_id, user_id)
        if not resume_ids:
            return []
        dtos = []
        for rid in resume_ids:
            try:
                entity = await self.resume_repository.get_by_id(UUID(rid))
            except (ValueError, TypeError):
                continue
            if entity is None:
                continue
            if str(entity.uploaded_by_user_id) != str(user_id):
                continue
            dtos.append(
                ResumeDTO(
                    resume_id=entity.resume_id,
                    candidate_name=entity.candidate_name,
                    file_name=entity.file_name,
                    file_path=entity.file_path,
                    uploaded_at=entity.uploaded_at,
                    is_indexed=entity.is_indexed,
                    vector_index_id=entity.vector_index_id,
                )
            )
        return dtos
