package service

import (
	"context"

	"github.com/zhoumingjun/bookmgr/backend/repository"
)

// DimensionService handles dimension business logic.
type DimensionService struct {
	repo *repository.DimensionRepository
}

// NewDimensionService creates a new DimensionService.
func NewDimensionService(repo *repository.DimensionRepository) *DimensionService {
	return &DimensionService{repo: repo}
}

// DimensionNode represents a dimension with its children.
type DimensionNode struct {
	ID          string
	Name        string
	Slug        string
	Description string
	SortOrder   int
	Children    []*DimensionNode
}

// ListDimensionTree returns all dimensions as a tree structure.
func (s *DimensionService) ListDimensionTree(ctx context.Context) ([]*DimensionNode, error) {
	all, err := s.repo.ListAll(ctx)
	if err != nil {
		return nil, err
	}

	// Build tree: find top-level first
	topLevel := make([]*DimensionNode, 0)
	nodeMap := make(map[string]*DimensionNode)

	// Create nodes
	for _, d := range all {
		node := &DimensionNode{
			ID:          d.ID.String(),
			Name:        d.Name,
			Slug:        d.Slug,
			Description: d.Description,
			SortOrder:   d.SortOrder,
			Children:    make([]*DimensionNode, 0),
		}
		nodeMap[d.ID.String()] = node
	}

	// Build tree: assign children to parents
	for _, d := range all {
		node := nodeMap[d.ID.String()]
		if d.Edges.Parent != nil {
			if parent, ok := nodeMap[d.Edges.Parent.ID.String()]; ok {
				parent.Children = append(parent.Children, node)
			}
		} else {
			topLevel = append(topLevel, node)
		}
	}

	return topLevel, nil
}

// GetBySlug returns a dimension by slug.
func (s *DimensionService) GetBySlug(ctx context.Context, slug string) (*DimensionNode, error) {
	d, err := s.repo.GetBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	return &DimensionNode{
		ID:          d.ID.String(),
		Name:        d.Name,
		Slug:        d.Slug,
		Description: d.Description,
		SortOrder:   d.SortOrder,
		Children:    make([]*DimensionNode, 0),
	}, nil
}

// Create creates a new dimension.
func (s *DimensionService) Create(ctx context.Context, name, slug, description string, sortOrder int, parentSlug string) (*DimensionNode, error) {
	// Check slug uniqueness
	exists, err := s.repo.SlugExists(ctx, slug)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, &ConflictError{Resource: "dimension", Field: "slug", Value: slug}
	}

	var parentID string
	if parentSlug != "" {
		parent, err := s.repo.GetBySlug(ctx, parentSlug)
		if err != nil {
			return nil, err
		}
		parentID = parent.ID.String()
	}

	d, err := s.repo.Create(ctx, name, slug, description, sortOrder, parentID)
	if err != nil {
		return nil, err
	}

	return &DimensionNode{
		ID:          d.ID.String(),
		Name:        d.Name,
		Slug:        d.Slug,
		Description: d.Description,
		SortOrder:   d.SortOrder,
	}, nil
}

// Update updates a dimension.
func (s *DimensionService) Update(ctx context.Context, slug, name, description string, sortOrder int) (*DimensionNode, error) {
	d, err := s.repo.Update(ctx, slug, name, description, sortOrder)
	if err != nil {
		return nil, err
	}
	return &DimensionNode{
		ID:          d.ID.String(),
		Name:        d.Name,
		Slug:        d.Slug,
		Description: d.Description,
		SortOrder:   d.SortOrder,
	}, nil
}

// Delete deletes a dimension.
func (s *DimensionService) Delete(ctx context.Context, slug string) error {
	return s.repo.Delete(ctx, slug)
}

// ListSubcategories returns subcategories of a parent.
func (s *DimensionService) ListSubcategories(ctx context.Context, parentSlug string) ([]*DimensionNode, error) {
	kids, err := s.repo.ListByParentSlug(ctx, parentSlug)
	if err != nil {
		return nil, err
	}
	result := make([]*DimensionNode, len(kids))
	for i, d := range kids {
		result[i] = &DimensionNode{
			ID:          d.ID.String(),
			Name:        d.Name,
			Slug:        d.Slug,
			Description: d.Description,
			SortOrder:   d.SortOrder,
			Children:    make([]*DimensionNode, 0),
		}
	}
	return result, nil
}

// ConflictError represents a resource conflict error.
type ConflictError struct {
	Resource string
	Field    string
	Value    string
}

func (e *ConflictError) Error() string {
	return e.Resource + " with " + e.Field + "='" + e.Value + "' already exists"
}
