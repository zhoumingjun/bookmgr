package config

import (
	"os"

	"go.uber.org/fx"
)

var Module = fx.Options(
	fx.Provide(New),
)

type Config struct {
	Port          string
	DatabaseURL   string
	JWTSecret     string
	UploadDir     string
	AdminUsername string
	AdminPassword string
	DataDir       string
}

func New() *Config {
	return &Config{
		Port:          getEnv("PORT", "8080"),
		DatabaseURL:   getEnv("DATABASE_URL", "postgres://bookmgr:bookmgr@localhost:5432/bookmgr?sslmode=disable"),
		JWTSecret:     getEnv("JWT_SECRET", "dev-secret-change-in-production"),
		UploadDir:     getEnv("UPLOAD_DIR", "./uploads"),
		AdminUsername: getEnv("ADMIN_USERNAME", "admin"),
		AdminPassword: getEnv("ADMIN_PASSWORD", "changeme"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
