package middleware

import (
	"context"
	"strings"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"

	"github.com/zhoumingjun/bookmgr/backend/service"
)

type ctxKey int

const claimsKey ctxKey = 0

// publicMethods that don't require authentication.
var publicMethods = map[string]bool{
	"/bookmgr.v1.AuthService/Register": true,
	"/bookmgr.v1.AuthService/Login":    true,
}

// AuthInterceptor returns a gRPC unary interceptor that validates JWT tokens.
func AuthInterceptor(jwt *service.JWTService) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		if publicMethods[info.FullMethod] {
			return handler(ctx, req)
		}

		md, ok := metadata.FromIncomingContext(ctx)
		if !ok {
			return nil, status.Error(codes.Unauthenticated, "missing metadata")
		}

		authHeader := md.Get("authorization")
		if len(authHeader) == 0 {
			return nil, status.Error(codes.Unauthenticated, "missing authorization header")
		}

		token := strings.TrimPrefix(authHeader[0], "Bearer ")
		if token == authHeader[0] {
			return nil, status.Error(codes.Unauthenticated, "invalid authorization format")
		}

		claims, err := jwt.ValidateToken(token)
		if err != nil {
			return nil, status.Errorf(codes.Unauthenticated, "invalid token: %v", err)
		}

		ctx = context.WithValue(ctx, claimsKey, claims)
		return handler(ctx, req)
	}
}

// ClaimsFromContext extracts JWT claims from the context.
func ClaimsFromContext(ctx context.Context) (*service.Claims, bool) {
	claims, ok := ctx.Value(claimsKey).(*service.Claims)
	return claims, ok
}
