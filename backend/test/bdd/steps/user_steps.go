//go:build bdd

package steps

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/cucumber/godog"
	"github.com/zhoumingjun/bookmgr/backend/test/bdd/helpers"
)

func registerUserSteps(ctx *godog.ScenarioContext) {
	ctx.Step(`^我发送 PATCH 请求更新用户 "([^"]*)" 的角色为 "([^"]*)"$`, func(ctx context.Context, username, role string) error {
		c := GetClient(ctx)
		userID, err := getUserIDByUsername(c, username)
		if err != nil {
			return err
		}
		roleNum := 1 // ROLE_USER
		if role == "ROLE_ADMIN" {
			roleNum = 2
		}
		body := map[string]interface{}{
			"user": map[string]interface{}{
				"id":   userID,
				"role": roleNum,
			},
			"update_mask": "role",
		}
		return c.Request("PATCH", "/api/v1/users/"+userID, body)
	})

	ctx.Step(`^我发送 PATCH 请求更新用户 "([^"]*)" 的密码为 "([^"]*)"$`, func(ctx context.Context, username, newPwd string) error {
		c := GetClient(ctx)
		userID, err := getUserIDByUsername(c, username)
		if err != nil {
			return err
		}
		body := map[string]interface{}{
			"user": map[string]interface{}{
				"id": userID,
			},
			"update_mask": "password",
			"password":    newPwd,
		}
		return c.Request("PATCH", "/api/v1/users/"+userID, body)
	})

	ctx.Step(`^我发送 DELETE 请求删除自己$`, func(ctx context.Context) error {
		c := GetClient(ctx)
		// Get admin's own user ID from the JWT sub claim
		adminID, err := getUserIDByUsername(c, helpers.AdminUsername)
		if err != nil {
			return err
		}
		return c.Request("DELETE", "/api/v1/users/"+adminID, nil)
	})

	ctx.Step(`^我发送 DELETE 请求删除用户 "([^"]*)"$`, func(ctx context.Context, username string) error {
		c := GetClient(ctx)
		// Need admin to look up user ID first
		adminClient := helpers.NewTestClient()
		if err := adminClient.LoginAs(helpers.AdminUsername, helpers.AdminPassword); err != nil {
			return err
		}
		userID, err := getUserIDByUsername(adminClient, username)
		if err != nil {
			return err
		}
		// Use the current client's token (may be non-admin)
		return c.Request("DELETE", "/api/v1/users/"+userID, nil)
	})
}

// getUserIDByUsername looks up a user ID by listing users.
func getUserIDByUsername(c *helpers.TestClient, username string) (string, error) {
	savedStatus := c.LastStatus
	savedBody := c.LastBody

	if err := c.Request("GET", "/api/v1/users?page_size=100", nil); err != nil {
		return "", err
	}

	var result struct {
		Users []struct {
			ID       string `json:"id"`
			Username string `json:"username"`
		} `json:"users"`
	}
	if err := json.Unmarshal(c.LastBody, &result); err != nil {
		return "", fmt.Errorf("parse users: %w", err)
	}

	// Restore previous request state
	c.LastStatus = savedStatus
	c.LastBody = savedBody

	for _, u := range result.Users {
		if u.Username == username {
			return u.ID, nil
		}
	}
	return "", fmt.Errorf("user %q not found", username)
}
