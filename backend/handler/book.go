package handler

import (
	"context"
	"io"
	"strings"

	"github.com/google/uuid"
	"google.golang.org/genproto/googleapis/api/httpbody"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/zhoumingjun/bookmgr/backend/ent"
	"github.com/zhoumingjun/bookmgr/backend/middleware"
	"github.com/zhoumingjun/bookmgr/backend/repository"
	"github.com/zhoumingjun/bookmgr/backend/service"
	bookmgrv1 "github.com/zhoumingjun/bookmgr/gen/api/bookmgr/v1"
)

// BookHandler implements the gRPC BookServiceServer.
type BookHandler struct {
	bookmgrv1.UnimplementedBookServiceServer
	bookService *service.BookService
}

// NewBookHandler creates a new BookHandler.
func NewBookHandler(bookService *service.BookService) *BookHandler {
	return &BookHandler{bookService: bookService}
}

func (h *BookHandler) ListBooks(ctx context.Context, req *bookmgrv1.ListBooksRequest) (*bookmgrv1.ListBooksResponse, error) {
	params := repository.ListBooksParams{
		Page:           1,
		PerPage:        int(req.GetPageSize()),
		DimensionSlug:  req.GetDimensionSlug(),
		Status:         req.GetStatus(),
		SearchQuery:    req.GetSearchQuery(),
		SortField:     req.GetSortField(),
		SortDesc:      req.GetSortDesc(),
		AgeMinYears:   int(req.GetAgeMin()),
		AgeMaxYears:   int(req.GetAgeMax()),
	}
	if params.PerPage == 0 {
		params.PerPage = 20
	}
	result, err := h.bookService.ListFull(ctx, params)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "listing books: %v", err)
	}

	books := make([]*bookmgrv1.Book, len(result.Books))
	for i, b := range result.Books {
		books[i] = entBookToProto(b)
	}

	var nextToken string
	if result.Total > params.PerPage {
		nextToken = result.NextPageToken
	}

	return &bookmgrv1.ListBooksResponse{
		Books:         books,
		NextPageToken: nextToken,
	}, nil
}

func (h *BookHandler) GetBook(ctx context.Context, req *bookmgrv1.GetBookRequest) (*bookmgrv1.GetBookResponse, error) {
	id, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid book id")
	}

	b, err := h.bookService.GetFull(ctx, id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			return nil, status.Errorf(codes.NotFound, "book not found")
		}
		return nil, status.Errorf(codes.Internal, "getting book: %v", err)
	}

	return &bookmgrv1.GetBookResponse{Book: entBookToProto(b)}, nil
}

func (h *BookHandler) CreateBook(ctx context.Context, req *bookmgrv1.CreateBookRequest) (*bookmgrv1.CreateBookResponse, error) {
	var uploaderID uuid.UUID
	if claims, ok := middleware.ClaimsFromContext(ctx); ok {
		uploaderID, _ = uuid.Parse(claims.Subject)
	}

	params := repository.CreateBookParams{
		Title:               req.GetTitle(),
		Author:              req.GetAuthor(),
		Description:         req.GetDescription(),
		PageCount:           int(req.GetPageCount()),
		DurationMinutes:     int(req.GetDurationMinutes()),
		CoreGoal:            req.GetCoreGoal(),
		CognitiveLevel:      req.GetCognitiveLevel(),
		ResourceType:        req.GetResourceType(),
		HasPrint:            req.GetHasPrint(),
		HasDigital:          req.GetHasDigital(),
		HasAudio:            req.GetHasAudio(),
		HasVideo:            req.GetHasVideo(),
		TeachingSuggestion:  req.GetTeachingSuggestion(),
		ParentReadingGuide:  req.GetParentReadingGuide(),
		RecommendedAgeMin:  int(req.GetRecommendedAgeMin()),
		RecommendedAgeMax:   int(req.GetRecommendedAgeMax()),
		UploaderID:          uploaderID,
		DimensionSlugs:     req.GetDimensionSlugs(),
	}

	b, err := h.bookService.CreateFull(ctx, params)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "creating book: %v", err)
	}

	return &bookmgrv1.CreateBookResponse{Book: entBookToProto(b)}, nil
}

func (h *BookHandler) UpdateBook(ctx context.Context, req *bookmgrv1.UpdateBookRequest) (*bookmgrv1.UpdateBookResponse, error) {
	if req.GetBook() == nil {
		return nil, status.Errorf(codes.InvalidArgument, "book is required")
	}

	id, err := uuid.Parse(req.GetBook().GetId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid book id")
	}

	pb := req.GetBook()
	mask := req.GetUpdateMask()
	if mask == nil || len(mask.GetPaths()) == 0 {
		return nil, status.Errorf(codes.InvalidArgument, "update_mask is required")
	}

	fields := service.BookUpdateFields{}
	for _, path := range mask.GetPaths() {
		switch path {
		case "title":
			v := pb.GetTitle()
			fields.Title = &v
		case "author":
			v := pb.GetAuthor()
			fields.Author = &v
		case "description":
			v := pb.GetDescription()
			fields.Description = &v
		case "page_count":
			v := int(pb.GetPageCount())
			fields.PageCount = &v
		case "duration_minutes":
			v := int(pb.GetDurationMinutes())
			fields.DurationMinutes = &v
		case "core_goal":
			v := pb.GetCoreGoal()
			fields.CoreGoal = &v
		case "cognitive_level":
			v := pb.GetCognitiveLevel()
			fields.CognitiveLevel = &v
		case "resource_type":
			v := pb.GetResourceType()
			fields.ResourceType = &v
		case "has_print":
			v := pb.GetHasPrint()
			fields.HasPrint = &v
		case "has_digital":
			v := pb.GetHasDigital()
			fields.HasDigital = &v
		case "has_audio":
			v := pb.GetHasAudio()
			fields.HasAudio = &v
		case "has_video":
			v := pb.GetHasVideo()
			fields.HasVideo = &v
		case "teaching_suggestion":
			v := pb.GetTeachingSuggestion()
			fields.TeachingSuggestion = &v
		case "parent_reading_guide":
			v := pb.GetParentReadingGuide()
			fields.ParentReadingGuide = &v
		case "recommended_age_min":
			v := int(pb.GetRecommendedAgeMin())
			fields.RecommendedAgeMin = &v
		case "recommended_age_max":
			v := int(pb.GetRecommendedAgeMax())
			fields.RecommendedAgeMax = &v
		case "dimensions":
			var slugs []string
			for _, d := range pb.GetDimensions() {
				slugs = append(slugs, d.GetSlug())
			}
			fields.DimensionSlugs = slugs
		default:
			return nil, status.Errorf(codes.InvalidArgument, "unsupported field: %s", path)
		}
	}

	b, err := h.bookService.Update(ctx, id, fields)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			return nil, status.Errorf(codes.NotFound, "book not found")
		}
		return nil, status.Errorf(codes.Internal, "updating book: %v", err)
	}

	return &bookmgrv1.UpdateBookResponse{Book: entBookToProto(b)}, nil
}

func (h *BookHandler) DeleteBook(ctx context.Context, req *bookmgrv1.DeleteBookRequest) (*bookmgrv1.DeleteBookResponse, error) {
	id, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid book id")
	}

	if err := h.bookService.Delete(ctx, id); err != nil {
		if strings.Contains(err.Error(), "not found") {
			return nil, status.Errorf(codes.NotFound, "book not found")
		}
		return nil, status.Errorf(codes.Internal, "deleting book: %v", err)
	}

	return &bookmgrv1.DeleteBookResponse{}, nil
}

func (h *BookHandler) DownloadBook(ctx context.Context, req *bookmgrv1.DownloadBookRequest) (*bookmgrv1.DownloadBookResponse, error) {
	id, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid book id")
	}

	rc, err := h.bookService.OpenFile(ctx, id)
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "no file") {
			return nil, status.Errorf(codes.NotFound, "book file not found")
		}
		return nil, status.Errorf(codes.Internal, "opening file: %v", err)
	}
	defer rc.Close()

	data, err := io.ReadAll(rc)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "reading file: %v", err)
	}

	return &bookmgrv1.DownloadBookResponse{
		HttpBody: &httpbody.HttpBody{
			ContentType: "application/pdf",
			Data:        data,
		},
	}, nil
}

func entBookToProto(b *ent.Book) *bookmgrv1.Book {
	pb := &bookmgrv1.Book{
		Id:                   b.ID.String(),
		Title:                b.Title,
		Author:               b.Author,
		Description:          b.Description,
		PageCount:            int32(b.PageCount),
		DurationMinutes:      int32(b.DurationMinutes),
		CoreGoal:             b.CoreGoal,
		CognitiveLevel:       b.CognitiveLevel,
		ResourceType:         b.ResourceType,
		HasPrint:             b.HasPrint,
		HasDigital:           b.HasDigital,
		HasAudio:             b.HasAudio,
		HasVideo:             b.HasVideo,
		TeachingSuggestion:   b.TeachingSuggestion,
		ParentReadingGuide:   b.ParentReadingGuide,
		RecommendedAgeMin:    int32(b.RecommendedAgeMin),
		RecommendedAgeMax:    int32(b.RecommendedAgeMax),
		CoverImageUrl:        b.CoverImageURL,
		Status:               b.Status,
		UploaderId:           b.UploaderID.String(),
		ViewCount:            int32(b.ViewCount),
		CreateTime:           timestamppb.New(b.CreatedAt),
		UpdateTime:           timestamppb.New(b.UpdatedAt),
	}

	// Map dimensions if loaded
	if len(b.Edges.BookDimensions) > 0 {
		pbDims := make([]*bookmgrv1.Dimension, 0, len(b.Edges.BookDimensions))
		for _, bd := range b.Edges.BookDimensions {
			if len(bd.Edges.Dimension) > 0 {
				pbDims = append(pbDims, entDimensionToProto(bd.Edges.Dimension[0]))
			}
		}
		pb.Dimensions = pbDims
	}

	return pb
}

func entDimensionToProto(d *ent.Dimension) *bookmgrv1.Dimension {
	return &bookmgrv1.Dimension{
		Id:   d.ID.String(),
		Name: d.Name,
		Slug: d.Slug,
	}
}
