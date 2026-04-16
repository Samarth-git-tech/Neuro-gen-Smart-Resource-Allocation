from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User, Task
from schemas import UserOut, TaskOut
from services.firebase import get_user_info_from_token

router = APIRouter(prefix="/users", tags=["Users"])


def _require_auth(authorization: str = Header(None)) -> dict:
    """Verify Bearer token and return decoded user info dict."""
    return get_user_info_from_token(authorization)


def _require_admin(authorization: str = Header(None), db: Session = Depends(get_db)) -> User:
    """Verify Bearer token AND enforce admin role."""
    user_info = get_user_info_from_token(authorization)
    email = user_info.get("email", "").strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


@router.get("/", response_model=List[UserOut])
def get_all_users(
    db: Session = Depends(get_db),
    admin: User = Depends(_require_admin),
):
    """Get all registered users. Admin only."""
    return db.query(User).all()


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(_require_auth),       # any authenticated user
):
    """Get a specific user by ID. Requires authentication."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{user_id}/tasks", response_model=List[TaskOut])
def get_user_tasks(
    user_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(_require_auth),
):
    """Get all tasks assigned to a specific user. Requires authentication."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    tasks = db.query(Task).filter(Task.assigned_to_id == user_id).all()
    return tasks


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(_require_admin),  # admin only
):
    """Delete a user by ID. Admin only."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": f"User #{user_id} deleted successfully"}