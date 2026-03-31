package schema

import (
	"github.com/google/uuid"
	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/edge"
)

// BookSearchIndex maps book_id to FTS5 rowid for ent integration.
type BookSearchIndex struct {
	ent.Schema
}

func (BookSearchIndex) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(func() uuid.UUID { _, _ = uuid.NewV7(); return uuid.Nil }).
			Immutable(),
		field.UUID("book_id", uuid.UUID{}),
	}
}

func (BookSearchIndex) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("book", Book.Type).
			Ref("search_index").
			Field("book_id").
			Required().
			Unique(),
	}
}
