package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

// BookFavorite represents a user's favorite book.
type BookFavorite struct {
	ent.Schema
}

// Fields of the BookFavorite.
func (BookFavorite) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(func() uuid.UUID { id, _ := uuid.NewV7(); return id }).
			Immutable(),
		field.UUID("user_id", uuid.UUID{}),
		field.UUID("book_id", uuid.UUID{}),
		field.Time("created_at").
			Default(time.Now).
			Immutable(),
	}
}

// Edges of the BookFavorite.
func (BookFavorite) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("user", User.Type),
		edge.To("book", Book.Type),
	}
}
