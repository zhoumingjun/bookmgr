// Shared steps for picturebook features
// All Given steps that are shared across picturebook features go here.
// Feature-specific When/Then steps go in their respective .steps.ts files.
import { createBdd } from 'playwright-bdd';
const { Given } = createBdd();

async function loginAs(page: any, username: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"], input[id*="username"], input[name*="user"]', username);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
}

// ============================================================
// Given 步骤 — 登录 / fixture
// ============================================================

Given('超级管理员"王老师"已登录系统', async ({ page }) => {
  await loginAs(page, 'admin', 'admin');
  await page.waitForURL('**/admin**', { timeout: 10000 });
});
Given('普通管理员"张管理员"已存在', async () => { /* fixture */ });
Given('普通管理员"张管理员"已登录系统', async ({ page }) => {
  await loginAs(page, 'admin2', 'admin123');
  await page.waitForURL('**/admin**', { timeout: 10000 });
});
Given('普通管理员"张管理员"{string}', async () => { /* fixture */ });
Given('王老师 已登录系统', async ({ page }) => {
  await loginAs(page, 'admin', 'admin');
  await page.waitForURL('**/admin**', { timeout: 10000 });
});
Given('教师用户"李老师"已存在', async () => { /* fixture */ });
Given('教师用户"李老师"已登录系统', async ({ page }) => {
  await loginAs(page, 'teacher', 'teacher123');
  await page.waitForURL(/\/(teacher|console)\//, { timeout: 10000 });
});
Given('家长用户"王家长"已存在', async () => { /* fixture */ });
Given('家长用户"王家长"已登录系统', async ({ page }) => {
  await loginAs(page, 'parent', 'parent123');
  await page.waitForURL(/\/parent\//, { timeout: 10000 });
});
Given('系统已初始化五大适应维度：', async () => { /* fixture */ });
Given('维度{string}下有以下子分类：', async () => { /* fixture */ });
Given('王老师 已创建绘本{string}', async ({ page }, title: string) => {
  await page.goto('/admin/books/new');
  const inp = page.locator('input[id*="title"], input[id*="name"], input[placeholder*="名称"]').first();
  if (await inp.isVisible({ timeout: 3000 }).catch(() => false)) { await inp.fill(title); }
  await page.click('button:has-text("保存草稿"), button:has-text("保存")');
  await page.waitForLoadState('networkidle');
});
Given('王老师 已创建以下绘本：', async () => { /* fixture */ });
Given('系统中有已审核通过的绘本：', async () => { /* fixture */ });
Given('系统中有以下已审核通过的绘本：', async () => { /* fixture */ });
Given('王老师 已创建绘本{string}（草稿状态）', async ({ page }, title: string) => {
  await page.goto('/admin/books/new');
  const inp = page.locator('input[id*="title"], input[placeholder*="名称"]').first();
  if (await inp.isVisible({ timeout: 3000 }).catch(() => false)) { await inp.fill(title); }
  await page.click('button:has-text("保存草稿"), button:has-text("保存")');
  await page.waitForLoadState('networkidle');
});
Given('王老师 已提交审核并通过审核', async () => { /* fixture */ });
Given('绘本{string}已被拒绝，拒绝原因是{string}', async () => { /* fixture */ });
Given('绘本{string}状态为{string}', async () => { /* fixture */ });
Given('绘本{string}经过了以下审核流程：', async () => { /* fixture */ });
Given('绘本有审核历史记录', async () => { /* fixture */ });
Given('绘本{string}已审核通过', async () => { /* fixture */ });
Given('绘本有 5 条反馈记录', async () => { /* fixture */ });
Given('绘本{string}包含教学使用建议{string}', async () => { /* fixture */ });
Given('绘本{string}包含亲子共读指导{string}', async () => { /* fixture */ });
Given('绘本{string}有上传的电版 PDF', async () => { /* fixture */ });
Given('绘本{string}有上传的纸版 PDF', async () => { /* fixture */ });
Given('绘本{string}已被 {int} 名用户收藏', async () => { /* fixture */ });
Given('李老师 已收藏绘本{string}', async () => { /* fixture */ });
Given('李老师 已收藏绘本{string}和{string}', async () => { /* fixture */ });
Given('李老师 已收藏 {int} 本绘本', async () => { /* fixture */ });
Given('李老师 已开始阅读{string}', async () => { /* fixture */ });
Given('李老师 已读完{string}', async () => { /* fixture */ });
Given('李老师 已提交了以下反馈：', async () => { /* fixture */ });
Given('李老师 已提交反馈到{string}', async () => { /* fixture */ });
Given('李老师 已阅读绘本到第 {int} 页', async () => { /* fixture */ });
Given('{string} 已登录系统并持有有效 token', async () => { /* fixture */ });
Given('{string} 已登录系统', async () => { /* fixture */ });
Given('{string} 已提交绘本{string}到待审核状态', async () => { /* fixture */ });
Given('绘本{string}处于待审核状态', async () => { /* fixture */ });
Given('系统有 {int} 本绘本符合当前筛选条件', async () => { /* fixture */ });
Given('{string} 已为绘本{string}上传了纸版 PDF', async () => { /* fixture */ });
Given('{string} 正在在线阅读{string}', async () => { /* fixture */ });
Given('{string} 的核心目标是{string}', async () => { /* fixture */ });
Given('{string} 被 {int} 名教师浏览过', async () => { /* fixture */ });
Given('李老师 已登录为教师', async ({ page }) => {
  await loginAs(page, 'teacher', 'teacher123');
  await page.waitForURL(/\/(teacher|console)\//, { timeout: 10000 });
});
Given('王家长 已登录为家长', async ({ page }) => {
  await loginAs(page, 'parent', 'parent123');
  await page.waitForURL(/\/parent\//, { timeout: 10000 });
});
Given('李老师 已登录系统并跳转到教师端', async ({ page }) => {
  await loginAs(page, 'teacher', 'teacher123');
  await page.waitForURL(/\/(teacher|console)\//, { timeout: 10000 });
});
Given('王家长 已登录系统并跳转到家长端', async ({ page }) => {
  await loginAs(page, 'parent', 'parent123');
  await page.waitForURL(/\/parent\//, { timeout: 10000 });
});
Given('高对比模式已开启', async () => { /* fixture */ });
Given('{string} 的角色为{string}', async () => { /* fixture */ });
Given('绘本{string}已审核通过', async () => { /* fixture */ });
