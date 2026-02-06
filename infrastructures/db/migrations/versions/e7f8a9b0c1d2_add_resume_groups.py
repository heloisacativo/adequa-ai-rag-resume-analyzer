"""Add resume_groups and resume_group_members tables

Revision ID: e7f8a9b0c1d2
Revises: 05dcd1251042
Create Date: 2026-02-06

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e7f8a9b0c1d2"
down_revision: Union[str, Sequence[str], None] = "05dcd1251042"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "resume_groups",
        sa.Column("group_id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.user_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("group_id"),
    )
    op.create_table(
        "resume_group_members",
        sa.Column("group_id", sa.String(36), nullable=False),
        sa.Column("resume_id", sa.String(36), nullable=False),
        sa.ForeignKeyConstraint(["group_id"], ["resume_groups.group_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["resume_id"], ["resumes.resume_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("group_id", "resume_id"),
    )


def downgrade() -> None:
    op.drop_table("resume_group_members")
    op.drop_table("resume_groups")
