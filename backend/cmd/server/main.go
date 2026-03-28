package main

import (
	"context"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"go.uber.org/fx"

	"github.com/zhoumingjun/bookmgr/backend/config"
	"github.com/zhoumingjun/bookmgr/backend/database"
	"github.com/zhoumingjun/bookmgr/backend/grpcserver"
	"github.com/zhoumingjun/bookmgr/backend/handler"
	"github.com/zhoumingjun/bookmgr/backend/middleware"
	"github.com/zhoumingjun/bookmgr/backend/repository"
	"github.com/zhoumingjun/bookmgr/backend/service"
	"github.com/zhoumingjun/bookmgr/backend/storage"
)

func main() {
	fx.New(
		config.Module,
		database.Module,
		database.SeedModule,
		handler.Module,
		service.Module,
		repository.Module,
		middleware.Module,
		storage.Module,
		grpcserver.Module,
		grpcserver.GatewayModule,
		fx.Provide(NewRouter),
		fx.Invoke(StartServer),
	).Run()
}

func NewRouter(health *handler.HealthHandler, gwMux *runtime.ServeMux) *chi.Mux {
	r := chi.NewRouter()
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(chimw.RequestID)

	r.Get("/healthz", health.Health)

	// Mount grpc-gateway — it handles /api/v1/* paths as defined in proto HTTP annotations
	r.Mount("/", gwMux)

	return r
}

func StartServer(lc fx.Lifecycle, cfg *config.Config, router *chi.Mux) {
	server := &http.Server{
		Addr:    fmt.Sprintf(":%s", cfg.Port),
		Handler: router,
	}

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			go server.ListenAndServe()
			fmt.Printf("Server started on :%s\n", cfg.Port)
			return nil
		},
		OnStop: func(ctx context.Context) error {
			return server.Shutdown(ctx)
		},
	})
}
