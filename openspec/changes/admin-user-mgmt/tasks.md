## 1. Backend Service Layer

- [ ] 1.1 Create `backend/service/user.go`: `UserService` with methods `List(ctx, pageSize, pageToken)`, `GetByID(ctx, id)`, `Update(ctx, id, fields, mask)`, `Delete(ctx, id, callerID)` — includes page token encode/decode, field mask handling, password hashing on reset, self-delete prevention
- [ ] 1.2 Export UserService in `backend/service/service.go` fx module

## 2. gRPC Handler

- [ ] 2.1 Create `backend/handler/user.go`: gRPC `UserServiceServer` implementation wrapping the user service, mapping proto types to domain types and domain errors to gRPC status codes
- [ ] 2.2 Register `UserServiceServer` on gRPC server, replacing the Unimplemented stub

## 3. Frontend API Layer

- [ ] 3.1 Create `frontend/src/api/users.ts`: API functions for listUsers, getUser, updateUser, deleteUser using axios client

## 4. Frontend Admin Pages

- [ ] 4.1 Create `frontend/src/pages/admin/Users.tsx`: user list table with columns (username, email, role, created), pagination, edit/delete action buttons
- [ ] 4.2 Create `frontend/src/pages/admin/UserEdit.tsx`: edit form for role change and password reset, with save and cancel buttons
- [ ] 4.3 Wire admin routes in `App.tsx`: `/admin/users` → Users, `/admin/users/:id` → UserEdit
- [ ] 4.4 Update `frontend/src/pages/admin/Dashboard.tsx`: add navigation link to user management

## 5. Verification

- [ ] 5.1 Test: `curl GET /api/v1/users` with admin token → 200 with user list
- [ ] 5.2 Test: `curl PUT /api/v1/users/{id}` with role change → 200 with updated user
- [ ] 5.3 Test: frontend admin user list and edit flow works end-to-end
