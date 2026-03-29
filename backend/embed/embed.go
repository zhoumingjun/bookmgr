package embed

import "embed"

//go:embed all:frontend_dist
var FrontendFS embed.FS
