.PHONY: install install-backend install-frontend dev dev-backend dev-frontend seed test test-backend test-e2e lint typecheck build db-init prod-backend

# ── Backend ──────────────────────────────────────────────────────────────
install-backend:
	cd backend && pip install -r requirements.txt

db-init:
	cd backend && python -c "from app.database import init_db; init_db()"

seed:
	cd backend && python seed.py

dev-backend:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test-backend:
	cd backend && pytest tests/ -v

prod-backend:
	cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000

# ── Frontend ─────────────────────────────────────────────────────────────
install-frontend:
	cd frontend && npm install

dev-frontend:
	cd frontend && npm run dev

lint:
	cd frontend && npm run lint

typecheck:
	cd frontend && npx tsc --noEmit

build:
	cd frontend && npm run build

test-e2e:
	cd frontend && npm run test:e2e

# ── Combined ─────────────────────────────────────────────────────────────
install: install-backend install-frontend

dev:
	@echo "Start backend:  make dev-backend"
	@echo "Start frontend: make dev-frontend"

test: test-backend test-e2e

setup: install db-init seed
	@echo "Setup complete. Run 'make dev-backend' and 'make dev-frontend' in separate terminals."
