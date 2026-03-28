## ADDED Requirements

### Requirement: Create user
The user repository SHALL provide a `Create` method that persists a new User entity to the database and returns the created User.

#### Scenario: Successful user creation
- **WHEN** `Create` is called with valid username, email, password_hash, and role
- **THEN** a new User record SHALL be inserted into the database and the complete User entity (including generated id and timestamps) SHALL be returned

#### Scenario: Creation with duplicate username
- **WHEN** `Create` is called with a username that already exists
- **THEN** the method SHALL return an error indicating a constraint violation

### Requirement: Get user by ID
The user repository SHALL provide a `GetByID` method that retrieves a User by their UUIDv7 ID.

#### Scenario: User found
- **WHEN** `GetByID` is called with an existing user's ID
- **THEN** the complete User entity SHALL be returned

#### Scenario: User not found
- **WHEN** `GetByID` is called with a non-existent ID
- **THEN** the method SHALL return a not-found error

### Requirement: Get user by email
The user repository SHALL provide a `GetByEmail` method that retrieves a User by their email address.

#### Scenario: User found by email
- **WHEN** `GetByEmail` is called with an existing user's email
- **THEN** the complete User entity SHALL be returned

#### Scenario: User not found by email
- **WHEN** `GetByEmail` is called with a non-existent email
- **THEN** the method SHALL return a not-found error

### Requirement: Get user by username
The user repository SHALL provide a `GetByUsername` method that retrieves a User by their username.

#### Scenario: User found by username
- **WHEN** `GetByUsername` is called with an existing user's username
- **THEN** the complete User entity SHALL be returned

#### Scenario: User not found by username
- **WHEN** `GetByUsername` is called with a non-existent username
- **THEN** the method SHALL return a not-found error

### Requirement: List users with pagination
The user repository SHALL provide a `List` method that returns a paginated list of users.

#### Scenario: List first page
- **WHEN** `List` is called with page=1 and per_page=20
- **THEN** the first 20 users SHALL be returned ordered by `created_at` descending, along with the total count

#### Scenario: List empty result
- **WHEN** `List` is called and no users exist
- **THEN** an empty list SHALL be returned with total count 0

### Requirement: Update user
The user repository SHALL provide an `Update` method that modifies an existing User's mutable fields (username, email, password_hash, role).

#### Scenario: Successful update
- **WHEN** `Update` is called with a valid user ID and new field values
- **THEN** the User record SHALL be updated in the database and the updated User entity SHALL be returned with `updated_at` refreshed

#### Scenario: Update non-existent user
- **WHEN** `Update` is called with a non-existent user ID
- **THEN** the method SHALL return a not-found error

### Requirement: Delete user
The user repository SHALL provide a `Delete` method that permanently removes a User from the database.

#### Scenario: Successful deletion
- **WHEN** `Delete` is called with an existing user's ID
- **THEN** the User record SHALL be permanently removed from the database

#### Scenario: Delete non-existent user
- **WHEN** `Delete` is called with a non-existent ID
- **THEN** the method SHALL return a not-found error

### Requirement: Repository as fx module
The user repository SHALL be exposed as an uber-go/fx module so it can be injected into service layer components.

#### Scenario: fx dependency injection
- **WHEN** the application starts with the repository module included
- **THEN** the `UserRepository` SHALL be available for injection into any fx-managed component
