package middleware

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// adminMethods require super_admin or admin role.
var adminMethods = map[string]bool{
	"/bookmgr.v1.UserService/CreateUser":  true,
	"/bookmgr.v1.UserService/ListUsers":    true,
	"/bookmgr.v1.UserService/UpdateUser":   true,
	"/bookmgr.v1.UserService/DeleteUser":   true,
	"/bookmgr.v1.BookService/CreateBook":   true,
	"/bookmgr.v1.BookService/UpdateBook":   true,
	"/bookmgr.v1.BookService/DeleteBook":   true,
}

// superAdminMethods require super_admin role only.
var superAdminMethods = map[string]bool{}

// isAdmin checks if the role is admin or super_admin.
func isAdmin(role string) bool {
	return role == "super_admin" || role == "admin"
}

// isSuperAdmin checks if the role is super_admin.
func isSuperAdmin(role string) bool {
	return role == "super_admin"
}

// RoleInterceptor returns a gRPC unary interceptor that enforces role-based access control.
func RoleInterceptor() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		// Allow if not an admin/super_admin method
		if !adminMethods[info.FullMethod] && !superAdminMethods[info.FullMethod] {
			return handler(ctx, req)
		}

		claims, ok := ClaimsFromContext(ctx)
		if !ok {
			return nil, status.Error(codes.Unauthenticated, "missing claims")
		}

		// Check super_admin-only methods first
		if superAdminMethods[info.FullMethod] {
			if !isSuperAdmin(claims.Role) {
				return nil, status.Error(codes.PermissionDenied, "super_admin access required")
			}
			return handler(ctx, req)
		}

		// Check admin methods (super_admin or admin)
		if !isAdmin(claims.Role) {
			return nil, status.Error(codes.PermissionDenied, "admin access required")
		}

		return handler(ctx, req)
	}
}
