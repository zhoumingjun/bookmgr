## 1. Dependencies and Setup

- [x] 1.1 Add Ent ORM, PostgreSQL driver, UUIDv7, and bcrypt dependencies to `backend/go.mod` (entgo.io/ent, github.com/lib/pq, github.com/google/uuid, golang.org/x/crypto)
- [x] 1.2 Add `ADMIN_USERNAME` and `ADMIN_PASSWORD` to `backend/config/config.go` with defaults (`admin` / `changeme`)

## 2. Ent Schema and Code Generation

- [x] 2.1 Create User Ent schema at `backend/ent/schema/user.go` with fields: id (UUIDv7), username, email, password_hash, role (enum: admin/user), created_at, updated_at — including validations and unique indexes
- [x] 2.2 Run `go generate ./ent` to generate Ent client code and commit the generated files

## 3. Database Connection

- [x] 3.1 Create Ent client initialization in `backend/database/` as an fx module: open PostgreSQL connection using `DATABASE_URL` from config, register lifecycle hooks for startup (auto-migration) and shutdown (close)

## 4. User Repository

- [x] 4.1 Implement `UserRepository` in `backend/repository/user.go` with methods: Create, GetByID, GetByEmail, GetByUsername, List (paginated), Update, Delete
- [x] 4.2 Export `UserRepository` as part of the repository fx module in `backend/repository/repository.go`

## 5. Admin Seeding

- [x] 5.1 Implement admin seeder as an fx lifecycle hook: on start, check if admin exists; if not, create one using config values with bcrypt-hashed password; log a warning if using default credentials

## 6. Integration and Verification

- [x] 6.1 Wire all new fx modules into `backend/cmd/server/main.go`
- [x] 6.2 Verify with `docker compose up -d --build` that the app starts, connects to PostgreSQL, runs migration, and seeds the admin user
