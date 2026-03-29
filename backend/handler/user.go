package handler

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/zhoumingjun/bookmgr/backend/ent"
	"github.com/zhoumingjun/bookmgr/backend/ent/user"
	"github.com/zhoumingjun/bookmgr/backend/middleware"
	"github.com/zhoumingjun/bookmgr/backend/service"
	bookmgrv1 "github.com/zhoumingjun/bookmgr/gen/api/bookmgr/v1"
)

// UserHandler implements the gRPC UserServiceServer.
type UserHandler struct {
	bookmgrv1.UnimplementedUserServiceServer
	userService *service.UserService
}

// NewUserHandler creates a new UserHandler.
func NewUserHandler(userService *service.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

func (h *UserHandler) ListUsers(ctx context.Context, req *bookmgrv1.ListUsersRequest) (*bookmgrv1.ListUsersResponse, error) {
	result, err := h.userService.List(ctx, int(req.GetPageSize()), req.GetPageToken())
	if err != nil {
		if strings.Contains(err.Error(), "invalid page token") {
			return nil, status.Errorf(codes.InvalidArgument, "invalid page token")
		}
		return nil, status.Errorf(codes.Internal, "listing users: %v", err)
	}

	users := make([]*bookmgrv1.User, len(result.Users))
	for i, u := range result.Users {
		users[i] = entUserToProto(u)
	}

	return &bookmgrv1.ListUsersResponse{
		Users:         users,
		NextPageToken: result.NextPageToken,
	}, nil
}

func (h *UserHandler) GetUser(ctx context.Context, req *bookmgrv1.GetUserRequest) (*bookmgrv1.GetUserResponse, error) {
	id, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user id")
	}

	u, err := h.userService.GetByID(ctx, id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			return nil, status.Errorf(codes.NotFound, "user not found")
		}
		return nil, status.Errorf(codes.Internal, "getting user: %v", err)
	}

	return &bookmgrv1.GetUserResponse{User: entUserToProto(u)}, nil
}

func (h *UserHandler) UpdateUser(ctx context.Context, req *bookmgrv1.UpdateUserRequest) (*bookmgrv1.UpdateUserResponse, error) {
	if req.GetUser() == nil {
		return nil, status.Errorf(codes.InvalidArgument, "user is required")
	}

	id, err := uuid.Parse(req.GetUser().GetId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user id")
	}

	fields := service.UpdateFields{}
	mask := req.GetUpdateMask()
	if mask == nil || len(mask.GetPaths()) == 0 {
		return nil, status.Errorf(codes.InvalidArgument, "update_mask is required")
	}

	for _, path := range mask.GetPaths() {
		switch path {
		case "username":
			v := req.GetUser().GetUsername()
			fields.Username = &v
		case "email":
			v := req.GetUser().GetEmail()
			fields.Email = &v
		case "role":
			r := protoRoleToEnt(req.GetUser().GetRole())
			fields.Role = &r
		case "password":
			v := req.GetPassword()
			if v == "" {
				return nil, status.Errorf(codes.InvalidArgument, "password is required when updating password")
			}
			fields.Password = &v
		default:
			return nil, status.Errorf(codes.InvalidArgument, "unsupported field: %s", path)
		}
	}

	u, err := h.userService.Update(ctx, id, fields)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			return nil, status.Errorf(codes.NotFound, "user not found")
		}
		return nil, status.Errorf(codes.Internal, "updating user: %v", err)
	}

	return &bookmgrv1.UpdateUserResponse{User: entUserToProto(u)}, nil
}

func (h *UserHandler) DeleteUser(ctx context.Context, req *bookmgrv1.DeleteUserRequest) (*bookmgrv1.DeleteUserResponse, error) {
	id, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user id")
	}

	var callerID uuid.UUID
	if claims, ok := middleware.ClaimsFromContext(ctx); ok {
		callerID, _ = uuid.Parse(claims.Subject)
	}

	if err := h.userService.Delete(ctx, id, callerID); err != nil {
		if strings.Contains(err.Error(), "cannot delete yourself") {
			return nil, status.Errorf(codes.FailedPrecondition, "cannot delete yourself")
		}
		if strings.Contains(err.Error(), "not found") {
			return nil, status.Errorf(codes.NotFound, "user not found")
		}
		return nil, status.Errorf(codes.Internal, "deleting user: %v", err)
	}

	return &bookmgrv1.DeleteUserResponse{}, nil
}

func entUserToProto(u *ent.User) *bookmgrv1.User {
	return &bookmgrv1.User{
		Id:         u.ID.String(),
		Username:   u.Username,
		Email:      u.Email,
		Role:       entRoleToProto(u.Role),
		CreateTime: timestamppb.New(u.CreatedAt),
		UpdateTime: timestamppb.New(u.UpdatedAt),
	}
}

func protoRoleToEnt(r bookmgrv1.Role) user.Role {
	switch r {
	case bookmgrv1.Role_ROLE_ADMIN:
		return user.RoleAdmin
	default:
		return user.RoleUser
	}
}
