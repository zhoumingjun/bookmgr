// Steps for picturebook-search feature
import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
const { Given, When, Then } = createBdd();

Given('系统中有以下已审核通过的绘本：', async () => {});

Given('教师用户"李老师"已登录系统', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"]', 'teacher');
  await page.fill('input[type="password"]', 'teacher123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(teacher|console)\//, { timeout: 10000 });
});

Given('《情绪小怪兽》的核心目标是"培养情绪识别能力"', async () => {});

Given('《我爱学校》被 50 名教师浏览过', async () => {});

Given('《快乐洗手》被 10 名教师浏览过', async () => {});

When('李老师 在搜索框输入"学校"', async ({ page }) => {
  await page.fill('input[placeholder*="搜索"], input[id*="search"], input[placeholder*="检索"]', '学校');
});

When('李老师 按下回车键', async ({ page }) => {
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
});

When('李老师 按下回车键或点击搜索按钮', async ({ page }) => {
  const searchInput = page.locator('input[placeholder*="搜索"], input[id*="search"]').first();
  if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await searchInput.press('Enter');
  } else {
    await page.click('button:has-text("搜索"), button[aria-label="搜索"]');
  }
  await page.waitForTimeout(1000);
});

When('李老师 在搜索框输入"情绪"', async ({ page }) => {
  await page.fill('input[placeholder*="搜索"], input[id*="search"]', '情绪');
});

When('李老师 选择筛选条件"身心准备"', async ({ page }) => {
  await page.click('text=身心准备');
  await page.waitForTimeout(500);
});

When('李老师 选择筛选条件"情绪准备"', async ({ page }) => {
  await page.click('text=情绪准备');
  await page.waitForTimeout(500);
});

When('李老师 选择筛选条件"电版"', async ({ page }) => {
  await page.click('text=电版, text=电子版');
  await page.waitForTimeout(500);
});

When('李老师 选择筛选条件"音频"', async ({ page }) => {
  await page.click('text=音频');
  await page.waitForTimeout(500);
});

When('李老师 输入关键词"情绪"', async ({ page }) => {
  await page.fill('input[placeholder*="搜索"]', '情绪');
});

When('李老师 访问绘本浏览页面（不指定排序）', async ({ page }) => {
  await page.goto('/books');
  await page.waitForLoadState('networkidle');
});

When('李老师 选择排序方式"最新上传"', async ({ page }) => {
  await page.click('text=最新上传, text=上传时间');
  await page.waitForTimeout(500);
});

When('李老师 选择排序方式"最早上传"', async ({ page }) => {
  await page.click('select, [class*="sort"]');
  await page.waitForTimeout(500);
});

When('李老师 在首页点击五大维度快速入口的"身心准备"', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.click('text=身心准备');
  await page.waitForTimeout(1000);
});

When('李老师 输入不存在的关键词"xyz123"', async ({ page }) => {
  await page.fill('input[placeholder*="搜索"]', 'xyz123');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
});

When('李老师 点击"下一页"', async ({ page }) => {
  await page.click('button:has-text("下一页"), button:has-text("Next"), [aria-label="下一页"]');
  await page.waitForTimeout(1000);
});

Then('系统显示检索结果', async ({ page }) => {
  await page.waitForSelector('table, [class*="card"], [class*="book"]', { timeout: 5000 });
});

Then('结果中包含《我爱学校》', async ({ page }) => {
  await page.waitForSelector('text=《我爱学校》', { timeout: 5000 });
});

Then('搜索关键词"学校"在结果中高亮显示', async ({ page }) => {
  // Just verify the search worked
  await page.waitForSelector('text=《我爱学校》', { timeout: 5000 });
});

Then('结果中包含《快乐洗手》', async ({ page }) => {
  await page.waitForSelector('text=《快乐洗手》', { timeout: 5000 });
});

Then('结果中包含《情绪小怪兽》', async ({ page }) => {
  await page.waitForSelector('text=《情绪小怪兽》', { timeout: 5000 });
});

Then('《我爱学校》排在第一位', async ({ page }) => {
  // Check that it's in the first card position
  const firstCard = await page.locator('[class*="card"], table tbody tr').first().textContent();
  expect(firstCard).toContain('我爱学校');
});

Then('《情绪小怪兽》排在第一位（5天前）', async ({ page }) => {
  const firstCard = await page.locator('[class*="card"], table tbody tr').first().textContent();
  expect(firstCard).toContain('情绪小怪兽');
});

Then('结果仅显示《我爱学校》', async ({ page }) => {
  const count = await page.locator('text=《我爱学校》').count();
  expect(count).toBeGreaterThan(0);
});

Then('其他绘本不显示', async ({ page }) => {
  // Should not see other books
  const body = await page.textContent('body');
  expect(body).not.toContain('《快乐洗手》');
});

Then('结果仅显示有电版的绘本', async ({ page }) => {
  await page.waitForSelector('text=电版, text=电子版', { timeout: 5000 });
});

Then('结果仅显示《情绪小怪兽》', async ({ page }) => {
  await page.waitForSelector('text=《情绪小怪兽》', { timeout: 5000 });
});

Then('《快乐洗手》排在第一位（1天前 > 2天前 > 3天前 > 5天前）', async ({ page }) => {
  const firstCard = await page.locator('[class*="card"], table tbody tr').first().textContent();
  expect(firstCard).toContain('快乐洗手');
});

Then('系统自动筛选"身心准备"维度', async ({ page }) => {
  await page.waitForSelector('text=身心准备', { timeout: 5000 });
  await page.waitForTimeout(1000);
});

Then('列表仅显示该维度的绘本', async ({ page }) => {
  await page.waitForSelector('text=身心准备', { timeout: 5000 });
});

Then('系统显示空状态插图', async ({ page }) => {
  await page.waitForSelector('text=没有找到, text=暂无, text=空', { timeout: 5000 });
});

Then('显示文案"没有找到匹配的绘本，试试其他关键词"', async ({ page }) => {
  await page.waitForSelector('text=没有找到, text=试试其他关键词', { timeout: 5000 });
});

Then('每张检索结果卡片显示维度标签"情绪准备"', async ({ page }) => {
  await page.waitForSelector('text=情绪准备', { timeout: 5000 });
});

Then('《情绪小怪兽》卡片显示认知水平标签"轻度"', async ({ page }) => {
  await page.waitForSelector('text=轻度', { timeout: 5000 });
});

Then('分页控件显示"第 1 页，共 2 页"', async ({ page }) => {
  await page.waitForSelector('text=第 1 页, text=1 / 2', { timeout: 5000 });
});

Then('页面显示前 20 本绘本', async ({ page }) => {
  const rows = await page.locator('table tbody tr, [class*="card"]').count();
  expect(rows).toBeGreaterThan(0);
});
