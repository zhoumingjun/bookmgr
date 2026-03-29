-- Create "books" table
CREATE TABLE "books" (
    "id" uuid NOT NULL,
    "title" character varying(255) NOT NULL,
    "author" character varying(255) NOT NULL,
    "description" character varying DEFAULT '',
    "cover_url" character varying DEFAULT '',
    "file_path" character varying DEFAULT '',
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "uploader_id" uuid NOT NULL,
    PRIMARY KEY ("id"),
    CONSTRAINT "books_users_books" FOREIGN KEY ("uploader_id") REFERENCES "users" ("id") ON DELETE NO ACTION
);
