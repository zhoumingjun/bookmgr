package service

import "go.uber.org/fx"

var Module = fx.Options(
	fx.Provide(NewJWTService),
	fx.Provide(NewAuthService),
)
