package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"github.com/zhoumingjun/bookmgr/backend/ent"
	"github.com/zhoumingjun/bookmgr/backend/ent/book"
	"github.com/zhoumingjun/bookmgr/backend/ent/bookdimension"
	"github.com/zhoumingjun/bookmgr/backend/ent/dimension"
)

type BookRepository struct {
	client *ent.Client
}

func NewBookRepository(client *ent.Client) *BookRepository {
	return &BookRepository{client: client}
}

// CreateParams holds all fields for creating a book.
type CreateBookParams struct {
	Title                string
	Author               string
	Description          string
	PageCount            int
	DurationMinutes      int
	CoreGoal             string
	CognitiveLevel       string
	ResourceType         string
	HasPrint             bool
	HasDigital           bool
	HasAudio             bool
	HasVideo             bool
	TeachingSuggestion   string
	ParentReadingGuide   string
	RecommendedAgeMin    int
	RecommendedAgeMax    int
	UploaderID           uuid.UUID
	DimensionSlugs       []string
}

func (r *BookRepository) Create(ctx context.Context, params CreateBookParams) (*ent.Book, error) {
	tx, err := r.client.Tx(ctx)
	if err != nil {
		return nil, fmt.Errorf("starting transaction: %w", err)
	}
	defer tx.Rollback()

	// Create book
	b, err := tx.Book.Create().
		SetTitle(params.Title).
		SetAuthor(params.Author).
		SetDescription(params.Description).
		SetPageCount(params.PageCount).
		SetDurationMinutes(params.DurationMinutes).
		SetCoreGoal(params.CoreGoal).
		SetCognitiveLevel(params.CognitiveLevel).
		SetResourceType(params.ResourceType).
		SetHasPrint(params.HasPrint).
		SetHasDigital(params.HasDigital).
		SetHasAudio(params.HasAudio).
		SetHasVideo(params.HasVideo).
		SetTeachingSuggestion(params.TeachingSuggestion).
		SetParentReadingGuide(params.ParentReadingGuide).
		SetRecommendedAgeMin(params.RecommendedAgeMin).
		SetRecommendedAgeMax(params.RecommendedAgeMax).
		SetUploaderID(params.UploaderID).
		Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("creating book: %w", err)
	}

	// Associate dimensions
	for i, slug := range params.DimensionSlugs {
		d, err := tx.Dimension.Query().Where(dimension.Slug(slug)).Only(ctx)
		if err != nil {
			return nil, fmt.Errorf("dimension '%s' not found: %w", slug, err)
		}
		isPrimary := i == 0
		_, err = tx.BookDimension.Create().
			AddBookIDs(b.ID).
			AddDimensionIDs(d.ID).
			SetIsPrimary(isPrimary).
			Save(ctx)
		if err != nil {
			return nil, fmt.Errorf("associating dimension '%s': %w", slug, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	// Reload with edges
	return r.GetByID(ctx, b.ID)
}

func (r *BookRepository) GetByID(ctx context.Context, id uuid.UUID) (*ent.Book, error) {
	b, err := r.client.Book.Get(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("getting book by id: %w", err)
	}
	return b, nil
}

// GetByIDWithDimensions returns a book with its associated dimensions eagerly loaded.
func (r *BookRepository) GetByIDWithDimensions(ctx context.Context, id uuid.UUID) (*ent.Book, error) {
	return r.client.Book.Query().
		Where(book.ID(id)).
		WithBookDimensions(func(bdq *ent.BookDimensionQuery) {
			bdq.WithDimension()
		}).
		Only(ctx)
}

type BookListResult struct {
	Books  []*ent.Book
	Total  int
	Page   int
	PerPage int
}

type ListBooksParams struct {
	Page          int
	PerPage       int
	DimensionSlug string
	Status        string
}

func (r *BookRepository) List(ctx context.Context, params ListBooksParams) (*BookListResult, error) {
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PerPage < 1 {
		params.PerPage = 20
	}
	offset := (params.Page - 1) * params.PerPage

	query := r.client.Book.Query()

	if params.DimensionSlug != "" {
		// Filter by dimension: find books that have this dimension slug
		query = query.Where(
			book.HasBookDimensionsWith(
				bookdimension.HasDimensionWith(dimension.Slug(params.DimensionSlug)),
			),
		)
	}

	if params.Status != "" {
		query = query.Where(book.Status(params.Status))
	}

	total, err := query.Count(ctx)
	if err != nil {
		return nil, fmt.Errorf("counting books: %w", err)
	}

	books, err := query.
		WithBookDimensions(func(bdq *ent.BookDimensionQuery) {
			bdq.WithDimension()
		}).
		Order(ent.Desc(book.FieldCreatedAt)).
		Offset(offset).
		Limit(params.PerPage).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("listing books: %w", err)
	}

	return &BookListResult{Books: books, Total: total, Page: params.Page, PerPage: params.PerPage}, nil
}

// UpdateBookParams holds fields for updating a book.
type UpdateBookParams struct {
	Title                *string
	Author               *string
	Description          *string
	PageCount            *int
	DurationMinutes       *int
	CoreGoal             *string
	CognitiveLevel       *string
	ResourceType         *string
	HasPrint             *bool
	HasDigital           *bool
	HasAudio             *bool
	HasVideo             *bool
	TeachingSuggestion   *string
	ParentReadingGuide   *string
	RecommendedAgeMin    *int
	RecommendedAgeMax    *int
	DimensionSlugs        []string
	Status               *string
	CoverImageURL        *string
}

func (r *BookRepository) Update(ctx context.Context, id uuid.UUID, params UpdateBookParams) (*ent.Book, error) {
	update := r.client.Book.UpdateOneID(id)

	if params.Title != nil {
		update = update.SetTitle(*params.Title)
	}
	if params.Author != nil {
		update = update.SetAuthor(*params.Author)
	}
	if params.Description != nil {
		update = update.SetDescription(*params.Description)
	}
	if params.PageCount != nil {
		update = update.SetPageCount(*params.PageCount)
	}
	if params.DurationMinutes != nil {
		update = update.SetDurationMinutes(*params.DurationMinutes)
	}
	if params.CoreGoal != nil {
		update = update.SetCoreGoal(*params.CoreGoal)
	}
	if params.CognitiveLevel != nil {
		update = update.SetCognitiveLevel(*params.CognitiveLevel)
	}
	if params.ResourceType != nil {
		update = update.SetResourceType(*params.ResourceType)
	}
	if params.HasPrint != nil {
		update = update.SetHasPrint(*params.HasPrint)
	}
	if params.HasDigital != nil {
		update = update.SetHasDigital(*params.HasDigital)
	}
	if params.HasAudio != nil {
		update = update.SetHasAudio(*params.HasAudio)
	}
	if params.HasVideo != nil {
		update = update.SetHasVideo(*params.HasVideo)
	}
	if params.TeachingSuggestion != nil {
		update = update.SetTeachingSuggestion(*params.TeachingSuggestion)
	}
	if params.ParentReadingGuide != nil {
		update = update.SetParentReadingGuide(*params.ParentReadingGuide)
	}
	if params.RecommendedAgeMin != nil {
		update = update.SetRecommendedAgeMin(*params.RecommendedAgeMin)
	}
	if params.RecommendedAgeMax != nil {
		update = update.SetRecommendedAgeMax(*params.RecommendedAgeMax)
	}
	if params.Status != nil {
		update = update.SetStatus(*params.Status)
	}
	if params.CoverImageURL != nil {
		update = update.SetCoverImageURL(*params.CoverImageURL)
	}

	// If dimension slugs are provided, update associations
	if len(params.DimensionSlugs) > 0 {
		tx, err := r.client.Tx(ctx)
		if err != nil {
			return nil, fmt.Errorf("starting transaction: %w", err)
		}
		defer tx.Rollback()

		// Remove existing associations
		_, err = tx.BookDimension.Delete().
			Where(bookdimension.HasBookWith(book.ID(id))).
			Exec(ctx)
		if err != nil {
			return nil, fmt.Errorf("removing old dimension associations: %w", err)
		}

		// Add new associations
		for i, slug := range params.DimensionSlugs {
			d, err := tx.Dimension.Query().Where(dimension.Slug(slug)).Only(ctx)
			if err != nil {
				return nil, fmt.Errorf("dimension '%s' not found: %w", slug, err)
			}
			isPrimary := i == 0
			_, err = tx.BookDimension.Create().
				AddBookIDs(id).
				AddDimensionIDs(d.ID).
				SetIsPrimary(isPrimary).
				Save(ctx)
			if err != nil {
				return nil, fmt.Errorf("associating dimension '%s': %w", slug, err)
			}
		}

		if err := tx.Commit(); err != nil {
			return nil, err
		}
	}

	b, err := update.Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("updating book: %w", err)
	}

	return b, nil
}

func (r *BookRepository) Delete(ctx context.Context, id uuid.UUID) error {
	tx, err := r.client.Tx(ctx)
	if err != nil {
		return fmt.Errorf("starting transaction: %w", err)
	}
	defer tx.Rollback()

	// Delete book-dimension associations
	_, err = tx.BookDimension.Delete().
		Where(bookdimension.HasBookWith(book.ID(id))).
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("deleting dimension associations: %w", err)
	}

	// Delete book
	err = tx.Book.DeleteOneID(id).Exec(ctx)
	if err != nil {
		return fmt.Errorf("deleting book: %w", err)
	}

	return tx.Commit()
}
