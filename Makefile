.PHONY: dev test lint build migrate clean format typecheck

dev:
	docker compose up --build

test:
	docker compose run --rm --no-deps python-api python -m pytest tests/ -v --tb=short

lint:
	docker compose run --rm --no-deps python-api ruff check . && \
	docker compose run --rm --no-deps python-api ruff format --check .

format:
	docker compose run --rm --no-deps python-api ruff check --fix . && \
	docker compose run --rm --no-deps python-api ruff format .

build:
	docker compose build

migrate:
	docker compose run --rm python-api python -c "from db import init_db; init_db()"

typecheck:
	pnpm run typecheck

clean:
	docker compose down -v --remove-orphans
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .ruff_cache -exec rm -rf {} + 2>/dev/null || true
