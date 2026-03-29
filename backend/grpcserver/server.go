package grpcserver

import (
	"context"
	"log"
	"net"

	"buf.build/go/protovalidate"
	"go.uber.org/fx"
	"google.golang.org/grpc"
	"google.golang.org/grpc/test/bufconn"
	"google.golang.org/protobuf/proto"

	"github.com/zhoumingjun/bookmgr/backend/handler"
	"github.com/zhoumingjun/bookmgr/backend/middleware"
	bookmgrv1 "github.com/zhoumingjun/bookmgr/gen/api/bookmgr/v1"
)

const bufSize = 1024 * 1024

// BufListener is an in-memory listener for gRPC, used to connect grpc-gateway without a TCP port.
type BufListener struct {
	*bufconn.Listener
}

// Module provides the gRPC server and bufconn listener as fx dependencies.
var Module = fx.Options(
	fx.Provide(NewBufListener),
	fx.Provide(NewGRPCServer),
	fx.Invoke(StartGRPCServer),
)

// NewBufListener creates an in-memory bufconn listener.
func NewBufListener() *BufListener {
	return &BufListener{Listener: bufconn.Listen(bufSize)}
}

// NewGRPCServer creates a gRPC server with protovalidate interceptor and registers service implementations.
func NewGRPCServer(authHandler *handler.AuthHandler, userHandler *handler.UserHandler, mw *middleware.Interceptors) (*grpc.Server, error) {
	validator, err := protovalidate.New()
	if err != nil {
		return nil, err
	}

	srv := grpc.NewServer(
		grpc.ChainUnaryInterceptor(
			protovalidateUnaryInterceptor(validator),
			mw.Auth,
			mw.Role,
		),
	)

	bookmgrv1.RegisterAuthServiceServer(srv, authHandler)
	bookmgrv1.RegisterUserServiceServer(srv, userHandler)
	bookmgrv1.RegisterBookServiceServer(srv, &bookmgrv1.UnimplementedBookServiceServer{})

	return srv, nil
}

// StartGRPCServer wires the gRPC server lifecycle to fx.
func StartGRPCServer(lc fx.Lifecycle, srv *grpc.Server, lis *BufListener) {
	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			go func() {
				log.Println("gRPC server starting on bufconn")
				if err := srv.Serve(lis); err != nil {
					log.Printf("gRPC server error: %v", err)
				}
			}()
			return nil
		},
		OnStop: func(ctx context.Context) error {
			log.Println("gRPC server stopping")
			srv.GracefulStop()
			return nil
		},
	})
}

// protovalidateUnaryInterceptor returns a gRPC unary interceptor that validates requests using protovalidate.
func protovalidateUnaryInterceptor(validator protovalidate.Validator) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		if msg, ok := req.(proto.Message); ok {
			if err := validator.Validate(msg); err != nil {
				return nil, err
			}
		}
		return handler(ctx, req)
	}
}

// BufDialer returns a dialer function for grpc.DialContext to connect to the bufconn listener.
func (bl *BufListener) BufDialer(context.Context, string) (net.Conn, error) {
	return bl.Dial()
}
