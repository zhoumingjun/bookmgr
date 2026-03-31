package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

// BookDimension represents the many-to-many relationship between Book and Dimension.
type BookDimension struct {
	ent.Schema
}

// Fields of the BookDimension.
func (BookDimension) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(func() uuid.UUID { id, _ := uuid.NewV7(); return id }).
			Immutable(),
		field.Bool("is_primary").
			Default(true),
		field.Time("created_at").
			Default(time.Now).
			Immutable(),
	}
}

// Edges of the BookDimension.
func (BookDimension) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("book", Book.Type).
			Ref("book_dimensions").
			Required(),
		edge.From("dimension", Dimension.Type).
			Ref("book_dimensions").
			Required(),
	}
}
