from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Text
from sqlalchemy.orm import relationship
from database import Base
import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    mobile = Column(String, nullable=True)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)         # "admin", "volunteer", "helper"
    skills = Column(String, nullable=True)
    availability = Column(String, nullable=True)
    location = Column(String, nullable=True)      # NEW: city/area for location-based matching

    # One user → many assigned tasks
    tasks = relationship("Task", back_populates="assignee")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, default="general")
    priority = Column(String, default="medium")
    dueDate = Column(String, nullable=True)
    desc = Column(String, nullable=True)
    problem = Column(String, nullable=True)
    resources_required = Column(String, nullable=True)
    skills_required = Column(String, nullable=True)
    assignedTo = Column(String, nullable=True)           # e.g. "helper", "volunteer"
    assignedVolunteers = Column(String, nullable=True)   # comma separated names
    status = Column(String, default="pending")           # pending/assigned/active/completed/done
    createdBy = Column(String, nullable=True)
    createdAt = Column(String, nullable=True)
    location = Column(String, nullable=True)             # Task location for matching

    # NEW: Smart assignment fields
    deadline = Column(DateTime, nullable=True)           # Auto-set based on priority
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)       # NEW: For calculating average completion time
    success_score = Column(Integer, default=0)           # NEW: Feedback loop (1 for success, -1 for failure/rejected)
    rejected_users = Column(String, nullable=True)       # JSON list of user IDs who rejected
    assignment_reason = Column(String, nullable=True)    # Explanation of why this user was picked
    is_emergency = Column(String, default="false")       # "true" for high priority emergency tasks

    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assignee = relationship("User", back_populates="tasks")


class Need(Base):
    __tablename__ = "needs"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=False)
    area = Column(String, nullable=True)
    urgency = Column(String, default="low")
    category = Column(String, default="uncategorized")
    action = Column(String, default="")
    ai_message = Column(String, nullable=True)
    status = Column(String, default="new")           # "new", "reviewed", "addressed"


class AIRequest(Base):
    __tablename__ = "ai_requests"

    id = Column(Integer, primary_key=True, index=True)
    input_text = Column(String, nullable=False)
    category = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    analysis = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
