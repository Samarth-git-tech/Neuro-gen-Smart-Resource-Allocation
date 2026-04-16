from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Task
from sqlalchemy import func

router = APIRouter(prefix="/stats", tags=["System Statistics"])

@router.get("/")
def get_system_stats(db: Session = Depends(get_db)):
    # 1. Total emergency tasks
    total_emergency = db.query(Task).filter(Task.is_emergency == "true").count()
    
    # 2. Success rate
    total_completed = db.query(Task).filter(Task.status == "completed").count()
    total_success_score = db.query(func.sum(Task.success_score)).filter(Task.status == "completed").scalar() or 0
    
    success_rate = 0
    if total_completed > 0:
        success_rate = round((total_success_score / total_completed) * 100, 1)

    # 3. Avg completion time
    completed_tasks = db.query(Task).filter(Task.status == "completed", Task.completed_at != None, Task.created_at != None).all()
    avg_completion_time = "N/A"
    
    if completed_tasks:
        total_seconds = sum((t.completed_at - t.created_at).total_seconds() for t in completed_tasks)
        avg_seconds = total_seconds / len(completed_tasks)
        
        hours = int(avg_seconds // 3600)
        minutes = int((avg_seconds % 3600) // 60)
        
        if hours > 0:
            avg_completion_time = f"{hours}h {minutes}m"
        else:
            avg_completion_time = f"{minutes}m"

    return {
        "success_rate": success_rate,
        "total_emergency": total_emergency,
        "avg_completion_time": avg_completion_time,
        "total_tasks_completed": total_completed
    }
