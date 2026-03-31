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

// ReviewHandler implements the gRPC ReviewServiceServer.
type ReviewHandler struct {
	bookmgrv1.UnimplementedReviewServiceServer
	reviewService *service.BookReviewService
}

// NewReviewHandler creates a new ReviewHandler.
func NewReviewHandler(reviewService *service.BookReviewService) *ReviewHandler {
	return &ReviewHandler{reviewService: reviewService}
}

func (h *ReviewHandler) SubmitForReview(ctx context.Context, req *bookmgrv1.SubmitForReviewRequest) (*bookmgrv1.SubmitForReviewResponse, error) {
	claims, ok := middleware.ClaimsFromContext(ctx)
	if !ok {
		return nil, status.Errorf(codes.Unauthenticated, "authentication required")
	}

	bookID, err := uuid.Parse(req.GetBookId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid book id")
	}

	userID, _ := uuid.Parse(claims.Subject)
	result, err := h.reviewService.SubmitForReview(ctx, bookID, userID)
	if err != nil {
		return nil, grpcReviewError(err)
	}

	return &bookmgrv1.SubmitForReviewResponse{
		Book:   nil,
		Review: entReviewToProto(result.Review),
	}, nil
}

func (h *ReviewHandler) ApproveBook(ctx context.Context, req *bookmgrv1.ApproveBookRequest) (*bookmgrv1.ApproveBookResponse, error) {
	claims, ok := middleware.ClaimsFromContext(ctx)
	if !ok || (claims.Role != "admin" && claims.Role != "super_admin") {
		return nil, status.Errorf(codes.PermissionDenied, "admin role required")
	}

	bookID, err := uuid.Parse(req.GetBookId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid book id")
	}

	reviewerID, _ := uuid.Parse(claims.Subject)
	result, err := h.reviewService.ApproveBook(ctx, bookID, reviewerID)
	if err != nil {
		return nil, grpcReviewError(err)
	}

	return &bookmgrv1.ApproveBookResponse{
		Book:   nil,
		Review: entReviewToProto(result.Review),
	}, nil
}

func (h *ReviewHandler) RejectBook(ctx context.Context, req *bookmgrv1.RejectBookRequest) (*bookmgrv1.RejectBookResponse, error) {
	claims, ok := middleware.ClaimsFromContext(ctx)
	if !ok || (claims.Role != "admin" && claims.Role != "super_admin") {
		return nil, status.Errorf(codes.PermissionDenied, "admin role required")
	}

	bookID, err := uuid.Parse(req.GetBookId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid book id")
	}

	reviewerID, _ := uuid.Parse(claims.Subject)
	result, err := h.reviewService.RejectBook(ctx, bookID, reviewerID, req.GetReason())
	if err != nil {
		return nil, grpcReviewError(err)
	}

	return &bookmgrv1.RejectBookResponse{
		Book:   nil,
		Review: entReviewToProto(result.Review),
	}, nil
}

func (h *ReviewHandler) RecallReview(ctx context.Context, req *bookmgrv1.RecallReviewRequest) (*bookmgrv1.RecallReviewResponse, error) {
	claims, ok := middleware.ClaimsFromContext(ctx)
	if !ok {
		return nil, status.Errorf(codes.Unauthenticated, "authentication required")
	}

	bookID, err := uuid.Parse(req.GetBookId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid book id")
	}

	userID, _ := uuid.Parse(claims.Subject)
	result, err := h.reviewService.RecallReview(ctx, bookID, userID)
	if err != nil {
		return nil, grpcReviewError(err)
	}

	return &bookmgrv1.RecallReviewResponse{
		Book:   nil,
		Review: entReviewToProto(result.Review),
	}, nil
}

func (h *ReviewHandler) ListBookReviews(ctx context.Context, req *bookmgrv1.ListBookReviewsRequest) (*bookmgrv1.ListBookReviewsResponse, error) {
	_, ok := middleware.ClaimsFromContext(ctx)
	if !ok {
		return nil, status.Errorf(codes.Unauthenticated, "authentication required")
	}

	bookID, err := uuid.Parse(req.GetBookId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid book id")
	}

	reviews, err := h.reviewService.ListReviews(ctx, bookID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "listing reviews: %v", err)
	}

	pbReviews := make([]*bookmgrv1.BookReview, len(reviews))
	for i, r := range reviews {
		pbReviews[i] = entReviewToProto(r)
	}

	return &bookmgrv1.ListBookReviewsResponse{Reviews: pbReviews}, nil
}

func (h *ReviewHandler) ListPendingBooks(ctx context.Context, req *bookmgrv1.ListPendingBooksRequest) (*bookmgrv1.ListPendingBooksResponse, error) {
	claims, ok := middleware.ClaimsFromContext(ctx)
	if !ok || (claims.Role != "admin" && claims.Role != "super_admin") {
		return nil, status.Errorf(codes.PermissionDenied, "admin role required")
	}

	perPage := int(req.GetPageSize())
	if perPage <= 0 || perPage > 100 {
		perPage = 20
	}

	page := 1
	books, total, err := h.reviewService.ListPending(ctx, page, perPage)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "listing pending books: %v", err)
	}

	pbBooks := make([]*bookmgrv1.Book, len(books))
	for i, b := range books {
		pbBooks[i] = &bookmgrv1.Book{
			Id:        b.ID.String(),
			Title:     b.Title,
			Author:    b.Author,
			Status:    b.Status,
			ViewCount: int32(b.ViewCount),
		}
	}

	var nextToken string
	if total > perPage {
		nextToken = "next"
	}

	return &bookmgrv1.ListPendingBooksResponse{
		Books:         pbBooks,
		NextPageToken: nextToken,
	}, nil
}

// --- Helpers ---

func entReviewToProto(r *ent.BookReview) *bookmgrv1.BookReview {
	return &bookmgrv1.BookReview{
		Id:         r.ID.String(),
		BookId:     r.BookID.String(),
		ReviewerId: r.ReviewerID.String(),
		StatusFrom: r.StatusFrom,
		StatusTo:   r.StatusTo,
		Reason:     r.Reason,
		CreatedAt:  timestamppb.New(r.CreatedAt),
	}
}

func grpcReviewError(err error) error {
	switch {
	case strings.Contains(err.Error(), "invalid status"):
		return status.Errorf(codes.FailedPrecondition, "%v", err)
	case strings.Contains(err.Error(), "only book owner"):
		return status.Errorf(codes.PermissionDenied, "%v", err)
	case strings.Contains(err.Error(), "reason is required"):
		return status.Errorf(codes.InvalidArgument, "%v", err)
	case strings.Contains(err.Error(), "not pending"):
		return status.Errorf(codes.FailedPrecondition, "%v", err)
	default:
		return status.Errorf(codes.Internal, "%v", err)
	}
}
