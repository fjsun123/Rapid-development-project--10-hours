// API 端到端测试 - 验证前后端数据流（无 UI）
import { test, expect, request } from '@playwright/test';

const API = 'http://localhost:3001';

async function smsLogin(ctx: any, phone: string) {
  const codeRes = await ctx.post(`${API}/api/auth/sms/code`, { data: { phone } });
  const { _code } = await codeRes.json();
  const loginRes = await ctx.post(`${API}/api/auth/login`, { data: { phone, code: _code } });
  return loginRes.json();
}

test('TC-API-001 admin 登录 + 拿 token', async () => {
  const ctx = await request.newContext();
  const res = await ctx.post(`${API}/api/auth/admin/login`, {
    data: { username: 'admin', password: 'admin123' },
  });
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(data.accessToken).toBeTruthy();
  expect(data.user.role).toBe('admin');
});

test('TC-API-002 短信验证码登录 + dev 返回 _code', async () => {
  const ctx = await request.newContext();
  const codeRes = await ctx.post(`${API}/api/auth/sms/code`, { data: { phone: '13800138001' } });
  const codeData = await codeRes.json();
  expect(codeData._code).toMatch(/^\d{6}$/);

  const loginRes = await ctx.post(`${API}/api/auth/login`, {
    data: { phone: '13800138001', code: codeData._code },
  });
  expect(loginRes.ok()).toBeTruthy();
  const data = await loginRes.json();
  expect(data.accessToken).toBeTruthy();
  expect(data.user.role).toBe('customer');
});

test('TC-API-003 创建订单 + 服务端金额计算 + 库存扣减', async () => {
  const ctx = await request.newContext();
  const auth = await smsLogin(ctx, '13800138001');
  const headers = { Authorization: `Bearer ${auth.accessToken}` };

  // 取菜单
  const menu = await (await ctx.get(`${API}/api/menu-items`)).json();
  const gongbao = menu.find((m: any) => m.name === '宫保鸡丁');
  const stockBefore = gongbao.stock;

  // 下单
  const orderRes = await ctx.post(`${API}/api/orders`, {
    headers,
    data: {
      customerId: 1,
      items: [{ menuItemId: gongbao.id, quantity: 2 }],
    },
  });
  expect(orderRes.ok()).toBeTruthy();
  const order = await orderRes.json();

  // 服务端金额 = 2 × 3800 = 7600
  expect(order.total).toBe(2 * gongbao.price);
  expect(order.status).toBe('pending');
  expect(order.orderNo).toMatch(/^ORD/);

  // 库存扣减
  const menuAfter = await (await ctx.get(`${API}/api/menu-items`)).json();
  const gongbaoAfter = menuAfter.find((m: any) => m.name === '宫保鸡丁');
  expect(gongbaoAfter.stock).toBe(stockBefore - 2);
});

test('TC-API-004 订单状态机：pending → confirmed → ready → completed', async () => {
  const ctx = await request.newContext();

  // 客户下单
  const customer = await smsLogin(ctx, '13800138001');
  const menu = await (await ctx.get(`${API}/api/menu-items`)).json();
  const item = menu.find((m: any) => m.available && m.name === '可乐');
  const order = await (await ctx.post(`${API}/api/orders`, {
    headers: { Authorization: `Bearer ${customer.accessToken}` },
    data: { customerId: 1, items: [{ menuItemId: item.id, quantity: 1 }] },
  })).json();

  expect(order.status).toBe('pending');

  // 切 admin 操作状态机
  const admin = await (await ctx.post(`${API}/api/auth/admin/login`, {
    data: { username: 'admin', password: 'admin123' },
  })).json();
  const auth = { Authorization: `Bearer ${admin.accessToken}` };

  const r1 = await (await ctx.post(`${API}/api/orders/${order.id}/confirm`, { headers: auth })).json();
  expect(r1.status).toBe('confirmed');

  const r2 = await (await ctx.post(`${API}/api/orders/${order.id}/ready`, { headers: auth })).json();
  expect(r2.status).toBe('ready');

  const r3 = await (await ctx.post(`${API}/api/orders/${order.id}/complete`, { headers: auth })).json();
  expect(r3.status).toBe('completed');
});

test('TC-API-005 不可用菜品下单被拒', async () => {
  const ctx = await request.newContext();
  const customer = await smsLogin(ctx, '13800138001');
  const menu = await (await ctx.get(`${API}/api/menu-items`)).json();
  const unavailable = menu.find((m: any) => m.name === '测试已下架菜品');
  expect(unavailable).toBeTruthy();

  const res = await ctx.post(`${API}/api/orders`, {
    headers: { Authorization: `Bearer ${customer.accessToken}` },
    data: { customerId: 1, items: [{ menuItemId: unavailable.id, quantity: 1 }] },
  });
  expect(res.ok()).toBeFalsy();
});

test('TC-API-006 dashboard KPI 接口', async () => {
  const ctx = await request.newContext();
  const admin = await (await ctx.post(`${API}/api/auth/admin/login`, {
    data: { username: 'admin', password: 'admin123' },
  })).json();
  const res = await ctx.get(`${API}/api/dashboard/kpi`, {
    headers: { Authorization: `Bearer ${admin.accessToken}` },
  });
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  // 后端 SUM/COUNT 返回的可能是 string（pg 数字精度问题），允许 string|number
  expect(Number(data.todayOrders)).not.toBeNaN();
  expect(Number(data.todayRevenue)).not.toBeNaN();
  expect(Number(data.pendingOrders)).not.toBeNaN();
});

test('TC-API-007 业务设置读写', async () => {
  const ctx = await request.newContext();
  const admin = await (await ctx.post(`${API}/api/auth/admin/login`, {
    data: { username: 'admin', password: 'admin123' },
  })).json();
  const auth = { Authorization: `Bearer ${admin.accessToken}` };

  const get1 = await (await ctx.get(`${API}/api/settings`, { headers: auth })).json();
  expect(get1.estimatedPrepTime).toBeGreaterThan(0);

  const patch = await ctx.patch(`${API}/api/settings`, {
    headers: auth,
    data: { estimatedPrepTime: 25 },
  });
  expect(patch.ok()).toBeTruthy();

  const get2 = await (await ctx.get(`${API}/api/settings`, { headers: auth })).json();
  expect(get2.estimatedPrepTime).toBe(25);
});
