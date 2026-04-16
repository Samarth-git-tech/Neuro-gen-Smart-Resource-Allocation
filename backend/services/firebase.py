"""
services/firebase.py
────────────────────
Firebase Admin service layer.
All Firebase token verification logic is isolated here.
Routes import from this module — no Firebase SDK calls in route handlers.
"""

import logging
from firebase_admin import auth as firebase_auth
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


def extract_token_from_header(authorization: str | None) -> str:
    """
    Extract the raw Bearer token string from an Authorization header.

    Raises:
        400 – if the header is missing entirely
        401 – if the header is malformed (not 'Bearer <token>')

    Returns:
        str: the raw JWT token string
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization header is missing. Expected: 'Bearer <token>'",
        )

    parts = authorization.strip().split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed Authorization header. Expected format: 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token is empty. Provide a valid Firebase ID token.",
        )

    return token


def verify_firebase_token(token: str) -> dict:
    """
    Verify a Firebase ID token using Firebase Admin SDK.

    Args:
        token: Raw Firebase JWT string

    Raises:
        401 – if the token is invalid, expired, or revoked

    Returns:
        dict: Decoded token payload containing uid, email, and other claims
    """
    try:
        decoded = firebase_auth.verify_id_token(token)
        logger.info("Token verified successfully for uid: %s", decoded.get("uid"))
        return decoded

    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    except firebase_auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase ID token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    except Exception as e:
        logger.error("Token verification failed: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_user_info_from_token(authorization: str | None) -> dict:
    """
    Convenience function: extract + verify token in one call.

    Returns:
        dict with keys: uid (str), email (str), and full decoded payload
    """
    token = extract_token_from_header(authorization)
    decoded = verify_firebase_token(token)

    uid = decoded.get("uid")
    email = decoded.get("email", "")

    if not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing uid claim.",
        )

    return {
        "uid": uid,
        "email": email,
        "decoded": decoded,
    }
