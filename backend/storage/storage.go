package storage

import (
	"go.uber.org/fx"
)

var Module = fx.Options(
	fx.Provide(NewLocalStorage),
	fx.Provide(func(ls *LocalStorage) Storage { return ls }),
)
