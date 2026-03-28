## Why

Administrators need to manage users — list all users, view details, update roles/profiles, reset passwords, and delete accounts. The UserService proto is defined but returns UNIMPLEMENTED. The UserRepository already provides CRUD operations. This change connects the gRPC service to the repository through a service layer, and builds the admin frontend UI.

## What Changes

- Implement `UserService` gRPC service: `ListUsers`, `GetUser`, `UpdateUser`, `DeleteUser`
- Implement user service layer with business logic (role changes, password resets)
- Add password reset support in `UpdateUser` (admin sets new password)
- Build admin user management frontend pages: user list table, user edit form
- All UserService RPCs are admin-only (enforced by existing role interceptor from `auth-system`)

## Capabilities

### New Capabilities

- `user-management-service`: gRPC UserService implementation with admin CRUD operations including password reset
- `admin-user-ui`: Admin frontend pages for user listing and management

### Modified Capabilities

_(none)_

## Impact

- **Code**: `backend/handler/user.go`, `backend/service/user.go`, `frontend/src/pages/admin/Users.tsx`, `frontend/src/pages/admin/UserEdit.tsx`, `frontend/src/api/users.ts`
- **API**: `GET /api/v1/users`, `GET /api/v1/users/{user}`, `PUT /api/v1/users/{user}`, `DELETE /api/v1/users/{user}` become functional (backward-compatible — currently return UNIMPLEMENTED)
- **Admin impact**: admins can manage users through both API and web UI
- **User impact**: none directly — these are admin-only endpoints
