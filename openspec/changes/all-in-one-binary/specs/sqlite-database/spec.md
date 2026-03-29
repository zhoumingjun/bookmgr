## ADDED Requirements

### Requirement: SQLite database connection
The system SHALL provide a SQLite database module that creates an Ent client connected to a SQLite database file within the configured data directory. The database file SHALL be named `bookmgr.db` and stored at `<data-dir>/bookmgr.db`.

#### Scenario: Database file creation on first start
- **WHEN** the standalone binary starts with `--data-dir ./data` and no `bookmgr.db` exists
- **THEN** the system creates `./data/bookmgr.db` and initializes the schema

#### Scenario: Database file reuse on subsequent starts
- **WHEN** the standalone binary starts and `<data-dir>/bookmgr.db` already exists
- **THEN** the system opens the existing database and preserves all data

### Requirement: SQLite auto-migration
The system SHALL use Ent's `client.Schema.Create(ctx)` to automatically create and update database tables from the Ent schema definitions. This replaces the Atlas versioned migration used in PostgreSQL mode.

#### Scenario: Schema tables created on first run
- **WHEN** the standalone binary starts with a fresh SQLite database
- **THEN** all tables (users, books) and indexes are created matching the Ent schema definitions

#### Scenario: Schema updated after Ent schema change
- **WHEN** the standalone binary starts with an existing SQLite database after an Ent schema adds a new field
- **THEN** the new column is added to the table without data loss

### Requirement: SQLite WAL mode
The system SHALL enable WAL (Write-Ahead Logging) mode on the SQLite connection to improve concurrent read performance.

#### Scenario: WAL mode enabled at startup
- **WHEN** the SQLite database connection is established
- **THEN** `PRAGMA journal_mode=WAL` is executed and WAL mode is active

### Requirement: SQLite driver is pure Go
The system SHALL use `modernc.org/sqlite` as the SQLite driver, requiring no CGO, to enable cross-platform compilation from a single build environment.

#### Scenario: Build without CGO
- **WHEN** the standalone binary is built with `CGO_ENABLED=0`
- **THEN** the build succeeds and the binary can open and operate on SQLite databases
