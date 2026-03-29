package storage

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/zhoumingjun/bookmgr/backend/config"
)

// LocalStorage implements Storage using the local filesystem.
type LocalStorage struct {
	dir string
}

// NewLocalStorage creates a new LocalStorage, ensuring the upload directory exists.
func NewLocalStorage(cfg *config.Config) (*LocalStorage, error) {
	if err := os.MkdirAll(cfg.UploadDir, 0o755); err != nil {
		return nil, fmt.Errorf("creating upload dir: %w", err)
	}
	return &LocalStorage{dir: cfg.UploadDir}, nil
}

func (s *LocalStorage) Save(_ context.Context, filename string, r io.Reader) error {
	path := filepath.Join(s.dir, filepath.Base(filename))
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

func (s *LocalStorage) Open(_ context.Context, filename string) (io.ReadCloser, error) {
	path := filepath.Join(s.dir, filepath.Base(filename))
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("opening file: %w", err)
	}
	return f, nil
}

func (s *LocalStorage) Delete(_ context.Context, filename string) error {
	path := filepath.Join(s.dir, filepath.Base(filename))
	if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("deleting file: %w", err)
	}
	return nil
}
