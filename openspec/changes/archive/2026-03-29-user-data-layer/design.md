## Context

The bookmgr backend is scaffolded with Chi router and uber-go/fx DI but has no data model, no database connection, and no data access layer. The `ent/schema/` directory is empty, `repository/` exports an empty fx module, and `go.mod` lacks Ent and PostgreSQL driver dependencies. PostgreSQL 16 is already configured in `docker-compose.yml` with a health check.

## Goals / Non-Goals

**Goals:**
- Define the User entity as an Ent schema with all required fields and validations
- Establish a working PostgreSQL connection managed by fx lifecycle
- Implement a user repository with standard CRUD + lookup operations
- Run Ent auto-migration on startup
- Seed a default admin user when no admin exists

**Non-Goals:**
- Authentication/JWT (covered by the `auth-system` change)
- HTTP handlers or API endpoints for users
- Book entity (covered by the `book-management` change)
- Frontend changes

## Decisions

### 1. Use Ent auto-migration instead of manual migration files

**Choice**: Call `client.Schema.Create(ctx)` on startup.

**Why**: The project is greenfield with no production data. Auto-migration is simpler and keeps the schema definition as the single source of truth. Manual migrations can be introduced later when the schema stabilizes.

**Alternative considered**: Hand-written SQL migrations in `backend/migrations/` — rejected as premature for a new project with no existing data.

### 2. UUIDv7 primary keys

**Choice**: Use UUIDv7 as the primary key type for User (and all future entities).

**Why**: UUIDv7 is time-sortable (embeds a timestamp), so it preserves insertion order for indexed queries while avoiding the predictability of auto-increment IDs. This is better for APIs (no enumeration attacks) and future-proofs for distributed scenarios.

**Alternative considered**: Auto-increment integers — simpler but exposes record counts and ordering to API consumers.

### 3. Password hashing with bcrypt

**Choice**: Store bcrypt hashes in `password_hash` field, cost factor 10.

**Why**: bcrypt is the standard for password storage in Go (`golang.org/x/crypto/bcrypt`). Cost 10 balances security with performance.

**Alternative considered**: argon2id — better but adds configuration complexity; bcrypt is sufficient here.

### 4. Role as Ent enum field

**Choice**: Define `role` as an Ent `enum` field with values `admin` and `user`, defaulting to `user`.

**Why**: Ent enums map directly to PostgreSQL enums, providing database-level validation. Two roles are sufficient for the described use cases.

### 5. Repository as a thin wrapper over Ent client

**Choice**: The repository layer wraps Ent client calls, returning Ent-generated types directly.

**Why**: Adding separate domain types would be premature abstraction. Ent-generated types are already well-structured. The repository provides a consistent interface and centralizes query logic.

### 6. Admin seeding via fx lifecycle hook

**Choice**: On application start, check if any admin user exists. If not, create one with credentials from environment variables (`ADMIN_USERNAME`, `ADMIN_PASSWORD`) or defaults (`admin` / `changeme`).

**Why**: Ensures first-time setup works without manual database intervention. Using env vars allows secure configuration in production.

## Risks / Trade-offs

- **[Auto-migration in production]** → Acceptable for now; add migration tooling before first production deployment.
- **[Default admin password]** → Mitigation: log a warning at startup if using the default password; document that it must be changed.
- **[Ent types leak to service layer]** → Acceptable trade-off for simplicity; can introduce domain types if the service layer grows complex.
- **[No soft delete]** → Hard delete for now. Soft delete can be added via Ent mixin later if audit requirements emerge.
