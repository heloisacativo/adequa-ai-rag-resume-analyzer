from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from enum import Enum


class JobApplicationStatus(Enum):
    APPLIED = "applied"
    UNDER_REVIEW = "under_review"
    INTERVIEW = "interview"
    OFFER = "offer"
    REJECTED = "rejected"


@dataclass
class JobApplicationEntity:
    id: int
    user_id: str
    company_name: str
    job_title: str
    application_date: datetime
    description: str
    status: JobApplicationStatus
    created_at: datetime
    updated_at: Optional[datetime] = None