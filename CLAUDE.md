# Bookmgr - Book Management System

## Project Overview
A web-based book management system where administrators can manage users and books (PDF files),
and users can browse and read books through a web console.

## Tech Stack
- **Backend**: Go 1.26+ | gRPC + grpc-gateway | Chi router v5 (non-API routes) | Ent ORM | uber-go/fx (DI) | golang-jwt/jwt v5
- **API Definition**: Protocol Buffers | buf (lint, breaking, generate) | AIP compliant (aip.dev)
- **Frontend**: React 19 | TypeScript | Vite | React Router
- **Database**: PostgreSQL 16 | Atlas (migration)
- **File Storage**: Local filesystem (Docker volume)
- **Deployment**: Docker Compose

## Project Structure
```
bookmgr/
├── api/                       # Proto API definitions (source of truth)
│   └── bookmgr/v1/           # API v1 proto files
│       ├── auth_service.proto
│       ├── book_service.proto
│       ├── user_service.proto
│       └── common.proto       # Shared types (pagination, etc.)
├── gen/                       # Generated code (proto, grpc-gateway, openapi)
├── docs/                      # Project documentation
├── openspec/                  # OpenSpec spec-driven workflow
├── backend/
│   ├── cmd/server/main.go     # Entry point (fx.New bootstrap)
│   ├── handler/               # gRPC service implementations
│   ├── service/               # Business logic layer
│   ├── repository/            # Data access layer (wraps Ent client)
│   ├── database/              # DB connection, migration, seeding
│   ├── migrations/            # Atlas versioned SQL migrations (embedded in binary)
│   ├── ent/                   # Ent ORM (schema/ is hand-written, rest is generated)
│   │   └── schema/            # Ent schema definitions
│   ├── middleware/             # JWT auth, CORS, logging middleware
│   ├── storage/               # File storage abstraction
│   ├── config/                # Config loading (env vars)
│   ├── go.mod
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── pages/admin/       # Admin dashboard pages
    │   ├── pages/console/     # User console pages
    │   ├── components/        # Shared UI components
    │   ├── api/               # API client (axios/fetch wrapper)
    │   └── auth/              # JWT auth context & hooks
    ├── package.json
    └── Dockerfile
```

### Key Commands

### Proto / API
```bash
buf lint                       # Lint proto files (AIP rules)
buf breaking --against '.git#branch=main'  # Detect breaking API changes
buf generate                   # Generate Go, gRPC, gateway, OpenAPI code
```

### Database Migrations
```bash
cd backend
# After changing Ent schemas, generate a new migration:
atlas migrate diff <migration_name> --env ent
# Verify migration integrity:
atlas migrate validate --dir file://migrations
# Rehash after manual edits:
atlas migrate hash --dir file://migrations
```

### Backend
```bash
cd backend
go run ./cmd/server           # Run the server
go test ./...                 # Run all tests
go generate ./ent             # Regenerate Ent code after schema changes
go vet ./...                  # Lint
```

### Frontend
```bash
cd frontend
npm install                   # Install dependencies
npm run dev                   # Dev server (Vite)
npm run build                 # Production build
npm run lint                  # ESLint
npm test                      # Vitest
```

### Docker / Environment Management
```bash
# Environment management via scripts/env.sh
./scripts/env.sh prod up        # Start prod (port 8000)
./scripts/env.sh prod down      # Stop prod
./scripts/env.sh prod rebuild   # Rebuild and start prod
./scripts/env.sh prod logs      # Follow prod logs

./scripts/env.sh test up        # Start test (port 9000, clean DB)
./scripts/env.sh test down      # Stop test
./scripts/env.sh test run       # up → API BDD + E2E BDD → down
./scripts/env.sh test run-api   # Run API BDD only
./scripts/env.sh test run-e2e   # Run E2E BDD only

./scripts/env.sh status         # Show both environments
```

## Architecture Decisions

### NO internal/ directory
All packages live at the top level of `backend/`. Deliberate choice for simplicity.

### Dependency Injection with uber-go/fx
All components wired through fx. Each package exports a `Module` variable.
`cmd/server/main.go` composes fx.Options from each package's Module.

### Layered Architecture
```
gRPC Request -> gRPC service (handler/) -> service/ -> repository/ -> ent/ -> PostgreSQL
HTTP Request -> Chi (middleware/) -> grpc-gateway -> gRPC service -> service/ -> repository/ -> ent/ -> PostgreSQL
```
- **handler/**: gRPC service implementations (proto-generated interfaces)
- **service/**: Business logic, validation, orchestration
- **repository/**: Data access, wraps Ent client queries
- **Chi router**: Handles non-API routes (/healthz), middleware (logging, recovery, CORS), mounts grpc-gateway for /api/v1

### API Design (gRPC + grpc-gateway)
- API defined in Protocol Buffers under `api/bookmgr/v1/`
- Follows Google AIP standards (aip.dev) — resource-oriented design
- grpc-gateway generates REST endpoints, mounted on Chi under `/api/v1`
- OpenAPI spec auto-generated from proto annotations
- `buf breaking` enforces backward compatibility on every change
- Pagination: token-based (AIP-158) with `page_size` and `page_token`
- Errors: `google.rpc.Status` model (AIP-193), auto-mapped to HTTP status by gateway
- Validation: protovalidate for declarative request validation in proto files

### Ent ORM
- Schema definitions in `backend/ent/schema/`
- Generated code in `backend/ent/` (committed to git)
- Run `go generate ./ent` after any schema change

### Atlas Versioned Migrations
- Migration SQL files in `backend/migrations/` (committed to git, reviewed in PRs)
- `atlas.hcl` configures Ent provider for diffing schema against migrations
- Migrations embedded in Go binary via `//go:embed` and applied programmatically at startup
- Revision tracking via `atlas_schema_revisions` table in PostgreSQL
- Workflow: change Ent schema → `go generate ./ent` → `atlas migrate diff --env ent "<name>"` → review SQL → commit

### Frontend Single-App Architecture
One React app with React Router:
- `/admin/*` routes - Admin dashboard (protected, role=admin)
- `/console/*` routes - User console (protected, any authenticated user)
- `/login`, `/register` - Public routes

### JWT Authentication
- Backend issues JWT on login with claims: {sub, role, exp}
- Frontend stores JWT in localStorage, sends via Authorization: Bearer header
- Backend middleware validates JWT on protected routes
- Admin routes additionally check role=admin

### API Conventions
- All API defined in proto files under `api/bookmgr/v1/`
- REST endpoints auto-generated via grpc-gateway under `/api/v1/`
- Error model: `google.rpc.Status` (AIP-193)
- Pagination: `page_size` + `page_token` (AIP-158)
- Resource naming: AIP-122 (e.g., `books/{book}`, `users/{user}`)
- File upload: multipart/form-data via custom HTTP endpoint (grpc-gateway httpbody)
- Breaking changes detected by `buf breaking` before merge

## Code Conventions
- Go: follow standard Go conventions, gofmt, no global state
- Go errors: wrap with `fmt.Errorf("context: %w", err)`
- TypeScript: strict mode, functional components, hooks
- Naming: Go uses MixedCaps, TypeScript uses camelCase for variables, PascalCase for components
- API client functions return typed responses, handle errors centrally

## Important Constraints
- PDF files can be large; use streaming for upload/download
- File storage path: `/app/uploads/` in container, mapped via Docker volume
- Database connection string from environment variable `DATABASE_URL`
- JWT secret from environment variable `JWT_SECRET`
- Server port from environment variable `PORT` (default 8080)
