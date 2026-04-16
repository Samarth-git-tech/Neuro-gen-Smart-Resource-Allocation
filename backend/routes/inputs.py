from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Need
from schemas import NeedCreate, NeedOut

from services.ai_service import analyze_task
router = APIRouter(prefix="/inputs", tags=["Community Inputs"])

@router.post("/", response_model=NeedOut, status_code=status.HTTP_201_CREATED)
def submit_need(data: NeedCreate, db: Session = Depends(get_db)):
    """Submit raw community input. AI auto-categorizes and generates a smart alert."""

    try:
        ai_result = analyze_task({
            "title": "Community Input",
            "description": data.text,
            "location": data.area or "",
            "people_count": 0,
            "urgency_hint": data.urgency or ""
        })
        category = ai_result.get("category", "other")
        action = f"Handle {category} related issue"
    except Exception:
        category = "other"
        action = "Handle other related issue"

    formatted_msg = f"A potential '{category}' need has been detected based on community reports. AI Suggestion: {action}"

    new_need = Need(
        text=data.text,
        area=data.area,
        urgency=data.urgency,
        category=category,
        action=action,
        ai_message=formatted_msg,
        status="new"
    )

    db.add(new_need)
    db.commit()
    db.refresh(new_need)
    return new_need

@router.get("/", response_model=List[NeedOut])
def get_all_needs(db: Session = Depends(get_db)):
    """Get all community needs with their AI-assigned categories."""
    return db.query(Need).all()

@router.get("/{need_id}", response_model=NeedOut)
def get_need(need_id: int, db: Session = Depends(get_db)):
    """Get a specific community need by ID."""
    need = db.query(Need).filter(Need.id == need_id).first()
    if not need:
        raise HTTPException(status_code=404, detail="Need not found")
    return need

@router.patch("/{need_id}/status")
def update_need_status(need_id: int, new_status: str, db: Session = Depends(get_db)):
    """Update the status of a community need (new → reviewed → addressed)."""
    if new_status not in ("new", "reviewed", "addressed"):
        raise HTTPException(status_code=400, detail="Status must be new, reviewed, or addressed")

    need = db.query(Need).filter(Need.id == need_id).first()
    if not need:
        raise HTTPException(status_code=404, detail="Need not found")

    need.status = new_status
    db.commit()
    db.refresh(need)
    return {"message": f"Need #{need_id} status updated to {new_status}", "need": NeedOut.model_validate(need)}
