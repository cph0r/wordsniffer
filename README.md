# WordSniffer

**Fetch. Search. Define. Repeat.**

WordSniffer is a full-stack word exploration tool that pulls random paragraphs from the internet, lets you search through them with precision, and builds a living dictionary from every word it finds. Think of it as a net that catches paragraphs and a magnifying glass that inspects every word inside.

---

## What Makes It Special

**Fetch** — Hit a button. Get a random paragraph from the wild internet. It lands in your database, timestamped and ready. No duplicates — WordSniffer remembers what it's already seen.

**Search** — Tag words, pick AND/OR logic, and watch WordSniffer hunt through every paragraph it's ever fetched. It highlights exact word matches (not substrings — searching "java" won't match "javascript"). Results load page by page so nothing chokes.

**Dictionary** — WordSniffer automatically analyzes every fetched paragraph, extracts the most frequent non-trivial words, and pulls real definitions from a dictionary API. Frequency bars show you which words dominate your collection.

---

## Tech Stack

| Layer      | Tech                                              |
| ---------- | ------------------------------------------------- |
| Backend    | Python 3.12, FastAPI, SQLAlchemy, PostgreSQL       |
| Frontend   | React 19, TypeScript, Vite, TanStack Query, Tailwind CSS |
| DevOps     | Docker, Docker Compose, GitHub Actions CI/CD       |
| Quality    | Ruff (lint + format), pytest (57+ tests), pre-commit hooks |

---

## Run It Locally (Docker)

Three commands. That's it.

```bash
# 1. Clone and enter the project
git clone <repo-url> && cd <repo-name>

# 2. Copy the env file (defaults work out of the box)
cp .env.example .env

# 3. Launch everything
make dev
```

PostgreSQL and the API spin up together. The API waits for the database to be healthy before starting — no race conditions.

Open **http://localhost:8000/python-api/docs** for the interactive API docs (Swagger UI).

---

## Run It Without Docker

If you prefer running things natively:

```bash
# Backend
cd artifacts/python-api
pip install -r requirements.txt
export DATABASE_URL="postgresql://user:pass@localhost:5432/wordsniffer"
uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend (in a separate terminal)
pnpm install
pnpm --filter @workspace/frontend run dev
```

---

## Makefile Commands

| Command         | What It Does                                     |
| --------------- | ------------------------------------------------ |
| `make dev`      | Start everything with Docker Compose              |
| `make test`     | Run the full test suite (57+ tests)               |
| `make lint`     | Check code style with Ruff                        |
| `make format`   | Auto-fix code style                               |
| `make typecheck`| TypeScript type checking                          |
| `make build`    | Build the Docker image                            |
| `make migrate`  | Initialize the database schema                    |
| `make clean`    | Tear down containers, volumes, and caches         |

---

## API Endpoints

All endpoints live under `/python-api/api/` and return a consistent envelope:

```json
{ "data": ..., "meta": ..., "error": null }
```

| Endpoint                    | Method | What It Does                                     |
| --------------------------- | ------ | ------------------------------------------------ |
| `/api/fetch`                | GET    | Fetch a random paragraph from the internet        |
| `/api/search`               | GET    | Search paragraphs by words (AND/OR, paginated)    |
| `/api/dictionary`           | GET    | Get top words with frequencies and definitions     |
| `/api/paragraphs/recent`    | GET    | List recently fetched paragraphs (paginated)       |
| `/health`                   | GET    | Health check                                       |

---

## CI/CD Pipeline

Every push and PR triggers four parallel CI jobs:

1. **Lint** — Ruff checks Python code style
2. **Test** — pytest runs against a real PostgreSQL service container
3. **Build** — Docker image compiles successfully
4. **Typecheck** — TypeScript catches type errors across the frontend

On merge to `main`, the CD pipeline builds and pushes a versioned Docker image to GitHub Container Registry (GHCR) with both `latest` and commit SHA tags.

---

## Project Structure

```
artifacts/
  python-api/          # FastAPI backend
    routes/            #   API endpoints (fetch, search, dictionary, paragraphs)
    services/          #   Business logic (HTTP client, text processing)
    models/            #   SQLAlchemy ORM models
    tests/             #   pytest test suite (57+ tests)
    Dockerfile         #   Multi-stage production build
  frontend/            # React + Vite frontend
    src/
      components/      #   UI panels (Fetch, Search, Dictionary)
      hooks/           #   TanStack Query hooks
      context/         #   React context (paragraph count)
      pages/           #   Page components
docker-compose.yml     # Service orchestration
docker-compose.override.yml  # Dev overrides (hot reload, port mapping)
Makefile               # Developer shortcuts
.github/workflows/     # CI/CD pipelines
.pre-commit-config.yaml # Git hooks (lint on commit)
```

---

## Pre-commit Hooks

Keep your commits clean automatically:

```bash
pip install pre-commit
pre-commit install
```

Every commit will auto-lint and format Python code, trim trailing whitespace, and validate YAML/JSON files.

---

## License

MIT
