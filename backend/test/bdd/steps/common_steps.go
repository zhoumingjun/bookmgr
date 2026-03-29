//go:build bdd

package steps

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/cucumber/godog"
	"github.com/zhoumingjun/bookmgr/backend/test/bdd/helpers"
)

func registerCommonSteps(ctx *godog.ScenarioContext, client **helpers.TestClient) {
	// --- Given ---
	ctx.Step(`^我已登录为管理员$`, func(ctx context.Context) error {
		c := GetClient(ctx)
		return c.LoginAs(helpers.AdminUsername, helpers.AdminPassword)
	})

	ctx.Step(`^我已登录为普通用户$`, func(ctx context.Context) (context.Context, error) {
		c := GetClient(ctx)
		// Ensure testuser exists
		body := map[string]string{
			"username": helpers.TestUsername,
			"email":    helpers.TestUsername + "@test.com",
			"password": helpers.TestPassword,
		}
		_ = c.Request("POST", "/api/v1/auth/register", body) // ignore if exists
		err := c.LoginAs(helpers.TestUsername, helpers.TestPassword)
		return ctx, err
	})

	ctx.Step(`^已存在用户 "([^"]*)" 密码 "([^"]*)"$`, func(ctx context.Context, username, password string) error {
		c := GetClient(ctx)
		body := map[string]string{
			"username": username,
			"email":    username + "@test.com",
			"password": password,
		}
		_ = c.Request("POST", "/api/v1/auth/register", body) // ignore if exists
		return nil
	})

	// --- When: POST with table ---
	ctx.Step(`^我发送 POST 请求到 "([^"]*)" 包含:$`, func(ctx context.Context, path string, table *godog.Table) error {
		c := GetClient(ctx)
		body := tableToMap(table)
		return c.Request("POST", path, body)
	})

	// --- When: generic method + path (handles GET, POST, PATCH, DELETE) ---
	ctx.Step(`^我发送 (\w+) 请求到 "([^"]*)"$`, func(ctx context.Context, method, path string) error {
		c := GetClient(ctx)
		var body interface{}
		if method == "POST" || method == "PATCH" {
			body = map[string]interface{}{}
		}
		return c.Request(method, path, body)
	})

	// --- When: unauthenticated ---
	ctx.Step(`^我不带认证发送 GET 请求到 "([^"]*)"$`, func(ctx context.Context, path string) error {
		c := GetClient(ctx)
		c.Token = "" // clear token
		return c.Request("GET", path, nil)
	})

	// --- Then: status code ---
	ctx.Step(`^响应状态码应该是 (\d+)$`, func(ctx context.Context, expected int) error {
		c := GetClient(ctx)
		if c.LastStatus != expected {
			return fmt.Errorf("expected status %d, got %d\nBody: %s", expected, c.LastStatus, string(c.LastBody))
		}
		return nil
	})

	// --- Then: response contains field ---
	ctx.Step(`^响应应该包含 "([^"]*)" 字段$`, func(ctx context.Context, field string) error {
		c := GetClient(ctx)
		var result map[string]interface{}
		if err := json.Unmarshal(c.LastBody, &result); err != nil {
			return fmt.Errorf("parse response: %w\nBody: %s", err, string(c.LastBody))
		}
		if _, ok := result[field]; !ok {
			return fmt.Errorf("response missing field %q\nBody: %s", field, string(c.LastBody))
		}
		return nil
	})

	// --- Then: response field equals value ---
	ctx.Step(`^响应应该包含 "([^"]*)" 值为 "([^"]*)"$`, func(ctx context.Context, field, expected string) error {
		c := GetClient(ctx)
		var result map[string]interface{}
		if err := json.Unmarshal(c.LastBody, &result); err != nil {
			return fmt.Errorf("parse response: %w", err)
		}
		// Check top-level and nested "book" / "user" objects
		if val, ok := result[field]; ok {
			if fmt.Sprintf("%v", val) == expected {
				return nil
			}
		}
		for _, key := range []string{"book", "user"} {
			if nested, ok := result[key].(map[string]interface{}); ok {
				if val, ok := nested[field]; ok {
					if fmt.Sprintf("%v", val) == expected {
						return nil
					}
				}
			}
		}
		return fmt.Errorf("field %q not equal to %q\nBody: %s", field, expected, string(c.LastBody))
	})

	// --- Mixed scenario stubs (shared steps that are UI-focused but appear in mixed features) ---
	ctx.Step(`^我应该看到页面标题 "([^"]*)"$`, func(ctx context.Context, _ string) error {
		return nil // UI assertion — verified in E2E only
	})
	ctx.Step(`^图书卡片应该显示作者 "([^"]*)"$`, func(ctx context.Context, _ string) error {
		return nil
	})
	ctx.Step(`^我应该看到添加时间$`, func(ctx context.Context) error {
		return nil
	})
	ctx.Step(`^表格应该包含 "([^"]*)" 用户$`, func(ctx context.Context, _ string) error {
		return nil
	})
	ctx.Step(`^我应该看到包含 "([^"]*)" 的图书卡片$`, func(ctx context.Context, _ string) error {
		return nil
	})
	ctx.Step(`^我应该看到图书标题 "([^"]*)"$`, func(ctx context.Context, _ string) error {
		return nil
	})
	ctx.Step(`^我应该看到图书作者 "([^"]*)"$`, func(ctx context.Context, _ string) error {
		return nil
	})
	ctx.Step(`^我应该看到用户列表表格$`, func(ctx context.Context) error {
		return nil
	})
	ctx.Step(`^我应该看到管理员角色标签$`, func(ctx context.Context) error {
		return nil
	})
	ctx.Step(`^我访问图书浏览页面$`, func(ctx context.Context) error {
		return nil
	})
	ctx.Step(`^我访问该图书的详情页面$`, func(ctx context.Context) error {
		return nil
	})
	ctx.Step(`^我访问用户管理页面$`, func(ctx context.Context) error {
		return nil
	})
}

// tableToMap converts a 2-column godog.Table (key | value) to map.
func tableToMap(table *godog.Table) map[string]string {
	m := make(map[string]string)
	for _, row := range table.Rows {
		if len(row.Cells) >= 2 {
			key := strings.TrimSpace(row.Cells[0].Value)
			val := strings.TrimSpace(row.Cells[1].Value)
			m[key] = val
		}
	}
	return m
}
