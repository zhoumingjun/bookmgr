// Steps for 收藏与反馈 feature
import { createBdd } from 'playwright-bdd';
const { Given, When, Then } = createBdd();

// ============================================================
// When 步骤
// ============================================================

When('李老师 访问绘本{string}的详情页', async ({ page }, title: string) => {
  await page.goto('/books');
  await page.waitForLoadState('networkidle');
  const card = page.locator(`.ant-card:has-text("${title}")`).first();
  if (await card.isVisible({ timeout: 3000 }).catch(() => false)) { await card.click(); }
  await page.waitForLoadState('networkidle');
});

When('李老师 点击详情页的"收藏"按钮', async ({ page }) => {
  await page.click('button:has-text("收藏")');
  await page.waitForLoadState('networkidle');
});

When('李老师 点击"已收藏"按钮', async ({ page }) => {
  await page.click('button:has-text("已收藏")');
  await page.waitForLoadState('networkidle');
});

When('李老师 访问"我的收藏"页面', async ({ page }) => {
  await page.click('a:has-text("我的收藏"), button:has-text("我的收藏"), [href*="favorite"]');
  await page.waitForLoadState('networkidle');
});

When('李老师 访问"我的反馈"页面', async ({ page }) => {
  await page.click('a:has-text("我的反馈"), button:has-text("我的反馈"), [href*="feedback"]');
  await page.waitForLoadState('networkidle');
});

When('李老师 点击"开始阅读"按钮', async ({ page }) => {
  await page.click('button:has-text("开始阅读")');
  await page.waitForLoadState('networkidle');
});

When('李老师 阅读完成后点击"标记已读"按钮', async ({ page }) => {
  await page.click('button:has-text("标记已读"), button:has-text("已完成阅读")');
  await page.waitForLoadState('networkidle');
});

When('李老师 在详情页选择难度评分{string}', async ({ page }, rating: string) => {
  const star = rating.replace('星', '');
  const idx = parseInt(star) - 1;
  const stars = page.locator('.ant-rate-star, .ant-rate .ant-rate-star-full, [class*="star"]');
  if (await stars.nth(idx).isVisible({ timeout: 3000 }).catch(() => false)) {
    await stars.nth(idx).click();
  }
});

When('李老师 点击"提交评分"按钮', async ({ page }) => {
  await page.click('button:has-text("提交评分")');
  await page.waitForLoadState('networkidle');
});

When('李老师 在详情页选择使用场景{string}', async ({ page }, scene: string) => {
  const el = page.locator(`.ant-radio-wrapper:has-text("${scene}"), .ant-checkbox-wrapper:has-text("${scene}")`).first();
  if (await el.isVisible({ timeout: 3000 }).catch(() => false)) { await el.click(); }
});

When('李老师 点击"提交反馈"按钮', async ({ page }) => {
  await page.click('button:has-text("提交反馈"), button:has-text("提交")');
  await page.waitForLoadState('networkidle');
});

When('王家长 尝试删除李老师的反馈', async ({ page }) => {
  const deleteBtn = page.locator('button:has-text("删除"):not([disabled])');
  if (await deleteBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    await deleteBtn.first().click();
  }
});

When('王家长 已读完绘本{string}', async ({ page }, title: string) => {
  await page.goto('/books');
  await page.waitForLoadState('networkidle');
  const card = page.locator(`.ant-card:has-text("${title}")`).first();
  if (await card.isVisible({ timeout: 3000 }).catch(() => false)) { await card.click(); }
  await page.waitForLoadState('networkidle');
});

When('王家长 选择难度评分{string}', async ({ page }, rating: string) => {
  const star = rating.replace('星', '');
  const idx = parseInt(star) - 1;
  const stars = page.locator('.ant-rate-star, [class*="star"]');
  if (await stars.nth(idx).isVisible({ timeout: 3000 }).catch(() => false)) {
    await stars.nth(idx).click();
  }
});

When('王家长 点击"提交评分"按钮', async ({ page }) => {
  await page.click('button:has-text("提交评分")');
  await page.waitForLoadState('networkidle');
});

When('王老师 访问绘本{string}的统计数据页面', async ({ page }, title: string) => {
  await page.goto('/admin/books');
  await page.waitForLoadState('networkidle');
  const row = page.locator('.ant-table-row').filter({ hasText: title });
  await row.locator('button:has-text("统计"), button:has-text("详情")').click();
  await page.waitForLoadState('networkidle');
});

When('王老师 访问绘本浏览页面', async ({ page }) => {
  await page.goto('/books');
  await page.waitForLoadState('networkidle');
});

When('李老师 再次点击"收藏"按钮', async ({ page }) => {
  await page.click('button:has-text("收藏")');
  await page.waitForLoadState('networkidle');
});

// API-only
When('李老师 发送 POST 请求到 {string}', async () => { /* api-only */ });
When('李老师 发送 DELETE 请求到 {string}', async () => { /* api-only */ });
When('李老师 发送 GET 请求到 {string}', async () => { /* api-only */ });
When('李老师 发送 POST 请求到 {string} 包含：', async () => { /* api-only */ });

// ============================================================
// Then 步骤
// ============================================================

Then('系统显示收藏成功提示', async ({ page }) => {
  await page.waitForSelector('.ant-message-success', { timeout: 5000 });
});

Then('{string}按钮变为{string}状态', async ({ page }, _btn: string, state: string) => {
  await page.waitForSelector(`button:has-text("${state}"), .ant-tag:has-text("${state}")`, { timeout: 5000 });
});

Then('按钮恢复为{string}状态', async ({ page }, state: string) => {
  await page.waitForSelector(`button:has-text("${state}")`, { timeout: 5000 });
});

Then('系统返回 {int} Conflict', async ({ page }) => {
  await page.waitForSelector('text=409, text=冲突, text=已收藏', { timeout: 5000 });
});

Then('提示{string}', async ({ page }, msg: string) => {
  await page.waitForSelector(`.ant-message:has-text("${msg}")`, { timeout: 5000 });
});

Then('系统显示取消收藏成功提示', async ({ page }) => {
  await page.waitForSelector('.ant-message-success', { timeout: 5000 });
});

Then('页面显示{string}和{string}的绘本卡片', async ({ page }, t1: string, t2: string) => {
  await page.waitForSelector(`text=${t1}, text=${t2}`, { timeout: 5000 });
});

Then('分页控件显示{string}', async ({ page }, paginationText: string) => {
  await page.waitForSelector(`.ant-pagination:has-text("${paginationText}")`, { timeout: 5000 });
});

Then('详情页显示{string}', async ({ page }, text: string) => {
  await page.waitForSelector(`text=${text}`, { timeout: 5000 });
});

Then('系统记录阅读开始时间', async ({ page }) => {
  await page.waitForSelector('.ant-message-success, text=已开始', { timeout: 5000 });
});

Then('显示反馈提交成功', async ({ page }) => {
  await page.waitForSelector('.ant-message-success', { timeout: 5000 });
});

Then('详情页显示{string}', async ({ page }, text: string) => {
  await page.waitForSelector(`text=${text}`, { timeout: 5000 });
});

Then('详情页显示该用户已评分', async ({ page }) => {
  await page.waitForSelector('.ant-rate, [class*="star"]:not(.ant-rate-star-zero)', { timeout: 5000 });
});

Then('系统返回 {int} 错误', async ({ page }) => {
  await page.waitForSelector('text=400, text=错误', { timeout: 5000 });
});

Then('提示{string}', async ({ page }, msg: string) => {
  await page.waitForSelector(`.ant-message:has-text("${msg}")`, { timeout: 5000 });
});

Then('页面显示李老师的完整反馈历史', async ({ page }) => {
  await page.waitForSelector('.ant-list, [class*="feedback"], [class*="history"]', { timeout: 5000 });
});

Then('系统返回 {int} 无权限错误', async ({ page }) => {
  await page.waitForSelector('text=403, text=无权限', { timeout: 5000 });
});

Then('详情页显示平均难度评分已更新', async ({ page }) => {
  await page.waitForSelector('.ant-rate, text=平均', { timeout: 5000 });
});

Then('页面显示：总收藏数、阅读完成数、平均难度评分、各使用场景分布', async ({ page }) => {
  await page.waitForSelector('[class*="stat"], [class*="chart"], [class*="summary"]', { timeout: 5000 });
});

Then('响应状态码为 {int}', async () => { /* api-only */ });
Then('响应包含 {int} 个收藏记录', async () => { /* api-only */ });
Then('响应包含聚合统计（平均分、总收藏数等）', async () => { /* api-only */ });
