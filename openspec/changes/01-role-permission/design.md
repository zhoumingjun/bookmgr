## Context

The existing bookmgr system has a 2-role model (`admin`/`user`) with self-registration via `AuthService.Register`. The picturebook requirements demand a 4-role hierarchy with no self-registration. This change expands the role system while preserving the existing layered architecture (handler → service → repository → ent).

The User Ent schema already exists with a `role` field currently defined as `Values("admin", "user")`. The AuthService and JWT middleware already exist. The UserService already has admin-only RPCs (ListUsers, UpdateUser, DeleteUser).

## Goals / Non-Goals

**Goals:**
- Expand role enum from 2 to 4 values: `super_admin`, `admin`, `teacher`, `parent`
- Disable `Register` RPC entirely (return `PERMISSION_DENIED`)
- Add `CreateUser` RPC (super_admin or admin only) for admin-driven user creation
- Add `ChangePassword` RPC (authenticated users, for admin-initiated password reset)
- Map legacy data: existing `admin` → `super_admin`, existing `user` → `teacher`
- Enforce 4-role check in role interceptor (super_admin and admin get admin RPC access; teacher and parent get user RPC access)
- Update frontend admin UI with role selector and user creation form

**Non-Goals:**
- Role editing by non-super-admin (only super_admin can change roles)
- Parent/teacher self-upgrade requests
- Role hierarchy beyond what's described (no nested permissions)
- Password complexity enforcement (can be added later)
- Account lockout after failed attempts (future work)

## Decisions

### 1. Role enum values

**Choice**: `super_admin` (课题负责人), `admin` (课题核心成员), `teacher`, `parent`.

**Why**: Exactly matches the requirements table. `super_admin` and `admin` both get admin access for the picturebook context (book upload, review, user management), with super_admin being the system owner.

### 2. Register RPC disabled via PERMISSION_DENIED

**Choice**: Keep the `Register` RPC in the proto but implement it to always return `PERMISSION_DENIED`. Do not remove the proto definition.

**Why**: Preserves API compatibility (no breaking change to the proto). Simply changes behavior. Removing the RPC would require a breaking API change and client updates.

**Alternative considered**: Remove `Register` from proto entirely — would be a breaking API change requiring `buf breaking` review. Not worth it.

### 3. Existing admin→super_admin migration

**Choice**: In the migration, map existing `admin` role users to `super_admin` and existing `user` role users to `teacher`.

**Why**: Preserves existing data. The functional permission of existing users is preserved (admins remain top-level, regular users become teachers which has browse-only access in the new system).

### 4. super_admin vs admin distinction in role interceptor

**Choice**: The role interceptor admin allowlist accepts both `super_admin` and `admin` roles. Both roles can access admin RPCs (ListUsers, CreateUser, etc.).

**Why**: The requirements distinguish super_admin and admin mainly in description, not in functional differences for the MVP. Both can manage books and users. The distinction can be enforced at the service layer if needed later.

### 5. Parent sees only assigned books

**Choice**: Parents can only see books that are explicitly assigned/pushed to them. Teacher can see all books.

**Why**: Requirement states "家长用户：仅可查看、浏览课题组推送的绘本". This requires a book-to-parent assignment relationship. This will be handled in the Book Assignment feature, not in this PR. For this feature, parent role is created and can authenticate.

### 6. CreateUser requires admin role

**Choice**: `CreateUser` RPC on UserService requires either `super_admin` or `admin` role.

**Why**: Only admins should create users. Teachers and parents cannot self-register.

### 7. Password: admin sets initial password

**Choice**: `CreateUser` takes an optional `password` field. If not provided, a random 12-character password is generated and returned in the response (admin must communicate it to the user). User is not forced to change password on first login in this feature.

**Why**: Simplest approach for MVP. Password change on first login can be added as a separate feature.

## Risks / Trade-offs

- **[Migration maps old roles]** → Existing admin and user data is remapped. Acceptable because we control the data.
- **[Register RPC still exists in proto]** → Returns 403, not a breaking API change, but some clients may be confused. Mitigation: document this in the API changelog.
- **[Parent sees all books until assignment feature]** → Parent role can authenticate but will see 0 books until the assignment feature lands. Acceptable for phased development.
- **[No password complexity enforcement]** → Mitigation: in production, initial passwords should be long random strings; this can be tightened later.
