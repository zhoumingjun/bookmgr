package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

func newBookUUID() uuid.UUID {
	id, err := uuid.NewV7()
	if err != nil {
		return uuid.New()
	}
	return id
}

// Book holds the schema definition for the Book entity.
type Book struct {
	ent.Schema
}

// Fields of the Book.
func (Book) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(newBookUUID).
			Immutable(),
		field.String("title").
			NotEmpty().
			MaxLen(200),
		field.String("author").
			MaxLen(100),
		field.Text("description").
			Optional().
			Default(""),
		field.Int("page_count").
			Optional(),
		field.Int("duration_minutes").
			Optional(),
		field.Text("core_goal").
			Optional().
			Default(""),
		field.String("cognitive_level").
			MaxLen(50).
			Optional().
			Default(""),
		// resource_type: print/digital/audio/video (comma-separated if multiple)
		field.String("resource_type").
			MaxLen(100).
			Optional().
			Default(""),
		field.Bool("has_print").
			Default(false),
		field.Bool("has_digital").
			Default(false),
		field.Bool("has_audio").
			Default(false),
		field.Bool("has_video").
			Default(false),
		field.Text("teaching_suggestion").
			Optional().
			Default(""),
		field.Text("parent_reading_guide").
			Optional().
			Default(""),
		field.Int("recommended_age_min").
			Default(0),
		field.Int("recommended_age_max").
			Default(216), // 18 years in months
		field.String("cover_image_url").
			MaxLen(500).
			Optional().
			Default(""),
		field.String("cover_url").
			MaxLen(500).
			Optional().
			Default(""),
		field.String("file_path").
			Optional().
			Default(""),
		// status: draft/pending/approved/rejected
		field.String("status").
			Default("draft").
			MaxLen(50),
		field.UUID("uploader_id", uuid.UUID{}),
		field.Int("view_count").
			Default(0),
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
