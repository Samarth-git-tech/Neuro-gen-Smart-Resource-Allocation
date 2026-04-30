from dotenv import load_dotenv
import os
load_dotenv()

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import database and routes
from database import engine, Base
from routes import auth, users, tasks, inputs, stats, ai

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
# Add every Vercel domain variant for this project.
# On Railway, set FRONTEND_URL to your exact Vercel production URL to
# avoid editing this file for each new deployment.
frontend_url = os.getenv("FRONTEND_URL")
origins = [
    # ── Local development ──
    "http://localhost:5173",
    "http://localhost:3000",
    # ── Neuro-gen / Digi-Sahaay Vercel domains ──
    "https://neuro-gen-smart-resource-allocation.vercel.app",
    "https://neuro-gen-smart-resource-allocation-git-main-jaiswals-projects.vercel.app",
    "https://neuro-gen-smart-resource-allocation-jaiswals-projects.vercel.app",
    "https://digi-sahaay.vercel.app",
    "https://digi-sahaay-jaiswals-projects.vercel.app",
]
if frontend_url:
    cleaned = frontend_url.rstrip("/")
    if cleaned not in origins:
        origins.append(cleaned)
        logger.info(f"CORS: added dynamic origin from env → {cleaned}")

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

@app.on_event("startup")
async def startup_event():
    logger.info("Startup complete: System online.")
    logger.info(f"CORS allowed origins: {origins}")

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
