from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class JobApplicationDTO:
    id: int
    user_id: str
    company_name: str
    job_title: str
    application_date: datetime
    description: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime]


@dataclass
class CreateJobApplicationDTO:
    company_name: str
    job_title: str
    application_date: datetime
    description: str


@dataclass
class UpdateJobApplicationStatusDTO:
    status: str