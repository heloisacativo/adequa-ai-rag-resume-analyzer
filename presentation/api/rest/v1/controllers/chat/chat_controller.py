from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, status, Depends, Query
from typing import List
from uuid import UUID

from application.services.chat.chat_service import ChatService
from presentation.api.rest.v1.schemas.requests import CreateChatSessionRequest, AddMessageRequest
from presentation.api.rest.v1.schemas.responses import ChatSessionResponse, ChatMessageResponse

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post(
    "/sessions",
    response_model=ChatSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new chat session",
)
@inject
async def create_session(
    request: CreateChatSessionRequest,
    chat_service: FromDishka[ChatService] = None,
) -> ChatSessionResponse:
    # Handle fake_user for testing
    if request.user_id == "fake_user":
        user_uuid = UUID("12345678-1234-5678-9012-123456789012")  # Default UUID for fake_user
    else:
        try:
            user_uuid = UUID(request.user_id)
        except ValueError:
            raise ValueError(f"Invalid user_id format: {request.user_id}")
    
    session = await chat_service.create_session(user_uuid, request.title)
    return ChatSessionResponse(
        session_id=str(session.session_id),
        user_id=str(session.user_id),
        title=session.title,
        created_at=session.created_at,
    )

@router.get(
    "/sessions",
    response_model=List[ChatSessionResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all chat sessions for the current user",
)
@inject
async def get_user_sessions(
    user_id: str = Query(..., description="User ID"),
    chat_service: FromDishka[ChatService] = None,
) -> List[ChatSessionResponse]:
    # Handle fake_user for testing
    if user_id == "fake_user":
        user_uuid = UUID("12345678-1234-5678-9012-123456789012")  # Default UUID for fake_user
    else:
        try:
            user_uuid = UUID(user_id)
        except ValueError:
            raise ValueError(f"Invalid user_id format: {user_id}")
    
    sessions = await chat_service.get_user_sessions(user_uuid)
    return [
        ChatSessionResponse(
            session_id=str(s.session_id),
            user_id=str(s.user_id),
            title=s.title,
            created_at=s.created_at,
        )
        for s in sessions
    ]

@router.post(
    "/sessions/{session_id}/messages",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a message to a chat session",
)
@inject
async def add_message(
    session_id: str,
    request: AddMessageRequest,
    chat_service: FromDishka[ChatService] = None,
) -> ChatMessageResponse:
    message = await chat_service.add_message(UUID(session_id), request.sender, request.text)
    return ChatMessageResponse(
        message_id=str(message.message_id),
        session_id=str(message.session_id),
        sender=message.sender,
        text=message.text,
        timestamp=message.timestamp,
    )

@router.get(
    "/sessions/{session_id}/messages",
    response_model=List[ChatMessageResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all messages for a chat session",
)
@inject
async def get_session_messages(
    session_id: str,
    chat_service: FromDishka[ChatService] = None,
) -> List[ChatMessageResponse]:
    messages = await chat_service.get_session_messages(UUID(session_id))
    return [
        ChatMessageResponse(
            message_id=str(m.message_id),
            session_id=str(m.session_id),
            sender=m.sender,
            text=m.text,
            timestamp=m.timestamp,
        )
        for m in messages
    ]