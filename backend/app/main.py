from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

# Use the full path starting from backend
from backend.app.db import database
from backend.app.models import models
from backend.app.schemas import schemas
app = FastAPI()
models.Base.metadata.create_all(bind=database.engine)
# --- CORS GATE PASS ---
# Ye React (port 5173) ko backend se baat karne ki permission deta hai
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATA MODELS (Like C Structs for Input) ---
class NGOCreate(BaseModel):
    name: str
    location: str
    sector: str

# --- ROUTES ---

@app.get("/")
def home():
    return {"message": "Smart Resource Allocation API is running!"}

@app.post("/register-ngo")
def register_ngo(ngo: NGOCreate, db: Session = Depends(database.get_db)):
    # Bilkul malloc() karke struct bharne jaisa hai
    new_ngo = models.NGO(name=ngo.name, location=ngo.location, sector=ngo.sector)
    db.add(new_ngo)
    db.commit()
    db.refresh(new_ngo)
    return {"status": "success", "data": new_ngo}

@app.get("/tasks")
def get_tasks(db: Session = Depends(database.get_db)):
    return db.query(models.Task).all()