"""Database setup: engine, session, base class, and init helper."""
import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

database_url_env = os.getenv("DATABASE_URL")
if database_url_env:
    DATABASE_URL = database_url_env
else:
    database_path = Path(os.getenv("DATABASE_PATH", "./airbnb.db")).expanduser().resolve()
    database_path.parent.mkdir(parents=True, exist_ok=True)
    DATABASE_URL = f"sqlite:///{database_path.as_posix()}"

# connect_args is required for SQLite to allow multi-threaded access
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency: yields a database session and closes it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables defined in models. Safe to call repeatedly."""
    # Import models so SQLAlchemy registers them before create_all
    from app import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
