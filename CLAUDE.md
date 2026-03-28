# Bookmgr - Book Management System

## Project Overview
A web-based book management system where administrators can manage users and books (PDF files),
and users can browse and read books through a web console.

## Tech Stack
- **Backend**: Go 1.26+ | Chi router v5 | Ent ORM | uber-go/fx (DI) | golang-jwt/jwt v5
- **Frontend**: React 19 | TypeScript | Vite | React Router
- **Database**: PostgreSQL 16
- **File Storage**: Local filesystem (Docker volume)
- **Deployment**: Docker Compose

## Project Structure
```
bookmgr/
├── docs/                      # Project documentation
├── openspec/                  # OpenSpec spec-driven workflow
├── backend/
│   ├── cmd/server/main.go     # Entry point (fx.New bootstrap)
│   ├── handler/               # HTTP handlers (Chi routes)
│   ├── service/               # Business logic layer
│   ├── repository/            # Data access layer (wraps Ent client)
│   ├── ent/                   # Ent ORM (schema/ is hand-written, rest is generated)
│   │   └── schema/            # Ent schema definitions
│   ├── middleware/             # JWT auth, CORS, logging middleware
│   ├── storage/               # File storage abstraction
│   ├── config/                # Config loading (env vars)
│   ├── migrations/            # Database migrations
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

## Key Commands

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

### Docker
```bash
docker compose up -d          # Start all services
docker compose down           # Stop all services
docker compose up -d --build  # Rebuild and start
docker compose logs -f        # Follow logs
```

## Architecture Decisions

### NO internal/ directory
All packages live at the top level of `backend/`. Deliberate choice for simplicity.

### Dependency Injection with uber-go/fx
All components wired through fx. Each package exports a `Module` variable.
`cmd/server/main.go` composes fx.Options from each package's Module.

### Layered Architecture
```
HTTP Request -> middleware/ -> handler/ -> service/ -> repository/ -> ent/ -> PostgreSQL
```
- **handler/**: HTTP concerns only (parse request, call service, write response)
- **service/**: Business logic, validation, orchestration
- **repository/**: Data access, wraps Ent client queries

### Ent ORM
- Schema definitions in `backend/ent/schema/`
- Generated code in `backend/ent/` (committed to git)
- Run `go generate ./ent` after any schema change

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
- All API routes under `/api/v1/`
- JSON request/response bodies
- Standard error format: `{"error": "message", "code": "ERROR_CODE"}`
- Pagination: `?page=1&per_page=20`
- File upload: multipart/form-data

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
