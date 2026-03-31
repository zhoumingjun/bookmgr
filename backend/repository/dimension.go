package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"github.com/zhoumingjun/bookmgr/backend/ent"
	"github.com/zhoumingjun/bookmgr/backend/ent/bookdimension"
	"github.com/zhoumingjun/bookmgr/backend/ent/dimension"
)

// DimensionRepository handles dimension data access.
type DimensionRepository struct {
	client *ent.Client
}

// NewDimensionRepository creates a new DimensionRepository.
func NewDimensionRepository(client *ent.Client) *DimensionRepository {
	return &DimensionRepository{client: client}
}

// ListAll returns all dimensions.
func (r *DimensionRepository) ListAll(ctx context.Context) ([]*ent.Dimension, error) {
	return r.client.Dimension.Query().
		WithParent().
		Order(ent.Asc(dimension.FieldSortOrder)).
		All(ctx)
}

// ListTopLevel returns top-level dimensions (no parent).
func (r *DimensionRepository) ListTopLevel(ctx context.Context) ([]*ent.Dimension, error) {
	return r.client.Dimension.Query().
		Where(dimension.Not(dimension.HasParent())).
		Order(ent.Asc(dimension.FieldSortOrder)).
		All(ctx)
}

// ListByParentSlug returns children of a parent dimension.
func (r *DimensionRepository) ListByParentSlug(ctx context.Context, parentSlug string) ([]*ent.Dimension, error) {
	parent, err := r.client.Dimension.Query().
		Where(dimension.Slug(parentSlug)).
		Only(ctx)
	if err != nil {
		return nil, fmt.Errorf("parent dimension not found: %w", err)
	}
	return r.client.Dimension.Query().
		Where(dimension.HasParentWith(dimension.ID(parent.ID))).
		Order(ent.Asc(dimension.FieldSortOrder)).
		All(ctx)
}

// GetBySlug returns a dimension by slug.
func (r *DimensionRepository) GetBySlug(ctx context.Context, slug string) (*ent.Dimension, error) {
	return r.client.Dimension.Query().
		Where(dimension.Slug(slug)).
		Only(ctx)
}

// GetByID returns a dimension by ID.
func (r *DimensionRepository) GetByID(ctx context.Context, id uuid.UUID) (*ent.Dimension, error) {
	return r.client.Dimension.Get(ctx, id)
}

// Create creates a new dimension.
func (r *DimensionRepository) Create(ctx context.Context, name, slug, description string, sortOrder int, parentID string) (*ent.Dimension, error) {
	create := r.client.Dimension.Create().
		SetName(name).
		SetSlug(slug).
		SetSortOrder(sortOrder)
	if description != "" {
		create.SetDescription(description)
	}
	if parentID != "" {
		uid, err := uuid.Parse(parentID)
		if err != nil {
			return nil, fmt.Errorf("invalid parent id: %w", err)
		}
		create.SetParentID(uid)
	}
	return create.Save(ctx)
}

// Update updates an existing dimension.
func (r *DimensionRepository) Update(ctx context.Context, slug string, name, description string, sortOrder int) (*ent.Dimension, error) {
	d, err := r.GetBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	return d.Update().
		SetName(name).
		SetDescription(description).
		SetSortOrder(sortOrder).
		Save(ctx)
}

// Delete deletes a dimension by slug. Fails if has children or associated books.
func (r *DimensionRepository) Delete(ctx context.Context, slug string) error {
	d, err := r.GetBySlug(ctx, slug)
	if err != nil {
		return fmt.Errorf("dimension not found: %w", err)
	}

	// Check for children
	children, err := r.client.Dimension.Query().
		Where(dimension.HasParentWith(dimension.ID(d.ID))).
		Count(ctx)
	if err != nil {
		return err
	}
	if children > 0 {
		return fmt.Errorf("dimension has %d subcategories, delete them first", children)
	}

	// Check for associated books
	bookCount, err := r.client.BookDimension.Query().
		Where(bookdimension.HasDimensionWith(dimension.ID(d.ID))).
		Count(ctx)
	if err != nil {
		return err
	}
	if bookCount > 0 {
		return fmt.Errorf("dimension is associated with %d books, remove associations first", bookCount)
	}

	return r.client.Dimension.DeleteOne(d).Exec(ctx)
}

// SlugExists checks if a slug already exists.
func (r *DimensionRepository) SlugExists(ctx context.Context, slug string) (bool, error) {
	count, err := r.client.Dimension.Query().
		Where(dimension.Slug(slug)).
		Count(ctx)
	return count > 0, err
}
