from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ── User Schemas ──

class UserCreate(BaseModel):
    name: str
    email: str
    mobile: Optional[str] = None
    role: str                          # "admin", "volunteer", "helper"
    skills: Optional[str] = None
    availability: Optional[str] = None
    location: Optional[str] = None     # NEW: city/area


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    mobile: Optional[str] = None
    role: str
    skills: Optional[str] = None
    availability: Optional[str] = None
    location: Optional[str] = None     # NEW

    class Config:
        from_attributes = True


# ── Task Schemas ──

class TaskCreate(BaseModel):
    title: str
    category: Optional[str] = "general"
    priority: Optional[str] = "medium"
    dueDate: Optional[str] = None
    desc: Optional[str] = None
    problem: Optional[str] = None
    resources_required: Optional[str] = None
    skills_required: Optional[str] = None
    assignedTo: Optional[str] = None
    assignedVolunteers: Optional[str] = None
    status: Optional[str] = "pending"
    createdBy: Optional[str] = "Unknown"
    createdAt: Optional[str] = None
    location: Optional[str] = None     # NEW: task location


class TaskOut(BaseModel):
    id: int
    title: str
    category: str
    priority: str
    dueDate: Optional[str] = None
    desc: Optional[str] = None
    problem: Optional[str] = None
    resources_required: Optional[str] = None
    skills_required: Optional[str] = None
    assignedTo: Optional[str] = None
    assignedVolunteers: Optional[str] = None
    assigned_to_id: Optional[int] = None
    status: str
    createdBy: Optional[str] = "Unknown"
    createdAt: Optional[str] = None
    location: Optional[str] = None          # NEW
    deadline: Optional[datetime] = None     # NEW: auto-set by priority
    created_at: Optional[datetime] = None   # NEW
    rejected_users: Optional[str] = None    # NEW: JSON list
    assignment_reason: Optional[str] = None # NEW: decision explanation
    is_emergency: Optional[str] = "false"   # NEW: emergency flag

    class Config:
        from_attributes = True


# ── Need Schemas (Community Input → AI Categorization) ──

class NeedCreate(BaseModel):
    text: str
    area: Optional[str] = None
    urgency: Optional[str] = "low"


class NeedOut(BaseModel):
    id: int
    text: str
    area: Optional[str] = None
    urgency: str
    category: str
    action: str
    ai_message: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


class AIRequestCreate(BaseModel):
    text: str


class AIRequestOut(BaseModel):
    id: int
    input_text: str
    category: str
    confidence: float
    analysis: str
    created_at: datetime

    class Config:
        from_attributes = True
