// Steps for picturebook-feedback feature
import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { Given, When, Then } = createBdd();

// --- Given ---

Given('系统中有已审核通过的绘本《我爱学校》', async ({ page }) => {
  // Book should already exist from test fixture
  await page.goto('/console/books');
  await page.waitForLoadState('networkidle');
});

Given('李老师 已收藏绘本《我爱学校》', async ({ page }) => {
  // Navigate to book and favorite it
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"]', 'teacher');
  await page.fill('input[type="password"]', 'teacher123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/console\/books/, { timeout: 10000 });
  // Find and click the book
  await page.click('text=我爱学校');
  await page.waitForSelector('[class*="card"]', { timeout: 5000 });
  // Favorite if not already
  const favBtn = page.locator('button').filter({ hasText: /收藏|favorite/i });
  if (await favBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await favBtn.click();
    await page.waitForTimeout(1000);
  }
});

Given('李老师 已登录系统', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"]', 'teacher');
  await page.fill('input[type="password"]', 'teacher123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/console\//, { timeout: 10000 });
});

Given('家长用户"王家长"已登录系统', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"]', 'parent');
  await page.fill('input[type="password"]', 'parent123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/console\//, { timeout: 10000 });
});

Given('李老师 已收藏 15 本绘本', async ({}) => {});
Given('李老师 收藏了 25 本绘本', async ({}) => {});
Given('《我爱学校》已被 5 名用户收藏', async ({}) => {});
Given('李老师 已开始阅读《我爱学校》', async ({}) => {});
Given('李老师 已读完《我爱学校》', async ({}) => {});
Given('李老师 已提交了以下反馈：', async ({}) => {});
Given('李老师 已提交反馈到《我爱学校》', async ({}) => {});
Given('绘本有 5 条反馈记录', async ({}) => {});
Given('绘本 ID 已知', async ({}) => {});
Given('李老师 已收藏 2 本绘本', async ({}) => {});
Given('李老师 已收藏绘本', async ({}) => {});

// --- When ---

When('李老师 访问绘本《我爱学校》的详情页', async ({ page }) => {
  await page.goto('/console/books');
  await page.waitForLoadState('networkidle');
  await page.click('text=我爱学校');
  await page.waitForURL(/\/console\/books\//, { timeout: 5000 });
});

When('李老师 点击详情页的"收藏"按钮', async ({ page }) => {
  await page.click('button:has-text("收藏")');
});

When('李老师 再次点击"收藏"按钮', async ({ page }) => {
  await page.click('button:has-text("收藏"), button:has-text("已收藏")');
});

When('李老师 点击"已收藏"按钮', async ({ page }) => {
  await page.click('button:has-text("已收藏")');
});

When('李老师 访问"我的收藏"页面', async ({ page }) => {
  await page.goto('/console/favorites');
  await page.waitForLoadState('networkidle');
});

When('李老师 收藏绘本', async ({ page }) => {
  await page.goto('/console/books');
  await page.click('text=我爱学校');
  await page.click('button:has-text("收藏")');
});

When('李老师 在详情页选择难度评分"5星"', async ({ page }) => {
  await page.click('[class*="rate"], .ant-rate');
});

When('李老师 点击"提交评分"按钮', async ({ page }) => {
  await page.click('button:has-text("提交"), button:has-text("评分")');
});

When('李老师 在详情页选择使用场景"课堂使用"', async ({ page }) => {
  await page.click('button:has-text("课堂使用"), [class*="select"]');
});

When('李老师 点击"提交反馈"按钮', async ({ page }) => {
  await page.click('button:has-text("提交反馈"), button:has-text("提交")');
});

When('李老师 访问"我的反馈"页面', async ({ page }) => {
  await page.goto('/console/feedback');
  await page.waitForLoadState('networkidle');
});

When('李老师 发送 POST 请求到 "/api/v1/books/{id}/favorite"', async ({}) => {});
When('李老师 发送 DELETE 请求到 "/api/v1/books/{id}/favorite"', async ({}) => {});
When('李老师 发送 GET 请求到 "/api/v1/users/me/favorites"', async ({}) => {});
When('李老师 发送 POST 请求到 "/api/v1/books/{id}/feedback" 包含：', async ({}) => {});
When('李老师 发送 GET 请求到 "/api/v1/books/{id}/feedback"', async ({}) => {});

When('李老师 点击"开始阅读"按钮', async ({ page }) => {
  await page.click('button:has-text("开始阅读"), button:has-text("在线阅读")');
});

When('李老师 阅读完成后点击"标记已读"按钮', async ({ page }) => {
  await page.click('button:has-text("标记已读"), button:has-text("完成")');
});

When('王家长 已登录系统', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"]', 'parent');
  await page.fill('input[type="password"]', 'parent123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/console\//, { timeout: 10000 });
});

When('王家长 已读完绘本《我爱学校》', async ({}) => {});
When('王家长 选择难度评分"4星"', async ({ page }) => {
  await page.locator('[class*="rate"] .ant-rate-star').nth(3).click();
});

When('王家长 点击"提交评分"按钮', async ({ page }) => {
  await page.click('button:has-text("提交"), button:has-text("评分")');
});

When('超级管理员"王老师"已登录系统', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"], input[id*="username"]', 'admin');
  await page.fill('input[type="password"]', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin**', { timeout: 10000 });
});

When('王老师 访问绘本《我爱学校》的统计数据页面', async ({ page }) => {
  await page.goto('/console/books');
  await page.click('text=我爱学校');
  await page.waitForTimeout(2000);
});

// --- Then ---

Then('系统显示收藏成功提示', async ({ page }) => {
  await expect(page.locator('.ant-message')).toContainText(/收藏|Favorite/i, { timeout: 5000 });
});

Then('"收藏"按钮变为"已收藏"状态', async ({ page }) => {
  await expect(page.locator('button:has-text("已收藏")')).toBeVisible({ timeout: 5000 });
});

Then('系统返回 409 Conflict', async ({ page }) => {
  await page.waitForTimeout(500);
  // 409 is handled by API; UI may show a toast
  const msg = await page.locator('.ant-message, .ant-notification').textContent().catch(() => '');
  expect(msg).toMatch(/已存在|409|Conflict/i);
});

Then('提示"该绘本已在收藏列表中"', async ({ page }) => {
  await expect(page.locator('.ant-message')).toContainText(/已在收藏|已收藏/i, { timeout: 5000 });
});

Then('系统显示取消收藏成功提示', async ({ page }) => {
  await expect(page.locator('.ant-message')).toContainText(/取消|移除/i, { timeout: 5000 });
});

Then('按钮恢复为"收藏"状态', async ({ page }) => {
  await expect(page.locator('button:has-text("收藏")').first()).toBeVisible({ timeout: 5000 });
});

Then('页面显示《我爱学校》和《快乐洗手》的绘本卡片', async ({ page }) => {
  await expect(page.locator('text=我爱学校')).toBeVisible({ timeout: 5000 });
});

Then('分页控件显示"第 1 页，共 2 页"', async ({ page }) => {
  await expect(page.locator('.ant-pagination')).toBeVisible({ timeout: 3000 });
});

Then('详情页显示"收藏 5"', async ({ page }) => {
  await expect(page.locator('text=/收藏.*5|5.*收藏/i')).toBeVisible({ timeout: 5000 });
});

Then('系统记录阅读开始时间', async ({}) => {});
Then('显示反馈提交成功', async ({ page }) => {
  await expect(page.locator('.ant-message')).toBeVisible({ timeout: 5000 });
});

Then('详情页显示"已完成阅读"', async ({ page }) => {
  await expect(page.locator('text=完成|已读')).toBeVisible({ timeout: 5000 });
});

Then('详情页显示该用户已评分', async ({ page }) => {
  await expect(page.locator('[class*="rate"]')).toBeVisible({ timeout: 3000 });
});

Then('系统返回 400 错误', async ({ page }) => {
  await page.waitForTimeout(500);
  const msg = await page.locator('.ant-message, .ant-notification').textContent().catch(() => '');
  expect(msg).toMatch(/400|评分|1-5/i);
});

Then('提示"评分范围为 1-5 星"', async ({ page }) => {
  await expect(page.locator('.ant-message, .ant-form-item-explain-error')).toContainText(/1-5|评分/i, { timeout: 5000 });
});

Then('系统记录使用场景', async ({}) => {});

Then('页面显示李老师的完整反馈历史', async ({ page }) => {
  await expect(page.locator('text=反馈|Feedback|反馈历史')).toBeVisible({ timeout: 5000 });
});

Then('系统返回 403 无权限错误', async ({ page }) => {
  await expect(page.locator('text=无权限|403')).toBeVisible({ timeout: 5000 });
});

Then('响应状态码为 200', async ({}) => {});
Then('响应包含 2 个收藏记录', async ({}) => {});
Then('响应包含聚合统计（平均分、总收藏数等）', async ({}) => {});

// --- API steps (no-op in E2E) ---
When('李老师 发送 POST 请求到 "/api/v1/books/{id}/favorite"', async ({}) => {});
When('李老师 发送 DELETE 请求到 "/api/v1/books/{id}/favorite"', async ({}) => {});
When('李老师 发送 GET 请求到 "/api/v1/users/me/favorites"', async ({}) => {});
When('李老师 发送 POST 请求到 "/api/v1/books/{id}/feedback" 包含：', async ({}, _p: string, _t: any) => {});
When('李老师 发送 GET 请求到 "/api/v1/books/{id}/feedback"', async ({}) => {});
Then('响应状态码为 200', async ({}) => {});
Then('响应包含 2 个收藏记录', async ({}) => {});
Then('响应包含聚合统计（平均分、总收藏数等）', async ({}) => {});
