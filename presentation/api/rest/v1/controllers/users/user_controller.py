from uuid import UUID

from dishka import FromDishka
from dishka.integrations.fastapi import inject
from fastapi import APIRouter, HTTPException, Query

from application.services.users.user_service import UserServiceProtocol
from application.dtos.users.user import UserDTO

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/current-session", summary="Get current chat session for user")
@inject
async def get_current_session(
    user_service: FromDishka[UserServiceProtocol],
    user_id: str = Query(..., description="User ID"),
) -> dict:
    """Get the current active chat session for a user."""
    try:
        user = await user_service.get_user_by_id(UUID(user_id))
        return {"current_session_id": user.current_session_id}
    except Exception as e:
        raise HTTPException(status_code=404, detail="User not found")


@router.put("/current-session", summary="Set current chat session for user")
@inject
async def set_current_session(
    user_service: FromDishka[UserServiceProtocol],
    user_id: str = Query(..., description="User ID"),
    session_id: str = Query(..., description="Chat session ID"),
) -> dict:
    """Set the current active chat session for a user."""
    try:
        await user_service.update_current_session(UUID(user_id), session_id)
        return {"message": "Current session updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/current-session", summary="Clear current chat session for user")
@inject
async def clear_current_session(
    user_service: FromDishka[UserServiceProtocol],
    user_id: str = Query(..., description="User ID"),
) -> dict:
    """Clear the current active chat session for a user."""
    try:
        await user_service.update_current_session(UUID(user_id), None)
        return {"message": "Current session cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))