package handler

import (
	"context"
	"strings"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/zhoumingjun/bookmgr/backend/ent/user"
	"github.com/zhoumingjun/bookmgr/backend/service"
	bookmgrv1 "github.com/zhoumingjun/bookmgr/gen/api/bookmgr/v1"
)

// AuthHandler implements the gRPC AuthServiceServer.
type AuthHandler struct {
	bookmgrv1.UnimplementedAuthServiceServer
	authService *service.AuthService
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Register creates a new user account.
func (h *AuthHandler) Register(ctx context.Context, req *bookmgrv1.RegisterRequest) (*bookmgrv1.RegisterResponse, error) {
	u, err := h.authService.Register(ctx, req.GetUsername(), req.GetEmail(), req.GetPassword())
	if err != nil {
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			return nil, status.Errorf(codes.AlreadyExists, "user already exists")
		}
		return nil, status.Errorf(codes.Internal, "registration failed: %v", err)
	}
	return &bookmgrv1.RegisterResponse{
		Id:       u.ID.String(),
		Username: u.Username,
		Email:    u.Email,
		Role:     entRoleToProto(u.Role),
	}, nil
}

// Login authenticates a user and returns a JWT token.
func (h *AuthHandler) Login(ctx context.Context, req *bookmgrv1.LoginRequest) (*bookmgrv1.LoginResponse, error) {
	token, err := h.authService.Login(ctx, req.GetUsername(), req.GetPassword())
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "invalid credentials") {
			return nil, status.Errorf(codes.Unauthenticated, "invalid username or password")
		}
		return nil, status.Errorf(codes.Internal, "login failed: %v", err)
	}
	return &bookmgrv1.LoginResponse{Token: token}, nil
}

func entRoleToProto(r user.Role) bookmgrv1.Role {
	switch r {
	case user.RoleAdmin:
		return bookmgrv1.Role_ROLE_ADMIN
	case user.RoleUser:
		return bookmgrv1.Role_ROLE_USER
	default:
		return bookmgrv1.Role_ROLE_UNSPECIFIED
	}
}
