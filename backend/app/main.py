"""FastAPI application entry point."""
from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import SessionLocal, init_db
from app.routes import listings, bookings, favorites


def _enabled(name: str, default: str = "false") -> bool:
    return os.getenv(name, default).lower() in {"1", "true", "yes", "on"}


def _database_has_users() -> bool:
    from sqlalchemy import func, select
    from app.models import User
    with SessionLocal() as db:
        return bool(db.scalar(select(func.count(User.id))))


@asynccontextmanager
async def lifespan(_: FastAPI):
    if _enabled("SEED_ON_START"):
        from seed import seed
        seed()
    else:
        init_db()
        if _enabled("SEED_IF_EMPTY") and not _database_has_users():
            from seed import seed
            seed()
    yield

app = FastAPI(
    title="StayFinder API",
    description="Airbnb-inspired accommodation marketplace API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup ───────────────────────────────────────────────────────────────


# ── Health ────────────────────────────────────────────────────────────────


@app.get("/api/health", tags=["health"])
def health() -> dict:
    return {"status": "ok", "service": "stayfinder-api"}


# ── Routers ───────────────────────────────────────────────────────────────

app.include_router(listings.router)
app.include_router(bookings.router)
app.include_router(favorites.router)
