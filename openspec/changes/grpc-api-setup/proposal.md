## Why

The bookmgr backend currently has no formal API definition — endpoints are documented informally in `docs/api.md`. As the system evolves, there is no mechanism to detect breaking API changes, enforce design consistency, or auto-generate client code and documentation. Adopting gRPC with Protocol Buffers as the API definition layer, combined with grpc-gateway for REST compatibility, establishes a machine-readable, lintable, and versionable API contract that follows Google AIP standards.

## What Changes

- Set up **buf** toolchain (`buf.yaml`, `buf.gen.yaml`) for proto compilation, AIP linting, and breaking change detection
- Define all API proto files under `api/bookmgr/v1/` following AIP standards:
  - `auth_service.proto`: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
  - `book_service.proto`: `GET/POST /api/v1/books`, `GET/PUT/DELETE /api/v1/books/{book}`, `GET /api/v1/books/{book}:download`
  - `user_service.proto`: `GET /api/v1/users`, `GET/PUT/DELETE /api/v1/users/{user}` (admin-only)
  - `common.proto`: shared pagination types (AIP-158 token-based)
- Integrate **protovalidate** for declarative request validation in proto definitions
- Configure **buf generate** to produce: Go protobuf, gRPC stubs, grpc-gateway reverse proxy, OpenAPI v2 spec
- Mount **grpc-gateway** `ServeMux` on Chi router under `/api/v1/`, keeping Chi for non-API routes (`/healthz`, middleware)
- Add generated Go and OpenAPI files to `gen/` directory
- Replace `docs/api.md` content with a pointer to the auto-generated OpenAPI spec

## Capabilities

### New Capabilities

- `grpc-api-definition`: Proto file definitions for all API services, buf toolchain configuration, AIP-compliant linting and breaking change detection
- `grpc-gateway-integration`: grpc-gateway mounted on Chi router, OpenAPI auto-generation, REST endpoint exposure under `/api/v1/`

### Modified Capabilities

_(none)_

## Impact

- **Code**: `api/bookmgr/v1/*.proto` (new), `gen/` (new, generated), `buf.yaml`, `buf.gen.yaml` (new), `backend/cmd/server/main.go` (gateway wiring)
- **Dependencies**: buf CLI (dev tool), `google.golang.org/grpc`, `google.golang.org/protobuf`, `github.com/grpc-ecosystem/grpc-gateway/v2`, `github.com/bufbuild/protovalidate-go`
- **API**: backward-compatible — this formalizes the planned API design, no existing consumers affected
- **Build**: new `buf generate` step required before `go build` when proto files change
- **Admin/User impact**: none directly; REST API behavior unchanged from what was planned, now formally defined
