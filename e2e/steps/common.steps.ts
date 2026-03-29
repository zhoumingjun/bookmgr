import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { When, Then } = createBdd();

// --- When ---

When('我尝试访问 {string}', async ({ page }, path: string) => {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
});

// --- API step placeholders for shared scenarios ---
// These steps handle API-related Gherkin steps in E2E context.
// They are no-ops in E2E since the actual API testing is in godog.

When('我发送 POST 请求到 {string} 包含:', async ({}, _path: string, _table: any) => {
  // API-only step — no-op in E2E
});

When('我发送 GET 请求到 {string}', async ({}, _path: string) => {
  // API-only step — no-op in E2E
});

When('我发送 PATCH 请求更新该图书的标题为 {string}', async ({}, _title: string) => {
  // API-only step — no-op in E2E
});

When('我发送 DELETE 请求删除该图书', async ({}) => {
  // API-only step — no-op in E2E
});

When('我发送 DELETE 请求删除自己', async ({}) => {
  // API-only step — no-op in E2E
});

When('我发送 DELETE 请求删除用户 {string}', async ({}, _username: string) => {
  // API-only step — no-op in E2E
});

When('我发送 PATCH 请求更新用户 {string} 的角色为 {string}', async ({}, _user: string, _role: string) => {
  // API-only step — no-op in E2E
});

When('我发送 PATCH 请求更新用户 {string} 的密码为 {string}', async ({}, _user: string, _pwd: string) => {
  // API-only step — no-op in E2E
});

When('我上传PDF文件到该图书', async ({}) => {
  // API-only step — no-op in E2E
});

When('我通过 Bearer Token 下载该图书的PDF', async ({}) => {
  // API-only step — no-op in E2E
});

When('我通过 access_token 查询参数下载该图书的PDF', async ({}) => {
  // API-only step — no-op in E2E
});

When('我不带认证发送 GET 请求到 {string}', async ({}, _path: string) => {
  // API-only step — no-op in E2E
});

When('我发送 {word} 请求到 {string}', async ({}, _method: string, _path: string) => {
  // API-only step — no-op in E2E (for scenario outline)
});

// --- Then (API stubs) ---

Then('响应状态码应该是 {int}', async ({}, _code: number) => {
  // API-only step — no-op in E2E
});

Then('响应应该包含 {string} 字段', async ({}, _field: string) => {
  // API-only step — no-op in E2E
});

Then('响应应该包含 {string} 值为 {string}', async ({}, _field: string, _value: string) => {
  // API-only step — no-op in E2E
});

Then('下载响应状态码应该是 {int}', async ({}, _code: number) => {
  // API-only step — no-op in E2E
});

Then('下载响应的 Content-Type 应该是 {string}', async ({}, _ct: string) => {
  // API-only step — no-op in E2E
});
