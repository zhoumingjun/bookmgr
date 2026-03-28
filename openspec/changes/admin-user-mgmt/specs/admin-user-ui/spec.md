## ADDED Requirements

### Requirement: Admin user list page
The admin dashboard SHALL include a user list page at `/admin/users` showing all users in a table with pagination.

#### Scenario: User list displayed
- **WHEN** an admin navigates to `/admin/users`
- **THEN** a table SHALL display users with columns: username, email, role, created date, and action buttons (edit, delete)

#### Scenario: Pagination navigation
- **WHEN** the user list has more than one page of results
- **THEN** pagination controls SHALL allow navigating between pages

### Requirement: Admin user edit page
The admin dashboard SHALL include a user edit page at `/admin/users/:id` for modifying user details.

#### Scenario: Edit user role
- **WHEN** an admin changes a user's role on the edit page and saves
- **THEN** the UpdateUser API SHALL be called with the role field, and the page SHALL show a success confirmation

#### Scenario: Reset user password
- **WHEN** an admin enters a new password on the edit page and saves
- **THEN** the UpdateUser API SHALL be called with the password field, and the page SHALL show a success confirmation

### Requirement: Admin delete user confirmation
Deleting a user SHALL require explicit confirmation.

#### Scenario: Delete with confirmation
- **WHEN** an admin clicks the delete button for a user
- **THEN** a confirmation dialog SHALL appear; only on confirmation SHALL the DeleteUser API be called
