import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

# ── Database configuration ──
# Resolves the DB path relative to this file, so it works regardless of cwd
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "digi_sahaay.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# ── Engine ──
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},  # Required for SQLite + FastAPI threads
    echo=False,  # Set True for SQL query logging during debugging
)

# Enable SQLite foreign key enforcement (off by default in SQLite)
@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

# ── Session factory ──
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ── Base class for ORM models ──
Base = declarative_base()


# ── Dependency for FastAPI routes ──
def get_db():
    """Yields a database session per request, ensures cleanup on completion."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
