package service

import (
	"context"
	"encoding/base64"
	"fmt"
	"strconv"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/zhoumingjun/bookmgr/backend/ent"
	"github.com/zhoumingjun/bookmgr/backend/ent/user"
	"github.com/zhoumingjun/bookmgr/backend/repository"
)

// UserService handles user management business logic.
type UserService struct {
	repo *repository.UserRepository
}

// NewUserService creates a new UserService.
func NewUserService(repo *repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

// UserListResult holds paginated user results.
type UserListResult struct {
	Users         []*ent.User
	NextPageToken string
}

// List returns a paginated list of users.
func (s *UserService) List(ctx context.Context, pageSize int, pageToken string) (*UserListResult, error) {
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	offset := 0
	if pageToken != "" {
		decoded, err := base64.StdEncoding.DecodeString(pageToken)
		if err != nil {
			return nil, fmt.Errorf("invalid page token: %w", err)
		}
		offset, err = strconv.Atoi(string(decoded))
		if err != nil {
			return nil, fmt.Errorf("invalid page token: %w", err)
		}
	}

	// Convert offset to page number for repository (1-based)
	page := (offset / pageSize) + 1
	result, err := s.repo.List(ctx, page, pageSize)
	if err != nil {
		return nil, fmt.Errorf("listing users: %w", err)
	}

	var nextToken string
	nextOffset := offset + pageSize
	if nextOffset < result.Total {
		nextToken = base64.StdEncoding.EncodeToString([]byte(strconv.Itoa(nextOffset)))
	}

	return &UserListResult{
		Users:         result.Users,
		NextPageToken: nextToken,
	}, nil
}

// GetByID returns a single user.
func (s *UserService) GetByID(ctx context.Context, id uuid.UUID) (*ent.User, error) {
	return s.repo.GetByID(ctx, id)
}

// UpdateFields specifies which user fields to update.
type UpdateFields struct {
	Username *string
	Email    *string
	Role     *user.Role
	Password *string
}

// Update modifies user fields based on the given mask.
func (s *UserService) Update(ctx context.Context, id uuid.UUID, fields UpdateFields) (*ent.User, error) {
	u, err := s.repo.Update(ctx, id, func(update *ent.UserUpdateOne) *ent.UserUpdateOne {
		if fields.Username != nil {
			update = update.SetUsername(*fields.Username)
		}
		if fields.Email != nil {
			update = update.SetEmail(*fields.Email)
		}
		if fields.Role != nil {
			update = update.SetRole(*fields.Role)
		}
		if fields.Password != nil {
			hash, err := bcrypt.GenerateFromPassword([]byte(*fields.Password), bcrypt.DefaultCost)
			if err == nil {
				update = update.SetPasswordHash(string(hash))
			}
		}
		return update
	})
	if err != nil {
		return nil, fmt.Errorf("updating user: %w", err)
	}
	return u, nil
}

// Delete removes a user, preventing self-deletion.
func (s *UserService) Delete(ctx context.Context, id uuid.UUID, callerID uuid.UUID) error {
	if id == callerID {
		return fmt.Errorf("cannot delete yourself")
	}
	return s.repo.Delete(ctx, id)
}
