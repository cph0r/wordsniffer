<p align="center">
  <img src="artifacts/frontend/public/logo.png" alt="WordSniffer Logo" width="120" />
</p>

# WordSniffer

**Fetch. Sniff. Kennel. Good boy.**

WordSniffer is a full-stack word exploration tool with the nose of a bloodhound. It sends a pup out to fetch random paragraphs from the wild internet, sniffs through them to find words by scent, and stores its favorite finds in the kennel. Think of it as a very good dog that retrieves paragraphs and never forgets a word.

---

## What Makes It Special

**Fetch** — Send the pup out to retrieve a fresh paragraph from the wild internet. It buries each one in the database, timestamped and ready. No duplicates — this dog remembers what it's already fetched.

**Sniff** — Drop a scent (words), pick ANY SCENT / ALL SCENTS logic, and watch the pup sniff through every paragraph it's ever retrieved. It highlights exact word matches (not substrings — sniffing "java" won't turn up "javascript"). Trails load page by page so nothing chokes.

**Kennel** — The pup's trophy room. WordSniffer automatically chews through every fetched paragraph, extracts the top 10 most frequent non-trivial words, and pulls real definitions from a dictionary API. Frequency bars show which words the pup digs most.

---

## Tech Stack

| Layer      | Tech                                              |
| ---------- | ------------------------------------------------- |
| Backend    | Python 3.12, FastAPI, SQLAlchemy, PostgreSQL       |
| Frontend   | React 19, TypeScript, Vite, TanStack Query, Tailwind CSS |
| DevOps     | Docker, Docker Compose, GitHub Actions CI/CD       |
| Quality    | Ruff (lint + format), pytest (59 tests), pre-commit hooks |

---

## Live Demo

**[Try WordSniffer Live](https://wordsniffer.replit.app/)**

WordSniffer is deployed on Replit. In production, a single FastAPI process serves both the API and the React frontend — no separate web server needed.

---

## Run It Locally (Docker)

Three commands. That's it.

```bash
# 1. Clone and enter the project
git clone https://github.com/cph0r/wordsniffer.git && cd wordsniffer

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
| `make test`     | Run the full test suite (59 tests)                |
| `make lint`     | Check code style with Ruff                        |
| `make format`   | Auto-fix code style                               |
| `make typecheck`| TypeScript type checking                          |
| `make build`    | Build the Docker image                            |
| `make migrate`  | Initialize the database schema                    |
| `make clean`    | Tear down containers, volumes, and caches         |

---

## API Endpoints

All endpoints live under `/api/` and return a consistent envelope:

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
    tests/             #   pytest test suite (59 tests)
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

## Production Deployment

In production, the FastAPI backend does double duty — it serves the API at `/api/*` and also serves the built React frontend as static files. All other routes fall through to `index.html` for SPA client-side routing.

The build pipeline:
1. Vite compiles the React frontend into static assets
2. The built files are copied into the Python API's `static/` directory
3. Uvicorn starts a single FastAPI process that handles everything

This means zero CORS issues, zero proxy layers, and a single port to manage.

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
