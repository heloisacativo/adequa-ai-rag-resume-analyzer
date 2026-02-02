"""Add job application status enum values (APPLIED, UNDER_REVIEW, INTERVIEW, OFFER)

If the DB has the old enum (PENDING, ACCEPTED, REJECTED, WITHDRAWN) from an earlier
migration, this adds the values expected by the application.
PostgreSQL 9.1+ supports ADD VALUE; 10+ supports IF NOT EXISTS.

Revision ID: d4e5f6a7b8c9
Revises: 78731fd5178e
Create Date: 2026-02-01

"""
from typing import Sequence, Union

from alembic import op


revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, Sequence[str], None] = "78731fd5178e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add enum values expected by JobApplicationStatus (APPLIED, UNDER_REVIEW, INTERVIEW, OFFER).
    # REJECTED may already exist. Use IF NOT EXISTS for idempotency (PG 10+).
    for value in ("APPLIED", "UNDER_REVIEW", "INTERVIEW", "OFFER", "REJECTED"):
        op.execute(
            f"ALTER TYPE jobapplicationstatus ADD VALUE IF NOT EXISTS '{value}'"
        )


def downgrade() -> None:
    # PostgreSQL does not support removing enum values; no-op.
    pass
