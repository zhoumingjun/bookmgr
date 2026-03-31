package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

// BookReadingProgress tracks a user's reading progress for a book.
type BookReadingProgress struct {
	ent.Schema
}

// Fields of the BookReadingProgress.
func (BookReadingProgress) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(func() uuid.UUID { id, _ := uuid.NewV7(); return id }).
			Immutable(),
		field.UUID("book_id", uuid.UUID{}),
		field.UUID("user_id", uuid.UUID{}),
		field.Int("progress_percent").
			Default(0).
			Min(0).
			Max(100),
		field.Int("last_page").
			Default(0).
			Min(0),
		field.Time("last_read_at").
			Default(time.Now),
	}
}

// Edges of the BookReadingProgress.
func (BookReadingProgress) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("book", Book.Type),
		edge.To("user", User.Type),
	}
}
