# Arquivo: presentation/api/rest/v1/schemas/candidates/job_application.py

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

# --- Schemas de Entrada (Input) ---

class CreateJobApplicationSchema(BaseModel):
    """Schema para criar uma nova candidatura."""
    company_name: str
    job_title: str
    application_date: str  # ISO date string
    description: str

class UpdateJobApplicationStatusSchema(BaseModel):
    """Schema para atualizar o status de uma candidatura."""
    status: str 
    feedback: Optional[str] = None

# --- Schemas de Saída (Response) ---

class JobApplicationSchema(BaseModel):
    """Schema completo de leitura da candidatura."""
    id: int
    user_id: str
    company_name: str
    job_title: str
    application_date: str
    description: str
    status: str
    created_at: str
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True 

class ResumeAnalysisSchema(BaseModel):
    """Schema para o retorno da análise do currículo (IA)."""
    match_percentage: float = Field(..., description="Porcentagem de compatibilidade (0-100)")
    missing_skills: List[str] = []
    strengths: List[str] = []
    overall_feedback: Optional[str] = None
    improvement_tips: List[str] = Field(default_factory=list, description="Dicas de melhoria para o currículo")

    class Config:
        from_attributes = True

class StoredResumeAnalysisSchema(BaseModel):
    """Schema para o retorno da análise de currículo armazenado."""
    match_percentage: float = Field(..., description="Porcentagem de compatibilidade (0-100)")
    missing_skills: List[str] = []
    strengths: List[str] = []
    overall_feedback: Optional[str] = None
    resume_used: str = Field(..., description="Nome do arquivo do currículo utilizado na análise")
    improvement_tips: List[str] = Field(default_factory=list, description="Dicas de melhoria para o currículo")

    class Config:
        from_attributes = True