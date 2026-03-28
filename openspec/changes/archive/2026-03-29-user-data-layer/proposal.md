## Why

The bookmgr project currently has only a scaffold — no data model, no database connection, and no data access layer. Every planned feature (authentication, book management, user management) depends on a functioning User entity backed by PostgreSQL. This change establishes the foundational data layer so subsequent changes can build on it.

## What Changes

- Define the **User** Ent schema with fields: `id` (UUIDv7), `username`, `email`, `password_hash`, `role` (enum: admin/user), `created_at`, `updated_at`
- Add Ent ORM, PostgreSQL driver, and bcrypt dependencies to `go.mod`
- Initialize the Ent client with PostgreSQL connection via uber-go/fx
- Implement the **user repository** with CRUD operations: Create, GetByID, GetByEmail, GetByUsername, List, Update, Delete
- Run auto-migration on startup to create the `users` table
- Seed a default admin user on first run

## Capabilities

### New Capabilities

- `user-schema`: Ent schema definition for the User entity, including field types, validations, indexes, and role enum
- `user-repository`: Data access layer wrapping Ent client for User CRUD operations, exposed as an fx module

### Modified Capabilities

_(none — no existing specs)_

## Impact

- **Code**: `backend/ent/schema/`, `backend/ent/` (generated), `backend/repository/`, `backend/cmd/server/main.go`
- **Dependencies**: adds `entgo.io/ent`, `github.com/lib/pq`, `golang.org/x/crypto` (bcrypt) to `go.mod`
- **Database**: creates `users` table in PostgreSQL with unique indexes on `username` and `email`
- **Admin impact**: default admin account seeded for initial access
- **User impact**: none directly — this is infrastructure; user-facing features come in subsequent changes (auth-system, admin-user-mgmt)
