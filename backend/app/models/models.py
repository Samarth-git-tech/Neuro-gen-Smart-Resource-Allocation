from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.db.database import Base

# In C, you define structs for your data. Example:
# typedef struct {
#     int id;
#     char name[255];
#     char location[255];
#     char sector[50];
# } NGO;
# 
# In Python, we use an Object-Relational Mapper (ORM), which translates Python classes 
# directly into actual database tables automatically!

class NGO(Base):
    # This acts like a schema definition. It creates a table named 'ngos'.
    __tablename__ = "ngos"

    # 'id' is like your unique array index, incremented automatically by the DB engine.
    id = Column(Integer, primary_key=True, index=True) 
    name = Column(String, index=True)
    location = Column(String)
    sector = Column(String) # For example: Food, Health, Education

class Volunteer(Base):
    __tablename__ = "volunteers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    skills = Column(String) # For example: Medical, Logistics
    is_available = Column(Boolean, default=True)

    # Indicates a relationship. A Volunteer can point to multiple Tasks they are allocated to.
    # Think of this like an array or linked list of pointers inside the struct.
    allocations = relationship("Allocation", back_populates="volunteer")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, index=True)
    priority_score = Column(Integer) # From 1 (lowest) to 5 (highest)
    category = Column(String)
    status = Column(String, default="Open") # E.g., Open, Assigned, Done

    allocations = relationship("Allocation", back_populates="task")

class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys act exactly like typed pointers. They store the ID of another struct instance!
    volunteer_id = Column(Integer, ForeignKey("volunteers.id"))
    task_id = Column(Integer, ForeignKey("tasks.id"))
    
    status = Column(String, default="Active")

    # These link back to the Python Objects, acting like dereferenced pointers when you access them.
    volunteer = relationship("Volunteer", back_populates="allocations")
    task = relationship("Task", back_populates="allocations")
