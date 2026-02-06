"""Merge heads: job application enum (d4e5f6a7b8c9) and resume_groups (e7f8a9b0c1d2)

Revision ID: merge_heads_01
Revises: d4e5f6a7b8c9, e7f8a9b0c1d2
Create Date: 2026-02-06

"""
from typing import Sequence, Union

from alembic import op


revision: str = "merge_heads_01"
down_revision: Union[str, Sequence[str], None] = ("d4e5f6a7b8c9", "e7f8a9b0c1d2")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
