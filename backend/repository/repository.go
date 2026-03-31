package repository

import "go.uber.org/fx"

var Module = fx.Options(
	fx.Provide(NewUserRepository),
	fx.Provide(NewBookRepository),
	fx.Provide(NewDimensionRepository),
	fx.Provide(NewBookFileRepository),
	fx.Provide(NewBookReviewRepository),
)
