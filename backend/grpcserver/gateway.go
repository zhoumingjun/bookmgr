package grpcserver

import (
	"context"
	"log"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"go.uber.org/fx"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/protobuf/encoding/protojson"

	bookmgrv1 "github.com/zhoumingjun/bookmgr/gen/api/bookmgr/v1"
)

// GatewayModule provides the grpc-gateway HTTP mux as an fx dependency.
var GatewayModule = fx.Options(
	fx.Provide(NewGatewayMux),
)

// NewGatewayMux creates a grpc-gateway ServeMux that proxies HTTP/JSON to the in-process gRPC server.
func NewGatewayMux(lc fx.Lifecycle, bl *BufListener) (*runtime.ServeMux, error) {
	mux := runtime.NewServeMux(
		runtime.WithMarshalerOption(runtime.MIMEWildcard, &runtime.JSONPb{
			MarshalOptions: protojson.MarshalOptions{
				EmitDefaultValues: true,
				UseProtoNames:     true,
			},
			UnmarshalOptions: protojson.UnmarshalOptions{
				DiscardUnknown: true,
			},
		}),
	)

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			conn, err := grpc.NewClient(
				"passthrough:///bufnet",
				grpc.WithContextDialer(bl.BufDialer),
				grpc.WithTransportCredentials(insecure.NewCredentials()),
			)
			if err != nil {
				return err
			}

			if err := bookmgrv1.RegisterAuthServiceHandler(ctx, mux, conn); err != nil {
				return err
			}
			if err := bookmgrv1.RegisterBookServiceHandler(ctx, mux, conn); err != nil {
				return err
			}
			if err := bookmgrv1.RegisterUserServiceHandler(ctx, mux, conn); err != nil {
				return err
			}
			if err := bookmgrv1.RegisterDimensionServiceHandler(ctx, mux, conn); err != nil {
				return err
			}
			if err := bookmgrv1.RegisterFileServiceHandler(ctx, mux, conn); err != nil {
				return err
			}

			log.Println("gRPC-Gateway handlers registered")
			return nil
		},
	})

	return mux, nil
}
