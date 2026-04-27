from dotenv import load_dotenv
import os
load_dotenv()

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import database and routes
from database import engine, Base
from routes import auth, users, tasks, inputs, stats, ai

origins = [
    "http://localhost:5173",
    "https://digi-sahaay.vercel.app",
]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url.rstrip("/"))

# Configure logging for startup events
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

# The NLP Engine is now self-contained globally via `utils.classifier.py` and loads on boot.

# Initialize FastAPI App
app = FastAPI(
    title="Digi-Sahaay AI Backend",
    description="Smart Resource Allocation with AI + NLP Support",
    version="1.0.0"
)

# ── CORS Middleware ──
frontend_url = os.getenv("FRONTEND_URL")
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
]
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info("Startup complete: System online.")

# ── Register Routers ──
# Prefixing all routes with "/api" for standard API structure
app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(tasks.router, prefix="/api", tags=["Tasks"])
app.include_router(inputs.router, prefix="/api", tags=["Inputs"])
app.include_router(stats.router, prefix="/api", tags=["Stats"])
app.include_router(ai.router, prefix="", tags=["AI Requests"]) # Prefix empty here as it's defined in the router (/api/ai-process)

# ── Root Endpoint ──
@app.get("/")
def root():
    return {"message": "Backend with AI + NLP is running"}
