## 1. JWT Service

- [ ] 1.1 Add `golang-jwt/jwt/v5` dependency to `backend/go.mod`
- [ ] 1.2 Create `backend/service/jwt.go`: `JWTService` with `GenerateToken(userID, role)` and `ValidateToken(tokenString)` methods, using HS256 and config JWTSecret, 24h expiration

## 2. Auth Service Implementation

- [ ] 2.1 Create `backend/service/auth.go`: `AuthService` with `Register(ctx, username, email, password)` (hash password, call repository Create) and `Login(ctx, username, password)` (verify credentials, call JWTService)
- [ ] 2.2 Create `backend/handler/auth.go`: gRPC `AuthServiceServer` implementation wrapping the auth service, mapping domain errors to gRPC status codes (ALREADY_EXISTS, UNAUTHENTICATED, INVALID_ARGUMENT)
- [ ] 2.3 Register `AuthServiceServer` on gRPC server, replacing the Unimplemented stub

## 3. Auth Middleware

- [ ] 3.1 Create `backend/middleware/auth.go`: gRPC unary interceptor for JWT validation — extract from `authorization` metadata, validate, inject claims into context, skip for public RPCs allowlist
- [ ] 3.2 Create `backend/middleware/role.go`: gRPC unary interceptor for admin role check — maintain admin-only RPC method set, check role claim from context
- [ ] 3.3 Register both interceptors on gRPC server in correct order (auth first, then role)

## 4. Frontend Login

- [ ] 4.1 Create `frontend/src/api/auth.ts`: API functions for `login(username, password)` and `register(username, email, password)`
- [ ] 4.2 Create `frontend/src/pages/Login.tsx`: login form with username/password fields, error display, calls auth API, stores JWT via AuthContext, redirects based on role
- [ ] 4.3 Add protected route wrapper component that redirects to `/login` if not authenticated

## 5. Verification

- [ ] 5.1 Test: `curl POST /api/v1/auth/register` with valid data → 200 with user profile
- [ ] 5.2 Test: `curl POST /api/v1/auth/login` with valid credentials → 200 with JWT token
- [ ] 5.3 Test: `curl GET /api/v1/users` without token → 401; with user token → 403; with admin token → 200 (or 501 if UserService not yet implemented)
- [ ] 5.4 Test: frontend login flow → redirects to console/admin
