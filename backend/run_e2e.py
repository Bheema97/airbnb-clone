"""Seed an isolated database and serve it for Playwright guest-flow tests."""
import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./e2e.db")
os.environ.setdefault("ALLOWED_ORIGINS", "http://127.0.0.1:3000,http://localhost:3000")

from seed import seed  # noqa: E402

seed()

import uvicorn  # noqa: E402

uvicorn.run("app.main:app", host="127.0.0.1", port=8000)
