# API Reference

Base URL: `/api/v1`

## Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login, returns JWT

## Books
- `GET /api/v1/books` - List books (paginated)
- `GET /api/v1/books/:id` - Get book details
- `GET /api/v1/books/:id/download` - Download book file
- `POST /api/v1/books` - Upload book (admin only)
- `PUT /api/v1/books/:id` - Update book (admin only)
- `DELETE /api/v1/books/:id` - Delete book (admin only)

## Users (Admin only)
- `GET /api/v1/users` - List users
- `GET /api/v1/users/:id` - Get user details
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

## Common Patterns
- Auth: `Authorization: Bearer <jwt>`
- Pagination: `?page=1&per_page=20`
- Errors: `{"error": "message", "code": "ERROR_CODE"}`
