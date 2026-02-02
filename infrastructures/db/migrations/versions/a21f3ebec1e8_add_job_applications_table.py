"""Add job_applications table

Revision ID: a21f3ebec1e8
Revises: 1ad818cc260c
Create Date: 2026-01-24 19:04:22.362621

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a21f3ebec1e8'
down_revision: Union[str, Sequence[str], None] = '1ad818cc260c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('job_applications',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.String(length=36), nullable=False),
    sa.Column('company_name', sa.String(), nullable=False),
    sa.Column('job_title', sa.String(), nullable=False),
    sa.Column('application_date', sa.DateTime(), nullable=False),
    sa.Column('description', sa.String(), nullable=False),
    sa.Column('status', sa.Enum('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', name='jobapplicationstatus'), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('job_applications')
