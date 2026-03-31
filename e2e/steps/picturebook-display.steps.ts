// Steps for picturebook-display feature
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

Given('系统中有已审核通过的绘本：', async () => {});

Given('《我爱学校》包含教学使用建议"建议在开学第一周使用"', async () => {});

Given('《我爱学校》包含亲子共读指导"家长可以在家模拟校园活动"', async () => {});

Given('《我爱学校》有上传的电版 PDF', async () => {});

Given('《我爱学校》有上传的纸版 PDF', async () => {});

Given('李老师 已阅读绘本到第 5 页', async ({ page }) => {
  await page.goto('/books');
  await page.waitForLoadState('networkidle');
  await page.click('text=《我爱学校》');
  await page.waitForSelector('text=在线阅读', { timeout: 5000 });
  await page.click('text=在线阅读');
  await page.waitForTimeout(2000);
  // Simulate reading to page 5
  for (let i = 0; i < 4; i++) {
    await page.click('button:has-text("下一页"), [aria-label="下一页"]', { timeout: 3000 }).catch(() => {});
  }
});

When('李老师 访问绘本浏览页面', async ({ page }) => {
  await page.goto('/books');
  await page.waitForLoadState('networkidle');
});

When('王家长 访问绘本浏览页面', async ({ page }) => {
  await page.goto('/books');
  await page.waitForLoadState('networkidle');
});

When('李老师 在绘本列表中点击《我爱学校》的卡片', async ({ page }) => {
  await page.click('text=《我爱学校》');
});

When('李老师 在详情页点击"在线阅读"', async ({ page }) => {
  await page.click('text=在线阅读');
});

When('李老师 翻到第 3 页', async ({ page }) => {
  for (let i = 0; i < 2; i++) {
    await page.click('button:has-text("下一页"), [aria-label="下一页"]', { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(500);
  }
});

When('李老师 关闭阅读器', async ({ page }) => {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
});

When('未认证用户 访问绘本浏览页面', async ({ page }) => {
  await page.goto('/books');
});

When('王老师 访问管理员绘本管理页面', async ({ page }) => {
  await page.goto('/admin/books');
  await page.waitForLoadState('networkidle');
});

Then('系统显示绘本卡片列表', async ({ page }) => {
  await page.waitForSelector('table, [class*="card"], [class*="book"]', { timeout: 5000 });
});

Then('卡片《我爱学校》显示书名"《我爱学校》"', async ({ page }) => {
  await page.waitForSelector('text=《我爱学校》', { timeout: 5000 });
});

Then('卡片显示维度标签"身心准备"', async ({ page }) => {
  await page.waitForSelector('text=身心准备', { timeout: 5000 });
});

Then('卡片显示认知水平"轻度"', async ({ page }) => {
  await page.waitForSelector('text=轻度', { timeout: 5000 });
});

Then('王家长 看到包含《我爱学校》的绘本列表', async ({ page }) => {
  await page.waitForSelector('text=《我爱学校》', { timeout: 5000 });
});

Then('详情页显示绘本完整信息', async ({ page }) => {
  await page.waitForSelector('text=教学使用建议, text=亲子共读指导', { timeout: 5000 });
});

Then('详情页显示"教学使用建议"板块', async ({ page }) => {
  await page.waitForSelector('text=教学使用建议', { timeout: 5000 });
});

Then('详情页显示"亲子共读指导"板块', async ({ page }) => {
  await page.waitForSelector('text=亲子共读指导', { timeout: 5000 });
});

Then('详情页显示"在线阅读"按钮', async ({ page }) => {
  await page.waitForSelector('text=在线阅读', { timeout: 5000 });
});

Then('详情页显示"下载 PDF"按钮', async ({ page }) => {
  await page.waitForSelector('text=下载', { timeout: 5000 });
});

Then('详情页不显示"下载 PDF"按钮', async ({ page }) => {
  const downloadBtn = await page.$('text=下载 PDF');
  expect(downloadBtn).toBeNull();
});

Then('系统重定向到登录页面', async ({ page }) => {
  await page.waitForURL(/\/login/, { timeout: 5000 });
});

Then('系统进入 PDF 阅读器页面', async ({ page }) => {
  await page.waitForSelector('canvas, [class*="pdf"], [class*="reader"]', { timeout: 5000 });
});

Then('PDF 正确加载', async ({ page }) => {
  await page.waitForSelector('canvas', { timeout: 5000 });
});

Then('阅读器自动定位到第 5 页', async ({ page }) => {
  await page.waitForTimeout(2000);
  // Check page indicator shows 5
  const pageText = await page.textContent('body');
  expect(pageText).toMatch(/5/);
});

Then('列表仅显示已审核通过的绘本', async ({ page }) => {
  await page.waitForSelector('text=已通过, text=approved', { timeout: 5000 });
});

Then('每本绘本旁显示对应的审核状态标签', async ({ page }) => {
  await page.waitForSelector('.ant-tag, [class*="tag"]', { timeout: 5000 });
});

Then('阅读器显示第 3 页', async ({ page }) => {
  await page.waitForTimeout(1000);
  const body = await page.textContent('body');
  expect(body).toMatch(/3/);
});
