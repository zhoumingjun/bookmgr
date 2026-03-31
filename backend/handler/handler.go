package handler

import (
	"go.uber.org/fx"
)

var Module = fx.Options(
	fx.Provide(NewHealthHandler),
	fx.Provide(NewAuthHandler),
	fx.Provide(NewUserHandler),
	fx.Provide(NewBookHandler),
	fx.Provide(NewUploadHandler),
	fx.Provide(NewDimensionHandler),
)
