package service

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"

	"github.com/zhoumingjun/bookmgr/backend/repository"
	"github.com/zhoumingjun/bookmgr/backend/storage"
)

// Service errors
var (
	ErrFileTooLarge    = errors.New("file size exceeds 500MB limit")
	ErrInvalidFileType = errors.New("invalid or unsupported file type")
)

// FileService handles book file management.
type FileService struct {
	repo       *repository.BookFileRepository
	localStore *storage.LocalStorage
}

// NewFileService creates a new FileService.
func NewFileService(repo *repository.BookFileRepository, localStore *storage.LocalStorage) *FileService {
	return &FileService{repo: repo, localStore: localStore}
}

// UploadFileParams holds fields for uploading a file.
type UploadFileParams struct {
	BookID      uuid.UUID
	FileType    storage.FileType
	FileData    io.Reader
	Filename    string
	ContentType string
	FileSize    int64
	UploaderID  uuid.UUID
}

// UploadFile saves a file to disk and creates the DB record.
func (s *FileService) UploadFile(ctx context.Context, params UploadFileParams) (*repository.BookFileResult, error) {
	if params.FileSize > 500<<20 {
		return nil, ErrFileTooLarge
	}

	if !params.FileType.IsValid() {
		return nil, ErrInvalidFileType
	}

	ext := strings.ToLower(filepath.Ext(params.Filename))
	if ext == "" {
		ext = "." + storage.ExtFromMimeType(params.ContentType)
	}
	if !isAllowedExt(ext) {
		return nil, ErrInvalidFileType
	}

	absPath := s.localStore.BuildPath(params.BookID, params.FileType, strings.TrimPrefix(ext, "."))

	if err := s.localStore.SavePath(ctx, absPath, params.FileData); err != nil {
		return nil, fmt.Errorf("saving file to disk: %w", err)
	}

	dbParams := repository.CreateBookFileParams{
		BookID:       params.BookID,
		FileType:     string(params.FileType),
		OriginalName: params.Filename,
		StoredName:  filepath.Base(absPath),
		FilePath:     absPath,
		FileSize:     params.FileSize,
		MimeType:     params.ContentType,
		UploaderID:  params.UploaderID,
	}

	record, err := s.repo.Create(ctx, dbParams)
	if err != nil {
		os.Remove(absPath)
		return nil, fmt.Errorf("creating file record: %w", err)
	}

	return &repository.BookFileResult{
		ID:           record.ID,
		BookID:       record.BookID,
		FileType:     record.FileType,
		OriginalName: record.OriginalName,
		StoredName:  record.StoredName,
		FilePath:     record.FilePath,
		FileSize:     record.FileSize,
		MimeType:     record.MimeType,
		UploaderID:  record.UploaderID,
		CreatedAt:    record.CreatedAt,
	}, nil
}

// ListFiles returns all files for a book.
func (s *FileService) ListFiles(ctx context.Context, bookID uuid.UUID) ([]*repository.BookFileResult, error) {
	files, err := s.repo.ListByBookID(ctx, bookID)
	if err != nil {
		return nil, err
	}
	results := make([]*repository.BookFileResult, len(files))
	for i, f := range files {
		results[i] = &repository.BookFileResult{
			ID:           f.ID,
			BookID:       f.BookID,
			FileType:     f.FileType,
			OriginalName: f.OriginalName,
			StoredName:  f.StoredName,
			FilePath:     f.FilePath,
			FileSize:     f.FileSize,
			MimeType:     f.MimeType,
			UploaderID:  f.UploaderID,
			CreatedAt:    f.CreatedAt,
		}
	}
	return results, nil
}

// GetFile returns a single file by ID.
func (s *FileService) GetFile(ctx context.Context, fileID uuid.UUID) (*repository.BookFileResult, error) {
	f, err := s.repo.GetByID(ctx, fileID)
	if err != nil {
		return nil, err
	}
	return &repository.BookFileResult{
		ID:           f.ID,
		BookID:       f.BookID,
		FileType:     f.FileType,
		OriginalName: f.OriginalName,
		StoredName:  f.StoredName,
		FilePath:     f.FilePath,
		FileSize:     f.FileSize,
		MimeType:     f.MimeType,
		UploaderID:  f.UploaderID,
		CreatedAt:    f.CreatedAt,
	}, nil
}

// DeleteFile removes the file from storage and database.
func (s *FileService) DeleteFile(ctx context.Context, fileID uuid.UUID) error {
	f, err := s.repo.GetByID(ctx, fileID)
	if err != nil {
		return err
	}
	if err := s.localStore.Delete(ctx, f.FilePath); err != nil && !os.IsNotExist(err) {
		return err
	}
	return s.repo.Delete(ctx, fileID)
}

// OpenFile opens a file for streaming read.
func (s *FileService) OpenFile(filePath string) (io.ReadCloser, error) {
	return s.localStore.Open(context.Background(), filePath)
}

var allowedExts = map[string]bool{
	".pdf":  true,
	".epub": true,
	".mp3":  true,
	".m4a":  true,
	".mp4":  true,
}

func isAllowedExt(ext string) bool {
	return allowedExts[ext]
}
