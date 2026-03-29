# language: zh-CN
功能: 用户登录
  作为一个已注册用户
  我想要登录系统
  以便我可以访问图书管理功能

  @e2e-only
  场景: 管理员成功登录
    假如 我在登录页面
    当 我输入用户名 "admin"
    而且 我输入密码 "changeme"
    而且 我点击登录按钮
    那么 我应该被重定向到图书浏览页面
    而且 导航栏应该显示用户管理入口

  @e2e-only
  场景: 普通用户成功登录
    假如 已存在用户 "loginuser" 密码 "password123"
    而且 我在登录页面
    当 我输入用户名 "loginuser"
    而且 我输入密码 "password123"
    而且 我点击登录按钮
    那么 我应该被重定向到图书浏览页面
    而且 导航栏不应该显示用户管理入口

  @e2e-only
  场景: 使用错误密码登录失败
    假如 我在登录页面
    当 我输入用户名 "admin"
    而且 我输入密码 "wrongpassword"
    而且 我点击登录按钮
    那么 我应该看到登录错误提示

  @api-only
  场景: API 登录成功返回 JWT
    假如 已存在用户 "jwtuser" 密码 "password123"
    当 我发送 POST 请求到 "/api/v1/auth/login" 包含:
      | username | jwtuser     |
      | password | password123 |
    那么 响应状态码应该是 200
    而且 响应应该包含 "token" 字段

  @api-only
  场景: API 使用错误凭证登录
    当 我发送 POST 请求到 "/api/v1/auth/login" 包含:
      | username | nonexistent |
      | password | badpassword |
    那么 响应状态码应该是 401
