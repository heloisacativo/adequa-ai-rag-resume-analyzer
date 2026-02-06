"""Protocol for resume group repository."""
from typing import Protocol
from uuid import UUID


class ResumeGroupRepositoryProtocol(Protocol):
    async def list_by_user_id(self, user_id: UUID) -> list[dict]:
        """List groups for user. Each dict: group_id, name, created_at, resume_count."""
        ...

    async def create(self, user_id: UUID, name: str) -> dict:
        """Create group. Returns dict with group_id, name, created_at."""
        ...

    async def delete(self, group_id: str, user_id: UUID) -> bool:
        """Delete group if owned by user. Returns True if deleted."""
        ...

    async def get_resume_ids(self, group_id: str, user_id: UUID) -> list[str]:
        """List resume ids in group. Empty if group not found or not owner."""
        ...

    async def add_resume(self, group_id: str, resume_id: str, user_id: UUID) -> bool:
        """Add resume to group. Returns True if added."""
        ...

    async def remove_resume(self, group_id: str, resume_id: str, user_id: UUID) -> bool:
        """Remove resume from group. Returns True if removed."""
        ...

    async def set_resumes(self, group_id: str, resume_ids: list[str], user_id: UUID) -> bool:
        """Replace all resumes in group. Returns True if group exists and is owner."""
        ...
