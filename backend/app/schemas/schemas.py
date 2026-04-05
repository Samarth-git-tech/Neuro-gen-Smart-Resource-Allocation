from pydantic import BaseModel
from typing import Optional

# Pydantic is a data validation library.
# In C, you'd manually validate inputs, ensure strings are null-terminated, and check array boundaries.
# Here, Pydantic acts like a strict type-checker that parses a JSON payload safely over the network.

# ==========================================
# NGO Schemas
# ==========================================
# Base parameters needed for any NGO action
class NGOBase(BaseModel):
    name: str
    location: str
    sector: str
    admin_name: str
    phone: str
    email: str

# Schema representing incoming data for registration (Creation)
class NGOCreate(NGOBase):
    pass

# Schema representing outgoing data, returned to frontend
class NGO(NGOBase):
    id: int # Now includes the database-assigned ID

    class Config:
        # Ensures Pydantic can read from database Class objects, not just basic dictionaries
        from_attributes = True

# ==========================================
# Task Schemas
# ==========================================
class TaskBase(BaseModel):
    description: str
    priority_score: int
    category: str
    status: Optional[str] = "Open"

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: int

    class Config:
        from_attributes = True

# ==========================================
# Volunteer & Allocation Schemas
# ==========================================
class VolunteerBase(BaseModel):
    name: str
    skills: str
    is_available: Optional[bool] = True

class VolunteerCreate(VolunteerBase):
    pass

class Volunteer(VolunteerBase):
    id: int

    class Config:
        from_attributes = True

class AllocationBase(BaseModel):
    volunteer_id: int
    task_id: int
    status: Optional[str] = "Active"

class AllocationCreate(AllocationBase):
    pass

class Allocation(AllocationBase):
    id: int

    class Config:
        from_attributes = True
