// 餐厅管理后端API - Express
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

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
  { id: '1', orderNo: 'ORD-2026001', customerId: '1', customerName: '张三', items: [{name: '宫保鸡丁', qty: 1, price: 38}], totalAmount: 3800, status: 'completed', createdAt: '2026-05-21 18:30' },
  { id: '2', orderNo: 'ORD-2026002', customerId: '2', customerName: '李四', items: [{name: '鱼香肉丝', qty: 1, price: 35}], totalAmount: 3500, status: 'pending', createdAt: '2026-05-22 12:00' },
];

let orderCounter = 3;

let settings = { prepTimeMin: 20, autoAccept: true, isOpen: true, businessHoursStart: '09:00', businessHoursEnd: '22:00' };

// Auth API - 发送验证码
app.post('/api/sms/code', (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length !== 11) {
    return res.status(400).json({ error: '手机号格式不正确' });
  }
  // 固定验证码 8888 用于测试
  smsCodes[phone] = { code: '8888', expiresAt: Date.now() + 5 * 60 * 1000 };
  console.log(`SMS code for ${phone}: 8888`);
  res.json({ success: true, message: '验证码已发送' });
});

// Auth API - 登录
app.post('/api/auth/login', (req, res) => {
  const { phone, code } = req.body;

  if (!phone || phone.length !== 11) {
    return res.status(400).json({ error: '手机号格式不正确' });
  }

  const storedCode = smsCodes[phone];
  if (!storedCode || storedCode.code !== code || storedCode.expiresAt < Date.now()) {
    return res.status(400).json({ error: '验证码错误' });
  }

  // 查找或创建用户
  let user = users.find(u => u.phone === phone);
  if (!user) {
    user = { id: String(users.length + 1), phone, name: `用户${phone.slice(-4)}`, role: 'customer', avatar: '' };
    users.push(user);
  }

  // 生成token (简单模拟)
  const token = `token_${user.id}_${Date.now()}`;

  res.json({
    user: { id: user.id, phone: user.phone, name: user.name, role: user.role, avatar: user.avatar },
    token
  });
});

// Auth API - 微信登录
app.post('/api/auth/wechat', (req, res) => {
  // 模拟微信登录
  const user = users[0]; // 返回服务员账号
  const token = `token_${user.id}_${Date.now()}`;
  res.json({
    user: { id: user.id, phone: user.phone, name: user.name, role: user.role, avatar: user.avatar },
    token
  });
});

// Dashboard API
app.get('/api/dashboard/stats', (req, res) => {
  const todayOrders = orders.filter(o => o.createdAt.startsWith('2026-05-23')).length;
  const todayRevenue = orders.filter(o => o.createdAt.startsWith('2026-05-23')).reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'making' || o.status === 'ready').length;
  res.json({ todayOrders, todayRevenue, pendingOrders, popularItem: '宫保鸡丁' });
});

app.get('/api/dashboard/trend', (req, res) => res.json([120, 95, 150, 130, 180, 165, 156]));

// Orders API
app.get('/api/orders', (req, res) => {
  const { status } = req.query;
  if (status && status !== 'all') {
    return res.json(orders.filter(o => o.status === status));
  }
  res.json(orders);
});

app.get('/api/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  res.json(order || null);
});

app.post('/api/orders', (req, res) => {
  const body = req.body;
  const orderNo = `ORD-2026${String(orderCounter++).padStart(3, '0')}`;
  const now = new Date();
  const createdAt = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const order = {
    id: String(orders.length + 1),
    orderNo,
    customerId: body.customerId || 'guest',
    customerName: body.customerName || '顾客',
    items: body.items || [],
    totalAmount: body.totalAmount || 0,
    status: 'pending',
    createdAt
  };
  orders.push(order);
  console.log('新订单:', order);
  res.json(order);
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const order = orders.find(o => o.id === req.params.id);
  if (order) {
    order.status = status;
    console.log(`订单 ${order.orderNo} 状态更新为: ${status}`);
  }
  res.json(order || null);
});

// Customers API
app.get('/api/customers', (req, res) => res.json(customers));
app.post('/api/customers', (req, res) => {
  const body = req.body;
  const customer = { id: String(customers.length + 1), ...body, totalSpent: 0, orderCount: 0 };
  customers.push(customer);
  res.json(customer);
});

// Menu API
app.get('/api/menu-items', (req, res) => res.json(menuItems));
app.post('/api/menu-items', (req, res) => {
  const body = req.body;
  const item = { id: String(menuItems.length + 1), ...body };
  menuItems.push(item);
  res.json(item);
});
app.patch('/api/menu-items/:id', (req, res) => {
  const body = req.body;
  const item = menuItems.find(i => i.id === req.params.id);
  if (item) Object.assign(item, body);
  res.json(item);
});

// Settings API
app.get('/api/settings', (req, res) => res.json(settings));
app.put('/api/settings', (req, res) => {
  Object.assign(settings, req.body);
  res.json(settings);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`餐厅管理后端API运行在 http://localhost:${PORT}`);
});
