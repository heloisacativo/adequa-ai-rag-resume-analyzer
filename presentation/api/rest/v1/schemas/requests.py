from pydantic import BaseModel, EmailStr, Field

class RegisterUserRequest(BaseModel):
    email: EmailStr = Field(..., description="The user's email address")
    full_name: str = Field(..., description="The user's full name")
    password: str = Field(..., min_length=8, description="The user's password")
    is_hirer: bool = Field(default=False, description="Whether the user is a hirer or candidate")
class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="The user's email address")
    password: str = Field(..., description="The user's password")


# Job schemas
class CreateJobRequest(BaseModel):
    title: str = Field(..., min_length=2, description="Job title")
    description: str = Field(..., min_length=10, description="Job description")
    location: str = Field(..., min_length=2, description="Job location")


class UpdateJobRequest(BaseModel):
    title: str | None = Field(None, min_length=2, description="Job title")
    description: str | None = Field(None, min_length=10, description="Job description")
    requirements: str | None = Field(None, description="Job requirements")
    location: str | None = Field(None, min_length=2, description="Job location")
    salary: str | None = Field(None, description="Job salary")
    type: str | None = Field(None, description="Job type")
    status: str | None = Field(None, description="Job status")


# Chat schemas
class CreateChatSessionRequest(BaseModel):
    user_id: str = Field(..., description="The user ID (UUID string)")
    title: str = Field(..., min_length=1, description="The chat session title")


class AddMessageRequest(BaseModel):
    sender: str = Field(..., description="The sender of the message")
    text: str = Field(..., description="The message text")


class UpdateChatSessionRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="The new chat session title")