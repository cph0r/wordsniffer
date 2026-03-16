# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server (TypeScript)
│   ├── frontend/           # React + Vite frontend (API Explorer)
│   └── python-api/         # Python FastAPI server (with Dockerfile)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts
├── .github/workflows/      # CI/CD pipelines (ci.yml, cd.yml)
├── docker-compose.yml      # Multi-service Docker Compose
├── docker-compose.override.yml  # Dev overrides (hot reload)
├── Makefile                # Convenience targets (dev, test, lint, build, etc.)
├── .env.example            # Environment variable template
├── .pre-commit-config.yaml # Pre-commit hooks (ruff, formatting)
├── CONTRIBUTING.md         # Local development guide
├── pnpm-workspace.yaml     # pnpm workspace config
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## DevOps

- **Docker**: Multi-stage Dockerfile at `artifacts/python-api/Dockerfile` (python:3.12-slim, venv-based)
- **Docker Compose**: `docker-compose.yml` wires python-api + postgres:16 with named volume. `docker-compose.override.yml` adds hot-reload for dev.
- **Makefile**: `make dev`, `make test`, `make lint`, `make format`, `make build`, `make migrate`, `make typecheck`, `make clean`
- **CI** (`.github/workflows/ci.yml`): lint, test (with postgres service), docker build, TypeScript typecheck — all parallel
- **CD** (`.github/workflows/cd.yml`): builds & pushes to GHCR on push to main (latest + SHA tags)
- **Pre-commit**: `.pre-commit-config.yaml` with ruff, trailing-whitespace, end-of-file-fixer, check-yaml, check-json
- **Replit Deployment**: Autoscale target. Build step builds frontend (Vite, `BASE_PATH=/`) and copies output to `artifacts/python-api/static/`. Run step starts uvicorn. In production, FastAPI serves both API routes (`/api/*`) and the SPA (all other paths → `index.html`) from a single process. `REPLIT_DEPLOYMENT=1` env var toggles production mode (`root_path=""`, static file serving enabled).

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `artifacts/python-api` (Python FastAPI)

Python 3.12 FastAPI service with 3 endpoints for paragraph management:

- **`GET /api/fetch`** — Fetches a 50-sentence paragraph from metaphorpsum.com, stores in PostgreSQL, returns it. Deduplicates. Returns HTTP 502 on fetch failure.
- **`GET /api/paragraphs/recent?limit=20`** — Returns the most recently fetched paragraphs ordered by `fetched_at` descending. Supports `limit` param (1–100, default 20).
- **`GET /api/search?words=x,y&operator=or|and&limit=50&offset=0`** — Searches stored paragraphs by words with OR/AND logic. SQL-level ILIKE pre-filtering + Python token-based matching (no substring false positives). Case-insensitive. Paginated with limit/offset.
- **`GET /api/dictionary`** — Returns top 10 most frequent words (excluding stop words) with definitions from dictionaryapi.dev. Returns `"definition_not_found"` for missing words. Reads paragraphs in batches of 500.
- **`GET /health`** — Health check.
- All endpoints return `{data, meta, error}` JSON envelopes. Routes prefixed with `root_path="/python-api"` in dev, empty in production.

Stack: FastAPI, SQLAlchemy, PostgreSQL (`DATABASE_URL`), httpx (5s timeout, shared connection pool), Pydantic. Linting: Ruff.

- Entry: `main.py` — FastAPI app with lifespan (initializes DB + shared httpx client), CORS, global exception handler
- Routes: `routes/fetch.py`, `routes/paragraphs.py`, `routes/search.py`, `routes/dictionary.py` — all with SQLAlchemy error handling
- Services: `services/text_processing.py` (tokenize, frequency, search), `services/external_api.py` (shared HttpClient with connection pooling, defensive API response parsing)
- Models: `models/paragraph.py` — SQLAlchemy `Paragraph` model with descending index on `fetched_at`
- Config: `config.py` — environment vars, stop words, 5s fetch timeout
- DB: `db.py` — SQLAlchemy engine (dialect-aware: pool options for PostgreSQL only), session, `init_db()`
- Tests: `tests/` — pytest + httpx.AsyncClient with in-memory SQLite (StaticPool) for unit/integration tests (57 tests incl. recent paragraphs, search pagination, error handling, DB failure, malformed API response tests)
- Run: `cd artifacts/python-api && uvicorn main:app --host 0.0.0.0 --port 8000`
- Lint: `cd artifacts/python-api && ruff check . && ruff format --check .`
- Test: `cd artifacts/python-api && python3 -m pytest tests/ -v`

### `artifacts/frontend` (`@workspace/frontend`)

React + Vite frontend serving as an API Explorer for the Python FastAPI backend. Minimal black and white design with three tab-based panels:

- **Fetch panel**: Retrieve paragraphs, displayed as stacked cards with content, ID, timestamp, and source link. History persists across tab switches via React Query cache (loads from `/api/paragraphs/recent`, new fetches optimistically prepend).
- **Search panel**: Tag-input for multiple words, AND/OR toggle, results with highlighted matching words. Highlighting uses Unicode-safe lookahead/lookbehind (no `\b`), higher contrast marks (`bg-foreground/30`). Shows paginated result counts.
- **Dictionary panel**: Ranked frequency list with animated horizontal bars, inline definitions, phonetics, part of speech. Auto-loads on first visit with 60s staleTime cache. "Rescan" button for manual refresh.

Stack: React, Vite, TailwindCSS, React Query, Framer Motion.

Design: Minimal monochrome — pure black background, white/gray text, no rounded corners, Inter + JetBrains Mono fonts. Clean information-dense layout.

- Calls Python API at `/python-api/api/*` in dev (via Vite proxy to `http://localhost:8000`) or `/api/*` in production (same origin, served by FastAPI)
- Compact header with title and record count
- Inline error banners for failed API calls
- React Error Boundary wraps app for crash recovery
- Responsive for desktop and mobile
- Entry: `src/App.tsx` (includes ErrorBoundary), Pages: `src/pages/Home.tsx`
- Panels: `src/components/FetchPanel.tsx`, `src/components/SearchPanel.tsx`, `src/components/DictionaryPanel.tsx`
- API hooks: `src/hooks/use-api.ts` — `useRecentParagraphs` (staleTime: Infinity), `useDictionary` (auto-enabled, 60s staleTime), fetch/search use `useMutation`
- Context: `src/context/CountContext.tsx` (paragraph count state, no redundant API call)
- Optimizations: HighlightedText memoized with React.memo, maxFrequency with useMemo, native Intl.DateTimeFormat (no date-fns), unused Shadcn UI components removed

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
