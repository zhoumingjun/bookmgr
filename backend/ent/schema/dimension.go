package schema

import (
	"regexp"
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

var slugRegexp = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

func newDimensionUUID() uuid.UUID {
	id, err := uuid.NewV7()
	if err != nil {
		return uuid.New()
	}
	return id
}

// Dimension represents a category dimension for picturebooks.
// Supports two-level hierarchy: top-level (一级维度) and subcategories (二级子分类).
type Dimension struct {
	ent.Schema
}

// Fields of the Dimension.
func (Dimension) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(newDimensionUUID).
			Immutable(),
		field.String("name").
			NotEmpty().
			MaxLen(100),
		field.String("slug").
			NotEmpty().
			MaxLen(50).
			Unique().
			Match(slugRegexp),
		field.String("description").
			Optional().
			MaxLen(500),
		field.Int("sort_order").
			Default(0),
		field.Time("created_at").
			Default(time.Now).
			Immutable(),
		field.Time("updated_at").
			Default(time.Now).
			UpdateDefault(time.Now),
	}
}

// Edges of the Dimension.
func (Dimension) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("children", Dimension.Type).
			From("parent").
			Unique(),
		edge.To("book_dimensions", BookDimension.Type),
	}
}
