package database

import (
	"context"
	"fmt"
	"log"

	_ "github.com/lib/pq"
	"go.uber.org/fx"

	"github.com/zhoumingjun/bookmgr/backend/config"
	"github.com/zhoumingjun/bookmgr/backend/ent"
)

var Module = fx.Options(
	fx.Provide(NewEntClient),
)

func NewEntClient(lc fx.Lifecycle, cfg *config.Config) (*ent.Client, error) {
	client, err := ent.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("opening database connection: %w", err)
	}

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			log.Println("Running database auto-migration...")
			if err := client.Schema.Create(ctx); err != nil {
				return fmt.Errorf("running auto-migration: %w", err)
			}
			log.Println("Database migration completed")
			return nil
		},
		OnStop: func(ctx context.Context) error {
			log.Println("Closing database connection...")
			return client.Close()
		},
	})

	return client, nil
}
