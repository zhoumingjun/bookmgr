package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"github.com/zhoumingjun/bookmgr/backend/ent"
	"github.com/zhoumingjun/bookmgr/backend/ent/user"
)

type UserRepository struct {
	client *ent.Client
}

func NewUserRepository(client *ent.Client) *UserRepository {
	return &UserRepository{client: client}
}

func (r *UserRepository) Create(ctx context.Context, username, email, passwordHash string, role user.Role) (*ent.User, error) {
	u, err := r.client.User.Create().
		SetUsername(username).
		SetEmail(email).
		SetPasswordHash(passwordHash).
		SetRole(role).
		Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("creating user: %w", err)
	}
	return u, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*ent.User, error) {
	u, err := r.client.User.Get(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("getting user by id: %w", err)
	}
	return u, nil
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*ent.User, error) {
	u, err := r.client.User.Query().
		Where(user.EmailEQ(email)).
		Only(ctx)
	if err != nil {
		return nil, fmt.Errorf("getting user by email: %w", err)
	}
	return u, nil
}

func (r *UserRepository) GetByUsername(ctx context.Context, username string) (*ent.User, error) {
	u, err := r.client.User.Query().
		Where(user.UsernameEQ(username)).
		Only(ctx)
	if err != nil {
		return nil, fmt.Errorf("getting user by username: %w", err)
	}
	return u, nil
}

type ListResult struct {
	Users []*ent.User
	Total int
}

func (r *UserRepository) List(ctx context.Context, page, perPage int) (*ListResult, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 20
	}
	offset := (page - 1) * perPage

	total, err := r.client.User.Query().Count(ctx)
	if err != nil {
		return nil, fmt.Errorf("counting users: %w", err)
	}

	users, err := r.client.User.Query().
		Order(ent.Desc(user.FieldCreatedAt)).
		Offset(offset).
		Limit(perPage).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("listing users: %w", err)
	}

	return &ListResult{Users: users, Total: total}, nil
}

func (r *UserRepository) Update(ctx context.Context, id uuid.UUID, fn func(*ent.UserUpdateOne) *ent.UserUpdateOne) (*ent.User, error) {
	update := r.client.User.UpdateOneID(id)
	u, err := fn(update).Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("updating user: %w", err)
	}
	return u, nil
}

func (r *UserRepository) Delete(ctx context.Context, id uuid.UUID) error {
	err := r.client.User.DeleteOneID(id).Exec(ctx)
	if err != nil {
		return fmt.Errorf("deleting user: %w", err)
	}
	return nil
}
