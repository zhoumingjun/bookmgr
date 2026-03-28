## 1. Atlas Setup

- [ ] 1.1 Install Atlas CLI (`curl -sSf https://atlasgo.sh | sh`) and verify with `atlas version`
- [ ] 1.2 Add `ariga.io/atlas-go-sdk` and `ariga.io/atlas-provider-ent` dependencies to `backend/go.mod`
- [ ] 1.3 Create `backend/atlas.hcl` with Ent provider configuration: source = Ent schema, migration directory = `backend/migrations/`, database driver = PostgreSQL

## 2. Baseline Migration

- [ ] 2.1 Generate initial baseline migration from current Ent User schema: `atlas migrate diff --env ent "initial_user_schema"`
- [ ] 2.2 Review generated SQL: verify it creates the `users` table with correct columns, types, indexes, and constraints
- [ ] 2.3 Remove `backend/migrations/.gitkeep` (no longer needed with real migration files)

## 3. Programmatic Migration

- [ ] 3.1 Replace `client.Schema.Create(ctx)` in `backend/database/database.go` with Atlas programmatic migration using `atlas-go-sdk/migrate` — read migration files from embedded FS, apply pending migrations, log results
- [ ] 3.2 Embed migration directory in Go binary using `//go:embed migrations/*.sql migrations/atlas.sum`

## 4. Verification

- [ ] 4.1 Run `docker compose down -v` to wipe DB, then `docker compose up -d --build` — verify migrations applied and admin user seeded
- [ ] 4.2 Run again without wiping — verify no migrations applied (already up to date)
- [ ] 4.3 Update CLAUDE.md: add `atlas migrate diff` to key commands, document migration workflow
