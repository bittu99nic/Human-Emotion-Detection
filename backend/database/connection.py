import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Fallback to local SQLite database if no database environment is supplied
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aura_database.db")

# SQLite needs specific parameters for multi-threading
connect_args = {}
pool_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    if ":memory:" in DATABASE_URL:
        from sqlalchemy.pool import StaticPool
        pool_kwargs = {"poolclass": StaticPool}

engine = create_engine(DATABASE_URL, connect_args=connect_args, **pool_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    Dependency injection helper to yield active database sessions.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Scans SQLAlchemy Base metadata models and creates database tables on boot.
    """
    print(f"[AURA DATABASE] Initializing tables on database URL: {DATABASE_URL}")
    Base.metadata.create_all(bind=engine)
