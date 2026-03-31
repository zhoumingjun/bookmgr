import { createBdd } from 'playwright-bdd';
const { Given, When, Then } = createBdd();

// Common fixture setup
Given('超级管理员"王老师"已登录系统', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"], input[id*="username"]', 'admin');
  await page.fill('input[type="password"]', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin**', { timeout: 10000 });
});

Given('系统已初始化五大适应维度：', async () => {});

Given('王老师 已登录系统', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"]', 'admin');
  await page.fill('input[type="password"]', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin**', { timeout: 10000 });
});

Given('系统当前无任何维度分类', async () => {});

When('王老师 访问维度管理页面', async ({ page }) => {
  await page.goto('/admin/dimensions');
});

When('王老师 点击"添加维度"按钮', async ({ page }) => {
  await page.click('button:has-text("添加维度"), button:has-text("新建")');
});

When('王老师 填写维度信息：', async ({ page }, dataTable) => {
  const rows = dataTable.rows();
  for (const row of rows) {
    const label = row[0].value;
    const value = row[1].value;
    if (label.includes('名称')) {
      await page.fill('input[id*="name"], input[placeholder*="名称"]', value);
    }
    if (label.includes('Slug')) {
      await page.fill('input[id*="slug"], input[placeholder*="slug"]', value);
    }
  }
  await page.click('button:has-text("保存")');
});

When('王老师 点击"保存"按钮', async ({ page }) => {
  await page.click('button:has-text("保存")');
});

When('王老师 删除维度"测试维度"', async ({ page }) => {
  await page.click('button:has-text("删除"):first');
  await page.click('button:has-text("确认")');
});

When('王老师 尝试删除维度"身心准备"', async ({ page }) => {
  await page.click('button:has-text("删除"):first');
});

When('普通管理员"张管理员"已登录系统', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"]', 'admin2');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin**', { timeout: 10000 });
});

When('张管理员 访问维度管理页面', async ({ page }) => {
  await page.goto('/admin/dimensions');
});

When('张管理员 创建一级维度"学习准备"', async ({ page }) => {
  await page.click('button:has-text("新建")');
  await page.fill('input[placeholder*="名称"]', '学习准备');
  await page.fill('input[placeholder*="slug"]', 'learning');
  await page.click('button:has-text("保存")');
});

When('李老师 尝试访问维度管理页面', async ({ page }) => {
  await page.goto('/admin/dimensions');
});

Then('系统返回新维度信息', async ({ page }) => {
  await page.waitForSelector('.ant-message-success, [class*="success"]', { timeout: 5000 });
});

Then('维度名称为"身心准备"', async ({ page }) => {
  await page.waitForSelector('text=身心准备', { timeout: 5000 });
});

Then('维度 Slug 为"physical"', async ({ page }) => {
  await page.waitForSelector('text=physical', { timeout: 5000 });
});

Then('维度名称更新为"身心发展"', async ({ page }) => {
  await page.waitForSelector('text=身心发展', { timeout: 5000 });
});

Then('系统返回 409 Conflict 错误', async ({ page }) => {
  await page.waitForSelector('text=409, text=已存在', { timeout: 5000 });
});

Then('错误信息包含"该维度下有关联绘本', async ({ page }) => {
  await page.waitForSelector('text=关联绘本', { timeout: 5000 });
});

Then('系统返回 403 无权限错误', async ({ page }) => {
  await page.waitForSelector('text=无权限, text=403', { timeout: 5000 });
});

Then('维度"测试维度"不再出现在维度列表中', async ({ page }) => {
  // Wait for table to refresh
  await page.waitForTimeout(1000);
  const text = await page.textContent('body');
  expect(text).not.toContain('测试维度');
});
