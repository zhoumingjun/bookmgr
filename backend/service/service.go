package service

import "go.uber.org/fx"

var Module = fx.Options(
	fx.Provide(NewJWTService),
	fx.Provide(NewAuthService),
	fx.Provide(NewUserService),
	fx.Provide(NewBookService),
	fx.Provide(NewDimensionService),
)
