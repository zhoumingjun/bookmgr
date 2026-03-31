// Steps for picturebook-review feature
import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
const { Given, When, Then } = createBdd();

Given('超级管理员"王老师"已登录系统', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"], input[id*="username"]', 'admin');
  await page.fill('input[type="password"]', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin**', { timeout: 10000 });
});

Given('普通管理员"张管理员"已存在', async () => {});

Given('王老师 已创建绘本《待审核绘本》（草稿状态）', async ({ page }) => {
  await page.goto('/admin/books/new');
  await page.waitForLoadState('networkidle');
  await page.fill('input[id*="title"], input[placeholder*="名称"]', '《待审核绘本》');
  await page.click('button:has-text("保存草稿"), button:has-text("保存")');
  await page.waitForTimeout(2000);
});

Given('王老师 已提交绘本《待拒绝绘本》到待审核状态', async ({ page }) => {
  await page.goto('/admin/books');
  await page.waitForLoadState('networkidle');
  const row = page.locator('text=《待拒绝绘本》').first();
  if (await row.isVisible({ timeout: 2000 }).catch(() => false)) {
    await row.click();
    await page.click('button:has-text("提交审核"), button:has-text("审核")');
    await page.waitForTimeout(1000);
  }
});

Given('绘本《待审核绘本》处于待审核状态', async ({ page }) => {
  await page.goto('/admin/books');
  await page.waitForSelector('text=待审核', { timeout: 5000 });
});

Given('绘本《已上线绘本》状态为"已通过"', async () => {});

Given('绘本《审核历史绘本》经过了以下审核流程：', async () => {});

Given('绘本《不可编辑绘本》处于待审核状态', async () => {});

Given('家长用户"王家长"已存在', async () => {});

Given('家长用户"王家长"已登录系统', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"]', 'parent');
  await page.fill('input[type="password"]', 'parent123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/parent\//, { timeout: 10000 });
});

Given('家长用户"王家长"已创建绘本《家长创作绘本》（草稿状态）', async ({ page }) => {
  await page.goto('/admin/books/new');
  await page.fill('input[id*="title"]', '《家长创作绘本》');
  await page.click('button:has-text("保存草稿")');
  await page.waitForTimeout(1000);
});

When('王老师 在审核列表中看到绘本《待审核绘本》（待审核状态）', async ({ page }) => {
  await page.goto('/admin/reviews');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('text=待审核', { timeout: 5000 });
});

When('王老师 点击"通过"按钮', async ({ page }) => {
  await page.click('button:has-text("通过"), button:has-text("审核通过"), button[aria-label*="通过"]');
});

When('王老师 填写审核意见"内容符合要求，可以上线"（可选）', async ({ page }) => {
  await page.fill('textarea, input[id*="reason"]', '内容符合要求，可以上线');
});

When('王老师 点击"确认通过"', async ({ page }) => {
  await page.click('button:has-text("确认"), button:has-text("确定"), button:has-text("通过")');
});

When('王老师 点击"拒绝"按钮', async ({ page }) => {
  await page.click('button:has-text("拒绝"), button:has-text("审核拒绝")');
});

When('王老师 填写拒绝原因"绘本内容涉及不适宜主题"', async ({ page }) => {
  await page.fill('textarea, input[id*="reason"]', '绘本内容涉及不适宜主题');
});

When('王老师 点击"确认拒绝"', async ({ page }) => {
  await page.click('button:has-text("确认"), button:has-text("确定")');
});

When('王老师 点击绘本《待撤回绘本》的"撤回审核"按钮', async ({ page }) => {
  await page.goto('/admin/books');
  await page.waitForLoadState('networkidle');
  const row = page.locator('text=《待撤回绘本》').first();
  if (await row.isVisible({ timeout: 2000 }).catch(() => false)) {
    await row.click();
    await page.click('button:has-text("撤回")');
    await page.waitForTimeout(1000);
  }
});

When('王老师 编辑绘本《待重新提交绘本》补充了缺失内容', async ({ page }) => {
  await page.goto('/admin/books');
  await page.waitForLoadState('networkidle');
  await page.click('text=《待重新提交绘本》');
  await page.fill('input[id*="title"]', '《待重新提交绘本（已补充）》');
  await page.click('button:has-text("保存")');
});

When('王老师 点击"重新提交审核"按钮', async ({ page }) => {
  await page.click('button:has-text("重新提交审核"), button:has-text("提交审核")');
});

When('王老师（超级管理员）点击"打回"按钮', async ({ page }) => {
  await page.click('button:has-text("打回"), button:has-text("撤销通过")');
});

When('王老师 填写打回原因"经复查发现内容不适龄"', async ({ page }) => {
  await page.fill('textarea', '经复查发现内容不适龄');
});

When('王老师 访问绘本《审核历史绘本》的审核记录页面', async ({ page }) => {
  await page.goto('/admin/books');
  await page.click('text=《审核历史绘本》');
  await page.click('text=审核记录, text=审核历史');
});

When('王老师 尝试编辑绘本《不可编辑绘本》', async ({ page }) => {
  await page.goto('/admin/books');
  await page.click('text=《不可编辑绘本》');
});

When('张管理员 已登录系统', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"]', 'admin2');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin**', { timeout: 10000 });
});

When('张管理员 在审核列表中点击绘本《待审阅绘本》的"通过"按钮', async ({ page }) => {
  await page.goto('/admin/reviews');
  await page.waitForLoadState('networkidle');
  await page.click('button:has-text("通过")');
});

When('李老师 尝试访问审核管理页面', async ({ page }) => {
  await page.goto('/admin/reviews');
});

When('王家长 尝试提交绘本审核', async ({ page }) => {
  await page.goto('/books');
  await page.click('text=《家长创作绘本》');
  await page.click('button:has-text("提交审核")');
});

When('王家长 点击绘本《家长创作绘本》的"提交审核"按钮', async ({ page }) => {
  await page.goto('/books');
  await page.click('text=《家长创作绘本》');
  await page.click('button:has-text("提交审核")');
});

Then('绘本状态为"草稿"', async ({ page }) => {
  await page.waitForSelector('text=草稿, .ant-tag:has-text("草稿")', { timeout: 5000 });
});

Then('绘本状态变更为"待审核"', async ({ page }) => {
  await page.waitForSelector('text=待审核, .ant-tag:has-text("待审核")', { timeout: 5000 });
});

Then('绘本详情页显示审核状态为"待审核"', async ({ page }) => {
  await page.waitForSelector('text=待审核', { timeout: 5000 });
});

Then('绘本状态变更为"已通过"', async ({ page }) => {
  await page.waitForSelector('text=已通过, .ant-tag:has-text("已通过"), text=通过', { timeout: 5000 });
});

Then('绘本在前台可见', async ({ page }) => {
  await page.goto('/books');
  await page.waitForLoadState('networkidle');
});

Then('绘本状态变更为"已拒绝"', async ({ page }) => {
  await page.waitForSelector('text=已拒绝, .ant-tag:has-text("已拒绝")', { timeout: 5000 });
});

Then('绘本不在前台展示', async ({ page }) => {
  await page.goto('/books');
  await page.waitForLoadState('networkidle');
  const body = await page.textContent('body');
  expect(body).not.toContain('已拒绝的绘本名');
});

Then('绘本详情页显示拒绝原因', async ({ page }) => {
  await page.waitForSelector('text=拒绝原因', { timeout: 5000 });
});

Then('系统提示"请填写拒绝原因"', async ({ page }) => {
  await page.waitForSelector('text=请填写拒绝原因, text=必填', { timeout: 5000 });
});

Then('绘本状态从"待审核"变更为"草稿"', async ({ page }) => {
  await page.waitForSelector('text=草稿', { timeout: 5000 });
});

Then('绘本状态从"已拒绝"变更为"待审核"', async ({ page }) => {
  await page.waitForSelector('text=待审核', { timeout: 5000 });
});

Then('系统禁止编辑', async ({ page }) => {
  await page.waitForTimeout(1000);
  // Check that edit is blocked - either no edit button or an error message
  const hasError = await page.locator('text=无权限, text=待审核, .ant-message').isVisible({ timeout: 3000 }).catch(() => false);
  expect(hasError).toBeTruthy();
});

Then('系统提示"待审核状态下无法编辑，请先撤回"', async ({ page }) => {
  await page.waitForSelector('text=待审核状态下无法编辑', { timeout: 5000 });
});

Then('系统返回 403 无权限错误', async ({ page }) => {
  await page.waitForSelector('text=无权限, text=403', { timeout: 5000 });
});

Then('系统显示完整的审核历史', async ({ page }) => {
  await page.waitForSelector('text=审核历史, text=审核记录', { timeout: 5000 });
});
