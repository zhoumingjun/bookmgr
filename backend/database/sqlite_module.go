package database

import "go.uber.org/fx"

var SQLiteModule = fx.Options(
	fx.Provide(NewSQLiteEntClient),
)
