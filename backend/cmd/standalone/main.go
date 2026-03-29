package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"go.uber.org/fx"

	"github.com/zhoumingjun/bookmgr/backend/config"
	"github.com/zhoumingjun/bookmgr/backend/database"
	"github.com/zhoumingjun/bookmgr/backend/embed"
	"github.com/zhoumingjun/bookmgr/backend/grpcserver"
	"github.com/zhoumingjun/bookmgr/backend/handler"
	"github.com/zhoumingjun/bookmgr/backend/middleware"
	"github.com/zhoumingjun/bookmgr/backend/repository"
	"github.com/zhoumingjun/bookmgr/backend/service"
	"github.com/zhoumingjun/bookmgr/backend/storage"
)

func main() {
	cfg := parseFlags()

	if err := initDataDir(cfg.DataDir); err != nil {
		log.Fatalf("Failed to initialize data directory: %v", err)
	}

	fx.New(
		fx.Supply(cfg),
		database.SQLiteModule,
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

func parseFlags() *config.Config {
	dataDir := flag.String("data-dir", getEnv("DATA_DIR", "./data"), "Data directory for SQLite DB and uploads")
	port := flag.String("port", getEnv("PORT", "8080"), "HTTP listen port")
	jwtSecret := flag.String("jwt-secret", getEnv("JWT_SECRET", ""), "JWT signing secret (random if empty)")
	adminPass := flag.String("admin-pass", getEnv("ADMIN_PASSWORD", "changeme"), "Initial admin password")
	flag.Parse()

	secret := *jwtSecret
	if secret == "" {
		secret = generateRandomSecret()
		log.Println("WARNING: No JWT secret specified. Generated a random secret — tokens will be invalidated on restart. Use --jwt-secret to set a persistent secret.")
	}

	return &config.Config{
		Port:          *port,
		DataDir:       *dataDir,
		DatabaseURL:   "", // unused in standalone mode
		JWTSecret:     secret,
		UploadDir:     filepath.Join(*dataDir, "uploads"),
		AdminUsername: getEnv("ADMIN_USERNAME", "admin"),
		AdminPassword: *adminPass,
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func generateRandomSecret() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		log.Fatalf("Failed to generate random JWT secret: %v", err)
	}
	return hex.EncodeToString(b)
}

func initDataDir(dataDir string) error {
	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		return fmt.Errorf("creating data directory %s: %w", dataDir, err)
	}
	uploadsDir := filepath.Join(dataDir, "uploads")
	if err := os.MkdirAll(uploadsDir, 0o755); err != nil {
		return fmt.Errorf("creating uploads directory %s: %w", uploadsDir, err)
	}
	log.Printf("Data directory: %s", dataDir)
	return nil
}

func NewRouter(health *handler.HealthHandler, upload *handler.UploadHandler, gwMux *runtime.ServeMux) *chi.Mux {
	r := chi.NewRouter()
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(chimw.RequestID)

	// API routes
	r.Get("/healthz", health.Health)
	r.Post("/api/v1/books/{id}/upload", upload.Upload)
	r.Get("/api/v1/books/{id}/download", upload.Download)

	// Mount grpc-gateway for /api/v1/* paths
	r.Mount("/api/", gwMux)

	// Serve embedded frontend for everything else (SPA fallback)
	r.NotFound(embed.NewSPAHandler().ServeHTTP)

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
			fmt.Printf("Bookmgr standalone server started on :%s\n", cfg.Port)
			return nil
		},
		OnStop: func(ctx context.Context) error {
			return server.Shutdown(ctx)
		},
	})
}
