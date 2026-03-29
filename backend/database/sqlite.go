package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"path/filepath"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"
	_ "modernc.org/sqlite"
	"go.uber.org/fx"

	"github.com/zhoumingjun/bookmgr/backend/config"
	"github.com/zhoumingjun/bookmgr/backend/ent"
)

func NewSQLiteEntClient(lc fx.Lifecycle, cfg *config.Config) (*ent.Client, error) {
	dbPath := filepath.Join(cfg.DataDir, "bookmgr.db")
	dsn := fmt.Sprintf("file:%s?_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)&_pragma=foreign_keys(1)", dbPath)

	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("opening sqlite database: %w", err)
	}

	// Wrap with Ent's SQLite dialect so schema migration works correctly.
	drv := entsql.OpenDB(dialect.SQLite, db)
	client := ent.NewClient(ent.Driver(drv))

	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			log.Println("Running Ent auto-migration for SQLite...")
			if err := client.Schema.Create(ctx); err != nil {
				return fmt.Errorf("running sqlite auto-migration: %w", err)
			}
			log.Println("SQLite auto-migration complete")
			return nil
		},
		OnStop: func(ctx context.Context) error {
			log.Println("Closing SQLite database connection...")
			return client.Close()
		},
	})

	return client, nil
}
