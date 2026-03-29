## ADDED Requirements

### Requirement: Standalone binary entry point
The system SHALL provide a separate entry point at `backend/cmd/standalone/main.go` that produces a self-contained HTTP server combining API and frontend serving, using SQLite as the database.

#### Scenario: Binary starts successfully
- **WHEN** the user runs `./bookmgr` with no arguments
- **THEN** the server starts on port 8080, creates `./data/` directory, initializes SQLite database, seeds admin user, and serves both API and frontend

### Requirement: Data directory configuration
The system SHALL accept a `--data-dir` flag (or `DATA_DIR` environment variable) specifying the root directory for all persistent data. The directory SHALL contain the SQLite database file and an `uploads/` subdirectory for uploaded files. The system SHALL create the directory and subdirectories if they do not exist.

#### Scenario: Custom data directory via flag
- **WHEN** the user runs `./bookmgr --data-dir /opt/bookmgr`
- **THEN** the SQLite database is created at `/opt/bookmgr/bookmgr.db` and uploads are stored in `/opt/bookmgr/uploads/`

#### Scenario: Default data directory
- **WHEN** the user runs `./bookmgr` without `--data-dir`
- **THEN** the data directory defaults to `./data` relative to the working directory

#### Scenario: Data directory created if missing
- **WHEN** the configured data directory does not exist
- **THEN** the system creates the directory and its `uploads/` subdirectory with appropriate permissions

### Requirement: Port configuration
The system SHALL accept a `--port` flag (or `PORT` environment variable) specifying the HTTP listen port, defaulting to 8080.

#### Scenario: Custom port via flag
- **WHEN** the user runs `./bookmgr --port 3000`
- **THEN** the server listens on port 3000

#### Scenario: Port via environment variable
- **WHEN** the `PORT` environment variable is set to `9090` and no `--port` flag is given
- **THEN** the server listens on port 9090

#### Scenario: Flag takes precedence over environment variable
- **WHEN** `PORT=9090` and the user runs `./bookmgr --port 3000`
- **THEN** the server listens on port 3000

### Requirement: JWT secret configuration
The system SHALL accept a `--jwt-secret` flag (or `JWT_SECRET` environment variable) for JWT token signing. If not provided, the system SHALL generate a random secret at startup and log a warning.

#### Scenario: Random JWT secret on default
- **WHEN** the user runs `./bookmgr` without specifying a JWT secret
- **THEN** a random secret is generated, a warning is logged indicating tokens will be invalidated on restart

#### Scenario: Explicit JWT secret
- **WHEN** the user runs `./bookmgr --jwt-secret my-secret-key`
- **THEN** the provided secret is used for JWT signing, and tokens survive restarts

### Requirement: Admin password configuration
The system SHALL accept a `--admin-pass` flag (or `ADMIN_PASSWORD` environment variable) for the initial admin user password, defaulting to `changeme`.

#### Scenario: Custom admin password
- **WHEN** the user runs `./bookmgr --admin-pass s3cure!`
- **THEN** the admin user is seeded with password `s3cure!`

### Requirement: Build script
The project SHALL provide a Makefile target `make standalone` that automates the full build pipeline: frontend build → copy dist to embed path → Go compile.

#### Scenario: Build standalone binary
- **WHEN** a developer runs `make standalone`
- **THEN** the frontend is built, assets are copied to the embed directory, and a standalone binary is produced at `bin/bookmgr`

#### Scenario: Cross-compile for Linux
- **WHEN** a developer runs `GOOS=linux GOARCH=amd64 make standalone`
- **THEN** a Linux amd64 binary is produced without requiring CGO or a C compiler
