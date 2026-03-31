package handler

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/zhoumingjun/bookmgr/backend/middleware"
	"github.com/zhoumingjun/bookmgr/backend/service"
	bookmgrv1 "github.com/zhoumingjun/bookmgr/gen/api/bookmgr/v1"
)

// FavoriteHandler implements favorite-related gRPC handlers on BookService.
type FavoriteHandler struct {
	bookmgrv1.UnimplementedBookServiceServer
	favService *service.BookFavoriteService
}

// NewFavoriteHandler creates a new FavoriteHandler.
func NewFavoriteHandler(favService *service.BookFavoriteService) *FavoriteHandler {
	return &FavoriteHandler{favService: favService}
}

func (h *FavoriteHandler) FavoriteBook(ctx context.Context, req *bookmgrv1.FavoriteBookRequest) (*bookmgrv1.FavoriteBookResponse, error) {
	claims, ok := middleware.ClaimsFromContext(ctx)
	if !ok {
		return nil, status.Errorf(codes.Unauthenticated, "authentication required")
	}

	bookID, err := uuid.Parse(req.GetBookId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid book id")
	}

	userID, _ := uuid.Parse(claims.Subject)
	result, err := h.favService.Favorite(ctx, userID, bookID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			return nil, status.Errorf(codes.NotFound, "book not found")
		}
		return nil, status.Errorf(codes.Internal, "favoriting book: %v", err)
	}

	return &bookmgrv1.FavoriteBookResponse{Favorited: result.Favorited}, nil
}

func (h *FavoriteHandler) UnfavoriteBook(ctx context.Context, req *bookmgrv1.UnfavoriteBookRequest) (*bookmgrv1.UnfavoriteBookResponse, error) {
	claims, ok := middleware.ClaimsFromContext(ctx)
	if !ok {
		return nil, status.Errorf(codes.Unauthenticated, "authentication required")
	}

	bookID, err := uuid.Parse(req.GetBookId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid book id")
	}

	userID, _ := uuid.Parse(claims.Subject)
	if err := h.favService.Unfavorite(ctx, userID, bookID); err != nil {
		if strings.Contains(err.Error(), "not found") {
			return nil, status.Errorf(codes.NotFound, "favorite not found")
		}
		return nil, status.Errorf(codes.Internal, "unfavoriting book: %v", err)
	}

	return &bookmgrv1.UnfavoriteBookResponse{}, nil
}

func (h *FavoriteHandler) GetFavorite(ctx context.Context, req *bookmgrv1.GetFavoriteRequest) (*bookmgrv1.GetFavoriteResponse, error) {
	claims, ok := middleware.ClaimsFromContext(ctx)
	if !ok {
		return nil, status.Errorf(codes.Unauthenticated, "authentication required")
	}

	bookID, err := uuid.Parse(req.GetBookId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid book id")
	}

	userID, _ := uuid.Parse(claims.Subject)
	isFav, err := h.favService.IsFavorited(ctx, userID, bookID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "checking favorite: %v", err)
	}

	return &bookmgrv1.GetFavoriteResponse{IsFavorited: isFav}, nil
}
