# language: zh-CN
功能: 用户注册
  作为一个新用户
  我想要注册一个账号
  以便我可以使用图书管理系统

  @e2e-only
  场景: 通过注册页面成功注册
    假如 我在注册页面
    当 我输入用户名 "newuser_<timestamp>"
    而且 我输入邮箱 "newuser_<timestamp>@test.com"
    而且 我输入密码 "password123"
    而且 我输入确认密码 "password123"
    而且 我点击注册按钮
    那么 我应该看到注册成功的提示
    而且 我应该被重定向到登录页面

  @e2e-only
  场景: 两次密码不一致时注册失败
    假如 我在注册页面
    当 我输入用户名 "testuser1"
    而且 我输入邮箱 "test1@test.com"
    而且 我输入密码 "password123"
    而且 我输入确认密码 "different456"
    那么 我应该看到密码不一致的错误提示

  @api-only
  场景: API 注册缺少必填字段
    当 我发送 POST 请求到 "/api/v1/auth/register" 包含:
      | username | |
      | email    | test@test.com |
      | password | password123   |
    那么 响应状态码应该是 400

  @api-only
  场景: API 注册密码过短
    当 我发送 POST 请求到 "/api/v1/auth/register" 包含:
      | username | shortpwduser       |
      | email    | shortpwd@test.com  |
      | password | 12345              |
    那么 响应状态码应该是 400

  @api-only
  场景: API 注册用户名重复
    假如 已存在用户 "dupuser" 密码 "password123"
    当 我发送 POST 请求到 "/api/v1/auth/register" 包含:
      | username | dupuser            |
      | email    | dup2@test.com      |
      | password | password123        |
    那么 响应状态码应该是 409
