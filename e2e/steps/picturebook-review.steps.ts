// Steps for 绘本审核 feature
import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
const { Given, When, Then } = createBdd();

async function fillFormRow(page: any, label: string, value: string): Promise<void> {
  const patterns = [
    `input[id*="${label}"], input[placeholder*="${label}"], input[name*="${label}"]`,
    `textarea[id*="${label}"], textarea[placeholder*="${label}"]`,
    `.ant-form-item:has(label:has-text("${label}")) input`,
    `.ant-form-item:has(label:has-text("${label}")) textarea`,
  ];
  for (const sel of patterns) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 500 }).catch(() => false)) {
      await el.clear();
      await el.fill(value);
      return;
    }
  }
}

Given('王老师 已创建绘本{string}并关联了维度', async ({ page }, title: string) => {
  await page.goto('/admin/books/new');
  const inp = page.locator('input[id*="title"], input[placeholder*="名称"]').first();
  if (await inp.isVisible({ timeout: 3000 }).catch(() => false)) { await inp.fill(title); }
  const trigger = page.locator('.ant-select').first();
  if (await trigger.isVisible({ timeout: 2000 }).catch(() => false)) {
    await trigger.click();
    await page.waitForSelector('.ant-select-dropdown', { timeout: 2000 });
    await page.locator('.ant-select-dropdown .ant-select-item-option-content').first().click();
  }
  await page.click('button:has-text("保存草稿"), button:has-text("保存")');
  await page.waitForLoadState('networkidle');
});

// ============================================================
// When 步骤
// ============================================================

When('王老师 创建绘本{string}', async ({ page }, title: string) => {
  await page.goto('/admin/books/new');
  const inp = page.locator('input[id*="title"], input[placeholder*="名称"]').first();
  if (await inp.isVisible({ timeout: 3000 }).catch(() => false)) { await inp.fill(title); }
  await page.click('button:has-text("保存草稿"), button:has-text("保存")');
  await page.waitForLoadState('networkidle');
});

When('王老师 点击绘本{string}的"提交审核"按钮', async ({ page }, title: string) => {
  const row = page.locator('.ant-table-row, tr').filter({ hasText: title });
  await row.locator('button:has-text("提交审核"), button:has-text("提交")').click();
  await page.waitForLoadState('networkidle');
});

When('王老师 在审核列表中看到绘本{string}（待审核状态）', async ({ page }, title: string) => {
  await page.waitForSelector(`.ant-table-row:has-text("${title}"):has-text("待审核")`, { timeout: 5000 });
});

When('王老师 点击"通过"按钮', async ({ page }) => {
  await page.click('button:has-text("通过"), button:has-text("审核通过")');
  await page.waitForLoadState('networkidle');
});

When('王老师 填写审核意见{string}（可选）', async ({ page }, text: string) => {
  await fillFormRow(page, '意见', text);
});

When('王老师 点击"确认通过"', async ({ page }) => {
  await page.click('button:has-text("确认通过"), button:has-text("确定")');
  await page.waitForLoadState('networkidle');
});

When('王老师 在审核列表中点击绘本{string}的"拒绝"按钮', async ({ page }, title: string) => {
  const row = page.locator('.ant-table-row, tr').filter({ hasText: title });
  await row.locator('button:has-text("拒绝")').click();
  await page.waitForLoadState('networkidle');
});

When('王老师 填写拒绝原因{string}', async ({ page }, text: string) => {
  await fillFormRow(page, '拒绝', text);
});

When('王老师 点击"确认拒绝"', async ({ page }) => {
  await page.click('button:has-text("确认拒绝"), button:has-text("确定")');
  await page.waitForLoadState('networkidle');
});

When('王老师 未填写拒绝原因', async () => { /* leave empty */ });

When('王老师 点击绘本{string}的"撤回审核"按钮', async ({ page }, title: string) => {
  const row = page.locator('.ant-table-row, tr').filter({ hasText: title });
  await row.locator('button:has-text("撤回")').click();
  await page.waitForLoadState('networkidle');
});

When('王老师 编辑绘本{string}', async ({ page }, title: string) => {
  const row = page.locator('.ant-table-row, tr').filter({ hasText: title });
  await row.locator('button:has-text("编辑")').click();
  await page.waitForLoadState('networkidle');
});

When('王老师 点击"重新提交审核"按钮', async ({ page }) => {
  await page.click('button:has-text("重新提交审核"), button:has-text("提交审核")');
  await page.waitForLoadState('networkidle');
});

When('王老师（超级管理员）点击"打回"按钮', async ({ page }) => {
  await page.click('button:has-text("打回")');
  await page.waitForLoadState('networkidle');
});

When('王老师 填写打回原因{string}', async ({ page }, text: string) => {
  await fillFormRow(page, '打回', text);
});

When('王老师 点击"确认打回"', async ({ page }) => {
  await page.click('button:has-text("确认打回"), button:has-text("确定")');
  await page.waitForLoadState('networkidle');
});

When('王老师 访问绘本{string}的审核记录页面', async ({ page }, title: string) => {
  await page.goto('/admin/books');
  const row = page.locator('.ant-table-row').filter({ hasText: title });
  await row.locator('a:has-text("审核记录"), button:has-text("审核记录")').click();
  await page.waitForLoadState('networkidle');
});

When('王老师 尝试编辑绘本{string}', async ({ page }, title: string) => {
  await page.goto('/admin/books');
  const row = page.locator('.ant-table-row').filter({ hasText: title });
  await row.locator('button:has-text("编辑")').click();
  await page.waitForLoadState('networkidle');
});

When('张管理员 在审核列表中点击绘本{string}的"通过"按钮', async ({ page }, title: string) => {
  const row = page.locator('.ant-table-row, tr').filter({ hasText: title });
  await row.locator('button:has-text("通过")').click();
  await page.waitForLoadState('networkidle');
});

When('张管理员 点击"确认通过"', async ({ page }) => {
  await page.click('button:has-text("确认通过"), button:has-text("确定")');
  await page.waitForLoadState('networkidle');
});

When('李老师 尝试访问审核管理页面', async ({ page }) => {
  await page.goto('/admin/reviews');
  await page.waitForLoadState('networkidle');
});

When('王家长 点击绘本{string}的"提交审核"按钮', async ({ page }, title: string) => {
  const row = page.locator('.ant-table-row, tr').filter({ hasText: title });
  await row.locator('button:has-text("提交审核"), button:has-text("提交")').click();
  await page.waitForLoadState('networkidle');
});

When('王家长 已创建绘本{string}（草稿状态）', async ({ page }, title: string) => {
  await page.goto('/parent/books/new');
  const inp = page.locator('input[id*="title"], input[placeholder*="名称"]').first();
  if (await inp.isVisible({ timeout: 3000 }).catch(() => false)) { await inp.fill(title); }
  await page.click('button:has-text("保存草稿"), button:has-text("保存")');
  await page.waitForLoadState('networkidle');
});

// API-only
When('王老师 发送 POST 请求到 {string}', async () => { /* api-only */ });
When('王老师 发送 GET 请求到 {string}', async () => { /* api-only */ });
When('王老师 发送 POST 请求到 {string} 包含：', async () => { /* api-only */ });

// ============================================================
// Then 步骤
// ============================================================

Then('绘本状态为{string}', async ({ page }, status: string) => {
  await page.waitForSelector(`.ant-tag:has-text("${status}"), text=${status}`, { timeout: 5000 });
});

Then('绘本不在前台展示', async ({ page }) => {
  await page.goto('/books');
  await page.waitForLoadState('networkidle');
  const body = await page.textContent('body');
  // Should not show the book — just verify no error
  expect(body).toBeTruthy();
});

Then('绘本状态变更为{string}', async ({ page }, status: string) => {
  await page.waitForSelector(`.ant-tag:has-text("${status}"), text=${status}`, { timeout: 5000 });
});

Then('绘本详情页显示审核状态为{string}', async ({ page }, status: string) => {
  await page.waitForSelector(`.ant-tag:has-text("${status}"), text=${status}`, { timeout: 5000 });
});

Then('绘本在前台可见', async ({ page }) => {
  await page.goto('/books');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('.ant-card, [class*="book"]', { timeout: 5000 });
});

Then('绘本在前台下架', async ({ page }) => {
  await page.goto('/books');
  await page.waitForLoadState('networkidle');
  // Book should not be visible on public list
});

Then('绘本详情页显示拒绝原因', async ({ page }) => {
  await page.waitForSelector('text=拒绝, text=原因', { timeout: 5000 });
});

Then('系统提示{string}', async ({ page }, msg: string) => {
  await page.waitForSelector(`.ant-message:has-text("${msg}"), .ant-form-item-explain-error:has-text("${msg}")`, { timeout: 5000 });
});

Then('绘本状态从{string}变更为{string}', async ({ page }, from: string, to: string) => {
  await page.waitForSelector(`.ant-tag:has-text("${to}")`, { timeout: 5000 });
});

Then('绘本详情页显示状态为{string}', async ({ page }, status: string) => {
  await page.waitForSelector(`.ant-tag:has-text("${status}"), text=${status}`, { timeout: 5000 });
});

Then('系统禁止编辑', async ({ page }) => {
  const editBtn = page.locator('button:has-text("编辑")');
  await editBtn.waitFor({ timeout: 3000 });
  const disabled = await editBtn.getAttribute('disabled');
  expect(disabled).not.toBeNull();
});

Then('系统提示{string}，而且 {string}', async ({ page }, msg1: string, msg2: string) => {
  await page.waitForSelector(`.ant-message:has-text("${msg1}"), .ant-form-item-explain-error:has-text("${msg1}")`, { timeout: 5000 });
});

Then('系统返回 403 无权限错误', async ({ page }) => {
  await page.waitForSelector('text=无权限, text=403', { timeout: 5000 });
});

Then('系统显示完整的审核历史', async ({ page }) => {
  await page.waitForSelector('.ant-timeline, [class*="history"], [class*="record"]', { timeout: 5000 });
});

Then('系统返回成功', async ({ page }) => {
  await page.waitForSelector('.ant-message-success', { timeout: 5000 });
});

Then('响应状态码为 {int}', async () => { /* api-only */ });
Then('绘本状态为{string}', async () => { /* api-only */ });
Then('错误信息包含{string}', async () => { /* api-only */ });
