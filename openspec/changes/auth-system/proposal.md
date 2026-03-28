## Why

Users cannot currently authenticate with the system. The User data layer exists but there are no login/register endpoints, no JWT token issuance, and no middleware to protect routes. Authentication is the prerequisite for all user-facing features — both the admin dashboard and the user console require knowing who is making requests and what role they have.

## What Changes

- Implement `AuthService` gRPC service: `Register` RPC (create user with hashed password) and `Login` RPC (verify credentials, issue JWT)
- Implement **JWT token issuance** using `golang-jwt/jwt/v5` with claims: `sub` (user ID), `role`, `exp`
- Implement **JWT auth interceptor** as a gRPC unary interceptor that validates tokens on protected RPCs
- Implement **role-based authorization** interceptor that checks `role=admin` for admin-only RPCs
- Configure auth interceptors on the gRPC server, with an allowlist for public RPCs (`Register`, `Login`)
- Frontend: implement login page, store JWT in localStorage, integrate with auth context

## Capabilities

### New Capabilities

- `auth-service`: gRPC AuthService implementation (Register, Login) with JWT issuance and password hashing
- `auth-middleware`: gRPC interceptors for JWT validation and role-based authorization

### Modified Capabilities

_(none)_

## Impact

- **Code**: `backend/handler/auth.go` (gRPC service impl), `backend/middleware/` (JWT + role interceptors), `frontend/src/pages/Login.tsx`, `frontend/src/api/auth.ts`
- **Dependencies**: `golang-jwt/jwt/v5` (already in go.mod plan)
- **API**: `POST /api/v1/auth/register` and `POST /api/v1/auth/login` become functional (currently return UNIMPLEMENTED)
- **Admin impact**: admin users can now log in; admin-only RPCs protected by role check
- **User impact**: users can register and log in; authenticated RPCs require Bearer token
