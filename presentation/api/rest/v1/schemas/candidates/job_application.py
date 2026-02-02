from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CreateJobApplicationSchema(BaseModel):
    company_name: str
    job_title: str
    application_date: datetime
    description: str


class UpdateJobApplicationStatusSchema(BaseModel):
    status: str


class JobApplicationSchema(BaseModel):
    id: int
    user_id: str
    company_name: str
    job_title: str
    application_date: datetime
    description: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime]


class ResumeAnalysisSchema(BaseModel):
    strengths: list[str]
    weaknesses: list[str]
    suggestions: list[str]