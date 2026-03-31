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
	userService   *service.UserService
	favService    *service.BookFavoriteService
	fbService     *service.BookFeedbackService
}

// NewUserHandler creates a new UserHandler.
func NewUserHandler(userService *service.UserService, favService *service.BookFavoriteService, fbService *service.BookFeedbackService) *UserHandler {
	return &UserHandler{
		userService:  userService,
		favService:   favService,
		fbService:    fbService,
	}
}

// CreateUser creates a new user. Requires admin/super_admin role (enforced by middleware).
func (h *UserHandler) CreateUser(ctx context.Context, req *bookmgrv1.CreateUserRequest) (*bookmgrv1.CreateUserResponse, error) {
	if req.GetUsername() == "" {
		return nil, status.Errorf(codes.InvalidArgument, "username is required")
	}
	if req.GetEmail() == "" {
		return nil, status.Errorf(codes.InvalidArgument, "email is required")
	}
	if req.GetRole() == bookmgrv1.Role_ROLE_UNSPECIFIED {
		return nil, status.Errorf(codes.InvalidArgument, "role is required")
	}

	result, err := h.userService.Create(ctx, service.CreateFields{
		Username: req.GetUsername(),
		Email:    req.GetEmail(),
		Role:     protoRoleToEnt(req.GetRole()),
		Password: req.GetPassword(),
	})
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") {
			return nil, status.Errorf(codes.AlreadyExists, "user already exists")
		}
		return nil, status.Errorf(codes.Internal, "creating user: %v", err)
	}

	resp := &bookmgrv1.CreateUserResponse{
		User: entUserToProto(result.User),
	}
	if result.GeneratedPassword != "" {
		resp.GeneratedPassword = result.GeneratedPassword
	}
	return resp, nil
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

func (h *UserHandler) ListMyFavorites(ctx context.Context, req *bookmgrv1.ListMyFavoritesRequest) (*bookmgrv1.ListMyFavoritesResponse, error) {
	claims, ok := middleware.ClaimsFromContext(ctx)
	if !ok {
		return nil, status.Errorf(codes.Unauthenticated, "authentication required")
	}

	userID, _ := uuid.Parse(claims.Subject)

	perPage := int(req.GetPageSize())
	if perPage <= 0 || perPage > 100 {
		perPage = 20
	}

	favorites, total, err := h.favService.ListFavorites(ctx, userID, 1, perPage)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "listing favorites: %v", err)
	}

	pbFavorites := make([]*bookmgrv1.FavoriteBook, len(favorites))
	for i, fav := range favorites {
		pbFav := &bookmgrv1.FavoriteBook{
			Id:        fav.ID.String(),
			CreatedAt: timestamppb.New(fav.CreatedAt),
		}
		books := fav.Edges.Book
		if len(books) > 0 && books[0] != nil {
			pbFav.Book = entBookToProto(books[0])
		}
		pbFavorites[i] = pbFav
	}

	var nextToken string
	if total > perPage {
		nextToken = "next"
	}

	return &bookmgrv1.ListMyFavoritesResponse{
		Favorites:      pbFavorites,
		NextPageToken:  nextToken,
	}, nil
}

func (h *UserHandler) ListMyFeedback(ctx context.Context, req *bookmgrv1.ListMyFeedbackRequest) (*bookmgrv1.ListMyFeedbackResponse, error) {
	claims, ok := middleware.ClaimsFromContext(ctx)
	if !ok {
		return nil, status.Errorf(codes.Unauthenticated, "authentication required")
	}

	userID, _ := uuid.Parse(claims.Subject)

	perPage := int(req.GetPageSize())
	if perPage <= 0 || perPage > 100 {
		perPage = 20
	}

	feedbacks, total, err := h.fbService.ListUserFeedback(ctx, userID, 1, perPage)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "listing feedback: %v", err)
	}

	pbFeedbacks := make([]*bookmgrv1.BookFeedback, len(feedbacks))
	for i, fb := range feedbacks {
		pbFeedbacks[i] = entFeedbackToProto(fb)
	}

	var nextToken string
	if total > perPage {
		nextToken = "next"
	}

	return &bookmgrv1.ListMyFeedbackResponse{
		Feedbacks:     pbFeedbacks,
		NextPageToken: nextToken,
	}, nil
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
	case bookmgrv1.Role_ROLE_SUPER_ADMIN:
		return user.RoleSuperAdmin
	case bookmgrv1.Role_ROLE_ADMIN:
		return user.RoleAdmin
	case bookmgrv1.Role_ROLE_TEACHER:
		return user.RoleTeacher
	case bookmgrv1.Role_ROLE_PARENT:
		return user.RoleParent
	default:
		return user.RoleTeacher
	}
}

func entRoleToProto(r user.Role) bookmgrv1.Role {
	switch r {
	case user.RoleSuperAdmin:
		return bookmgrv1.Role_ROLE_SUPER_ADMIN
	case user.RoleAdmin:
		return bookmgrv1.Role_ROLE_ADMIN
	case user.RoleTeacher:
		return bookmgrv1.Role_ROLE_TEACHER
	case user.RoleParent:
		return bookmgrv1.Role_ROLE_PARENT
	default:
		return bookmgrv1.Role_ROLE_TEACHER
	}
}
