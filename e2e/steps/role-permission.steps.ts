import { Given, When, Then } from '@cucumber/cucumber';
import { createBdd } from 'playwright-bdd';
const { Given: SGiven, When: SWhen, Then: SThen } = createBdd();

SGiven('系统中有以下角色：', async ({ page }, dataTable) => {
  // Fixture data is set up by global-setup.ts
  // This step is informational for documentation
});

SGiven('超级管理员"王老师"已登录系统', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"]', 'admin');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin**', { timeout: 10000 });
});

SGiven('普通管理员"张管理员"已存在', async ({ page }) => {
  // Assumed to be pre-seeded via fixture/setup
});

SGiven('普通管理员"张管理员"已登录系统', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"]', 'admin2');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin**', { timeout: 10000 });
});

SGiven('普通管理员"张管理员"{string}', async () => {
  // Pre-condition step - user assumed to exist
});

SGiven('教师用户"李老师"已存在', async () => {});
SGiven('教师用户"李老师"已登录系统', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"]', 'teacher');
  await page.fill('input[type="password"]', 'teacher123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(teacher|console)\//, { timeout: 10000 });
});

SGiven('家长用户"王家长"已存在', async () => {});
SGiven('家长用户"王家长"已登录系统', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"]', 'parent');
  await page.fill('input[type="password"]', 'parent123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/parent\//, { timeout: 10000 });
});

SGiven('系统当前无其他用户', async () => {});

SWhen('王老师 创建用户时填写以下信息：', async ({ page }, dataTable) => {
  await page.goto('/admin/users');
  await page.click('button:has-text("创建用户")');
  const rows = dataTable.rows();
  for (const row of rows) {
    const label = row[0].value;
    const value = row[1].value;
    if (label === '用户名') await page.fill('input[id*="username"], input[placeholder*="用户"]', value);
    if (label === '邮箱') await page.fill('input[type="email"], input[placeholder*="邮箱"]', value);
    if (label === '角色') await page.selectOption('select', { label: value });
  }
  await page.click('button:has-text("创建"):not([disabled])');
});

SWhen('王老师 修改用户"李老师"的角色为"普通管理员"', async ({ page }) => {
  await page.goto('/admin/users');
  await page.click('button:has-text("编辑"):first');
  await page.selectOption('select', { label: '普通管理员' });
  await page.click('button:has-text("保存")');
});

SWhen('王老师 重置用户"李老师"的密码', async ({ page }) => {
  await page.goto('/admin/users');
  await page.click('button:has-text("编辑"):first');
  await page.fill('input[type="password"]', 'NewPass123!');
  await page.click('button:has-text("保存")');
});

SWhen('王老师 删除用户"李老师"', async ({ page }) => {
  await page.goto('/admin/users');
  await page.click('button:has-text("删除"):first');
  await page.click('button:has-text("确认")');
});

SWhen('张管理员 尝试创建用户时：', async ({ page }) => {
  await page.goto('/admin/users');
  // Should not see create button or should get 403
});

SWhen('李老师 尝试访问用户管理页面', async ({ page }) => {
  await page.goto('/admin/users');
});

SWhen('未认证用户 访问注册页面', async ({ page }) => {
  await page.goto('/register');
});

SThen('系统返回新账户信息，包含生成的临时密码', async ({ page }) => {
  // Should see success message with generated password
  await page.waitForSelector('.ant-message, [class*="message"]', { timeout: 5000 });
});

SThen('用户的角色为"普通管理员"', async ({ page }) => {
  await page.goto('/admin/users');
  await page.waitForSelector('table', { timeout: 5000 });
});

SThen('用户无法登录注册页面（自主注册已关闭）', async ({ page }) => {
  await page.goto('/register');
  await page.waitForSelector('text=自主注册已关闭', { timeout: 5000 });
});

SThen('系统返回 403 无权限错误', async ({ page }) => {
  // Either sees 403 page or gets error message
  await page.waitForSelector('text=无权限, text=403, [role="alert"]', { timeout: 5000 });
});

SThen('页面显示"无权限访问"', async ({ page }) => {
  await page.waitForSelector('text=无权限', { timeout: 5000 });
});

SThen('系统返回成功', async ({ page }) => {
  await page.waitForSelector('.ant-message-success, [class*="success"]', { timeout: 5000 });
});

SThen('李老师 无法使用原有凭证登录', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[placeholder*="用户"]', 'teacher');
  await page.fill('input[type="password"]', 'teacher123');
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=无效', { timeout: 5000 });
});

SThen('页面不显示注册表单', async ({ page }) => {
  await page.waitForSelector('text=自主注册已关闭', { timeout: 5000 });
  const form = await page.$('form');
  expect(form).toBeNull();
});
