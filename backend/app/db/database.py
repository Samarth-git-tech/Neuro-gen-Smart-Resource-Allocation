from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# The database URL for SQLite. 
# This tells SQLAlchemy to store our database in a flat file named 'sql_app.db'
SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

# In C, you use pointers to manage connections to hardware or files.
# Here, the 'engine' manages the connection pool to the database files.
# connect_args={"check_same_thread": False} is a specific requirement for SQLite in FastAPI.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# A SessionLocal class is used to create actual database sessions per request.
# Think of it like a file descriptor or a network socket that gets opened and closed.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is a template class our models will inherit from (like a base struct type).
Base = declarative_base()

# Dependency to get a database session for every request
# Similar to allocating memory at the start of a function and freeing it at the end.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
