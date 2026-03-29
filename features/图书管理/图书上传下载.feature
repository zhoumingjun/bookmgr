# language: zh-CN
功能: 图书上传下载
  作为管理员
  我想要上传PDF文件到图书
  以便用户可以在线阅读和下载

  @api-only
  场景: 管理员上传PDF文件
    假如 我已登录为管理员
    而且 管理员已创建图书 "上传测试书" 作者 "上传作者"
    当 我上传PDF文件到该图书
    那么 响应状态码应该是 200
    而且 响应应该包含 "file_path" 字段

  @api-only
  场景: 通过 Bearer Token 下载PDF
    假如 我已登录为管理员
    而且 管理员已创建图书 "下载测试书" 作者 "下载作者" 并上传PDF
    当 我通过 Bearer Token 下载该图书的PDF
    那么 下载响应状态码应该是 200
    而且 下载响应的 Content-Type 应该是 "application/pdf"

  @api-only
  场景: 通过 access_token 查询参数下载PDF
    假如 我已登录为普通用户
    而且 管理员已创建图书 "Token下载书" 作者 "Token作者" 并上传PDF
    当 我通过 access_token 查询参数下载该图书的PDF
    那么 下载响应状态码应该是 200

  @api-only
  场景: 下载不存在的图书文件返回 404
    假如 我已登录为普通用户
    当 我发送 GET 请求到 "/api/v1/books/00000000-0000-0000-0000-000000000000/download"
    那么 响应状态码应该是 404
