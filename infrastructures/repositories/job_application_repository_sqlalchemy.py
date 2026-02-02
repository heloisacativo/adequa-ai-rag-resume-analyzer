from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from domain.entities.candidates.job_application import JobApplicationEntity, JobApplicationStatus
from application.interfaces.candidates.repositories import JobApplicationRepositoryProtocol
from infrastructures.db.models.candidates.job_application import JobApplicationModel


class JobApplicationRepository(JobApplicationRepositoryProtocol):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, entity: JobApplicationEntity) -> JobApplicationEntity:
        model = JobApplicationModel(
            user_id=entity.user_id,
            company_name=entity.company_name,
            job_title=entity.job_title,
            application_date=entity.application_date,
            description=entity.description,
            status=entity.status,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )
        self.session.add(model)
        await self.session.commit()
        await self.session.refresh(model)
        return JobApplicationEntity(
            id=model.id,
            user_id=model.user_id,
            company_name=model.company_name,
            job_title=model.job_title,
            application_date=model.application_date,
            description=model.description,
            status=model.status,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    async def get_by_id(self, id: int) -> Optional[JobApplicationEntity]:
        query = select(JobApplicationModel).where(JobApplicationModel.id == id)
        result = await self.session.execute(query)
        model = result.scalar_one_or_none()
        if model:
            return JobApplicationEntity(
                id=model.id,
                user_id=model.user_id,
                company_name=model.company_name,
                job_title=model.job_title,
                application_date=model.application_date,
                description=model.description,
                status=model.status,
                created_at=model.created_at,
                updated_at=model.updated_at,
            )
        return None

    async def get_by_user_id(self, user_id: str) -> list[JobApplicationEntity]:
        query = select(JobApplicationModel).where(JobApplicationModel.user_id == user_id)
        result = await self.session.execute(query)
        models = result.scalars().all()
        return [
            JobApplicationEntity(
                id=model.id,
                user_id=model.user_id,
                company_name=model.company_name,
                job_title=model.job_title,
                application_date=model.application_date,
                description=model.description,
                status=model.status,
                created_at=model.created_at,
                updated_at=model.updated_at,
            )
            for model in models
        ]

    async def update(self, entity: JobApplicationEntity) -> JobApplicationEntity:
        query = (
            update(JobApplicationModel)
            .where(JobApplicationModel.id == entity.id)
            .values(
                company_name=entity.company_name,
                job_title=entity.job_title,
                application_date=entity.application_date,
                description=entity.description,
                status=entity.status,
                updated_at=entity.updated_at,
            )
        )
        await self.session.execute(query)
        await self.session.commit()
        return entity

    async def delete(self, id: int) -> None:
        query = delete(JobApplicationModel).where(JobApplicationModel.id == id)
        await self.session.execute(query)
        await self.session.commit()