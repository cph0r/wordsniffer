.PHONY: dev test lint build migrate clean format typecheck

dev:
	docker compose up --build

test:
	cd artifacts/python-api && python -m pytest tests/ -v --tb=short

lint:
	cd artifacts/python-api && ruff check . && ruff format --check .

format:
	cd artifacts/python-api && ruff check --fix . && ruff format .

build:
	docker compose build

migrate:
	docker compose exec python-api python -c "from db import init_db; init_db()"

typecheck:
	pnpm run typecheck

clean:
	docker compose down -v --remove-orphans
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .ruff_cache -exec rm -rf {} + 2>/dev/null || true
