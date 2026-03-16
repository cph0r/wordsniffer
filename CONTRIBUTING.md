# Contributing

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js 24+](https://nodejs.org/) with [pnpm](https://pnpm.io/)
- Python 3.12+ (for running tests/linting locally without Docker)

## Local Setup

```bash
git clone <repo-url> && cd <repo-name>

cp .env.example .env

make dev
```

The Python API will be available at `http://localhost:8000/python-api/`.

## Running Tests

```bash
make test
```

Tests use an in-memory SQLite database and do not require a running PostgreSQL instance.

## Linting

```bash
make lint

make format
```

## TypeScript Typecheck

```bash
make typecheck
```

## Pre-commit Hooks

Install pre-commit hooks to automatically lint and format on every commit:

```bash
pip install pre-commit
pre-commit install
```

## CI/CD Pipeline

Every pull request and push to `main` triggers the CI pipeline (`.github/workflows/ci.yml`):

| Job         | What it does                                       |
| ----------- | -------------------------------------------------- |
| **lint**    | Runs `ruff check` and `ruff format --check`        |
| **test**    | Runs `pytest` with coverage against PostgreSQL      |
| **build**   | Builds the Docker image to verify it compiles       |
| **typecheck** | Runs `pnpm run typecheck` for TypeScript projects |

On push to `main`, the CD pipeline (`.github/workflows/cd.yml`) builds and pushes the Docker image to GitHub Container Registry (GHCR).

## Project Structure

```
artifacts/python-api/   # FastAPI backend (Python)
artifacts/frontend/     # React + Vite frontend
artifacts/api-server/   # Express API server (TypeScript)
lib/                    # Shared libraries
```
