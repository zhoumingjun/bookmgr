//go:build bdd

package steps

// Auth steps are covered by common_steps.go:
// - 已存在用户 "X" 密码 "Y"
// - 我发送 POST 请求到 "/api/v1/auth/register" 包含:
// - 我发送 POST 请求到 "/api/v1/auth/login" 包含:
// - 响应状态码应该是 NNN
// - 响应应该包含 "token" 字段

// No additional auth-specific steps needed — all auth scenarios
// use generic common steps (POST with table, status assertion, field assertion).
