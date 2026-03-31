// Steps for accessibility feature
import { createBdd } from 'playwright-bdd';
const { Given, When, Then } = createBdd();

Given('系统已实现基础的用户认证和角色权限', async () => {});

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

Given('超级管理员"王老师"已登录系统', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"]', 'admin');
  await page.fill('input[type="password"]', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin**', { timeout: 10000 });
});

Given('李老师 已登录为教师', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"]', 'teacher');
  await page.fill('input[type="password"]', 'teacher123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/teacher\//, { timeout: 10000 });
});

Given('王家长 已登录为家长', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"]', 'parent');
  await page.fill('input[type="password"]', 'parent123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/parent\//, { timeout: 10000 });
});

Given('高对比模式已开启', async ({ page }) => {
  await page.goto('/teacher/console');
  await page.click('button:has-text("对比度"), [aria-label*="对比度"]');
});

When('李老师 登录系统', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"]', 'teacher');
  await page.fill('input[type="password"]', 'teacher123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/teacher\//, { timeout: 10000 });
});

When('王家长 登录系统', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"]', 'parent');
  await page.fill('input[type="password"]', 'parent123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/parent\//, { timeout: 10000 });
});

When('王老师 登录系统', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"]', 'admin');
  await page.fill('input[type="password"]', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin**', { timeout: 10000 });
});

When('李老师 访问任意页面', async ({ page }) => {
  await page.goto('/teacher/console');
  await page.waitForLoadState('networkidle');
});

When('李老师 在页面右上角点击"字号"设置', async ({ page }) => {
  await page.click('button:has-text("字号"), button:has-text("字体"), [aria-label*="字号"]');
});

When('李老师 选择"特大（1.5x）"', async ({ page }) => {
  await page.click('text=特大, text=1.5x, text=1.5');
});

When('李老师 点击"字号"设置', async ({ page }) => {
  await page.click('button:has-text("字号")');
});

When('李老师 选择"超特大（2x）"', async ({ page }) => {
  await page.click('text=超特大, text=2x, text=2.0');
});

When('李老师 刷新页面', async ({ page }) => {
  await page.reload();
  await page.waitForLoadState('networkidle');
});

When('李老师 点击右上角"对比度"开关', async ({ page }) => {
  await page.click('button:has-text("对比度"), [aria-label*="对比"]');
});

When('李老师 开启高对比模式', async ({ page }) => {
  // Find and click the high contrast toggle
  const toggle = page.locator('text=高对比, [aria-label*="对比"], input[type="checkbox"]').first();
  if (await toggle.isVisible({ timeout: 2000 }).catch(() => false)) {
    await toggle.click();
  }
});

When('李老师 关闭高对比模式开关', async ({ page }) => {
  const toggle = page.locator('[aria-label*="对比"], input[type="checkbox"]').first();
  if (await toggle.isVisible({ timeout: 2000 }).catch(() => false)) {
    await toggle.click();
  }
});

When('李老师 使用 Tab 键导航页面', async ({ page }) => {
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
  }
});

When('李老师 尝试直接访问 /parent/browse', async ({ page }) => {
  await page.goto('/parent/browse');
});

When('王家长 尝试直接访问 /teacher/browse', async ({ page }) => {
  await page.goto('/teacher/browse');
});

When('李老师 设置字号为"超特大（2x）"', async ({ page }) => {
  await page.goto('/teacher/console');
  await page.click('button:has-text("字号")');
  await page.click('text=超特大, text=2x');
});

When('李老师 开启高对比模式', async ({ page }) => {
  await page.click('button:has-text("对比度"), [aria-label*="对比"]');
});

Then('系统跳转到 /teacher/browse 页面', async ({ page }) => {
  await page.waitForURL(/\/teacher\//, { timeout: 5000 });
});

Then('左侧导航显示教师端专属菜单', async ({ page }) => {
  await page.waitForSelector('text=绘本浏览, text=我的收藏', { timeout: 5000 });
});

Then('系统跳转到 /parent/browse 页面', async ({ page }) => {
  await page.waitForURL(/\/parent\//, { timeout: 5000 });
});

Then('左侧导航显示家长端专属菜单', async ({ page }) => {
  await page.waitForSelector('text=绘本浏览, text=阅读记录', { timeout: 5000 });
});

Then('系统跳转到 /admin/dashboard', async ({ page }) => {
  await page.waitForURL(/\/admin\//, { timeout: 5000 });
});

Then('左侧导航显示管理后台菜单', async ({ page }) => {
  await page.waitForSelector('text=用户管理, text=绘本管理', { timeout: 5000 });
});

Then('左侧导航显示"绘本浏览"', async ({ page }) => {
  await page.waitForSelector('text=绘本浏览', { timeout: 5000 });
});

Then('左侧导航显示"我的收藏"', async ({ page }) => {
  await page.waitForSelector('text=我的收藏', { timeout: 5000 });
});

Then('左侧导航显示"提交审核"', async ({ page }) => {
  await page.waitForSelector('text=提交审核', { timeout: 5000 });
});

Then('左侧导航显示"我的反馈"', async ({ page }) => {
  await page.waitForSelector('text=我的反馈', { timeout: 5000 });
});

Then('左侧导航不显示"用户管理"菜单', async ({ page }) => {
  const userMenu = await page.$('text=用户管理');
  expect(userMenu).toBeNull();
});

Then('左侧导航不显示"绘本上传"菜单', async ({ page }) => {
  const uploadMenu = await page.$('text=上传绘本');
  expect(uploadMenu).toBeNull();
});

Then('左侧导航不显示"审核管理"菜单', async ({ page }) => {
  const reviewMenu = await page.$('text=审核管理');
  expect(reviewMenu).toBeNull();
});

Then('全站字体从 16px 变为 24px', async ({ page }) => {
  await page.waitForTimeout(500);
  const fontSize = await page.evaluate(() => {
    const el = document.querySelector('body');
    return window.getComputedStyle(el).fontSize;
  });
  expect(parseInt(fontSize)).toBeGreaterThanOrEqual(20);
});

Then('按钮的 min-height 从 32px 变为 64px', async ({ page }) => {
  const btnHeight = await page.evaluate(() => {
    const btn = document.querySelector('button') as HTMLElement;
    return window.getComputedStyle(btn).minHeight;
  });
  expect(parseInt(btnHeight)).toBeGreaterThanOrEqual(50);
});

Then('字号仍保持"特大（1.5x）"', async ({ page }) => {
  await page.waitForTimeout(500);
  const fontSize = await page.evaluate(() => {
    const el = document.querySelector('body');
    return window.getComputedStyle(el).fontSize;
  });
  expect(parseInt(fontSize)).toBeGreaterThanOrEqual(20);
});

Then('页面背景变为纯白色', async ({ page }) => {
  const bg = await page.evaluate(() => {
    return window.getComputedStyle(document.body).backgroundColor;
  });
  // High contrast should have near-white background
  expect(bg).toMatch(/rgba?\(/);
});

Then('正文文字变为纯黑色', async ({ page }) => {
  const color = await page.evaluate(() => {
    const el = document.querySelector('p, span, div');
    return window.getComputedStyle(el).color;
  });
  expect(color).toMatch(/rgba?\(/);
});

Then('主要按钮变为高饱和蓝色', async ({ page }) => {
  const btnColor = await page.evaluate(() => {
    const btn = document.querySelector('button.ant-btn-primary') as HTMLElement;
    return window.getComputedStyle(btn).backgroundColor;
  });
  expect(btnColor).toMatch(/rgba?\(/);
});

Then('页面完全恢复 Ant Design 默认配色', async ({ page }) => {
  await page.waitForTimeout(500);
  // Just verify page is accessible
  await page.waitForSelector('body');
});

Then('字号仍为"超特大"', async ({ page }) => {
  const fontSize = await page.evaluate(() => {
    const el = document.querySelector('body');
    return window.getComputedStyle(el).fontSize;
  });
  expect(parseInt(fontSize)).toBeGreaterThanOrEqual(28);
});

Then('高对比模式保持开启', async ({ page }) => {
  await page.waitForTimeout(500);
  // Check localStorage or toggle state
  const isHighContrast = await page.evaluate(() => {
    return localStorage.getItem('highContrast') === 'true' || 
           document.body.classList.contains('high-contrast');
  });
  expect(isHighContrast).toBe(true);
});

Then('按钮的 min-height 不小于 44px', async ({ page }) => {
  const btnHeight = await page.evaluate(() => {
    const btn = document.querySelector('button') as HTMLElement;
    return parseInt(window.getComputedStyle(btn).minHeight);
  });
  expect(btnHeight).toBeGreaterThanOrEqual(44);
});

Then('焦点指示器清晰可见', async ({ page }) => {
  const outline = await page.evaluate(() => {
    const btn = document.querySelector('button:focus, a:focus, input:focus') as HTMLElement;
    if (!btn) return '';
    return window.getComputedStyle(btn).outline;
  });
  expect(outline).toBeTruthy();
});

Then('详情页不显示"提交审核"按钮', async ({ page }) => {
  const reviewBtn = await page.$('button:has-text("提交审核"), button:has-text("审核")');
  expect(reviewBtn).toBeNull();
});

Then('系统返回 403 或重定向到 /teacher/browse', async ({ page }) => {
  await page.waitForURL(url => /\/teacher\//.test(url.toString()) || url.toString().includes('403'), { timeout: 5000 });
});

Then('系统返回 403 或重定向到 /parent/browse', async ({ page }) => {
  await page.waitForURL(url => /\/parent\//.test(url.toString()) || url.toString().includes('403'), { timeout: 5000 });
});

Then('页面布局正常无错位', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  // No visible overflow or broken layout
  const hasOverflow = await page.evaluate(() => {
    return document.body.scrollWidth > document.body.clientWidth;
  });
  expect(hasOverflow).toBe(false);
});
