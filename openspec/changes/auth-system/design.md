## Context

The gRPC API definitions (proto files) and grpc-gateway integration are in place from the `grpc-api-setup` change. The `AuthService` proto defines `Register` and `Login` RPCs with request/response messages and HTTP annotations. The User data layer (Ent schema + UserRepository) exists. The gRPC server currently registers `UnimplementedAuthServiceServer`. JWT secret is available via `config.Config.JWTSecret`.

## Goals / Non-Goals

**Goals:**
- Implement AuthService gRPC server with Register and Login logic
- Issue JWT tokens with user ID, role, and expiration claims
- Validate JWT on all protected RPCs via gRPC unary interceptor
- Enforce admin role on admin-only RPCs via gRPC unary interceptor
- Frontend login page that stores JWT and integrates with existing AuthContext

**Non-Goals:**
- Refresh tokens (can be added later)
- OAuth / social login
- Email verification on register
- Password reset flow (covered by admin-user-mgmt)
- Rate limiting on login attempts

## Decisions

### 1. JWT with HMAC-SHA256 (HS256)

**Choice**: Sign JWTs with HS256 using the `JWT_SECRET` env var. Claims: `sub` (user UUID string), `role` (string), `exp` (expiration timestamp), `iat` (issued at).

**Why**: Simplest symmetric signing. Single backend instance, no need for asymmetric keys. Standard for small-to-medium systems.

**Alternative considered**: RS256 with key pair — unnecessary for single-service architecture.

### 2. Token expiration: 24 hours

**Choice**: JWTs expire 24 hours after issuance. No refresh token.

**Why**: Reasonable balance between UX (not too short) and security (not indefinite). Refresh tokens add complexity that isn't needed yet.

### 3. gRPC unary interceptor for auth

**Choice**: Implement JWT validation as a gRPC `UnaryServerInterceptor`. The interceptor extracts the token from gRPC metadata (`authorization` key), validates it, and injects user claims into the context. An allowlist skips auth for public RPCs (`Register`, `Login`).

**Why**: gRPC interceptors are the standard middleware pattern. Works for both direct gRPC calls and gateway-proxied HTTP calls (gateway forwards the `Authorization` header as gRPC metadata).

### 4. Separate auth and role interceptors

**Choice**: Two interceptors chained: (1) `AuthInterceptor` validates JWT and adds claims to context, (2) `RoleInterceptor` checks if the RPC requires admin role and verifies the claim.

**Why**: Separation of concerns. Auth interceptor runs on all protected RPCs. Role interceptor only checks admin for specific RPCs. Easy to configure independently.

### 5. Admin RPC allowlist in role interceptor

**Choice**: The role interceptor maintains a set of full method names that require admin role (e.g., `/bookmgr.v1.UserService/ListUsers`). All other authenticated RPCs allow any role.

**Why**: Explicit allowlist is easier to audit than annotation-based approaches. The list is small and changes infrequently.

### 6. Frontend login with existing AuthContext

**Choice**: Build a login page that calls `POST /api/v1/auth/login`, stores the JWT via the existing `AuthContext.login()`, and redirects to `/console` (or `/admin` for admin users).

**Why**: The `AuthContext` already handles JWT storage, parsing, and role extraction. Just need to wire up the actual API call.

## Risks / Trade-offs

- **[No refresh token]** → Users must re-login after 24h. Acceptable for initial version.
- **[JWT in localStorage]** → Vulnerable to XSS. Mitigation: CSP headers in future; acceptable for internal tool.
- **[Hardcoded admin RPC list]** → Must update when adding new admin RPCs. Mitigation: keep list in one file, review in PRs.
