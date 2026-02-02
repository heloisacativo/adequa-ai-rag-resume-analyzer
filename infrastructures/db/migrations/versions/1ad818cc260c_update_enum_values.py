"""update_enum_values

Revision ID: 1ad818cc260c
Revises: 05dcd1251042
Create Date: 2026-01-20 22:55:34.406882

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1ad818cc260c'
down_revision: Union[str, Sequence[str], None] = '05dcd1251042'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Update job types from old values to new enum names.
    # Use ::text in WHEN so PostgreSQL never casts 'full-time' etc. to jobtype
    # (jobtype may already only have FULL_TIME, PART_TIME, ...).
    op.execute("""
        UPDATE jobs SET type = CASE
            WHEN type::text = 'full-time' THEN 'FULL_TIME'::jobtype
            WHEN type::text = 'part-time' THEN 'PART_TIME'::jobtype
            WHEN type::text = 'contract' THEN 'CONTRACT'::jobtype
            WHEN type::text = 'freelance' THEN 'FREELANCE'::jobtype
            ELSE type END
    """)
    
    # Update job statuses from old values to new enum names.
    op.execute("""
        UPDATE jobs SET status = CASE
            WHEN status::text = 'active' THEN 'ACTIVE'::jobstatus
            WHEN status::text = 'inactive' THEN 'INACTIVE'::jobstatus
            WHEN status::text = 'filled' THEN 'FILLED'::jobstatus
            ELSE status END
    """)


def downgrade() -> None:
    """Downgrade schema. Note: only works if enum was altered to include old values."""
    op.execute("""
        UPDATE jobs SET type = CASE
            WHEN type::text = 'FULL_TIME' THEN 'FULL_TIME'::jobtype
            WHEN type::text = 'PART_TIME' THEN 'PART_TIME'::jobtype
            WHEN type::text = 'CONTRACT' THEN 'CONTRACT'::jobtype
            WHEN type::text = 'FREELANCE' THEN 'FREELANCE'::jobtype
            ELSE type END
    """)
    op.execute("""
        UPDATE jobs SET status = CASE
            WHEN status::text = 'ACTIVE' THEN 'ACTIVE'::jobstatus
            WHEN status::text = 'INACTIVE' THEN 'INACTIVE'::jobstatus
            WHEN status::text = 'FILLED' THEN 'FILLED'::jobstatus
            ELSE status END
    """)
