## ADDED Requirements

### Requirement: ListUsers with pagination
The UserService `ListUsers` RPC SHALL return a paginated list of users using AIP-158 token-based pagination.

#### Scenario: First page request
- **WHEN** `ListUsers` is called with `page_size: 20` and no `page_token`
- **THEN** the response SHALL include up to 20 users and a `next_page_token` if more users exist

#### Scenario: Next page request
- **WHEN** `ListUsers` is called with a valid `page_token` from a previous response
- **THEN** the response SHALL include the next page of users

### Requirement: GetUser by ID
The UserService `GetUser` RPC SHALL return a single user's profile by ID.

#### Scenario: User found
- **WHEN** `GetUser` is called with an existing user's ID
- **THEN** the response SHALL include the user's id, username, email, role, create_time, update_time

#### Scenario: User not found
- **WHEN** `GetUser` is called with a non-existent ID
- **THEN** the RPC SHALL return `NOT_FOUND` status

### Requirement: UpdateUser with field mask
The UserService `UpdateUser` RPC SHALL update specified fields of a user, supporting partial updates via `update_mask`.

#### Scenario: Update user role
- **WHEN** `UpdateUser` is called with `update_mask: ["role"]` and `role: ROLE_ADMIN`
- **THEN** only the user's role SHALL be updated, other fields unchanged

#### Scenario: Reset password
- **WHEN** `UpdateUser` is called with `update_mask: ["password"]` and a new password value
- **THEN** the password SHALL be bcrypt-hashed and stored, other fields unchanged

#### Scenario: Update non-existent user
- **WHEN** `UpdateUser` is called with a non-existent user ID
- **THEN** the RPC SHALL return `NOT_FOUND` status

### Requirement: DeleteUser
The UserService `DeleteUser` RPC SHALL permanently remove a user.

#### Scenario: Successful deletion
- **WHEN** `DeleteUser` is called with an existing user's ID
- **THEN** the user SHALL be permanently removed from the database

#### Scenario: Admin cannot self-delete
- **WHEN** an admin calls `DeleteUser` with their own user ID
- **THEN** the RPC SHALL return `FAILED_PRECONDITION` status with message indicating self-deletion is not allowed

#### Scenario: Delete non-existent user
- **WHEN** `DeleteUser` is called with a non-existent ID
- **THEN** the RPC SHALL return `NOT_FOUND` status
