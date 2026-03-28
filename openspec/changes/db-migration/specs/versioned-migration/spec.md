## ADDED Requirements

### Requirement: Atlas configuration for Ent integration
The project SHALL have an `atlas.hcl` configuration file in `backend/` that uses Ent schema as the desired state source and `backend/migrations/` as the migration directory.

#### Scenario: Atlas reads Ent schema
- **WHEN** `atlas migrate diff` is run with the Ent environment
- **THEN** Atlas SHALL read the Ent schema definitions from `backend/ent/schema/` and compare against the migration directory to produce a diff

### Requirement: Versioned migration files
Database schema changes SHALL be managed through versioned SQL migration files stored in `backend/migrations/`, with an `atlas.sum` checksum file for integrity verification.

#### Scenario: Migration directory contains SQL and checksum
- **WHEN** the migration directory is inspected
- **THEN** it SHALL contain one or more `.sql` files and an `atlas.sum` file

#### Scenario: Checksum integrity
- **WHEN** a migration file is modified without updating the checksum
- **THEN** `atlas migrate validate` SHALL fail with an integrity error

### Requirement: Initial baseline migration
The migration directory SHALL contain an initial migration that creates the `users` table matching the current Ent User schema (UUIDv7 id, username, email, password_hash, role enum, created_at, updated_at, unique indexes).

#### Scenario: Fresh database after baseline migration
- **WHEN** the baseline migration is applied to an empty database
- **THEN** the `users` table SHALL exist with all columns, constraints, and indexes matching the Ent User schema

### Requirement: Programmatic migration on startup
The application SHALL apply pending Atlas migrations programmatically at startup, replacing the previous `client.Schema.Create(ctx)` auto-migration.

#### Scenario: Pending migration applied on startup
- **WHEN** the application starts and there are unapplied migrations
- **THEN** the pending migrations SHALL be applied in order before the application begins serving requests

#### Scenario: No pending migrations
- **WHEN** the application starts and all migrations are already applied
- **THEN** the startup SHALL proceed without applying any migrations

#### Scenario: Migration failure halts startup
- **WHEN** a migration fails to apply (e.g., SQL error)
- **THEN** the application SHALL log the error and fail to start

### Requirement: Developer migration workflow
After any Ent schema change, developers SHALL generate a new migration by running `atlas migrate diff` which diffs the Ent desired state against the migration directory.

#### Scenario: Generate migration after schema change
- **WHEN** a developer adds a field to an Ent schema and runs `atlas migrate diff --env ent "add_field_name"`
- **THEN** a new SQL migration file SHALL be generated in `backend/migrations/` containing the ALTER TABLE statement, and `atlas.sum` SHALL be updated
