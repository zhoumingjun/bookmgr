package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

// Book holds the schema definition for the Book entity.
type Book struct {
	ent.Schema
}

// Fields of the Book.
func (Book) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(newUUIDv7).
			Immutable(),
		field.String("title").
			NotEmpty().
			MaxLen(255),
		field.String("author").
			NotEmpty().
			MaxLen(255),
		field.String("description").
			Optional().
			Default(""),
		field.String("cover_url").
			Optional().
			Default(""),
		field.String("file_path").
			Optional().
			Default(""),
		field.UUID("uploader_id", uuid.UUID{}),
		field.Time("created_at").
			Default(time.Now).
			Immutable(),
		field.Time("updated_at").
			Default(time.Now).
			UpdateDefault(time.Now),
	}
}

// Edges of the Book.
func (Book) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("uploader", User.Type).
			Ref("books").
			Field("uploader_id").
			Required().
			Unique(),
		edge.To("book_dimensions", BookDimension.Type),
	}
}
