package storage

import (
	"context"
	"io"

	"go.uber.org/fx"
)

// Storage defines the file storage interface.
type Storage interface {
	Save(ctx context.Context, filename string, r io.Reader) error
	Open(ctx context.Context, filename string) (io.ReadCloser, error)
	Delete(ctx context.Context, filename string) error
}

var Module = fx.Options(
	fx.Provide(NewLocalStorage),
	fx.Provide(func(ls *LocalStorage) Storage { return ls }),
)
