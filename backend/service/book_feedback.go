package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"

	"github.com/zhoumingjun/bookmgr/backend/ent"
	"github.com/zhoumingjun/bookmgr/backend/repository"
)

// BookFeedbackService errors
var (
	ErrFeedbackNotFound          = errors.New("feedback not found")
	ErrInvalidDifficultyRating  = errors.New("difficulty rating must be between 1 and 5")
	ErrInvalidFeedbackType      = errors.New("invalid feedback type")
	ErrUseScenarioRequired      = errors.New("use scenario is required for use_scenario type")
	ErrDifficultyRatingRequired = errors.New("difficulty rating is required for difficulty_rating type")
)

// BookFeedbackService handles feedback business logic.
type BookFeedbackService struct {
	fbRepo   *repository.BookFeedbackRepository
	favRepo  *repository.BookFavoriteRepository
	bookRepo *repository.BookRepository
}

// NewBookFeedbackService creates a new BookFeedbackService.
func NewBookFeedbackService(fbRepo *repository.BookFeedbackRepository, favRepo *repository.BookFavoriteRepository, bookRepo *repository.BookRepository) *BookFeedbackService {
	return &BookFeedbackService{
		fbRepo:   fbRepo,
		favRepo:  favRepo,
		bookRepo: bookRepo,
	}
}

// SubmitFeedbackParams holds fields for submitting feedback.
type SubmitFeedbackParams struct {
	UserID           uuid.UUID
	BookID           uuid.UUID
	FeedbackType     string
	DifficultyRating *int
	UseScenario      *string
}

// SubmitFeedback submits or updates a feedback record.
func (s *BookFeedbackService) SubmitFeedback(ctx context.Context, params SubmitFeedbackParams) (*ent.BookFeedback, error) {
	// Validate book exists
	_, err := s.bookRepo.GetByID(ctx, params.BookID)
	if err != nil {
		return nil, fmt.Errorf("book not found: %w", err)
	}

	// Validate feedback type
	switch params.FeedbackType {
	case "read_start", "read_complete":
		// No extra validation needed
	case "difficulty_rating":
		if params.DifficultyRating == nil {
			return nil, ErrDifficultyRatingRequired
		}
		if *params.DifficultyRating < 1 || *params.DifficultyRating > 5 {
			return nil, ErrInvalidDifficultyRating
		}
	case "use_scenario":
		if params.UseScenario == nil || *params.UseScenario == "" {
			return nil, ErrUseScenarioRequired
		}
	default:
		return nil, ErrInvalidFeedbackType
	}

	// Auto-favorite the book when submitting feedback
	s.favRepo.Create(ctx, params.UserID, params.BookID)

	fb, err := s.fbRepo.Upsert(ctx, repository.CreateFeedbackParams{
		UserID:           params.UserID,
		BookID:           params.BookID,
		FeedbackType:     params.FeedbackType,
		DifficultyRating: params.DifficultyRating,
		UseScenario:      params.UseScenario,
	})
	if err != nil {
		return nil, fmt.Errorf("submitting feedback: %w", err)
	}

	return fb, nil
}

// DeleteFeedback deletes a feedback record.
func (s *BookFeedbackService) DeleteFeedback(ctx context.Context, userID, feedbackID uuid.UUID) error {
	err := s.fbRepo.Delete(ctx, userID, feedbackID)
	if err != nil {
		return fmt.Errorf("deleting feedback: %w", err)
	}
	return nil
}

// ListUserFeedback returns all feedback for a user.
func (s *BookFeedbackService) ListUserFeedback(ctx context.Context, userID uuid.UUID, page, perPage int) ([]*ent.BookFeedback, int, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	offset := (page - 1) * perPage
	return s.fbRepo.GetByUserID(ctx, userID, perPage, offset)
}

// GetBookFeedback returns all feedback for a book.
func (s *BookFeedbackService) GetBookFeedback(ctx context.Context, bookID uuid.UUID) ([]*ent.BookFeedback, error) {
	return s.fbRepo.GetByBookID(ctx, bookID)
}

// GetBookStats returns aggregated statistics for a book.
func (s *BookFeedbackService) GetBookStats(ctx context.Context, bookID uuid.UUID) (*repository.BookStats, error) {
	favCount, completeCount, avgDifficulty, err := s.fbRepo.GetBookStats(ctx, bookID)
	if err != nil {
		return nil, fmt.Errorf("getting book stats: %w", err)
	}
	return &repository.BookStats{
		FavoriteCount:      favCount,
		ReadCompleteCount:   completeCount,
		AvgDifficulty:       avgDifficulty,
	}, nil
}
