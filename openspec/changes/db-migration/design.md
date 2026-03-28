## Context

The backend uses Ent ORM with a User schema (UUIDv7 id, username, email, password_hash, role, timestamps). On startup, `client.Schema.Create(ctx)` auto-migrates the database. The `backend/migrations/` directory exists but is empty (`.gitkeep` only). PostgreSQL 16 runs in Docker Compose. More entities (Book) will be added in future changes.

## Goals / Non-Goals

**Goals:**
- Replace auto-migration with Atlas versioned migrations
- Generate migrations from Ent schema diffs automatically
- Apply migrations programmatically on startup (no manual CLI step in production)
- Store migration files as reviewed, committed SQL

**Non-Goals:**
- Down migrations / rollback SQL (Atlas uses a different approach — roll forward with new migrations)
- Migration UI or admin tooling
- Changing the database schema itself (this change is infrastructure only)

## Decisions

### 1. Atlas with Ent integration (atlas-go-sdk)

**Choice**: Use Atlas's Ent integration to diff Ent schemas against the database and generate versioned SQL migrations. Apply migrations programmatically at startup using `atlas-go-sdk`.

**Why**: Atlas + Ent share the same team at Ariga. The integration reads Ent schema Go code directly — no intermediate HCL needed. This keeps Ent schemas as the single source of truth.

**Alternative considered**: goose with hand-written SQL — requires maintaining two representations of the schema (Ent + SQL), prone to drift.

### 2. Programmatic migration at startup (not CLI-only)

**Choice**: Use `atlas-go-sdk/migrate` package to apply pending migrations in Go code at application startup, replacing the current `client.Schema.Create(ctx)` call.

**Why**: Production containers don't need the Atlas CLI installed. Migration is automatic on deploy, same UX as auto-migration but with versioned, reviewed SQL.

**Alternative considered**: Run `atlas migrate apply` as a separate init container — adds operational complexity; programmatic approach is simpler for a single-instance deployment.

### 3. Migration files in `backend/migrations/`

**Choice**: Store migration files (SQL + atlas.sum) in `backend/migrations/`, committed to git.

**Why**: The directory already exists. Migrations are part of the backend codebase. Developers review SQL in PRs before merging.

### 4. Developer workflow: `atlas migrate diff`

**Choice**: After changing Ent schemas, developers run `atlas migrate diff --env ent "<migration_name>"` to generate a new migration file, then review and commit.

**Why**: Atlas diffs the desired state (Ent schema) against the migration directory to produce the minimal SQL change. This is automatic and prevents manual SQL errors.

### 5. Baseline migration for existing databases

**Choice**: Generate an initial migration that creates the `users` table as it currently exists. For databases that already have the table (dev environments), use Atlas's baseline mechanism.

**Why**: Ensures both fresh and existing databases are in a consistent state relative to the migration history.

## Risks / Trade-offs

- **[Atlas learning curve]** → Mitigation: document the `atlas migrate diff` workflow in CLAUDE.md; the day-to-day command is simple.
- **[Migration conflicts in teams]** → Mitigation: `atlas.sum` checksum file detects conflicting migrations at PR review time.
- **[Startup latency]** → Mitigation: migration check is fast (read atlas.sum, compare to DB state); only applies pending migrations.
