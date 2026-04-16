from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import User
from schemas import UserCreate, UserLogin, UserOut

import firebase_config
from firebase_admin import auth as firebase_auth
from services.firebase import get_user_info_from_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Response schema for /auth/verify ──────────────────────────────────────────
class VerifyResponse(BaseModel):
    uid: str
    email: str

def get_verified_email(authorization: str) -> str:
    """Helper to verify token and extract email"""
    user_info = get_user_info_from_token(authorization)
    return user_info["email"].strip().lower()

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db), authorization: str = Header(None)):
    token_email = get_verified_email(authorization)
    email_normalized = user_data.email.strip().lower()
    
    if token_email != email_normalized:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token email mismatch")

    try:
        existing = db.query(User).filter(User.email == email_normalized).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        if user_data.role not in ("admin", "volunteer", "helper"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role must be admin, volunteer, or helper")

        new_user = User(
            name=user_data.name,
            email=email_normalized,
            mobile=user_data.mobile,
            skills=user_data.skills,
            availability=user_data.availability,
            password="",  # bcrypt logic removed, schema compatible
            role=user_data.role
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.post("/login", response_model=UserOut)
def login(db: Session = Depends(get_db), authorization: str = Header(None)):
    try:
        print("Incoming POST /auth/login")

        # Step 1: Verify Firebase token
        user_info = get_user_info_from_token(authorization)
        email = user_info.get("email")

        if not email:
            raise HTTPException(status_code=401, detail="No email found in token")

        email_normalized = email.strip().lower()
        print(f"Token verified. Looking up user: {email_normalized}")

        # Step 2: Lookup user in database
        user = db.query(User).filter(User.email == email_normalized).first()

        if not user:
            print("User not found in DB")
            raise HTTPException(status_code=404, detail="User not found in system")

        print(f"User found: ID={user.id}")
        return user

    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ── POST /auth/verify ──────────────────────────────────────────────────────────
@router.post(
    "/verify",
    response_model=VerifyResponse,
    summary="Verify Firebase ID Token",
    description=(
        "Reads the Bearer token from the Authorization header, "
        "verifies it with Firebase Admin SDK, and returns the "
        "authenticated user's uid and email."
    ),
)
def verify_token(authorization: str = Header(None)):
    """
    POST /auth/verify

    Headers:
        Authorization: Bearer <firebase_id_token>

    Returns:
        200 { uid, email }           — token is valid
        400                          — Authorization header missing
        401                          — token invalid / expired / revoked
    """
    user_info = get_user_info_from_token(authorization)
    return VerifyResponse(uid=user_info["uid"], email=user_info["email"])
