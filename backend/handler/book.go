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
	result, err := h.bookService.List(ctx, int(req.GetPageSize()), req.GetPageToken())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "listing books: %v", err)
	}

	books := make([]*bookmgrv1.Book, len(result.Books))
	for i, b := range result.Books {
		books[i] = entBookToProto(b)
	}

	return &bookmgrv1.ListBooksResponse{
		Books:         books,
		NextPageToken: result.NextPageToken,
	}, nil
}

func (h *BookHandler) GetBook(ctx context.Context, req *bookmgrv1.GetBookRequest) (*bookmgrv1.GetBookResponse, error) {
	id, err := uuid.Parse(req.GetId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid book id")
	}

	b, err := h.bookService.Get(ctx, id)
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

	b, err := h.bookService.Create(ctx, req.GetTitle(), req.GetAuthor(), req.GetDescription(), uploaderID)
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

	fields := service.BookUpdateFields{}
	mask := req.GetUpdateMask()
	if mask == nil || len(mask.GetPaths()) == 0 {
		return nil, status.Errorf(codes.InvalidArgument, "update_mask is required")
	}

	for _, path := range mask.GetPaths() {
		switch path {
		case "title":
			v := req.GetBook().GetTitle()
			fields.Title = &v
		case "author":
			v := req.GetBook().GetAuthor()
			fields.Author = &v
		case "description":
			v := req.GetBook().GetDescription()
			fields.Description = &v
		case "cover_url":
			v := req.GetBook().GetCoverUrl()
			fields.CoverURL = &v
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
	return &bookmgrv1.Book{
		Id:          b.ID.String(),
		Title:       b.Title,
		Author:      b.Author,
		Description: b.Description,
		CoverUrl:    b.CoverURL,
		UploaderId:  b.UploaderID.String(),
		CreateTime:  timestamppb.New(b.CreatedAt),
		UpdateTime:  timestamppb.New(b.UpdatedAt),
	}
}
