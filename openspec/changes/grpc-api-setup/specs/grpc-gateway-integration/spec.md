## ADDED Requirements

### Requirement: In-process gRPC server with bufconn
The application SHALL run a gRPC server using an in-memory `bufconn` listener (no TCP port), managed by uber-go/fx lifecycle.

#### Scenario: gRPC server starts on application startup
- **WHEN** the application starts
- **THEN** a gRPC server SHALL be listening on a bufconn in-memory connection, with protovalidate unary interceptor registered

#### Scenario: gRPC server shuts down gracefully
- **WHEN** the application receives a shutdown signal
- **THEN** the gRPC server SHALL call `GracefulStop()` before the process exits

### Requirement: grpc-gateway mounted on Chi router
The grpc-gateway `runtime.ServeMux` SHALL be mounted on the Chi router under `/api/v1/`, connecting to the in-process gRPC server via bufconn.

#### Scenario: REST request routed through gateway
- **WHEN** an HTTP request is sent to `GET /api/v1/books`
- **THEN** Chi SHALL route it to the grpc-gateway ServeMux, which SHALL forward it to the in-process gRPC `BookService.ListBooks` RPC

#### Scenario: Non-API routes still handled by Chi
- **WHEN** an HTTP request is sent to `GET /healthz`
- **THEN** Chi SHALL handle it directly without involving grpc-gateway

### Requirement: Gateway JSON marshaling follows AIP
The grpc-gateway SHALL use `runtime.JSONPb` marshaler configured to emit default values and use `proto` field names (snake_case), following AIP conventions.

#### Scenario: Empty fields included in response
- **WHEN** a gRPC response has a field with its zero value
- **THEN** the JSON response SHALL include that field (not omit it)

#### Scenario: Field names are snake_case
- **WHEN** a gRPC response is serialized to JSON
- **THEN** field names SHALL use snake_case (matching proto field names), not camelCase

### Requirement: Gateway error mapping
The grpc-gateway SHALL map gRPC status codes to HTTP status codes following the standard mapping (e.g., `NOT_FOUND` → 404, `INVALID_ARGUMENT` → 400, `UNAUTHENTICATED` → 401, `PERMISSION_DENIED` → 403).

#### Scenario: Not found error
- **WHEN** a gRPC service returns `status.Errorf(codes.NotFound, "book not found")`
- **THEN** the HTTP response SHALL have status 404 with body containing `google.rpc.Status` JSON

### Requirement: OpenAPI spec served at known path
The auto-generated OpenAPI v2 spec SHALL be accessible for documentation purposes.

#### Scenario: OpenAPI file generated
- **WHEN** `buf generate` is run
- **THEN** an OpenAPI v2 JSON file SHALL be generated in `gen/openapi/` covering all services

### Requirement: Unimplemented services as placeholders
All gRPC service registrations SHALL initially use the generated `Unimplemented*Server` stubs so the application compiles and gateway routes are active (returning `UNIMPLEMENTED` for all RPCs).

#### Scenario: Unimplemented RPC returns proper error
- **WHEN** a REST request hits `POST /api/v1/auth/login` before the auth service is implemented
- **THEN** the response SHALL be HTTP 501 with a `google.rpc.Status` body indicating the RPC is not implemented
