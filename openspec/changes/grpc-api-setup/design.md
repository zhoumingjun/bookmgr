## Context

The bookmgr backend uses Chi router with hand-written REST handlers. Currently only `/healthz` is implemented. The project needs a formal API contract that supports evolution with backward-compatibility guarantees. The team has decided to adopt gRPC + grpc-gateway with AIP compliance, using buf as the toolchain. The existing User data layer (Ent + repository) is in place and will be consumed by gRPC service implementations in a follow-up change.

## Goals / Non-Goals

**Goals:**
- Establish buf toolchain with AIP linting and breaking change detection
- Define all API proto files with full request/response messages, field validations, and HTTP annotations
- Configure code generation for Go protobuf, gRPC, grpc-gateway, and OpenAPI
- Mount grpc-gateway on Chi router so REST clients (including the React frontend) work transparently
- Output an auto-generated OpenAPI spec for documentation

**Non-Goals:**
- Implementing gRPC service logic (follow-up: `auth-system`, `admin-user-mgmt`, `book-management`)
- Setting up CI pipeline for buf lint/breaking (can be added later)
- gRPC reflection or gRPC-native clients (REST via gateway is the primary interface)
- Swagger UI embedding in the application

## Decisions

### 1. buf as proto toolchain

**Choice**: Use buf for linting (with AIP rules), breaking change detection, and code generation.

**Why**: buf provides `buf breaking --against .git#branch=main` which is the most mature proto breaking change detection tool available. AIP lint rules are built-in. `buf generate` replaces complex protoc invocations.

**Alternative considered**: Raw protoc + api-linter — more manual setup, no built-in breaking change detection.

### 2. Proto package structure: `api/bookmgr/v1/`

**Choice**: All proto files under `api/bookmgr/v1/` with Go package `github.com/zhoumingjun/bookmgr/gen/api/bookmgr/v1;bookmgrv1`.

**Why**: Follows AIP-191 package naming. Version in path enables future v2 alongside v1. Generated Go code goes to `gen/` to keep it separate from hand-written code.

**Alternative considered**: Proto files inside `backend/` — rejected to keep API definitions language-agnostic and at the project root level.

### 3. Generated code in `gen/` directory, committed to git

**Choice**: `buf generate` outputs to `gen/`. Generated files are committed.

**Why**: Same pattern as Ent — generated code committed so the project builds without running code generation. `gen/` is separate from `api/` (definitions) and `backend/` (implementation).

### 4. Chi router wraps grpc-gateway ServeMux

**Choice**: Chi remains the top-level HTTP router. grpc-gateway's `runtime.ServeMux` is mounted as a handler under Chi's `/api/v1` route group.

**Why**: Chi continues to handle non-API concerns (healthz, middleware like logging/recovery/CORS). Gateway handles only API routing. This is a clean separation and avoids replacing the existing router entirely.

**Setup**:
```
Chi Mux
├── GET /healthz        → HealthHandler
├── /api/v1/*           → grpc-gateway ServeMux (reverse-proxy to in-process gRPC)
└── middleware: Logger, Recoverer, RequestID, CORS
```

### 5. In-process gRPC server (no separate port)

**Choice**: Run gRPC server in-process. grpc-gateway connects to it via `bufconn` (in-memory listener), not over TCP.

**Why**: Avoids exposing a separate gRPC port. The React frontend only needs REST. In-process connection has zero network overhead. Can add a TCP gRPC listener later if needed.

**Alternative considered**: gRPC on separate port (e.g., 9090) — adds operational complexity for no benefit in this context.

### 6. AIP-158 token-based pagination

**Choice**: Use `page_size` (int32) + `page_token` (string) for all list RPCs. Token encodes an opaque cursor.

**Why**: AIP-158 standard. Token-based pagination is stable under concurrent writes (unlike offset-based). Existing repository `List` method uses offset internally — the service layer will translate tokens to offsets.

### 7. protovalidate for request validation

**Choice**: Use `buf.validate` annotations in proto files for declarative field validation.

**Why**: Validation rules live next to the field definition — single source of truth. Runtime validation via `protovalidate-go` interceptor. No hand-written validation code needed.

### 8. Error model: google.rpc.Status

**Choice**: Use `google.rpc.Status` with `google.rpc.ErrorInfo` details. grpc-gateway auto-maps gRPC status codes to HTTP status codes.

**Why**: AIP-193 standard. Consistent error format across gRPC and REST. No custom error types to maintain.

## Risks / Trade-offs

- **[Build complexity]** → Developers must run `buf generate` when proto files change. Mitigation: add a Makefile target and document the workflow.
- **[bufconn learning curve]** → In-process gRPC with bufconn is less common. Mitigation: well-documented setup in main.go, standard pattern from grpc-gateway docs.
- **[Token pagination vs offset]** → Repository layer uses offset; service must translate. Mitigation: simple base64-encoded offset as token, transparent to clients.
- **[Proto file maintenance]** → Adding/changing APIs requires proto changes + regeneration. Mitigation: this is the desired workflow — proto is the source of truth.
