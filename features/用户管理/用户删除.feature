# language: zh-CN
功能: 用户删除
  作为管理员
  我想要删除不需要的用户
  以便保持系统用户的整洁

  @e2e-only
  场景: 管理员删除用户
    假如 已存在用户 "deluser" 密码 "password123"
    而且 我已登录为管理员
    当 我访问用户管理页面
    而且 我点击用户 "deluser" 的删除按钮
    而且 我确认删除
    那么 我应该看到用户删除成功的提示

  @e2e-only
  场景: 删除用户需要确认
    假如 已存在用户 "confirmuser" 密码 "password123"
    而且 我已登录为管理员
    当 我访问用户管理页面
    而且 我点击用户 "confirmuser" 的删除按钮
    那么 我应该看到删除确认弹窗

  @api-only
  场景: API 管理员不能删除自己
    假如 我已登录为管理员
    当 我发送 DELETE 请求删除自己
    那么 响应状态码应该是 400

  @api-only
  场景: API 普通用户无权删除用户
    假如 已存在用户 "nopermuser" 密码 "password123"
    而且 我已登录为普通用户
    当 我发送 DELETE 请求删除用户 "nopermuser"
    那么 响应状态码应该是 403
