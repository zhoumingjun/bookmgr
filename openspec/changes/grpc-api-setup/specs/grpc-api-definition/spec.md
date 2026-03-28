## ADDED Requirements

### Requirement: buf toolchain configuration
The project SHALL have a `buf.yaml` at the project root configuring the `api/` directory as a buf module with AIP lint rules enabled, and a `buf.gen.yaml` configuring code generation for Go protobuf, gRPC, grpc-gateway, and OpenAPI v2.

#### Scenario: buf lint passes on all proto files
- **WHEN** `buf lint` is executed at the project root
- **THEN** the command SHALL exit with code 0 and report no errors

#### Scenario: buf generate produces all outputs
- **WHEN** `buf generate` is executed at the project root
- **THEN** the `gen/` directory SHALL contain generated `.pb.go`, `_grpc.pb.go`, `.pb.gw.go`, and `.swagger.json` files

### Requirement: buf breaking change detection
The project SHALL support running `buf breaking --against '.git#branch=main'` to detect backward-incompatible API changes.

#### Scenario: No breaking changes detected on compatible change
- **WHEN** a new optional field is added to a request message and `buf breaking` is run
- **THEN** the command SHALL exit with code 0

#### Scenario: Breaking change detected on incompatible change
- **WHEN** a required field is removed from a response message and `buf breaking` is run
- **THEN** the command SHALL exit with a non-zero code and report the breaking change

### Requirement: Auth service proto definition
The file `api/bookmgr/v1/auth_service.proto` SHALL define an `AuthService` with the following RPCs:
- `Register`: creates a new user account
- `Login`: authenticates and returns a JWT token

Each RPC SHALL have `google.api.http` annotations mapping to REST endpoints under `/api/v1/auth/`.

#### Scenario: Register RPC definition
- **WHEN** a consumer reads the `Register` RPC definition
- **THEN** it SHALL accept `RegisterRequest` (username, email, password with protovalidate rules) and return `RegisterResponse` (user id, username, email, role), with HTTP annotation `POST /api/v1/auth/register`

#### Scenario: Login RPC definition
- **WHEN** a consumer reads the `Login` RPC definition
- **THEN** it SHALL accept `LoginRequest` (username, password) and return `LoginResponse` (token string), with HTTP annotation `POST /api/v1/auth/login`

### Requirement: Book service proto definition
The file `api/bookmgr/v1/book_service.proto` SHALL define a `BookService` with the following RPCs:
- `ListBooks`: paginated list (AIP-132)
- `GetBook`: get by ID (AIP-131)
- `CreateBook`: create with metadata (AIP-133, admin-only)
- `UpdateBook`: update metadata (AIP-134, admin-only)
- `DeleteBook`: delete (AIP-135, admin-only)
- `DownloadBook`: download file content

Each RPC SHALL have `google.api.http` annotations.

#### Scenario: ListBooks RPC uses AIP-158 pagination
- **WHEN** a consumer reads the `ListBooks` RPC definition
- **THEN** `ListBooksRequest` SHALL include `page_size` (int32) and `page_token` (string), and `ListBooksResponse` SHALL include `books` (repeated Book) and `next_page_token` (string), with HTTP annotation `GET /api/v1/books`

#### Scenario: CreateBook RPC definition
- **WHEN** a consumer reads the `CreateBook` RPC definition
- **THEN** `CreateBookRequest` SHALL include `title`, `author`, `description` with protovalidate rules, with HTTP annotation `POST /api/v1/books`

#### Scenario: DownloadBook RPC definition
- **WHEN** a consumer reads the `DownloadBook` RPC definition
- **THEN** it SHALL return `google.api.HttpBody` for binary streaming, with HTTP annotation `GET /api/v1/books/{book}/download`

### Requirement: User service proto definition
The file `api/bookmgr/v1/user_service.proto` SHALL define a `UserService` with the following RPCs:
- `ListUsers`: paginated list (AIP-132, admin-only)
- `GetUser`: get by ID (AIP-131, admin-only)
- `UpdateUser`: update user fields (AIP-134, admin-only)
- `DeleteUser`: delete user (AIP-135, admin-only)

Each RPC SHALL have `google.api.http` annotations under `/api/v1/users/`.

#### Scenario: ListUsers RPC uses AIP-158 pagination
- **WHEN** a consumer reads the `ListUsers` RPC definition
- **THEN** `ListUsersRequest` SHALL include `page_size` (int32) and `page_token` (string), and `ListUsersResponse` SHALL include `users` (repeated User) and `next_page_token` (string), with HTTP annotation `GET /api/v1/users`

#### Scenario: User message includes all fields
- **WHEN** a consumer reads the `User` message definition
- **THEN** it SHALL include `id` (string, UUIDv7 format), `username`, `email`, `role` (enum), `create_time` (google.protobuf.Timestamp), `update_time` (google.protobuf.Timestamp)

### Requirement: Common types proto definition
The file `api/bookmgr/v1/common.proto` SHALL define shared types used across services.

#### Scenario: Role enum defined
- **WHEN** a consumer reads `common.proto`
- **THEN** it SHALL define a `Role` enum with values `ROLE_UNSPECIFIED`, `ROLE_USER`, `ROLE_ADMIN`

### Requirement: protovalidate annotations
All request messages SHALL include `buf.validate` annotations for field validation (e.g., string length, required fields, email format).

#### Scenario: Username validation in Register
- **WHEN** a consumer reads the `RegisterRequest` message
- **THEN** the `username` field SHALL have protovalidate rules: `min_len: 3`, `max_len: 64`, `pattern: "^[a-zA-Z0-9_-]+$"`

#### Scenario: Email validation in Register
- **WHEN** a consumer reads the `RegisterRequest` message
- **THEN** the `email` field SHALL have a protovalidate `email: true` rule

### Requirement: Proto package naming
All proto files SHALL use package `bookmgr.v1` with `go_package = "github.com/zhoumingjun/bookmgr/gen/api/bookmgr/v1;bookmgrv1"`, following AIP-191.

#### Scenario: Consistent package across files
- **WHEN** any proto file under `api/bookmgr/v1/` is inspected
- **THEN** it SHALL declare `package bookmgr.v1` and the same `go_package` option
