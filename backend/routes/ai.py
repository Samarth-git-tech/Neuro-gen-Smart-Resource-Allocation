from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import AIRequest
from schemas import AIRequestCreate, AIRequestOut
from typing import List
import datetime
import json

from services.ai_service import analyze_task
from services.firebase import get_user_info_from_token

router = APIRouter(prefix="/api/ai-process")


def _get_opt_user(authorization: str = Header(None)):
    """
    Optional token verification — allows authenticated OR unauthenticated access
    to the AI board (community-facing feature).  Returns user info dict or None.
    """
    if not authorization:
        return None
    try:
        return get_user_info_from_token(authorization)
    except Exception:
        return None


@router.post("/ai-process")
def process_ai_input(
    data: AIRequestCreate,
    db: Session = Depends(get_db),
    authorization: str = Header(None),
):
    """
    Analyze text with Gemini AI and store the result.
    Route is accessible to authenticated users.
    Unauthenticated requests are accepted for community-facing input.
    """
    text_clean = data.text.strip() if data.text else ""
    if not text_clean:
        return {"success": False, "error": "Invalid input: empty text"}

    if len(text_clean) > 1500:
        return {"success": False, "error": "Invalid input: text exceeds 1500 characters"}

    try:
        # Pass as string — ai_service.analyze_task handles both str and dict
        parsed_data = analyze_task(text_clean)

        assigned_category = parsed_data.get("category", "other")
        assigned_priority  = parsed_data.get("priority",  "medium")
        problem            = parsed_data.get("problem",   "")
        skills_required    = parsed_data.get("skills_required",    [])
        resources_required = parsed_data.get("resources_required", [])

        new_request = AIRequest(
            input_text=text_clean,
            category=assigned_category,
            confidence=1.0,
            analysis=json.dumps(parsed_data),
            created_at=datetime.datetime.utcnow(),
        )
        db.add(new_request)
        db.commit()
        db.refresh(new_request)

        return {
            "success": True,
            "data": {
                "input":              new_request.input_text,
                "category":           new_request.category,
                "priority":           assigned_priority,
                "problem":            problem,
                "skills_required":    json.dumps(skills_required),
                "resources_required": json.dumps(resources_required),
            },
        }

    except json.JSONDecodeError as json_err:
        return {"success": False, "error": f"Failed to parse AI response: {str(json_err)}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.get("/ai-history", response_model=List[AIRequestOut])
def get_ai_history(db: Session = Depends(get_db)):
    """Return all past AI analyses ordered newest-first."""
    return db.query(AIRequest).order_by(AIRequest.created_at.desc()).all()
