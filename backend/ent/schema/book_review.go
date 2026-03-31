package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

// BookReview represents a book status change record in the review workflow.
type BookReview struct {
	ent.Schema
}

// Fields of the BookReview.
func (BookReview) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(func() uuid.UUID { id, _ := uuid.NewV7(); return id }).
			Immutable(),
		field.UUID("book_id", uuid.UUID{}),
		field.UUID("reviewer_id", uuid.UUID{}),
		field.String("action").
			NotEmpty().
			MaxLen(20), // submit/approve/reject/recall
		field.String("status_from").
			MaxLen(50),
		field.String("status_to").
			MaxLen(50),
		field.Text("reason").
			Optional().
			Default(""),
		field.Time("created_at").
			Default(time.Now).
			Immutable(),
	}
}

// Edges of the BookReview.
func (BookReview) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("book", Book.Type),
		edge.To("reviewer", User.Type),
	}
}
