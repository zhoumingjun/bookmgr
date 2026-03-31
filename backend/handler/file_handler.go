package handler

import (
	"context"
	"io"
	"strings"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/zhoumingjun/bookmgr/backend/middleware"
	"github.com/zhoumingjun/bookmgr/backend/repository"
	"github.com/zhoumingjun/bookmgr/backend/service"
	"github.com/zhoumingjun/bookmgr/backend/storage"
	bookmgrv1 "github.com/zhoumingjun/bookmgr/gen/api/bookmgr/v1"
)

// FileHandler implements the gRPC FileServiceServer.
type FileHandler struct {
	bookmgrv1.UnimplementedFileServiceServer
	fileService *service.FileService
}

// NewFileHandler creates a new FileHandler.
func NewFileHandler(fileService *service.FileService) *FileHandler {
	return &FileHandler{fileService: fileService}
}

func (h *FileHandler) UploadBookFile(ctx context.Context, req *bookmgrv1.UploadBookFileRequest) (*bookmgrv1.UploadBookFileResponse, error) {
	bookID, err := uuid.Parse(req.GetBookId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid book_id")
	}

	claims, ok := middleware.ClaimsFromContext(ctx)
	if !ok {
		return nil, status.Errorf(codes.Unauthenticated, "missing credentials")
	}
	uploaderID, err := uuid.Parse(claims.Subject)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user id")
	}

	fileData := req.GetFileData()
	if len(fileData) == 0 {
		return nil, status.Errorf(codes.InvalidArgument, "file data is empty")
	}

	// Convert proto FileType enum to storage FileType string
	ft := protoFileTypeToStorage(req.GetFileType())

	params := service.UploadFileParams{
		BookID:      bookID,
		FileType:    ft,
		FileData:    &bytesReader{data: fileData},
		Filename:    "file",
		ContentType: detectContentType(fileData),
		FileSize:    int64(len(fileData)),
		UploaderID: uploaderID,
	}

	result, err := h.fileService.UploadFile(ctx, params)
	if err != nil {
		if strings.Contains(err.Error(), "too large") || strings.Contains(err.Error(), "500MB") {
			return nil, status.Errorf(codes.InvalidArgument, "file too large (max 500MB)")
		}
		if strings.Contains(err.Error(), "invalid") || strings.Contains(err.Error(), "unsupported") {
			return nil, status.Errorf(codes.InvalidArgument, "invalid or unsupported file type")
		}
		return nil, status.Errorf(codes.Internal, "uploading file: %v", err)
	}

	return &bookmgrv1.UploadBookFileResponse{
		File: protoBookFileFromResult(result),
	}, nil
}

func (h *FileHandler) BatchUploadBookFiles(ctx context.Context, req *bookmgrv1.BatchUploadBookFilesRequest) (*bookmgrv1.BatchUploadBookFilesResponse, error) {
	bookID, err := uuid.Parse(req.GetBookId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid book_id")
	}

	claims, ok := middleware.ClaimsFromContext(ctx)
	if !ok {
		return nil, status.Errorf(codes.Unauthenticated, "missing credentials")
	}
	uploaderID, err := uuid.Parse(claims.Subject)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user id")
	}

	files := make([]*bookmgrv1.BookFile, 0, len(req.GetFiles()))
	for _, entry := range req.GetFiles() {
		fileData := entry.GetFileData()
		if len(fileData) == 0 {
			continue
		}
		if int64(len(fileData)) > 500<<20 {
			return nil, status.Errorf(codes.InvalidArgument, "file too large (max 500MB)")
		}

		ft := protoFileTypeToStorage(entry.GetFileType())

		params := service.UploadFileParams{
			BookID:      bookID,
			FileType:    ft,
			FileData:    &bytesReader{data: fileData},
			Filename:    "file",
			ContentType: detectContentType(fileData),
			FileSize:    int64(len(fileData)),
			UploaderID: uploaderID,
		}

		result, err := h.fileService.UploadFile(ctx, params)
		if err != nil {
			if strings.Contains(err.Error(), "too large") {
				return nil, status.Errorf(codes.InvalidArgument, "file too large (max 500MB)")
			}
			return nil, status.Errorf(codes.Internal, "uploading file: %v", err)
		}

		files = append(files, protoBookFileFromResult(result))
	}

	return &bookmgrv1.BatchUploadBookFilesResponse{Files: files}, nil
}

func (h *FileHandler) ListBookFiles(ctx context.Context, req *bookmgrv1.ListBookFilesRequest) (*bookmgrv1.ListBookFilesResponse, error) {
	bookID, err := uuid.Parse(req.GetBookId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid book_id")
	}

	files, err := h.fileService.ListFiles(ctx, bookID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "listing files: %v", err)
	}

	result := make([]*bookmgrv1.BookFile, len(files))
	for i, f := range files {
		result[i] = protoBookFileFromResult(f)
	}

	return &bookmgrv1.ListBookFilesResponse{Files: result}, nil
}

func (h *FileHandler) DownloadBookFile(req *bookmgrv1.DownloadBookFileRequest, stream bookmgrv1.FileService_DownloadBookFileServer) error {
	fileID, err := uuid.Parse(req.GetFileId())
	if err != nil {
		return status.Errorf(codes.InvalidArgument, "invalid file_id")
	}

	f, err := h.fileService.GetFile(stream.Context(), fileID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "sql: no rows") {
			return status.Errorf(codes.NotFound, "file not found")
		}
		return status.Errorf(codes.Internal, "getting file: %v", err)
	}

	rc, err := h.fileService.OpenFile(f.FilePath)
	if err != nil {
		return status.Errorf(codes.Internal, "opening file: %v", err)
	}
	defer rc.Close()

	buf := make([]byte, 32*1024) // 32KB buffer
	for {
		n, err := rc.Read(buf)
		if n > 0 {
			if err := stream.Send(&bookmgrv1.DownloadBookFileResponse{Chunk: buf[:n]}); err != nil {
				return err
			}
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}
	}
	return nil
}

func (h *FileHandler) DeleteBookFile(ctx context.Context, req *bookmgrv1.DeleteBookFileRequest) (*bookmgrv1.DeleteBookFileResponse, error) {
	fileID, err := uuid.Parse(req.GetFileId())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid file_id")
	}

	if err := h.fileService.DeleteFile(ctx, fileID); err != nil {
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "sql: no rows") {
			return nil, status.Errorf(codes.NotFound, "file not found")
		}
		return nil, status.Errorf(codes.Internal, "deleting file: %v", err)
	}

	return &bookmgrv1.DeleteBookFileResponse{}, nil
}

// protoFileTypeToStorage converts proto FileType enum to storage FileType string.
func protoFileTypeToStorage(ft bookmgrv1.FileType) storage.FileType {
	switch ft {
	case bookmgrv1.FileType_FILE_TYPE_PRINT:
		return storage.FileTypePrint
	case bookmgrv1.FileType_FILE_TYPE_DIGITAL:
		return storage.FileTypeDigital
	case bookmgrv1.FileType_FILE_TYPE_AUDIO:
		return storage.FileTypeAudio
	case bookmgrv1.FileType_FILE_TYPE_VIDEO:
		return storage.FileTypeVideo
	default:
		return storage.FileTypePrint
	}
}

// protoBookFileFromResult converts a repository.BookFileResult to proto BookFile.
func protoBookFileFromResult(r *repository.BookFileResult) *bookmgrv1.BookFile {
	return &bookmgrv1.BookFile{
		Id:           r.ID.String(),
		BookId:       r.BookID.String(),
		FileType:     bookmgrv1.FileType_FILE_TYPE_PRINT,
		OriginalName: r.OriginalName,
		FileSize:     r.FileSize,
		MimeType:     r.MimeType,
		UploaderId:   r.UploaderID.String(),
		CreateTime:   timestamppb.New(r.CreatedAt),
	}
}

// bytesReader adapts a byte slice to io.Reader.
type bytesReader struct {
	data []byte
	pos  int
}

func (b *bytesReader) Read(p []byte) (n int, err error) {
	if b.pos >= len(b.data) {
		return 0, io.EOF
	}
	n = copy(p, b.data[b.pos:])
	b.pos += n
	return n, nil
}

func detectContentType(data []byte) string {
	if len(data) >= 4 {
		if data[0] == 0x25 && data[1] == 0x50 && data[2] == 0x44 && data[3] == 0x46 {
			return "application/pdf"
		}
		if data[0] == 0x50 && data[1] == 0x4B && data[2] == 0x03 && data[3] == 0x04 {
			return "application/epub+zip"
		}
		if data[0] == 0x49 && data[1] == 0x44 && data[2] == 0x33 {
			return "audio/mpeg"
		}
		if data[0] == 0xFF && data[1] == 0xFB {
			return "audio/mpeg"
		}
		if data[0] == 0x66 && data[1] == 0x4C && data[2] == 0x61 && data[3] == 0x67 {
			return "audio/mp4"
		}
	}
	return "application/octet-stream"
}
