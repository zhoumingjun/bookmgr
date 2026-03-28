package database

import (
	"context"
	"fmt"
	"log"

	"go.uber.org/fx"
	"golang.org/x/crypto/bcrypt"

	"github.com/zhoumingjun/bookmgr/backend/config"
	"github.com/zhoumingjun/bookmgr/backend/ent/user"
	"github.com/zhoumingjun/bookmgr/backend/repository"
)

var SeedModule = fx.Options(
	fx.Invoke(RegisterAdminSeeder),
)

func RegisterAdminSeeder(lc fx.Lifecycle, repo *repository.UserRepository, cfg *config.Config) {
	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			return seedAdmin(ctx, repo, cfg)
		},
	})
}

func seedAdmin(ctx context.Context, repo *repository.UserRepository, cfg *config.Config) error {
	_, err := repo.GetByUsername(ctx, cfg.AdminUsername)
	if err == nil {
		log.Println("Admin user already exists, skipping seed")
		return nil
	}

	if cfg.AdminPassword == "changeme" {
		log.Println("WARNING: Using default admin password. Change ADMIN_PASSWORD in production!")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(cfg.AdminPassword), 10)
	if err != nil {
		return fmt.Errorf("hashing admin password: %w", err)
	}

	_, err = repo.Create(ctx, cfg.AdminUsername, cfg.AdminUsername+"@bookmgr.local", string(hash), user.RoleAdmin)
	if err != nil {
		return fmt.Errorf("seeding admin user: %w", err)
	}

	log.Printf("Admin user '%s' created successfully", cfg.AdminUsername)
	return nil
}
