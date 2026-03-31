package schema

import (
	"regexp"
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

var usernameRegexp = regexp.MustCompile(`^[a-zA-Z0-9_-]{3,64}$`)

func newUUIDv7() uuid.UUID {
	id, err := uuid.NewV7()
	if err != nil {
		return uuid.New()
	}
	return id
}

// User holds the schema definition for the User entity.
type User struct {
	ent.Schema
}

// Fields of the User.
func (User) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(newUUIDv7).
			Immutable(),
		field.String("username").
			NotEmpty().
			MaxLen(64).
			Match(usernameRegexp).
			Unique(),
		field.String("email").
			NotEmpty().
			Unique(),
		field.String("password_hash").
			NotEmpty().
			Sensitive(),
		field.Enum("role").
			Values("super_admin", "admin", "teacher", "parent").
			Default("teacher"),
		field.Time("created_at").
			Default(time.Now).
			Immutable(),
		field.Time("updated_at").
			Default(time.Now).
			UpdateDefault(time.Now),
	}
}

// Edges of the User.
func (User) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("books", Book.Type),
		edge.From("uploaded_files", BookFile.Type).Ref("uploader"),
	}
}

// Indexes of the User.
func (User) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("username").Unique(),
		index.Fields("email").Unique(),
	}
}
