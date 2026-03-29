package database

import (
	"context"
	"database/sql"
	"fmt"
	"io/fs"
	"log"
	"sort"
	"strings"
	"time"

	_ "github.com/lib/pq"
	"go.uber.org/fx"

	"github.com/zhoumingjun/bookmgr/backend/config"
	"github.com/zhoumingjun/bookmgr/backend/ent"
	"github.com/zhoumingjun/bookmgr/backend/migrations"
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
			db, err := sql.Open("postgres", cfg.DatabaseURL)
			if err != nil {
				return fmt.Errorf("opening database for migration: %w", err)
			}
			defer db.Close()

			if err := runMigrations(ctx, db); err != nil {
				return fmt.Errorf("running migrations: %w", err)
			}
			return nil
		},
		OnStop: func(ctx context.Context) error {
			log.Println("Closing database connection...")
			return client.Close()
		},
	})

	return client, nil
}

// runMigrations applies all pending SQL migrations from the embedded migrations directory.
func runMigrations(ctx context.Context, db *sql.DB) error {
	log.Println("Running Atlas versioned migrations...")

	// Ensure the revision tracking table exists.
	if _, err := db.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS atlas_schema_revisions (
			version    TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
		)
	`); err != nil {
		return fmt.Errorf("creating revision table: %w", err)
	}

	// Read applied versions.
	applied := make(map[string]bool)
	rows, err := db.QueryContext(ctx, `SELECT version FROM atlas_schema_revisions`)
	if err != nil {
		return fmt.Errorf("reading revisions: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var v string
		if err := rows.Scan(&v); err != nil {
			return fmt.Errorf("scanning revision: %w", err)
		}
		applied[v] = true
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("iterating revisions: %w", err)
	}

	// List migration files sorted by name.
	entries, err := fs.ReadDir(migrations.FS, ".")
	if err != nil {
		return fmt.Errorf("reading migration files: %w", err)
	}
	var files []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".sql") {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)

	// Apply pending migrations.
	pending := 0
	for _, name := range files {
		version := strings.TrimSuffix(name, ".sql")
		if applied[version] {
			continue
		}

		data, err := migrations.FS.ReadFile(name)
		if err != nil {
			return fmt.Errorf("reading migration %s: %w", name, err)
		}

		start := time.Now()
		tx, err := db.BeginTx(ctx, nil)
		if err != nil {
			return fmt.Errorf("beginning transaction for %s: %w", name, err)
		}

		if _, err := tx.ExecContext(ctx, string(data)); err != nil {
			tx.Rollback()
			return fmt.Errorf("executing migration %s: %w", name, err)
		}

		if _, err := tx.ExecContext(ctx,
			`INSERT INTO atlas_schema_revisions (version) VALUES ($1)`, version,
		); err != nil {
			tx.Rollback()
			return fmt.Errorf("recording revision %s: %w", name, err)
		}

		if err := tx.Commit(); err != nil {
			return fmt.Errorf("committing migration %s: %w", name, err)
		}

		log.Printf("Applied migration %s (%s)", name, time.Since(start).Round(time.Millisecond))
		pending++
	}

	if pending == 0 {
		log.Println("No pending migrations")
	} else {
		log.Printf("Applied %d migration(s)", pending)
	}
	return nil
}
