package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

// BookFile holds the schema definition for the BookFile entity.
type BookFile struct {
	ent.Schema
}

// Fields of the BookFile.
func (BookFile) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(func() uuid.UUID { id, _ := uuid.NewV7(); return id }).
			Immutable(),
		field.UUID("book_id", uuid.UUID{}),
		field.String("file_type").
			NotEmpty().
			MaxLen(20),
		field.String("original_name").
			NotEmpty().
			MaxLen(255),
		field.String("stored_name").
			NotEmpty().
			MaxLen(255),
		field.String("file_path").
			NotEmpty().
			MaxLen(500),
		field.Int64("file_size"),
		field.String("mime_type").
			MaxLen(100).
			Optional().
			Default(""),
		field.UUID("uploader_id", uuid.UUID{}),
		field.Time("created_at").
			Default(time.Now).
			Immutable(),
	}
}

// Edges of the BookFile.
func (BookFile) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("book", Book.Type),
		edge.To("uploader", User.Type),
	}
}
