from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import User
from schemas import UserCreate, UserOut

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
    print(f"DEBUG AUTH HEADER (get_verified_email): {authorization}")
    user_info = get_user_info_from_token(authorization)
    email = user_info.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Token email missing")
    return email.strip().lower()

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db), authorization: str = Header(None)):
    print(f"Incoming registration body: {user_data.dict()}")
    token_email = get_verified_email(authorization)
    
    # Strictly enforce identity through Firebase, completely ignoring frontend email matching.
    email_normalized = token_email

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
            role=user_data.role,
            location=user_data.location  # Fixed DB insert to include location
        )
        db.add(new_user)
        try:
            db.commit()
            db.refresh(new_user)
        except Exception as e:
            db.rollback()
            print(f"DB Insert Error on register: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Database error during registration: {str(e)}")
            
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

        # Step 2: Lookup user in database with try-except to catch 500 error root cause
        try:
            user = db.query(User).filter(User.email == email_normalized).first()
        except Exception as e:
            print(f"DB Query Error in login: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Database schema or query error: {str(e)}")

        if not user:
            print(f"User not found in DB for email: {email_normalized}")
            raise HTTPException(status_code=404, detail="User not found in system")

        print(f"User found: ID={user.id}")
        return user

    except HTTPException:
        raise
    except Exception as e:
        print(f"Login unexpected python error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


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
