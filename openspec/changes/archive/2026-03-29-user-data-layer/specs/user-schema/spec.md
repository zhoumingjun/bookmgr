## ADDED Requirements

### Requirement: User entity fields
The User entity SHALL have the following fields:
- `id`: UUIDv7 primary key (time-sortable, generated automatically)
- `username`: unique, non-empty string, max 64 characters
- `email`: unique, non-empty string, valid email format
- `password_hash`: non-empty string (bcrypt hash)
- `role`: enum with values `admin` and `user`, default `user`
- `created_at`: timestamp, set automatically on creation
- `updated_at`: timestamp, updated automatically on mutation

#### Scenario: User created with all required fields
- **WHEN** a User is created with username "alice", email "alice@example.com", password_hash "<bcrypt_hash>", and role "user"
- **THEN** the User is persisted with an auto-generated UUIDv7 id, the provided field values, and created_at/updated_at set to the current time

#### Scenario: User created with default role
- **WHEN** a User is created without specifying a role
- **THEN** the role SHALL default to "user"

### Requirement: Username uniqueness
The system SHALL enforce a unique constraint on the `username` field at the database level.

#### Scenario: Duplicate username rejected
- **WHEN** a User is created with a username that already exists
- **THEN** the operation SHALL fail with a constraint violation error

### Requirement: Email uniqueness
The system SHALL enforce a unique constraint on the `email` field at the database level.

#### Scenario: Duplicate email rejected
- **WHEN** a User is created with an email that already exists
- **THEN** the operation SHALL fail with a constraint violation error

### Requirement: Username validation
The system SHALL validate that usernames contain only alphanumeric characters, hyphens, and underscores, with a length between 3 and 64 characters.

#### Scenario: Short username rejected
- **WHEN** a User is created with username "ab"
- **THEN** the operation SHALL fail with a validation error

#### Scenario: Invalid characters rejected
- **WHEN** a User is created with username "alice@bob"
- **THEN** the operation SHALL fail with a validation error

### Requirement: Password hash storage
The system SHALL store passwords as bcrypt hashes with a cost factor of 10. Raw passwords SHALL never be stored.

#### Scenario: Password stored as hash
- **WHEN** a User is created with a bcrypt-hashed password
- **THEN** the `password_hash` field SHALL contain only the bcrypt hash, not the plaintext

### Requirement: Auto-migration creates users table
The system SHALL run Ent auto-migration on startup to create or update the `users` table schema in PostgreSQL.

#### Scenario: First startup creates table
- **WHEN** the application starts and the `users` table does not exist
- **THEN** the auto-migration SHALL create the `users` table with all defined columns, indexes, and constraints

### Requirement: Default admin seeding
The system SHALL seed a default admin user on startup if no user with role `admin` exists in the database.

#### Scenario: First startup seeds admin
- **WHEN** the application starts and no admin user exists
- **THEN** the system SHALL create an admin user with credentials from `ADMIN_USERNAME`/`ADMIN_PASSWORD` environment variables, or defaults `admin`/`changeme`

#### Scenario: Admin already exists
- **WHEN** the application starts and an admin user already exists
- **THEN** the system SHALL not create another admin user
