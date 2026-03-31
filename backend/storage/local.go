package storage

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"

	"github.com/zhoumingjun/bookmgr/backend/config"
)

// FileType represents the type of book file.
type FileType string

const (
	FileTypePrint   FileType = "print"
	FileTypeDigital FileType = "digital"
	FileTypeAudio  FileType = "audio"
	FileTypeVideo  FileType = "video"
)

// IsValid checks if the file type is valid.
func (ft FileType) IsValid() bool {
	switch ft {
	case FileTypePrint, FileTypeDigital, FileTypeAudio, FileTypeVideo:
		return true
	}
	return false
}

// ExtFromMimeType returns the file extension for a MIME type.
func ExtFromMimeType(mimeType string) string {
	switch mimeType {
	case "application/pdf":
		return "pdf"
	case "application/epub+zip":
		return "epub"
	case "audio/mpeg", "audio/mp3":
		return "mp3"
	case "audio/mp4", "audio/x-m4a":
		return "m4a"
	case "video/mp4":
		return "mp4"
	default:
		// Try to extract from mime type
		if idx := strings.LastIndex(mimeType, "/"); idx >= 0 {
			ext := mimeType[idx+1:]
			if ext == "octet-stream" {
				return "bin"
			}
			return ext
		}
		return "bin"
	}
}

// Storage defines the file storage interface.
type Storage interface {
	Save(ctx context.Context, filename string, r io.Reader) error
	Open(ctx context.Context, filename string) (io.ReadCloser, error)
	Delete(ctx context.Context, filename string) error
}

// LocalStorage implements Storage using the local filesystem.
type LocalStorage struct {
	dir string
}

// NewLocalStorage creates a new LocalStorage, ensuring the upload directory exists.
func NewLocalStorage(cfg *config.Config) (*LocalStorage, error) {
	uploadDir := cfg.DataDir + "/uploads"
	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		return nil, fmt.Errorf("creating upload dir: %w", err)
	}
	return &LocalStorage{dir: uploadDir}, nil
}

// BuildPath constructs the storage path for a book file.
// Format: {dir}/uploads/{book_id}/{file_type}/{uuid}.{ext}
func (s *LocalStorage) BuildPath(bookID uuid.UUID, fileType FileType, ext string) string {
	return filepath.Join(s.dir, bookID.String(), string(fileType), uuid.New().String()+"."+ext)
}

// Save stores a file at the given absolute path.
func (s *LocalStorage) SavePath(ctx context.Context, path string, r io.Reader) error {
	// Ensure directory exists
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("creating directory: %w", err)
	}
	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("creating file: %w", err)
	}
	defer f.Close()
	if _, err := io.Copy(f, r); err != nil {
		return fmt.Errorf("writing file: %w", err)
	}
	return nil
}

// Open opens a file for reading.
func (s *LocalStorage) Open(ctx context.Context, filename string) (io.ReadCloser, error) {
	f, err := os.Open(filename)
	if err != nil {
		return nil, fmt.Errorf("opening file: %w", err)
	}
	return f, nil
}

// Delete removes a file.
func (s *LocalStorage) Delete(ctx context.Context, filename string) error {
	if err := os.Remove(filename); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("deleting file: %w", err)
	}
	return nil
}

// Save implements Storage.Save (legacy, saves to root upload dir).
func (s *LocalStorage) Save(ctx context.Context, filename string, r io.Reader) error {
	path := filepath.Join(s.dir, filepath.Base(filename))
	return s.SavePath(ctx, path, r)
}

// BuildFilePath returns the absolute path for a file.
func (s *LocalStorage) BuildFilePath(relativePath string) string {
	return relativePath
}
