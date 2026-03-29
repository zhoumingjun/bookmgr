package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"github.com/zhoumingjun/bookmgr/backend/ent"
	"github.com/zhoumingjun/bookmgr/backend/ent/book"
)

type BookRepository struct {
	client *ent.Client
}

func NewBookRepository(client *ent.Client) *BookRepository {
	return &BookRepository{client: client}
}

func (r *BookRepository) Create(ctx context.Context, title, author, description string, uploaderID uuid.UUID) (*ent.Book, error) {
	b, err := r.client.Book.Create().
		SetTitle(title).
		SetAuthor(author).
		SetDescription(description).
		SetUploaderID(uploaderID).
		Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("creating book: %w", err)
	}
	return b, nil
}

func (r *BookRepository) GetByID(ctx context.Context, id uuid.UUID) (*ent.Book, error) {
	b, err := r.client.Book.Get(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("getting book by id: %w", err)
	}
	return b, nil
}

type BookListResult struct {
	Books []*ent.Book
	Total int
}

func (r *BookRepository) List(ctx context.Context, page, perPage int) (*BookListResult, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 20
	}
	offset := (page - 1) * perPage

	total, err := r.client.Book.Query().Count(ctx)
	if err != nil {
		return nil, fmt.Errorf("counting books: %w", err)
	}

	books, err := r.client.Book.Query().
		Order(ent.Desc(book.FieldCreatedAt)).
		Offset(offset).
		Limit(perPage).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("listing books: %w", err)
	}

	return &BookListResult{Books: books, Total: total}, nil
}

func (r *BookRepository) Update(ctx context.Context, id uuid.UUID, fn func(*ent.BookUpdateOne) *ent.BookUpdateOne) (*ent.Book, error) {
	update := r.client.Book.UpdateOneID(id)
	b, err := fn(update).Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("updating book: %w", err)
	}
	return b, nil
}

func (r *BookRepository) Delete(ctx context.Context, id uuid.UUID) error {
	err := r.client.Book.DeleteOneID(id).Exec(ctx)
	if err != nil {
		return fmt.Errorf("deleting book: %w", err)
	}
	return nil
}
