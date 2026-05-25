// Dashboard Expo Web 烟雾测试
import { test, expect } from '@playwright/test';

test('登录页可加载 + 表单元素可见', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('餐厅管理后台')).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('用户名')).toBeVisible();
  await expect(page.getByText('密码')).toBeVisible();
  await page.screenshot({ path: 'e2e/screenshots/dashboard-login.png', fullPage: true });
});

test('admin 登录 → 跳首页 → KPI 加载', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // 表单已预填 admin/admin123，直接点登录
  await page.getByText('登 录').click();

  // 等待跳到首页
  await page.waitForURL(/\/(?!login).*$|\/$/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');

  // 验证首页
  await expect(page.getByText('首页', { exact: false }).first()).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('今日订单数')).toBeVisible();
  await page.screenshot({ path: 'e2e/screenshots/dashboard-home.png', fullPage: true });
});

test('UI 组件库可访问', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByText('登 录').click();
  await page.waitForURL(/\/(?!login).*$|\/$/, { timeout: 10000 });
  await page.waitForTimeout(500);

  // 点击侧边栏「UI 组件库」（模拟真实用户路径）
  await page.getByText('🎨 UI 组件库').click();
  await page.waitForTimeout(1500);
  await expect(page.getByText('设计系统与组件库')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('颜色令牌')).toBeVisible();
  await page.screenshot({ path: 'e2e/screenshots/dashboard-ui-library.png', fullPage: true });
});

test('菜单管理页可访问 + 显示种子数据', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByText('登 录').click();
  await page.waitForURL(/\/(?!login).*$|\/$/, { timeout: 10000 });
  await page.waitForTimeout(500);

  // 点击侧边栏「菜单」
  await page.getByText('菜单', { exact: true }).first().click();
  await page.waitForTimeout(1500);
  await expect(page.getByText('菜单管理')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('宫保鸡丁').first()).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: 'e2e/screenshots/dashboard-menu.png', fullPage: true });
});
