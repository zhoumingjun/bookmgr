package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"github.com/zhoumingjun/bookmgr/backend/ent"
	"github.com/zhoumingjun/bookmgr/backend/ent/bookfeedback"
)

// BookFeedbackRepository handles data access for BookFeedback entities.
type BookFeedbackRepository struct {
	client *ent.Client
}

// NewBookFeedbackRepository creates a new BookFeedbackRepository.
func NewBookFeedbackRepository(client *ent.Client) *BookFeedbackRepository {
	return &BookFeedbackRepository{client: client}
}

// CreateFeedbackParams holds fields for creating a feedback record.
type CreateFeedbackParams struct {
	UserID           uuid.UUID
	BookID           uuid.UUID
	FeedbackType     string
	DifficultyRating *int
	UseScenario      *string
}

// Create creates a new feedback record. Returns existing if same user/book/type combo exists.
func (r *BookFeedbackRepository) Create(ctx context.Context, params CreateFeedbackParams) (*ent.BookFeedback, error) {
	fb := r.client.BookFeedback.Create().
		SetUserID(params.UserID).
		SetBookID(params.BookID).
		SetFeedbackType(params.FeedbackType)

	switch params.FeedbackType {
	case "difficulty_rating":
		if params.DifficultyRating != nil {
			fb.SetDifficultyRating(*params.DifficultyRating)
		}
	case "use_scenario":
		if params.UseScenario != nil {
			fb.SetUseScenario(*params.UseScenario)
		}
	}

	feedback, err := fb.Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("creating feedback: %w", err)
	}
	return feedback, nil
}

// Upsert creates or updates a feedback record based on (user_id, book_id, feedback_type) uniqueness.
func (r *BookFeedbackRepository) Upsert(ctx context.Context, params CreateFeedbackParams) (*ent.BookFeedback, error) {
	// Check if exists
	existing, err := r.client.BookFeedback.Query().
		Where(bookfeedback.UserIDEQ(params.UserID)).
		Where(bookfeedback.BookIDEQ(params.BookID)).
		Where(bookfeedback.FeedbackTypeEQ(params.FeedbackType)).
		Only(ctx)
	if err == nil {
		// Update existing
		update := existing.Update()
		switch params.FeedbackType {
		case "difficulty_rating":
			if params.DifficultyRating != nil {
				update.SetDifficultyRating(*params.DifficultyRating)
			}
		case "use_scenario":
			if params.UseScenario != nil {
				update.SetUseScenario(*params.UseScenario)
			}
		}
		updated, err := update.Save(ctx)
		if err != nil {
			return nil, fmt.Errorf("updating feedback: %w", err)
		}
		return updated, nil
	}

	// Create new
	return r.Create(ctx, params)
}

// Delete removes a feedback record.
func (r *BookFeedbackRepository) Delete(ctx context.Context, userID, feedbackID uuid.UUID) error {
	_, err := r.client.BookFeedback.Delete().
		Where(bookfeedback.ID(feedbackID)).
		Where(bookfeedback.UserIDEQ(userID)).
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("deleting feedback: %w", err)
	}
	return nil
}

// GetByUserID returns all feedback for a user with pagination.
func (r *BookFeedbackRepository) GetByUserID(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*ent.BookFeedback, int, error) {
	total, err := r.client.BookFeedback.Query().
		Where(bookfeedback.UserIDEQ(userID)).
		Count(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("counting feedbacks: %w", err)
	}

	feedbacks, err := r.client.BookFeedback.Query().
		Where(bookfeedback.UserIDEQ(userID)).
		WithBook().
		Order(ent.Desc(bookfeedback.FieldCreatedAt)).
		Offset(offset).
		Limit(limit).
		All(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("listing feedbacks: %w", err)
	}

	return feedbacks, total, nil
}

// GetByBookID returns all feedback for a book.
func (r *BookFeedbackRepository) GetByBookID(ctx context.Context, bookID uuid.UUID) ([]*ent.BookFeedback, error) {
	feedbacks, err := r.client.BookFeedback.Query().
		Where(bookfeedback.BookIDEQ(bookID)).
		Order(ent.Desc(bookfeedback.FieldCreatedAt)).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("listing book feedbacks: %w", err)
	}
	return feedbacks, nil
}

// GetBookStats returns aggregated statistics for a book.
func (r *BookFeedbackRepository) GetBookStats(ctx context.Context, bookID uuid.UUID) (favoriteCount, readCompleteCount int, avgDifficulty float64, err error) {
	favCount, err := r.client.BookFavorite.Query().
		Where(bookfavorite.BookIDEQ(bookID)).
		Count(ctx)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("counting favorites: %w", err)
	}

	completeCount, err := r.client.BookFeedback.Query().
		Where(bookfeedback.BookIDEQ(bookID)).
		Where(bookfeedback.FeedbackTypeEQ("read_complete")).
		Count(ctx)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("counting read_complete: %w", err)
	}

	// Calculate average difficulty rating
	var sum, cnt int
	diffs, err := r.client.BookFeedback.Query().
		Where(bookfeedback.BookIDEQ(bookID)).
		Where(bookfeedback.FeedbackTypeEQ("difficulty_rating")).
		All(ctx)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("querying difficulty ratings: %w", err)
	}
	for _, d := range diffs {
		if d.DifficultyRating > 0 {
			sum += d.DifficultyRating
			cnt++
		}
	}
	var avg float64
	if cnt > 0 {
		avg = float64(sum) / float64(cnt)
	}

	return favCount, completeCount, avg, nil
}

// BookStats holds aggregated statistics for a book.
type BookStats struct {
	FavoriteCount    int
	ReadCompleteCount int
	AvgDifficulty    float64
}
