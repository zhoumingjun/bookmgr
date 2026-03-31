// Shared steps for picturebook features
import { createBdd } from 'playwright-bdd';
const { Given, When, Then } = createBdd();

Given('超级管理员"王老师"已登录系统', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"], input[id*="username"]', 'admin');
  await page.fill('input[type="password"]', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin**', { timeout: 10000 });
});

Given('教师用户"李老师"已登录系统', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"]', 'teacher');
  await page.fill('input[type="password"]', 'teacher123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(teacher|console)\//, { timeout: 10000 });
});

Given('家长用户"王家长"已登录系统', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"]', 'parent');
  await page.fill('input[type="password"]', 'parent123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/parent\//, { timeout: 10000 });
});

Given('王老师 已创建绘本{string}', async ({ page }, title) => {
  await page.goto('/admin/books/new');
  await page.fill('input[id*="title"], input[placeholder*="名称"]', title);
  await page.click('button:has-text("保存草稿")');
});

Given('王老师 已创建以下绘本：', async () => {});

Given('系统中有已审核通过的绘本：', async () => {});

When('王老师 在绘本管理页面点击"新建绘本"按钮', async ({ page }) => {
  await page.goto('/admin/books/new');
});

When('李老师 访问绘本浏览页面', async ({ page }) => {
  await page.goto('/books');
});

When('王家长 访问绘本浏览页面', async ({ page }) => {
  await page.goto('/books');
});

When('李老师 在绘本列表中点击{string}的卡片', async ({ page }, title) => {
  await page.click(`text=${title}`);
});

When('王老师 访问绘本管理页面', async ({ page }) => {
  await page.goto('/admin/books');
});

When('未认证用户 访问绘本浏览页面', async ({ page }) => {
  await page.goto('/books');
});

When('王老师 填写以下绘本信息：', async ({ page }, dataTable) => {});

When('王老师 选择一级维度{string}', async ({ page }, dim) => {
  await page.click(`text=${dim}`);
});

When('王老师 点击"保存草稿"按钮', async ({ page }) => {
  await page.click('button:has-text("保存草稿"), button:has-text("保存")');
});

Then('绘本状态为"草稿"', async ({ page }) => {
  await page.waitForSelector('text=草稿', { timeout: 5000 });
});

Then('系统返回 403 无权限错误', async ({ page }) => {
  await page.waitForSelector('text=无权限, text=403', { timeout: 5000 });
});

Then('页面显示"无权限访问"', async ({ page }) => {
  await page.waitForSelector('text=无权限', { timeout: 5000 });
});

Then('系统返回新绘本信息', async ({ page }) => {
  await page.waitForSelector('.ant-message-success', { timeout: 5000 });
});
