package handler

import (
	"context"
	"strings"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

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

// Register is disabled. All users must be created by super_admin or admin.
// Self-registration is not allowed.
func (h *AuthHandler) Register(ctx context.Context, req *bookmgrv1.RegisterRequest) (*bookmgrv1.RegisterResponse, error) {
	return nil, status.Error(codes.PermissionDenied, "self-registration is disabled. please contact your administrator to create an account.")
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
