## ADDED Requirements

### Requirement: Register creates a new user
The AuthService `Register` RPC SHALL create a new user with a bcrypt-hashed password and return the user's public profile (id, username, email, role).

#### Scenario: Successful registration
- **WHEN** `Register` is called with valid username, email, and password
- **THEN** a new user SHALL be created with role `user`, password stored as bcrypt hash, and the response SHALL include the user's id, username, email, and role

#### Scenario: Duplicate username
- **WHEN** `Register` is called with a username that already exists
- **THEN** the RPC SHALL return `ALREADY_EXISTS` status with a descriptive message

#### Scenario: Invalid input
- **WHEN** `Register` is called with input failing protovalidate rules (e.g., short username, invalid email)
- **THEN** the RPC SHALL return `INVALID_ARGUMENT` status

### Requirement: Login authenticates and returns JWT
The AuthService `Login` RPC SHALL verify credentials and return a signed JWT token.

#### Scenario: Successful login
- **WHEN** `Login` is called with a valid username and correct password
- **THEN** the response SHALL include a JWT token signed with HS256, containing claims `sub` (user UUID), `role`, `exp` (24h from now), `iat`

#### Scenario: Wrong password
- **WHEN** `Login` is called with a valid username but incorrect password
- **THEN** the RPC SHALL return `UNAUTHENTICATED` status

#### Scenario: User not found
- **WHEN** `Login` is called with a non-existent username
- **THEN** the RPC SHALL return `UNAUTHENTICATED` status (same as wrong password to prevent user enumeration)

### Requirement: AuthService registered as gRPC service
The AuthService implementation SHALL be registered on the gRPC server and exposed via grpc-gateway, replacing the UnimplementedAuthServiceServer stub.

#### Scenario: Register endpoint accessible via REST
- **WHEN** `POST /api/v1/auth/register` is called with JSON body
- **THEN** grpc-gateway SHALL forward to the AuthService Register RPC and return the JSON response

#### Scenario: Login endpoint accessible via REST
- **WHEN** `POST /api/v1/auth/login` is called with JSON body
- **THEN** grpc-gateway SHALL forward to the AuthService Login RPC and return the JSON response with token
