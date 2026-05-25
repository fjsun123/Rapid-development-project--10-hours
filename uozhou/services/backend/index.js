// 餐厅管理后端API - Hono on Cloudflare Workers
import { Hono } from 'hono';

const app = new Hono();

// 模拟数据库
let users = [
  { id: '1', phone: '13800138000', name: '服务员小王', role: 'staff', avatar: '' },
  { id: '2', phone: '13900139000', name: '客户张三', role: 'customer', avatar: '' },
];

let smsCodes = {}; // { phone: { code, expiresAt } }

let menuItems = [
  { id: '1', name: '宫保鸡丁', price: 3800, categoryId: '1', available: true, stock: 100 },
  { id: '2', name: '鱼香肉丝', price: 3500, categoryId: '1', available: true, stock: 80 },
  { id: '3', name: '可乐', price: 1000, categoryId: '2', available: false, stock: 50 },
];

let customers = [
  { id: '1', name: '张三', phone: '13800000000', totalSpent: 0, orderCount: 0 },
  { id: '2', name: '李四', phone: '13912345678', totalSpent: 0, orderCount: 0 },
];

let orders = [
  { id: '1', orderNo: 'ORD-2026001', customerId: '1', totalAmount: 3800, status: 'completed', createdAt: '2026-05-21' },
  { id: '2', orderNo: 'ORD-2026002', customerId: '2', totalAmount: 1800, status: 'pending', createdAt: '2026-05-22' },
];

let settings = { prepTimeMin: 20, autoAccept: true, isOpen: true, businessHoursStart: '09:00', businessHoursEnd: '22:00' };

// CORS
app.use('*', async (c, next) => {
  await next();
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
});

// Auth API - 发送验证码
app.post('/api/sms/code', async (c) => {
  const { phone } = await c.req.json();
  if (!phone || phone.length !== 11) {
    return c.json({ error: '手机号格式不正确' }, 400);
  }
  // 固定验证码 8888 用于测试
  smsCodes[phone] = { code: '8888', expiresAt: Date.now() + 5 * 60 * 1000 };
  console.log(`SMS code for ${phone}: 8888`);
  return c.json({ success: true, message: '验证码已发送' });
});

// Auth API - 登录
app.post('/api/auth/login', async (c) => {
  const { phone, code } = await c.req.json();

  if (!phone || phone.length !== 11) {
    return c.json({ error: '手机号格式不正确' }, 400);
  }

  const storedCode = smsCodes[phone];
  if (!storedCode || storedCode.code !== code || storedCode.expiresAt < Date.now()) {
    return c.json({ error: '验证码错误' }, 400);
  }

  // 查找或创建用户
  let user = users.find(u => u.phone === phone);
  if (!user) {
    user = { id: String(users.length + 1), phone, name: `用户${phone.slice(-4)}`, role: 'customer', avatar: '' };
    users.push(user);
  }

  // 生成token (简单模拟)
  const token = `token_${user.id}_${Date.now()}`;

  return c.json({
    user: { id: user.id, phone: user.phone, name: user.name, role: user.role, avatar: user.avatar },
    token
  });
});

// Auth API - 微信登录
app.post('/api/auth/wechat', async (c) => {
  const { code } = await c.req.json();
  // 模拟微信登录
  const user = users[0]; // 返回服务员账号
  const token = `token_${user.id}_${Date.now()}`;
  return c.json({
    user: { id: user.id, phone: user.phone, name: user.name, role: user.role, avatar: user.avatar },
    token
  });
});

// Dashboard API
app.get('/api/dashboard/stats', (c) => c.json({ todayOrders: 156, todayRevenue: 1258000, pendingOrders: 23, popularItem: '宫保鸡丁' }));
app.get('/api/dashboard/trend', (c) => c.json([120, 95, 150, 130, 180, 165, 156]));

// Orders API
app.get('/api/orders', (c) => c.json(orders));
app.get('/api/orders/:id', (c) => c.json(orders.find(o => o.id === c.req.param('id'))));
app.post('/api/orders', async (c) => { const body = await c.req.json(); const order = { id: String(orders.length + 1), ...body, status: 'pending' }; orders.push(order); return c.json(order); });
app.patch('/api/orders/:id/status', async (c) => { const { status } = await c.req.json(); const order = orders.find(o => o.id === c.req.param('id')); if (order) order.status = status; return c.json(order); });

// Customers API
app.get('/api/customers', (c) => c.json(customers));
app.post('/api/customers', async (c) => { const body = await c.req.json(); const customer = { id: String(customers.length + 1), ...body, totalSpent: 0, orderCount: 0 }; customers.push(customer); return c.json(customer); });

// Menu API
app.get('/api/menu-items', (c) => c.json(menuItems));
app.post('/api/menu-items', async (c) => { const body = await c.req.json(); const item = { id: String(menuItems.length + 1), ...body }; menuItems.push(item); return c.json(item); });
app.patch('/api/menu-items/:id', async (c) => { const body = await c.req.json(); const item = menuItems.find(i => i.id === c.req.param('id')); if (item) Object.assign(item, body); return c.json(item); });

// Settings API
app.get('/api/settings', (c) => c.json(settings));
app.put('/api/settings', async (c) => { const body = await c.req.json(); Object.assign(settings, body); return c.json(settings); });

export default app;