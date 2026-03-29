package middleware

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// adminMethods that require admin role.
var adminMethods = map[string]bool{
	"/bookmgr.v1.UserService/ListUsers":  true,
	"/bookmgr.v1.UserService/GetUser":    true,
	"/bookmgr.v1.UserService/UpdateUser": true,
	"/bookmgr.v1.UserService/DeleteUser": true,
}

// RoleInterceptor returns a gRPC unary interceptor that enforces admin role on admin-only RPCs.
func RoleInterceptor() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		if !adminMethods[info.FullMethod] {
			return handler(ctx, req)
		}

		claims, ok := ClaimsFromContext(ctx)
		if !ok {
			return nil, status.Error(codes.Unauthenticated, "missing claims")
		}

		if claims.Role != "admin" {
			return nil, status.Error(codes.PermissionDenied, "admin role required")
		}

		return handler(ctx, req)
	}
}
