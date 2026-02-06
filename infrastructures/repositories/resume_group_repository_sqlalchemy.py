"""SQLAlchemy repository for ResumeGroup."""
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete

from infrastructures.db.models.resumes.resume_group import ResumeGroupModel, ResumeGroupMemberModel


class ResumeGroupRepositorySqlAlchemy:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_by_user_id(self, user_id: UUID) -> list[dict]:
        stmt = (
            select(
                ResumeGroupModel.group_id,
                ResumeGroupModel.name,
                ResumeGroupModel.created_at,
                func.count(ResumeGroupMemberModel.resume_id).label("resume_count"),
            )
            .outerjoin(ResumeGroupMemberModel, ResumeGroupModel.group_id == ResumeGroupMemberModel.group_id)
            .where(ResumeGroupModel.user_id == str(user_id))
            .group_by(ResumeGroupModel.group_id, ResumeGroupModel.name, ResumeGroupModel.created_at)
            .order_by(ResumeGroupModel.created_at.desc())
        )
        result = await self.session.execute(stmt)
        rows = result.all()
        return [
            {
                "group_id": r.group_id,
                "name": r.name,
                "created_at": r.created_at,
                "resume_count": r.resume_count or 0,
            }
            for r in rows
        ]

    async def create(self, user_id: UUID, name: str) -> dict:
        g = ResumeGroupModel(user_id=str(user_id), name=name.strip())
        self.session.add(g)
        await self.session.commit()
        await self.session.refresh(g)
        return {"group_id": g.group_id, "name": g.name, "created_at": g.created_at}

    async def delete(self, group_id: str, user_id: UUID) -> bool:
        stmt = select(ResumeGroupModel).where(
            ResumeGroupModel.group_id == group_id,
            ResumeGroupModel.user_id == str(user_id),
        )
        r = await self.session.execute(stmt)
        g = r.scalar_one_or_none()
        if not g:
            return False
        await self.session.delete(g)
        await self.session.commit()
        return True

    async def get_resume_ids(self, group_id: str, user_id: UUID) -> list[str]:
        stmt = (
            select(ResumeGroupMemberModel.resume_id)
            .join(ResumeGroupModel, ResumeGroupMemberModel.group_id == ResumeGroupModel.group_id)
            .where(
                ResumeGroupModel.group_id == group_id,
                ResumeGroupModel.user_id == str(user_id),
            )
        )
        result = await self.session.execute(stmt)
        return [row[0] for row in result.all()]

    async def add_resume(self, group_id: str, resume_id: str, user_id: UUID) -> bool:
        stmt = select(ResumeGroupModel).where(
            ResumeGroupModel.group_id == group_id,
            ResumeGroupModel.user_id == str(user_id),
        )
        r = await self.session.execute(stmt)
        if r.scalar_one_or_none() is None:
            return False
        m = ResumeGroupMemberModel(group_id=group_id, resume_id=resume_id)
        self.session.add(m)
        await self.session.commit()
        return True

    async def remove_resume(self, group_id: str, resume_id: str, user_id: UUID) -> bool:
        stmt = select(ResumeGroupModel).where(
            ResumeGroupModel.group_id == group_id,
            ResumeGroupModel.user_id == str(user_id),
        )
        r = await self.session.execute(stmt)
        if r.scalar_one_or_none() is None:
            return False
        await self.session.execute(
            delete(ResumeGroupMemberModel).where(
                ResumeGroupMemberModel.group_id == group_id,
                ResumeGroupMemberModel.resume_id == resume_id,
            )
        )
        await self.session.commit()
        return True

    async def set_resumes(self, group_id: str, resume_ids: list[str], user_id: UUID) -> bool:
        stmt = select(ResumeGroupModel).where(
            ResumeGroupModel.group_id == group_id,
            ResumeGroupModel.user_id == str(user_id),
        )
        r = await self.session.execute(stmt)
        if r.scalar_one_or_none() is None:
            return False
        await self.session.execute(delete(ResumeGroupMemberModel).where(ResumeGroupMemberModel.group_id == group_id))
        for rid in resume_ids:
            if rid:
                self.session.add(ResumeGroupMemberModel(group_id=group_id, resume_id=rid))
        await self.session.commit()
        return True
