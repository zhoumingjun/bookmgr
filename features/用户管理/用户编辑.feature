# language: zh-CN
功能: 用户编辑
  作为管理员
  我想要编辑用户信息
  以便我可以修改用户角色和密码

  @e2e-only
  场景: 管理员修改用户角色
    假如 已存在用户 "roleuser" 密码 "password123"
    而且 我已登录为管理员
    当 我访问用户管理页面
    而且 我点击用户 "roleuser" 的编辑按钮
    而且 我修改角色为 "管理员"
    而且 我点击保存按钮
    那么 我应该看到用户更新成功的提示

  @e2e-only
  场景: 管理员重置用户密码
    假如 已存在用户 "pwduser" 密码 "password123"
    而且 我已登录为管理员
    当 我访问用户管理页面
    而且 我点击用户 "pwduser" 的编辑按钮
    而且 我输入新密码 "newpass456"
    而且 我点击保存按钮
    那么 我应该看到用户更新成功的提示

  @api-only
  场景: API 更新用户角色
    假如 已存在用户 "apiroleuser" 密码 "password123"
    而且 我已登录为管理员
    当 我发送 PATCH 请求更新用户 "apiroleuser" 的角色为 "ROLE_ADMIN"
    那么 响应状态码应该是 200

  @api-only
  场景: API 更新用户密码后可用新密码登录
    假如 已存在用户 "apipwduser" 密码 "oldpass123"
    而且 我已登录为管理员
    当 我发送 PATCH 请求更新用户 "apipwduser" 的密码为 "newpass789"
    那么 响应状态码应该是 200
    当 我发送 POST 请求到 "/api/v1/auth/login" 包含:
      | username | apipwduser |
      | password | newpass789 |
    那么 响应状态码应该是 200
