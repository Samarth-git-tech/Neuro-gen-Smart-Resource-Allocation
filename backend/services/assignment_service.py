import json
import datetime
from sqlalchemy.orm import Session
from models import Task, User


# Workload cap — skip users already handling this many active tasks
MAX_ACTIVE_TASKS = 2


def _get_active_task_count(user: User, db: Session) -> int:
    """Count how many tasks are actively assigned to this user."""
    return db.query(Task).filter(
        Task.assigned_to_id == user.id,
        Task.status == "active"
    ).count()


def assign_task(task: Task, db: Session, exclude_user_id: int = None) -> Task:
    """
    Smart assignment engine with:
    - Priority-based fast-path (high = emergency, assign first available instantly)
    - Location-based preference (same city/area gets priority)
    - Skill matching (AI extracted skills vs user skills)
    - Category fallback matching
    - Workload capping (skip users with ≥ 2 active tasks)
    - Rejection memory (skip users who already rejected this task)
    - Decision explanation saved in task.assignment_reason
    """
    try:
        # ── Step 1: Build base candidate query ──
        query = db.query(User).filter(
            User.role.in_(["volunteer", "helper"]),
            User.availability.in_(["true", "True", "1", "yes", "Available"])
        )

        # Exclude the rejecting user if provided
        if exclude_user_id:
            query = query.filter(User.id != exclude_user_id)

        candidates = query.all()

        if not candidates:
            task.assigned_to_id = None
            task.assignedVolunteers = None
            task.assignedTo = None
            task.status = "pending"
            task.assignment_reason = "No available candidates found."
            return task

        # ── Step 2: Load rejected_users list ──
        rejected_ids = []
        if task.rejected_users:
            try:
                rejected_ids = json.loads(task.rejected_users)
            except Exception:
                rejected_ids = []

        # Filter out users in rejection memory
        candidates = [u for u in candidates if u.id not in rejected_ids]

        if not candidates:
            task.assigned_to_id = None
            task.assignedVolunteers = None
            task.assignedTo = None
            task.status = "pending"
            task.assignment_reason = "All matching users have already rejected this task."
            return task

        # ── Step 3: Filter out overloaded users (workload cap) ──
        candidates = [u for u in candidates if _get_active_task_count(u, db) < MAX_ACTIVE_TASKS]

        if not candidates:
            task.assigned_to_id = None
            task.assignedVolunteers = None
            task.assignedTo = None
            task.status = "pending"
            task.assignment_reason = "All available volunteers have reached the workload limit (2 active tasks)."
            return task

        # ── Step 4: EMERGENCY fast-path (high priority) ──
        task_priority = (task.priority or "medium").strip().lower()
        if task_priority == "high":
            chosen_user = candidates[0]
            task.assigned_to_id = chosen_user.id
            task.assignedVolunteers = chosen_user.name
            task.assignedTo = chosen_user.role
            task.status = "assigned"
            task.is_emergency = "true"
            task.assignment_reason = (
                f"EMERGENCY: High priority task assigned to first available volunteer "
                f"({chosen_user.name}) — bypassing skill filters."
            )
            return task

        # ── Step 5: Parse AI skills ──
        task_skills = []
        if task.skills_required:
            try:
                parsed = json.loads(task.skills_required)
                if isinstance(parsed, list):
                    task_skills = [str(s).strip().lower() for s in parsed]
                else:
                    task_skills = [str(parsed).strip().lower()]
            except Exception:
                task_skills = [s.strip().lower() for s in str(task.skills_required).split(",")]

        task_category = (task.category or "").strip().lower()
        task_location = (task.location or "").strip().lower()
        chosen_user = None
        match_reason = ""

        # ── Step 6: Location + Skill match (highest priority) ──
        if task_skills and task_location:
            for user in candidates:
                user_skills = [s.strip().lower() for s in str(user.skills or "").split(",")]
                user_location = (user.location or "").strip().lower()
                if set(task_skills).intersection(set(user_skills)) and user_location == task_location:
                    chosen_user = user
                    matched = list(set(task_skills).intersection(set(user_skills)))
                    match_reason = f"Matched on skill: {', '.join(matched)}, location: same ({task_location}), availability: true"
                    break

        # ── Step 7: Skill-only match ──
        if not chosen_user and task_skills:
            for user in candidates:
                user_skills = [s.strip().lower() for s in str(user.skills or "").split(",")]
                if set(task_skills).intersection(set(user_skills)):
                    chosen_user = user
                    matched = list(set(task_skills).intersection(set(user_skills)))
                    match_reason = f"Matched on skill: {', '.join(matched)}, availability: true"
                    break

        # ── Step 8: Location-only match ──
        if not chosen_user and task_location:
            for user in candidates:
                user_location = (user.location or "").strip().lower()
                if user_location == task_location:
                    chosen_user = user
                    match_reason = f"Matched on location: {task_location}, availability: true"
                    break

        # ── Step 9: Category fallback ──
        if not chosen_user and task_category:
            for user in candidates:
                user_skills_raw = str(user.skills or "").lower()
                if task_category in user_skills_raw:
                    chosen_user = user
                    match_reason = f"Matched on category: {task_category}, availability: true"
                    break

        # ── Step 10: Last resort — first available ──
        if not chosen_user:
            chosen_user = candidates[0]
            match_reason = "No skill/location match found — assigned to first available volunteer."

        # ── Assign ──
        if chosen_user:
            task.assigned_to_id = chosen_user.id
            task.assignedVolunteers = chosen_user.name
            task.assignedTo = chosen_user.role
            task.status = "assigned"
            task.is_emergency = "false"
            task.assignment_reason = match_reason
        else:
            task.assigned_to_id = None
            task.assignedVolunteers = None
            task.assignedTo = None
            task.status = "pending"
            task.assignment_reason = "No suitable volunteer found."

    except Exception as e:
        print(f"[Assignment Engine Error] {e}")
        task.assigned_to_id = None
        task.assignedVolunteers = None
        task.assignedTo = None
        task.status = "pending"
        task.assignment_reason = f"Assignment failed: {e}"

    return task
