## Context

The gRPC UserService proto defines 4 RPCs (ListUsers, GetUser, UpdateUser, DeleteUser), all admin-only. The UserRepository provides CRUD operations. The auth-system change adds JWT auth and role interceptors that protect these RPCs. The frontend has a placeholder admin dashboard at `/admin`.

## Goals / Non-Goals

**Goals:**
- Implement UserService gRPC server connecting proto layer to repository
- Support admin password reset via UpdateUser
- Build admin user management UI (list + edit)
- Token-based pagination translation (page_token ↔ offset)

**Non-Goals:**
- User self-service profile editing (future change)
- User creation by admin (use Register endpoint instead)
- User search/filter (can be added later)

## Decisions

### 1. Service layer between handler and repository

**Choice**: `backend/service/user.go` contains `UserService` with business logic. gRPC handler delegates to service, service delegates to repository.

**Why**: Keeps gRPC handler thin (proto mapping only). Service layer owns validation logic like "admin cannot delete themselves" and password hashing on reset.

### 2. Page token as base64-encoded offset

**Choice**: `page_token` is a base64-encoded integer offset. Service layer decodes token to offset for repository, encodes next offset as token for response.

**Why**: Simple, stateless, compatible with the existing offset-based repository List method. Opaque to clients.

### 3. UpdateUser uses field mask pattern

**Choice**: `UpdateUser` accepts an `update_mask` (google.protobuf.FieldMask) indicating which fields to update. Only masked fields are modified.

**Why**: AIP-134 standard. Prevents accidental overwrites. Allows partial updates (e.g., change role without changing email).

### 4. Admin cannot delete themselves

**Choice**: `DeleteUser` returns `FAILED_PRECONDITION` if the authenticated admin tries to delete their own account.

**Why**: Prevents lockout — at least one admin must always exist.

## Risks / Trade-offs

- **[No user search]** → Admin must scroll through pages to find a user. Acceptable for initial version with few users.
- **[Base64 offset pagination]** → Not stable under concurrent writes but acceptable for admin-only list with low write frequency.
