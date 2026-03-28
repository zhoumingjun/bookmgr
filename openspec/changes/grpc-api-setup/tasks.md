## 1. buf Toolchain Setup

- [ ] 1.1 Install buf CLI and verify with `buf --version`
- [ ] 1.2 Create `buf.yaml` at project root: configure `api/` as module source, enable AIP lint rules, configure breaking change detection against git
- [ ] 1.3 Create `buf.gen.yaml` at project root: configure plugins for `protoc-gen-go`, `protoc-gen-go-grpc`, `protoc-gen-grpc-gateway`, `protoc-gen-openapiv2`, all outputting to `gen/`

## 2. Proto File Definitions

- [ ] 2.1 Create `api/bookmgr/v1/common.proto`: package declaration (AIP-191), `Role` enum (ROLE_UNSPECIFIED, ROLE_USER, ROLE_ADMIN)
- [ ] 2.2 Create `api/bookmgr/v1/auth_service.proto`: `AuthService` with `Register` and `Login` RPCs, request/response messages, HTTP annotations, protovalidate rules
- [ ] 2.3 Create `api/bookmgr/v1/book_service.proto`: `BookService` with `ListBooks`, `GetBook`, `CreateBook`, `UpdateBook`, `DeleteBook`, `DownloadBook` RPCs, AIP-158 pagination, HTTP annotations, protovalidate rules
- [ ] 2.4 Create `api/bookmgr/v1/user_service.proto`: `UserService` with `ListUsers`, `GetUser`, `UpdateUser`, `DeleteUser` RPCs, AIP-158 pagination, HTTP annotations, protovalidate rules
- [ ] 2.5 Run `buf lint` and fix any AIP violations

## 3. Code Generation

- [ ] 3.1 Add Go dependencies: `google.golang.org/grpc`, `google.golang.org/protobuf`, `github.com/grpc-ecosystem/grpc-gateway/v2`, `github.com/bufbuild/protovalidate-go`, `buf.build/gen/go/bufbuild/protovalidate/protocolbuffers/go`
- [ ] 3.2 Run `buf generate` and verify generated files in `gen/api/bookmgr/v1/` (pb.go, grpc.pb.go, pb.gw.go) and `gen/openapi/` (swagger.json)
- [ ] 3.3 Verify `go build ./...` succeeds with generated code

## 4. grpc-gateway Integration

- [ ] 4.1 Create gRPC server setup in `backend/` as fx module: bufconn listener, gRPC server with protovalidate interceptor, register Unimplemented service stubs, lifecycle hooks for start/stop
- [ ] 4.2 Create grpc-gateway setup in `backend/` as fx module: `runtime.ServeMux` with JSONPb marshaler (emit defaults, snake_case), dial to bufconn, register gateway handlers for all services
- [ ] 4.3 Update `backend/cmd/server/main.go`: mount gateway ServeMux on Chi under `/api/v1/`, wire new fx modules

## 5. Verification

- [ ] 5.1 Run `buf lint` — all proto files pass AIP rules
- [ ] 5.2 Run `docker compose up -d --build` — app starts, healthz works, API routes return 501 (UNIMPLEMENTED)
- [ ] 5.3 Test: `curl POST /api/v1/auth/login` returns HTTP 501 with google.rpc.Status JSON body
