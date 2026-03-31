package handler

import (
	"context"
	"strings"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/zhoumingjun/bookmgr/backend/service"
	bookmgrv1 "github.com/zhoumingjun/bookmgr/gen/api/bookmgr/v1"
)

// DimensionHandler implements the gRPC DimensionServiceServer.
type DimensionHandler struct {
	bookmgrv1.UnimplementedDimensionServiceServer
	dimensionService *service.DimensionService
}

// NewDimensionHandler creates a new DimensionHandler.
func NewDimensionHandler(dimensionService *service.DimensionService) *DimensionHandler {
	return &DimensionHandler{dimensionService: dimensionService}
}

// ListDimensions returns the full dimension tree.
func (h *DimensionHandler) ListDimensions(ctx context.Context, req *bookmgrv1.ListDimensionsRequest) (*bookmgrv1.ListDimensionsResponse, error) {
	nodes, err := h.dimensionService.ListDimensionTree(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "listing dimensions: %v", err)
	}

	dimensions := make([]*bookmgrv1.Dimension, len(nodes))
	for i, n := range nodes {
		dimensions[i] = dimensionNodeToProto(n)
	}

	return &bookmgrv1.ListDimensionsResponse{Dimensions: dimensions}, nil
}

// GetDimension returns a single dimension by slug.
func (h *DimensionHandler) GetDimension(ctx context.Context, req *bookmgrv1.GetDimensionRequest) (*bookmgrv1.GetDimensionResponse, error) {
	node, err := h.dimensionService.GetBySlug(ctx, req.GetSlug())
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			return nil, status.Errorf(codes.NotFound, "dimension not found")
		}
		return nil, status.Errorf(codes.Internal, "getting dimension: %v", err)
	}

	return &bookmgrv1.GetDimensionResponse{Dimension: dimensionNodeToProto(node)}, nil
}

// CreateDimension creates a new dimension. Admin/super_admin enforced by middleware.
func (h *DimensionHandler) CreateDimension(ctx context.Context, req *bookmgrv1.CreateDimensionRequest) (*bookmgrv1.CreateDimensionResponse, error) {
	node, err := h.dimensionService.Create(
		ctx,
		req.GetName(),
		req.GetSlug(),
		req.GetDescription(),
		int(req.GetSortOrder()),
		req.GetParentSlug(),
	)
	if err != nil {
		if strings.Contains(err.Error(), "already exists") {
			return nil, status.Errorf(codes.AlreadyExists, "dimension with slug '%s' already exists", req.GetSlug())
		}
		if strings.Contains(err.Error(), "not found") {
			return nil, status.Errorf(codes.NotFound, "parent dimension not found")
		}
		return nil, status.Errorf(codes.Internal, "creating dimension: %v", err)
	}

	return &bookmgrv1.CreateDimensionResponse{Dimension: dimensionNodeToProto(node)}, nil
}

// UpdateDimension updates an existing dimension. Admin/super_admin enforced by middleware.
func (h *DimensionHandler) UpdateDimension(ctx context.Context, req *bookmgrv1.UpdateDimensionRequest) (*bookmgrv1.UpdateDimensionResponse, error) {
	node, err := h.dimensionService.Update(
		ctx,
		req.GetSlug(),
		req.GetName(),
		req.GetDescription(),
		int(req.GetSortOrder()),
	)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			return nil, status.Errorf(codes.NotFound, "dimension not found")
		}
		return nil, status.Errorf(codes.Internal, "updating dimension: %v", err)
	}

	return &bookmgrv1.UpdateDimensionResponse{Dimension: dimensionNodeToProto(node)}, nil
}

// DeleteDimension deletes a dimension. Admin/super_admin enforced by middleware.
func (h *DimensionHandler) DeleteDimension(ctx context.Context, req *bookmgrv1.DeleteDimensionRequest) (*bookmgrv1.DeleteDimensionResponse, error) {
	err := h.dimensionService.Delete(ctx, req.GetSlug())
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			return nil, status.Errorf(codes.NotFound, "dimension not found")
		}
		if strings.Contains(err.Error(), "subcategories") {
			return nil, status.Errorf(codes.FailedPrecondition, "%v", err)
		}
		if strings.Contains(err.Error(), "books") {
			return nil, status.Errorf(codes.FailedPrecondition, "%v", err)
		}
		return nil, status.Errorf(codes.Internal, "deleting dimension: %v", err)
	}

	return &bookmgrv1.DeleteDimensionResponse{}, nil
}

// ListSubcategories returns subcategories of a parent dimension.
func (h *DimensionHandler) ListSubcategories(ctx context.Context, req *bookmgrv1.ListSubcategoriesRequest) (*bookmgrv1.ListSubcategoriesResponse, error) {
	kids, err := h.dimensionService.ListSubcategories(ctx, req.GetParentSlug())
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			return nil, status.Errorf(codes.NotFound, "parent dimension not found")
		}
		return nil, status.Errorf(codes.Internal, "listing subcategories: %v", err)
	}

	subcategories := make([]*bookmgrv1.Dimension, len(kids))
	for i, n := range kids {
		subcategories[i] = dimensionNodeToProto(n)
	}

	return &bookmgrv1.ListSubcategoriesResponse{Subcategories: subcategories}, nil
}

// dimensionNodeToProto converts a service DimensionNode to a proto Dimension.
func dimensionNodeToProto(n *service.DimensionNode) *bookmgrv1.Dimension {
	d := &bookmgrv1.Dimension{
		Id:        n.ID,
		Name:      n.Name,
		Slug:      n.Slug,
		SortOrder: int32(n.SortOrder),
	}
	if len(n.Children) > 0 {
		children := make([]*bookmgrv1.Dimension, len(n.Children))
		for i, c := range n.Children {
			children[i] = dimensionNodeToProto(c)
		}
		d.Children = children
	}
	return d
}
