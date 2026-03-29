//go:build bdd

package bdd

import (
	"os"
	"testing"

	"github.com/cucumber/godog"
	"github.com/cucumber/godog/colors"
	"github.com/zhoumingjun/bookmgr/backend/test/bdd/steps"
)

func TestFeatures(t *testing.T) {
	featuresPath := os.Getenv("BDD_FEATURES_PATH")
	if featuresPath == "" {
		featuresPath = "../../../features"
	}

	suite := godog.TestSuite{
		Name:                "bookmgr-api-bdd",
		ScenarioInitializer: steps.InitializeScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Output:   colors.Colored(os.Stdout),
			Paths:    []string{featuresPath},
			Tags:     "~@e2e-only",
			TestingT: t,
			Strict:   true,
		},
	}

	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, failed to run feature tests")
	}
}
