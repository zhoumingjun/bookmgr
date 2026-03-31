package handler

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/zhoumingjun/bookmgr/backend/ent"
	"github.com/zhoumingjun/bookmgr/backend/middleware"
	"github.com/zhoumingjun/bookmgr/backend/service"
	bookmgrv1 "github.com/zhoumingjun/bookmgr/gen/api/bookmgr/v1"
)

// FeedbackHandler implements feedback-related gRPC handlers on BookService.
type FeedbackHandler struct {
	bookmgrv1.UnimplementedBookServiceServer
	fbService *service.BookFeedbackService
}

// NewFeedbackHandler creates a new FeedbackHandler.
func NewFeedbackHandler(fbService *service.BookFeedbackService) *FeedbackHandler {
	return &FeedbackHandler{fbService: fbService}
}

func (h *FeedbackHandler) SubmitFeedback(ctx context.Context, req *bookmgrv1.SubmitFeedbackRequest) (*bookmgrv1.SubmitFeedbackResponse, error) {
	claims, ok := middleware.ClaimsFromContext(ctx)
	if !ok {
		return nil, status.Errorf(codes.Unauthenticated, "authentication required")
	}

	bookID, err := uuid.Parse(req.GetBookId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid book id")
	}

	userID, _ := uuid.Parse(claims.Subject)

	params := service.SubmitFeedbackParams{
		UserID:       userID,
		BookID:       bookID,
		FeedbackType: req.GetFeedbackType(),
	}

	if req.GetFeedbackType() == "difficulty_rating" {
		rating := int(req.GetDifficultyRating())
		params.DifficultyRating = &rating
	}
	if req.GetFeedbackType() == "use_scenario" {
		scenario := req.GetUseScenario()
		params.UseScenario = &scenario
	}

	fb, err := h.fbService.SubmitFeedback(ctx, params)
	if err != nil {
		switch {
		case strings.Contains(err.Error(), "difficulty rating"):
			return nil, status.Errorf(codes.InvalidArgument, "%v", err)
		case strings.Contains(err.Error(), "invalid feedback"):
			return nil, status.Errorf(codes.InvalidArgument, "%v", err)
		case strings.Contains(err.Error(), "use scenario"):
			return nil, status.Errorf(codes.InvalidArgument, "%v", err)
		case strings.Contains(err.Error(), "not found"):
			return nil, status.Errorf(codes.NotFound, "book not found")
		default:
			return nil, status.Errorf(codes.Internal, "submitting feedback: %v", err)
		}
	}

	return &bookmgrv1.SubmitFeedbackResponse{
		Feedback: entFeedbackToProto(fb),
	}, nil
}

func (h *FeedbackHandler) GetFeedbackStats(ctx context.Context, req *bookmgrv1.GetFeedbackStatsRequest) (*bookmgrv1.GetFeedbackStatsResponse, error) {
	_, ok := middleware.ClaimsFromContext(ctx)
	if !ok {
		return nil, status.Errorf(codes.Unauthenticated, "authentication required")
	}

	bookID, err := uuid.Parse(req.GetBookId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid book id")
	}

	stats, err := h.fbService.GetBookStats(ctx, bookID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "getting feedback stats: %v", err)
	}

	return &bookmgrv1.GetFeedbackStatsResponse{
		FavoriteCount:        int32(stats.FavoriteCount),
		ReadCompleteCount:    int32(stats.ReadCompleteCount),
		AvgDifficultyRating:  stats.AvgDifficulty,
	}, nil
}

// entFeedbackToProto converts ent.BookFeedback to proto.
func entFeedbackToProto(fb *ent.BookFeedback) *bookmgrv1.BookFeedback {
	return &bookmgrv1.BookFeedback{
		Id:               fb.ID.String(),
		BookId:           fb.BookID.String(),
		UserId:           fb.UserID.String(),
		FeedbackType:    string(fb.FeedbackType),
		DifficultyRating: int32(fb.DifficultyRating),
		UseScenario:     fb.UseScenario,
		CreatedAt:        timestamppb.New(fb.CreatedAt),
	}
}
