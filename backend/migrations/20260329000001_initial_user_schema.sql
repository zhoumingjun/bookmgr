-- Create enum type for user roles
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- Create "users" table
CREATE TABLE "users" (
    "id" uuid NOT NULL,
    "username" character varying(64) NOT NULL,
    "email" character varying NOT NULL,
    "password_hash" character varying NOT NULL,
    "role" user_role NOT NULL DEFAULT 'user',
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL,
    PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX "user_username" ON "users" ("username");
CREATE UNIQUE INDEX "user_email" ON "users" ("email");
