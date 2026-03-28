# Architecture

## Overview
Bookmgr is a book management system with two user-facing interfaces:
1. **Admin Dashboard** - User management, book upload/management
2. **User Console** - Browse and read books (PDF)

## System Components

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────>│   Backend    │────>│  PostgreSQL   │
│  (React/TS)  │     │ (Go/Chi/fx)  │     │              │
└─────────────┘     └──────┬───────┘     └──────────────┘
                           │
                    ┌──────▼───────┐
                    │ File Storage  │
                    │ (Docker Vol)  │
                    └──────────────┘
```

## Backend Architecture
Layered architecture with dependency injection:
- **handler/** - HTTP request/response handling
- **service/** - Business logic
- **repository/** - Data access via Ent ORM
- **ent/schema/** - Data model definitions
- **middleware/** - JWT auth, CORS
- **config/** - Environment-based configuration
- **storage/** - File system abstraction

## Data Model
- **User**: id, username, email, password_hash, role (admin/user), timestamps
- **Book**: id, title, author, description, cover_url, file_path, uploader_id (FK->User), timestamps
