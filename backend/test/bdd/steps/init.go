//go:build bdd

package steps

import (
	"context"

	"github.com/cucumber/godog"
	"github.com/zhoumingjun/bookmgr/backend/test/bdd/helpers"
)

type clientKey struct{}

// InitializeScenario registers all step definitions.
func InitializeScenario(ctx *godog.ScenarioContext) {
	var client **helpers.TestClient

	ctx.Before(func(c context.Context, sc *godog.Scenario) (context.Context, error) {
		tc := helpers.NewTestClient()
		client = &tc
		return context.WithValue(c, clientKey{}, tc), nil
	})

	registerCommonSteps(ctx, client)
	registerBookSteps(ctx)
	registerUserSteps(ctx)
}

// GetClient retrieves the per-scenario TestClient from context.
func GetClient(ctx context.Context) *helpers.TestClient {
	return ctx.Value(clientKey{}).(*helpers.TestClient)
}
