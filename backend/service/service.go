package service

import "go.uber.org/fx"

var Module = fx.Options(
	fx.Provide(NewJWTService),
	fx.Provide(NewAuthService),
	fx.Provide(NewUserService),
	fx.Provide(NewBookService),
	fx.Provide(NewDimensionService),
	fx.Provide(NewFileService),
	fx.Provide(NewBookReviewService),
	fx.Provide(NewBookSearchService),
	fx.Provide(NewBookFavoriteService),
	fx.Provide(NewBookFeedbackService),
)
