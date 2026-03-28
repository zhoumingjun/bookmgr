## ADDED Requirements

### Requirement: JWT auth interceptor
A gRPC unary interceptor SHALL validate JWT tokens from the `authorization` metadata on all protected RPCs.

#### Scenario: Valid token
- **WHEN** a request includes a valid, non-expired JWT in the `authorization` metadata (format: `Bearer <token>`)
- **THEN** the interceptor SHALL extract user claims (sub, role) and inject them into the gRPC context, then allow the RPC to proceed

#### Scenario: Missing token on protected RPC
- **WHEN** a request to a protected RPC has no `authorization` metadata
- **THEN** the interceptor SHALL return `UNAUTHENTICATED` status

#### Scenario: Expired token
- **WHEN** a request includes an expired JWT
- **THEN** the interceptor SHALL return `UNAUTHENTICATED` status with message indicating token expiration

#### Scenario: Invalid token signature
- **WHEN** a request includes a JWT with an invalid signature
- **THEN** the interceptor SHALL return `UNAUTHENTICATED` status

#### Scenario: Public RPCs skip auth
- **WHEN** a request targets `AuthService.Register` or `AuthService.Login`
- **THEN** the interceptor SHALL skip JWT validation and allow the RPC to proceed

### Requirement: Role-based authorization interceptor
A gRPC unary interceptor SHALL check the user's role for admin-only RPCs.

#### Scenario: Admin accesses admin RPC
- **WHEN** an authenticated user with role `admin` calls an admin-only RPC (e.g., `UserService.ListUsers`)
- **THEN** the interceptor SHALL allow the RPC to proceed

#### Scenario: Non-admin accesses admin RPC
- **WHEN** an authenticated user with role `user` calls an admin-only RPC
- **THEN** the interceptor SHALL return `PERMISSION_DENIED` status

#### Scenario: Non-admin RPCs allow any role
- **WHEN** an authenticated user with any role calls a non-admin RPC (e.g., `BookService.ListBooks`)
- **THEN** the interceptor SHALL allow the RPC to proceed

### Requirement: Frontend login page
The frontend SHALL have a login page at `/login` that accepts username and password, calls the login API, and stores the JWT.

#### Scenario: Successful login redirects
- **WHEN** a user submits valid credentials on the login page
- **THEN** the JWT SHALL be stored via AuthContext, and the user SHALL be redirected to `/console` (or `/admin` if admin)

#### Scenario: Failed login shows error
- **WHEN** a user submits invalid credentials
- **THEN** an error message SHALL be displayed without redirecting
