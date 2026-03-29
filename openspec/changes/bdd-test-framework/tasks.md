## Phase 1: 基础设施

- [ ] 1.1 创建目录结构：features/（含中文子目录）、e2e/（steps/, fixtures/, helpers/）、backend/test/bdd/（steps/, helpers/, testdata/）、ops/cd/{prod,test}/、scripts/
- [ ] 1.2 迁移 docker-compose.yml + kong/ → ops/cd/prod/，创建 ops/cd/prod/.env.example
- [ ] 1.3 创建 ops/cd/test/docker-compose.yml（端口 9000，tmpfs，确定性密钥）+ .env + kong/kong.yml
- [ ] 1.4 创建 scripts/env.sh（prod/test up/down/rebuild/logs/run/run-api/run-e2e/status）
- [ ] 1.5 初始化 e2e/package.json（@playwright/test, playwright-bdd, typescript），安装 Chromium
- [ ] 1.6 创建 e2e/playwright.config.ts（defineBddConfig, language: zh-CN, baseURL: http://localhost:9000, 排除 @api-only）
- [ ] 1.7 创建 E2E fixtures（e2e/fixtures/test-fixtures.ts: authenticatedPage）和 helpers（api-client.ts, test-data.ts）
- [ ] 1.8 创建 e2e/global-setup.ts（通过 API 确保 test 环境中 testuser 已注册）
- [ ] 1.9 创建 backend/test/bdd/features_test.go（godog.TestSuite 入口，//go:build bdd，排除 @e2e-only），go get godog
- [ ] 1.10 创建 Go helpers（backend/test/bdd/helpers/client.go: HTTPClient 封装 + LoginAs；testdata.go: 常量；testdata/sample.pdf）
- [ ] 1.11 更新 .gitignore（ops/cd/prod/.env, e2e/.features-gen/, e2e/test-results/, e2e/playwright-report/）
- [ ] 1.12 验证：scripts/env.sh test up + wait 成功，scripts/env.sh prod up 成功，两环境同时运行互不干扰

## Phase 2: E2E BDD Features（Playwright）

- [ ] 2.1 编写 features/认证/注册.feature 和 features/认证/登录.feature
- [ ] 2.2 实现 e2e/steps/auth.steps.ts（登录/注册表单交互、成功/错误断言、重定向验证）
- [ ] 2.3 编写 features/图书管理/图书浏览.feature 和 features/图书管理/图书详情.feature
- [ ] 2.4 实现 e2e/steps/book.steps.ts — 浏览部分（卡片列表断言、导航到详情、元数据展示、下载按钮）
- [ ] 2.5 编写 features/图书管理/图书增删改.feature 和 features/图书管理/图书上传下载.feature
- [ ] 2.6 实现 e2e/steps/book.steps.ts — 管理部分（admin 表格、新增/编辑/删除流程、文件上传）
- [ ] 2.7 编写 features/用户管理/用户列表.feature、用户编辑.feature、用户删除.feature
- [ ] 2.8 实现 e2e/steps/user.steps.ts（admin 用户表格、角色编辑、密码重置、删除确认）
- [ ] 2.9 编写 features/权限控制/角色权限.feature
- [ ] 2.10 实现 e2e/steps/common.steps.ts — 权限部分（URL 重定向断言、菜单可见性检查）
- [ ] 2.11 编写 features/界面布局/导航栏.feature 和 features/界面布局/国际化.feature
- [ ] 2.12 实现 e2e/steps/layout.steps.ts（导航菜单内容、下拉菜单、语言切换、localStorage 验证）
- [ ] 2.13 全量 E2E 运行：scripts/env.sh test run-e2e，调试失败用例，生成 HTML 报告

## Phase 3: API BDD Features（Go godog）

- [ ] 3.1 实现 backend/test/bdd/steps/common_steps.go（共享步骤：登录身份、发送请求、状态码断言、响应字段断言）
- [ ] 3.2 实现 backend/test/bdd/steps/auth_steps.go（注册 API 步骤：缺少字段、密码过短、用户名重复；登录 API 步骤：JWT 验证）
- [ ] 3.3 实现 backend/test/bdd/steps/book_steps.go（图书 CRUD、multipart 上传、Bearer/access_token 下载、分页、404 检查）
- [ ] 3.4 实现 backend/test/bdd/steps/user_steps.go（用户列表、角色更新、密码更新后重新登录、自删除防护、权限拒绝）
- [ ] 3.5 全量 API BDD 运行：scripts/env.sh test run-api，调试失败用例
- [ ] 3.6 集成验证：scripts/env.sh test run 跑完整流程（API + E2E），验证退出码
