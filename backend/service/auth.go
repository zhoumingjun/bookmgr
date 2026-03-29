package service

import (
	"context"
	"fmt"

	"golang.org/x/crypto/bcrypt"

	"github.com/zhoumingjun/bookmgr/backend/ent"
	"github.com/zhoumingjun/bookmgr/backend/ent/user"
	"github.com/zhoumingjun/bookmgr/backend/repository"
)

// AuthService handles user registration and authentication.
type AuthService struct {
	repo *repository.UserRepository
	jwt  *JWTService
}

// NewAuthService creates a new AuthService.
func NewAuthService(repo *repository.UserRepository, jwt *JWTService) *AuthService {
	return &AuthService{repo: repo, jwt: jwt}
}

// Register creates a new user account with the given credentials.
func (s *AuthService) Register(ctx context.Context, username, email, password string) (*ent.User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hashing password: %w", err)
	}
	u, err := s.repo.Create(ctx, username, email, string(hash), user.RoleUser)
	if err != nil {
		return nil, fmt.Errorf("creating user: %w", err)
	}
	return u, nil
}

// Login verifies credentials and returns a JWT token.
func (s *AuthService) Login(ctx context.Context, username, password string) (string, error) {
	u, err := s.repo.GetByUsername(ctx, username)
	if err != nil {
		return "", fmt.Errorf("finding user: %w", err)
	}
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
		return "", fmt.Errorf("invalid credentials: %w", err)
	}
	token, err := s.jwt.GenerateToken(u.ID.String(), string(u.Role))
	if err != nil {
		return "", fmt.Errorf("generating token: %w", err)
	}
	return token, nil
}
