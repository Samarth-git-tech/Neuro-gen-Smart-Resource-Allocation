from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Task, User
from schemas import TaskCreate, TaskOut
import json
import datetime

from services.ai_service import analyze_task
from services.assignment_service import assign_task
from routes.auth import get_verified_email
from services.firebase import get_user_info_from_token

router = APIRouter(prefix="/tasks", tags=["Task Management"])

# ── Auth Helpers ──
def _require_auth(authorization: str = Header(None)) -> dict:
    """Verify Bearer token and return decoded user info."""
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


# ── Deadline helpers ──
DEADLINE_DELTA = {
    "urgent": datetime.timedelta(hours=1),
    "high":   datetime.timedelta(hours=2),
    "medium": datetime.timedelta(hours=6),
    "low":    datetime.timedelta(hours=24),
}

def compute_deadline(priority: str) -> datetime.datetime:
    delta = DEADLINE_DELTA.get((priority or "MEDIUM").lower(), datetime.timedelta(hours=6))
    return datetime.datetime.utcnow() + delta


@router.post("/", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    data: TaskCreate, 
    db: Session = Depends(get_db),
    _: dict = Depends(_require_auth)
):
    """Create a new task. Auto-categorizes via Gemini AI and sets deadline by priority."""

    task_text = f"{data.title}. {data.desc or ''}".strip()
    category = data.category or "other"
    priority = data.priority or "medium"

    try:
        task_data = {
            "title": data.title,
            "description": data.desc or "",
            "location": data.location or "Not provided",
            "people_count": 0,
            "urgency_hint": data.priority or ""
        }
        parsed_data = analyze_task(task_data)

        extracted_cat = parsed_data.get("category")
        extracted_pri = parsed_data.get("priority")
        extracted_problem = parsed_data.get("problem")
        extracted_skills = parsed_data.get("skills_required", [])
        extracted_resources = parsed_data.get("resources_required", [])

        if extracted_cat: category = extracted_cat
        if extracted_pri: priority = extracted_pri

        data.problem = extracted_problem
        data.skills_required = json.dumps(extracted_skills) if isinstance(extracted_skills, list) else str(extracted_skills)
        data.resources_required = json.dumps(extracted_resources) if isinstance(extracted_resources, list) else str(extracted_resources)

    except Exception:
        pass  # Fallback to user-provided or defaults

    if not category or category == "general":
        category = "other"
    if not priority:
        priority = "medium"

    # Auto-set deadline from priority
    deadline = compute_deadline(priority)
    # Emergency flag for high priority
    is_emergency = "true" if priority.lower() in ["urgent", "high"] else "false"

    new_task = Task(
        title=data.title,
        category=category,
        priority=priority,
        dueDate=data.dueDate,
        desc=data.desc,
        problem=data.problem,
        resources_required=data.resources_required,
        skills_required=data.skills_required,
        assignedTo=data.assignedTo,
        assignedVolunteers=data.assignedVolunteers,
        status=data.status if data.status else "pending",
        createdBy=data.createdBy,
        createdAt=data.createdAt,
        location=data.location,
        deadline=deadline,
        created_at=datetime.datetime.utcnow(),
        rejected_users="[]",
        is_emergency=is_emergency,
    )

    # Route through assignment engine
    new_task = assign_task(new_task, db)

    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


@router.get("/role/{role}", response_model=List[TaskOut])
def get_tasks_by_role(
    role: str, 
    db: Session = Depends(get_db),
    _: dict = Depends(_require_auth)
):
    """Get all tasks assigned to a specific role group (volunteer or helper)."""
    tasks = db.query(Task).filter(Task.assignedTo == role).all()
    return tasks


@router.get("/", response_model=List[TaskOut])
def get_all_tasks(
    db: Session = Depends(get_db),
    _: dict = Depends(_require_auth)
):
    """Get all tasks."""
    return db.query(Task).all()


@router.patch("/{task_id}/status")
def update_task_status(
    task_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    authorization: str = Header(None)
):
    """
    Volunteers accept/reject tasks. State machine:
    assigned → active   (accept)
    assigned → pending  (reject + add to rejection memory + reassign)
    active → completed
    """
    try:
        user_email = get_verified_email(authorization)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    is_admin = (user.role == "admin")
    if not is_admin:
        if task.assigned_to_id != user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this task's status")

    old_status = task.status
    allowed_statuses = ["pending", "active", "completed", "done"]
    if new_status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")

    if not is_admin:
        if old_status == "assigned" and new_status == "active":
            pass  # accept
        elif old_status == "assigned" and new_status == "pending":
            pass  # reject
        elif old_status == "active" and new_status in ("completed", "done"):
            pass  # complete
        else:
            raise HTTPException(status_code=400, detail=f"Invalid transition: {old_status} → {new_status}")

    # On reject: update rejection memory + reassign
    if old_status == "assigned" and new_status == "pending":
        excluded_id = task.assigned_to_id

        # Append to rejection memory
        try:
            rejected = json.loads(task.rejected_users or "[]")
        except Exception:
            rejected = []
        if excluded_id and excluded_id not in rejected:
            rejected.append(excluded_id)
        task.rejected_users = json.dumps(rejected)

        task.assigned_to_id = None
        task.assignedVolunteers = None
        task.assignedTo = None
        task.assignment_reason = None

        # Reassign excluding all past rejected users
        task = assign_task(task, db, exclude_user_id=excluded_id)
    else:
        new_stat = "completed" if new_status == "done" else new_status
        task.status = new_stat
        if new_stat == "completed":
            task.completed_at = datetime.datetime.utcnow()
            # If volunteer voluntarily completed this, set success score to 1 automatically
            task.success_score = 1

    db.commit()
    db.refresh(task)
    return {"message": f"Task #{task_id} updated to {task.status}", "task": TaskOut.model_validate(task)}


@router.delete("/{task_id}")
def delete_task(
    task_id: int, 
    db: Session = Depends(get_db),
    admin: User = Depends(_require_admin)
):
    """Delete a task by ID. Admin only."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": f"Task #{task_id} deleted successfully"}


# ── ADMIN OVERRIDES ──

@router.patch("/{task_id}/reassign")
def reassign_task(
    task_id: int, 
    db: Session = Depends(get_db),
    admin: User = Depends(_require_admin)
):
    """Admin endpoint to force re-evaluation of task assignment using AI engine."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Null out current assignment
    task.assigned_to_id = None
    task.assignedVolunteers = None
    task.assignedTo = None
    task.assignment_reason = None
    
    # Run assignment engine again
    task = assign_task(task, db)
    db.commit()
    return {"message": "Task reassigned", "task": TaskOut.model_validate(task)}

from pydantic import BaseModel
class PriorityUpdate(BaseModel):
    priority: str

@router.patch("/{task_id}/priority")
def update_priority(
    task_id: int, 
    data: PriorityUpdate, 
    db: Session = Depends(get_db),
    admin: User = Depends(_require_admin)
):
    """Admin endpoint to manually alter priority, recalculating deadline/emergency."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.priority = data.priority
    task.deadline = compute_deadline(data.priority)
    task.is_emergency = "true" if data.priority.lower() in ["urgent", "high"] else "false"
    
    # Consider if reassign is needed here, but let's keep it strictly priority update
    db.commit()
    return {"message": "Priority updated", "task": TaskOut.model_validate(task)}

@router.patch("/{task_id}/force-assign/{user_id}")
def force_assign_user(
    task_id: int, 
    user_id: int, 
    db: Session = Depends(get_db),
    admin: User = Depends(_require_admin)
):
    """Admin manual override to hardcode a user despite AI/workload rules."""
    task = db.query(Task).filter(Task.id == task_id).first()
    user = db.query(User).filter(User.id == user_id).first()
    
    if not task or not user:
        raise HTTPException(status_code=404, detail="Task or User not found")
    
    task.assigned_to_id = user.id
    task.assignedVolunteers = user.name
    task.assignedTo = user.role
    task.status = "assigned"
    task.assignment_reason = f"ADMIN OVERRIDE: Manually assigned to {user.name}."
    
    db.commit()
    return {"message": "Forced assignment successful", "task": TaskOut.model_validate(task)}

