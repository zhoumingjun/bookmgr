## MODIFIED Requirements

### Requirement: Auto-migration creates users table
The system SHALL apply versioned Atlas migrations on startup to create or update the database schema, replacing the previous Ent auto-migration (`client.Schema.Create`).

#### Scenario: First startup creates table
- **WHEN** the application starts and the `users` table does not exist
- **THEN** the Atlas migration system SHALL apply the baseline migration to create the `users` table with all defined columns, indexes, and constraints
