package middleware

import (
	"go.uber.org/fx"
	"google.golang.org/grpc"

	"github.com/zhoumingjun/bookmgr/backend/service"
)

// Interceptors holds the gRPC interceptors for use by the gRPC server.
type Interceptors struct {
	Auth grpc.UnaryServerInterceptor
	Role grpc.UnaryServerInterceptor
}

// NewInterceptors creates the middleware interceptors.
func NewInterceptors(jwt *service.JWTService) *Interceptors {
	return &Interceptors{
		Auth: AuthInterceptor(jwt),
		Role: RoleInterceptor(),
	}
}

var Module = fx.Options(
	fx.Provide(NewInterceptors),
)
