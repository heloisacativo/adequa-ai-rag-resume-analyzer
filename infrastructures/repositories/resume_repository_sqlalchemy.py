"""SQLAlchemy repository for Resume entity."""
from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from domain.entities.resumes.resume import ResumeEntity
from infrastructures.db.models.resumes.resume import ResumeModel


class ResumeRepositorySqlAlchemy:
    """SQLAlchemy implementation of ResumeRepositoryProtocol."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def add(self, resume: ResumeEntity) -> None:
        """Add a resume to the repository."""
        model = ResumeModel(
            resume_id=str(resume.resume_id),
            uploaded_by_user_id=str(resume.uploaded_by_user_id),
            candidate_name=resume.candidate_name,
            file_name=resume.file_name,
            file_path=resume.file_path,
            vector_index_id=resume.vector_index_id,
            is_indexed=resume.is_indexed,
        )
        self.session.add(model)

    async def get_by_id(self, resume_id: UUID) -> Optional[ResumeEntity]:
        """Get a resume by ID."""
        stmt = select(ResumeModel).where(ResumeModel.resume_id == str(resume_id))
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            return None

        return ResumeEntity(
            resume_id=UUID(model.resume_id),
            uploaded_by_user_id=UUID(model.uploaded_by_user_id),
            candidate_name=model.candidate_name,
            file_name=model.file_name,
            file_path=model.file_path,
            vector_index_id=model.vector_index_id,
            is_indexed=model.is_indexed,
            uploaded_at=model.created_at,
        )

    async def get_by_vector_index_id(self, index_id: str) -> list[ResumeEntity]:
        """Get all resumes for a vector index."""
        stmt = select(ResumeModel).where(ResumeModel.vector_index_id == index_id)
        result = await self.session.execute(stmt)
        models = result.scalars().all()

        return [
            ResumeEntity(
                resume_id=UUID(model.resume_id),
                uploaded_by_user_id=UUID(model.uploaded_by_user_id),
                candidate_name=model.candidate_name,
                file_name=model.file_name,
                file_path=model.file_path,
                vector_index_id=model.vector_index_id,
                is_indexed=model.is_indexed,
                uploaded_at=model.created_at,
            )
            for model in models
        ]

    async def exists_by_file_name(self, file_name: str) -> bool:
        """Check if a resume with this file name already exists."""
        stmt = select(ResumeModel).where(ResumeModel.file_name == file_name)
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()
        return model is not None

    async def get_all_vector_index_ids(self) -> list[str]:
        """Get all unique vector index IDs."""
        stmt = select(ResumeModel.vector_index_id).where(ResumeModel.vector_index_id.isnot(None)).distinct()
        result = await self.session.execute(stmt)
        index_ids = result.scalars().all()
        return [idx for idx in index_ids if idx is not None]

    async def get_by_user_id(self, user_id: UUID) -> list[ResumeEntity]:
        """Get all resumes for a user."""
        stmt = select(ResumeModel).where(ResumeModel.uploaded_by_user_id == str(user_id))
        result = await self.session.execute(stmt)
        models = result.scalars().all()

        return [
            ResumeEntity(
                resume_id=UUID(model.resume_id),
                uploaded_by_user_id=UUID(model.uploaded_by_user_id),
                candidate_name=model.candidate_name,
                file_name=model.file_name,
                file_path=model.file_path,
                vector_index_id=model.vector_index_id,
                is_indexed=model.is_indexed,
                uploaded_at=model.created_at,
            )
            for model in models
        ]

    async def count_by_user_id(self, user_id: UUID) -> int:
        """Count the number of resumes for a user."""
        from sqlalchemy import func
        stmt = select(func.count(ResumeModel.resume_id)).where(ResumeModel.uploaded_by_user_id == str(user_id))
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def get_all(self) -> list[ResumeEntity]:
        """Get all resumes."""
        stmt = select(ResumeModel)
        result = await self.session.execute(stmt)
        models = result.scalars().all()

        return [
            ResumeEntity(
                resume_id=UUID(model.resume_id),
                uploaded_by_user_id=UUID(model.uploaded_by_user_id),
                candidate_name=model.candidate_name,
                file_name=model.file_name,
                file_path=model.file_path,
                vector_index_id=model.vector_index_id,
                is_indexed=model.is_indexed,
                uploaded_at=model.created_at,
            )
            for model in models
        ]

    async def delete(self, resume_id: UUID) -> bool:
        """Delete a resume by ID."""
        import os
        stmt = select(ResumeModel).where(ResumeModel.resume_id == str(resume_id))
        result = await self.session.execute(stmt)
        model = result.scalar_one_or_none()

        if model is None:
            return False

        # Delete the file from filesystem
        if os.path.exists(model.file_path):
            try:
                os.remove(model.file_path)
            except OSError:
                # Log error but don't fail the deletion
                pass

        await self.session.delete(model)
        return True