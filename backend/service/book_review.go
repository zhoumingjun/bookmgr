package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"

	"github.com/zhoumingjun/bookmgr/backend/ent"
	"github.com/zhoumingjun/bookmgr/backend/repository"
)

// ReviewService errors
var (
	ErrInvalidStatusTransition = errors.New("invalid status transition")
	ErrNotBookOwner           = errors.New("only book owner can perform this action")
	ErrReviewReasonRequired   = errors.New("rejection reason is required")
	ErrNotPending            = errors.New("book is not in pending status")
	ErrNotOwnerOrReviewer    = errors.New("only book owner or admin can perform this action")
)

// BookReviewService handles book review business logic.
type BookReviewService struct {
	bookRepo    *repository.BookRepository
	reviewRepo  *repository.BookReviewRepository
}

// NewBookReviewService creates a new BookReviewService.
func NewBookReviewService(bookRepo *repository.BookRepository, reviewRepo *repository.BookReviewRepository) *BookReviewService {
	return &BookReviewService{
		bookRepo:   bookRepo,
		reviewRepo: reviewRepo,
	}
}

// ReviewResult holds the result of a review action.
type ReviewResult struct {
	Book   *ent.Book
	Review *ent.BookReview
}

// SubmitForReview submits a draft book for review (draft -> pending).
func (s *BookReviewService) SubmitForReview(ctx context.Context, bookID, userID uuid.UUID) (*ReviewResult, error) {
	b, err := s.bookRepo.GetByID(ctx, bookID)
	if err != nil {
		return nil, fmt.Errorf("getting book: %w", err)
	}

	// Only book owner can submit
	if b.UploaderID != userID {
		return nil, ErrNotBookOwner
	}

	// Only draft can be submitted
	if b.Status != "draft" {
		return nil, ErrInvalidStatusTransition
	}

	// Update status to pending
	b, err = s.bookRepo.Update(ctx, bookID, repository.UpdateBookParams{Status: strPtr("pending")})
	if err != nil {
		return nil, fmt.Errorf("updating book status: %w", err)
	}

	// Create review record
	review, err := s.reviewRepo.Create(ctx, repository.CreateReviewParams{
		BookID:     bookID,
		ReviewerID: userID,
		StatusFrom: "draft",
		StatusTo:   "pending",
		Reason:     "",
	})
	if err != nil {
		return nil, fmt.Errorf("creating review record: %w", err)
	}

	return &ReviewResult{Book: b, Review: review}, nil
}

// ApproveBook approves a pending book (pending -> approved).
func (s *BookReviewService) ApproveBook(ctx context.Context, bookID, reviewerID uuid.UUID) (*ReviewResult, error) {
	b, err := s.bookRepo.GetByID(ctx, bookID)
	if err != nil {
		return nil, fmt.Errorf("getting book: %w", err)
	}

	if b.Status != "pending" {
		return nil, ErrNotPending
	}

	b, err = s.bookRepo.Update(ctx, bookID, repository.UpdateBookParams{Status: strPtr("approved")})
	if err != nil {
		return nil, fmt.Errorf("updating book status: %w", err)
	}

	review, err := s.reviewRepo.Create(ctx, repository.CreateReviewParams{
		BookID:     bookID,
		ReviewerID: reviewerID,
		StatusFrom: "pending",
		StatusTo:   "approved",
		Reason:     "",
	})
	if err != nil {
		return nil, fmt.Errorf("creating review record: %w", err)
	}

	return &ReviewResult{Book: b, Review: review}, nil
}

// RejectBook rejects a pending book (pending -> rejected).
func (s *BookReviewService) RejectBook(ctx context.Context, bookID, reviewerID uuid.UUID, reason string) (*ReviewResult, error) {
	if reason == "" {
		return nil, ErrReviewReasonRequired
	}

	b, err := s.bookRepo.GetByID(ctx, bookID)
	if err != nil {
		return nil, fmt.Errorf("getting book: %w", err)
	}

	if b.Status != "pending" {
		return nil, ErrNotPending
	}

	b, err = s.bookRepo.Update(ctx, bookID, repository.UpdateBookParams{Status: strPtr("rejected")})
	if err != nil {
		return nil, fmt.Errorf("updating book status: %w", err)
	}

	review, err := s.reviewRepo.Create(ctx, repository.CreateReviewParams{
		BookID:     bookID,
		ReviewerID: reviewerID,
		StatusFrom: "pending",
		StatusTo:   "rejected",
		Reason:     reason,
	})
	if err != nil {
		return nil, fmt.Errorf("creating review record: %w", err)
	}

	return &ReviewResult{Book: b, Review: review}, nil
}

// RecallReview recalls a pending book back to draft (pending -> draft).
func (s *BookReviewService) RecallReview(ctx context.Context, bookID, userID uuid.UUID) (*ReviewResult, error) {
	b, err := s.bookRepo.GetByID(ctx, bookID)
	if err != nil {
		return nil, fmt.Errorf("getting book: %w", err)
	}

	if b.Status != "pending" {
		return nil, ErrNotPending
	}

	// Only book owner can recall
	if b.UploaderID != userID {
		return nil, ErrNotBookOwner
	}

	b, err = s.bookRepo.Update(ctx, bookID, repository.UpdateBookParams{Status: strPtr("draft")})
	if err != nil {
		return nil, fmt.Errorf("updating book status: %w", err)
	}

	review, err := s.reviewRepo.Create(ctx, repository.CreateReviewParams{
		BookID:     bookID,
		ReviewerID: userID,
		StatusFrom: "pending",
		StatusTo:   "draft",
		Reason:     "",
	})
	if err != nil {
		return nil, fmt.Errorf("creating review record: %w", err)
	}

	return &ReviewResult{Book: b, Review: review}, nil
}

// ListReviews returns the review history for a book.
func (s *BookReviewService) ListReviews(ctx context.Context, bookID uuid.UUID) ([]*ent.BookReview, error) {
	return s.reviewRepo.ListByBookID(ctx, bookID)
}

// ListPending returns all pending books.
func (s *BookReviewService) ListPending(ctx context.Context, page, perPage int) ([]*ent.Book, int, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	offset := (page - 1) * perPage
	return s.reviewRepo.ListPending(ctx, perPage, offset)
}

func strPtr(s string) *string { return &s }
