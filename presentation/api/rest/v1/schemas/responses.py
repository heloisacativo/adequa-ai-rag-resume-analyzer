from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class MaterialResponseSchema(BaseModel):
    model_config = ConfigDict(
        frozen=True,
        extra="forbid",
    )
    value: str


class EraResponseSchema(BaseModel):
    model_config = ConfigDict(
        frozen=True,
        extra="forbid",
    )
    value: str


class ArtifactResponseSchema(BaseModel):
    model_config = ConfigDict(
        frozen=True,
        extra="forbid",
        from_attributes=True,
    )

    inventory_id: UUID = Field(..., description="Unique identifier of the artifact")
    created_at: datetime = Field(
        description="Timestamp when the artifact record was created (UTC)",
    )
    acquisition_date: datetime = Field(
        ..., description="Date when the artifact was acquired"
    )
    name: str = Field(..., description="Name of the artifact")
    department: str = Field(
        ...,
        description="Department responsible for the artifact",
    )
    era: EraResponseSchema = Field(..., description="Historical era of the artifact")
    material: MaterialResponseSchema = Field(..., description="Material of the artifact")
    description: str | None = Field(
        None, description="Optional description of the artifact"
    )

class UserResponseSchema(BaseModel):
    user_id: UUID
    created_at: datetime
    email: str
    full_name: str
    is_active: bool
    is_hirer: bool
    last_login: datetime | None = None

class AuthTokenResponseSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponseSchema


# Job schemas
class JobResponseSchema(BaseModel):
    model_config = ConfigDict(
        frozen=True,
        extra="forbid",
    )

    id: str = Field(..., description="Job unique identifier")
    title: str = Field(..., description="Job title")
    description: str = Field(..., description="Job description")
    requirements: str | None = Field(None, description="Job requirements")
    location: str = Field(..., description="Job location")
    salary: str | None = Field(None, description="Job salary")
    type: str = Field(..., description="Job type")
    status: str = Field(..., description="Job status")
    created_at: str = Field(..., description="Job creation timestamp")
    updated_at: str = Field(..., description="Job last update timestamp")


class JobListResponseSchema(BaseModel):
    model_config = ConfigDict(
        frozen=True,
        extra="forbid",
    )

    jobs: list[JobResponseSchema] = Field(..., description="List of jobs")
    total: int = Field(..., description="Total number of jobs")


# Chat schemas
class ChatSessionResponse(BaseModel):
    model_config = ConfigDict(
        frozen=True,
        extra="forbid",
    )

    session_id: str = Field(..., description="Chat session unique identifier")
    user_id: str = Field(..., description="User ID")
    title: str = Field(..., description="Chat session title")
    created_at: datetime = Field(..., description="Session creation timestamp")


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(
        frozen=True,
        extra="forbid",
    )

    message_id: str = Field(..., description="Message unique identifier")
    session_id: str = Field(..., description="Chat session ID")
    sender: str = Field(..., description="Message sender")
    text: str = Field(..., description="Message text")
    timestamp: datetime = Field(..., description="Message timestamp")