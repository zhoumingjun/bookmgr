## Why

bookmgr 项目当前有 13 个 API 端点、9 个前端页面、角色权限控制和国际化功能，但**零测试覆盖**。没有任何测试文件、测试运行器配置或测试依赖。每次变更后无法自动回归验证，bug 只能靠手动测试发现。

## What Changes

引入 BDD 测试框架，使用中文 Gherkin 编写业务行为规范，分两层实现：

1. **E2E 层**：Playwright + playwright-bdd，通过浏览器验证完整用户流程
2. **API 层**：Go godog，通过 HTTP 调用验证后端业务逻辑

同时建立环境管理体系，将 prod 和 test 环境隔离到 `ops/cd/` 目录下，支持同时运行互不干扰。

## Capabilities

### New Capabilities

- `bdd-features`: 11 个中文 Gherkin Feature 文件，~46 个场景，覆盖认证、图书管理、用户管理、权限控制、界面布局
- `e2e-playwright`: Playwright BDD 测试层，验证浏览器端完整用户流程
- `api-godog`: Go godog 测试层，验证 REST API 业务逻辑
- `env-management`: prod/test 双环境管理（ops/cd/{prod,test}/），端口隔离（8000/9000），统一管理脚本

### Modified Capabilities

- `docker-compose`: 现有 docker-compose.yml 和 kong/ 迁移到 ops/cd/prod/，test 环境独立定义在 ops/cd/test/

## Impact

- **Dependencies**: 前端新增 `@playwright/test`, `playwright-bdd`（e2e/ 独立 package.json）；后端新增 `github.com/cucumber/godog`
- **Code**: 纯新增文件，不修改任何现有业务代码
- **Infrastructure**: docker-compose.yml 和 kong/ 从根目录迁移到 ops/cd/prod/
- **No API changes**
- **No DB schema changes**
