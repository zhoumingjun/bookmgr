## Why

The backend currently uses Ent's `client.Schema.Create(ctx)` auto-migration on every startup. This works for development but is unsafe for production — auto-migration can silently drop columns, lose data, or apply irreversible changes without review. As the schema evolves (Book entity, field changes), we need versioned, reviewable, and reversible database migrations. Atlas, built by the same team as Ent, provides native integration for generating migrations from Ent schema changes.

## What Changes

- Add **Atlas** CLI as a development dependency
- Create `atlas.hcl` configuration pointing to Ent schema as the desired state source
- Generate an initial migration from the current User schema (baseline)
- Replace `client.Schema.Create(ctx)` in `backend/database/database.go` with Atlas versioned migration (`atlas migrate apply`)
- Store migration files in `backend/migrations/` (versioned SQL, committed to git)
- Keep admin seeder running after migrations complete

## Capabilities

### New Capabilities

- `versioned-migration`: Atlas-based versioned database migration system integrated with Ent schema definitions, replacing auto-migration

### Modified Capabilities

- `user-schema`: Migration plan added — auto-migration requirement replaced with Atlas versioned migration on startup

## Impact

- **Code**: `backend/database/database.go` (replace auto-migration), `atlas.hcl` (new), `backend/migrations/` (new, SQL files)
- **Dependencies**: Atlas CLI (dev tool), `ariga.io/atlas-go-sdk` (Go library for programmatic migration)
- **Database**: no schema changes — the initial migration captures the existing User table as a baseline
- **Migration plan**: backward-compatible — existing databases get a baseline migration that matches current state; new databases get the full migration applied
- **Admin impact**: migration workflow changes — developers must run `atlas migrate diff` after Ent schema changes instead of relying on auto-migration
- **User impact**: none
