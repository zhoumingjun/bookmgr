# Development Setup

## Prerequisites
- Go 1.26+
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)

## Quick Start

### 1. Start Database
```bash
docker compose up -d postgres
```

### 2. Run Backend
```bash
cd backend
go run ./cmd/server
```

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend dev server runs on http://localhost:3000 with API proxy to :8080.

## Full Docker Setup
```bash
docker compose up -d --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- PostgreSQL: localhost:5432

## Ent Schema Changes
```bash
cd backend
# Create new schema
go run -mod=mod entgo.io/ent/cmd/ent new <EntityName>
# Regenerate after schema edits
go generate ./ent
```
