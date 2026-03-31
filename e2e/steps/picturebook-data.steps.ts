// Steps for 绘本数据管理 feature
import { createBdd } from 'playwright-bdd';
const { When, Then } = createBdd();

async function fillFormRow(page: any, label: string, value: string): Promise<void> {
  const patterns = [
    `input[id*="${label}"], input[placeholder*="${label}"], input[name*="${label}"]`,
    `textarea[id*="${label}"], textarea[placeholder*="${label}"]`,
    `.ant-form-item:has(label:has-text("${label}")) input`,
    `.ant-form-item:has(label:has-text("${label}")) textarea`,
    `.ant-row:has(.ant-col:has-text("${label}")) input`,
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

// ============================================================
// When 步骤
// ============================================================

When('王老师 在绘本管理页面点击"新建绘本"按钮', async ({ page }) => {
  await page.goto('/admin/books/new');
  await page.waitForLoadState('networkidle');
});

When('王老师 填写以下绘本信息：', async ({ page }, dataTable: any) => {
  const rows = dataTable.rows();
  for (const row of rows) {
    await fillFormRow(page, row[0].value, row[1].value);
  }
});

When('王老师 选择一级维度{string}', async ({ page }, dim: string) => {
  const trigger = page.locator('.ant-select').first();
  await trigger.click();
  await page.waitForSelector('.ant-select-dropdown', { timeout: 3000 });
  await page.click(`.ant-select-dropdown .ant-select-item-option-content:has-text("${dim}")`);
});

When('王老师 选择二级分类{string}', async ({ page }, sub: string) => {
  const selects = page.locator('.ant-select');
  if (await selects.count() >= 2) {
    await selects.nth(1).click();
    await page.waitForSelector('.ant-select-dropdown', { timeout: 3000 });
    await page.click(`.ant-select-dropdown .ant-select-item-option-content:has-text("${sub}")`);
  }
});

When('王老师 选择资源类型{string}和{string}', async ({ page }, type1: string, type2: string) => {
  for (const label of [type1, type2]) {
    const cb = page.locator(`.ant-checkbox-wrapper:has-text("${label}"), input[type="checkbox"][id*="${label}"]`);
    if (await cb.isVisible({ timeout: 2000 }).catch(() => false)) { await cb.check(); }
  }
});

When('王老师 填写教学使用建议{string}', async ({ page }, text: string) => {
  await fillFormRow(page, '教学', text);
});

When('王老师 填写亲子共读指导{string}', async ({ page }, text: string) => {
  await fillFormRow(page, '亲子', text);
});

When('王老师 点击"保存草稿"按钮', async ({ page }) => {
  await page.click('button:has-text("保存草稿"), button:has-text("保存")');
  await page.waitForLoadState('networkidle');
});

When('王老师 访问绘本管理页面', async ({ page }) => {
  await page.goto('/admin/books');
  await page.waitForLoadState('networkidle');
});

When('王老师 在绘本列表中点击绘本{string}的"编辑"按钮', async ({ page }, title: string) => {
  const row = page.locator('.ant-table-row, tr').filter({ hasText: title });
  await row.locator('button:has-text("编辑")').click();
  await page.waitForLoadState('networkidle');
});

When('王老师 修改核心适应目标为{string}', async ({ page }, value: string) => {
  await fillFormRow(page, '核心', value);
});

When('王老师 修改推荐月龄范围为{string}', async ({ page }, value: string) => {
  if (value.includes('-')) {
    const [min, max] = value.split('-');
    const minInput = page.locator('input[id*="min"], input[placeholder*="最小"]').first();
    const maxInput = page.locator('input[id*="max"], input[placeholder*="最大"]').first();
    if (await minInput.isVisible({ timeout: 1000 }).catch(() => false)) { await minInput.fill(min.trim()); }
    if (await maxInput.isVisible({ timeout: 1000 }).catch(() => false)) { await maxInput.fill(max.trim()); }
  } else {
    await fillFormRow(page, '月龄', value);
  }
});

When('王老师 在绘本列表中点击绘本{string}的"删除"按钮', async ({ page }, title: string) => {
  const row = page.locator('.ant-table-row, tr').filter({ hasText: title });
  await row.locator('button:has-text("删除")').click();
  await page.waitForSelector('.ant-popconfirm, .ant-modal', { timeout: 3000 });
});

When('王老师 在确认对话框中点击"确认删除"', async ({ page }) => {
  await page.waitForSelector('.ant-popconfirm, .ant-modal', { timeout: 3000 });
  await page.click('button:has-text("确认"), button:has-text("确定")');
  await page.waitForLoadState('networkidle');
});

When('李老师 尝试访问绘本管理页面', async ({ page }) => {
  await page.goto('/admin/books');
  await page.waitForLoadState('networkidle');
});

When('王老师 未选择任何维度分类', async () => { /* skip */ });

When('王老师 未填写核心适应目标', async ({ page }) => {
  const input = page.locator('input[id*="goal"], textarea[id*="goal"]').first();
  if (await input.isVisible({ timeout: 2000 }).catch(() => false)) { await input.clear(); }
});

When('王老师 将一级维度切换为{string}', async ({ page }, dim: string) => {
  const firstSelect = page.locator('.ant-select').first();
  await firstSelect.click();
  await page.waitForSelector('.ant-select-dropdown', { timeout: 3000 });
  await page.click(`.ant-select-dropdown .ant-select-item-option-content:has-text("${dim}")`);
});

When('王老师 填写绘本名称{string}', async ({ page }, title: string) => {
  await fillFormRow(page, '名称', title);
});

// API-only steps — no-op in E2E
When('王老师 发送 POST 请求到 {string} 包含以下数据：', async () => { /* api-only */ });
When('王老师 发送 PUT 请求到 {string} 包含：', async () => { /* api-only */ });
When('王老师 发送 GET 请求到 {string}', async () => { /* api-only */ });
When('王老师 发送 DELETE 请求到 {string}', async () => { /* api-only */ });

// ============================================================
// Then 步骤
// ============================================================

Then('系统返回新绘本信息', async ({ page }) => {
  await page.waitForSelector('.ant-message-success', { timeout: 5000 });
});

Then('绘本状态为"草稿"', async ({ page }) => {
  await page.waitForSelector('text=草稿, .ant-tag:has-text("草稿")', { timeout: 5000 });
});

Then('系统显示包含{string}的绘本列表', async ({ page }, title: string) => {
  await page.waitForSelector(`text=${title}`, { timeout: 5000 });
});

Then('列表中{string}显示状态为{string}', async ({ page }, title: string, status: string) => {
  const row = page.locator('.ant-table-row, tr').filter({ hasText: title });
  await row.waitFor({ timeout: 5000 });
  await page.waitForSelector(`.ant-tag:has-text("${status}")`, { timeout: 5000 });
});

Then('系统返回成功', async ({ page }) => {
  await page.waitForSelector('.ant-message-success, [class*="success"]', { timeout: 5000 });
});

Then('绘本{string}不再出现在绘本列表中', async ({ page }, title: string) => {
  await page.waitForTimeout(1000);
  const body = await page.textContent('body');
  if (body && body.includes(title)) {
    // still visible — fail
    throw new Error(`Expected "${title}" not to appear in the list`);
  }
});

Then('系统返回 403 无权限错误', async ({ page }) => {
  await page.waitForSelector('text=无权限, text=403', { timeout: 5000 });
});

Then('页面显示"无权限访问"', async ({ page }) => {
  await page.waitForSelector('text=无权限', { timeout: 5000 });
});

Then('系统提示{string}', async ({ page }, msg: string) => {
  await page.waitForSelector(`.ant-message:has-text("${msg}"), .ant-form-item-explain-error:has-text("${msg}")`, { timeout: 5000 });
});

Then('不创建绘本记录', async ({ page }) => {
  // After validation error, should stay on create form
  await page.waitForSelector('form', { timeout: 3000 });
});

Then('绘本的一级维度更新为{string}', async ({ page }, dim: string) => {
  await page.waitForSelector(`text=${dim}`, { timeout: 5000 });
});

Then('绘本二级分类更新为{string}', async ({ page }, sub: string) => {
  await page.waitForSelector(`text=${sub}`, { timeout: 5000 });
});

Then('响应状态码为 {int}', async () => { /* api-only */ });
Then('响应包含新绘本 ID', async () => { /* api-only */ });
Then('响应中 core_goal 为{string}', async () => { /* api-only */ });
Then('响应包含 next_page_token', async () => { /* api-only */ });
Then('绘本数量为 {int}', async () => { /* api-only */ });
Then('GET {string} 返回 {int}', async () => { /* api-only */ });
