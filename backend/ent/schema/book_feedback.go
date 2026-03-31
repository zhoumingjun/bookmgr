package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

// BookFeedback represents a user's feedback on a book.
type BookFeedback struct {
	ent.Schema
}

// Fields of the BookFeedback.
func (BookFeedback) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(func() uuid.UUID { id, _ := uuid.NewV7(); return id }).
			Immutable(),
		field.UUID("user_id", uuid.UUID{}),
		field.UUID("book_id", uuid.UUID{}),
		field.Enum("feedback_type").
			Values("read_start", "read_complete", "difficulty_rating", "use_scenario"),
		field.Int("difficulty_rating").
			Optional(),
		field.String("use_scenario").
			Optional().
			MaxLen(200),
		field.Time("created_at").
			Default(time.Now).
			Immutable(),
	}
}

// Edges of the BookFeedback.
func (BookFeedback) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("user", User.Type),
		edge.To("book", Book.Type),
	}
}
