// Hono API 路由 + OpenAPI 集成 + JWT 认证
// 所有路由通过 createRoute + app.openapi(...) 注册，
// 这样 /openapi.json 的 paths 才会被填充（供 Orval 生成前端 hooks）

import { cors } from 'hono/cors';
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

// 路由
import authRoutes from './auth';

// 中间件
import { authMiddleware, requireAdmin, requireStaff, requireRole } from '../middleware/auth';

// 服务
import { createOrder, getOrders, getOrderById } from '../services/order-service';
import {
  confirmOrder,
  readyOrder,
  completeOrder,
  cancelOrder,
} from '../services/order-state-machine';
import { db, schema } from '../db';
import { eq, sql, desc, and, gte } from 'drizzle-orm';

// 统一 Schema
import {
  ErrorSchema,
  HealthSchema,
  MenuItemSchema,
  CreateMenuItemRequestSchema,
  UpdateMenuItemRequestSchema,
  CustomerSchema,
  CreateCustomerRequestSchema,
  UpdateCustomerRequestSchema,
  OrderSchema,
  OrderWithItemsSchema,
  CreateOrderRequestSchema,
  UpdateOrderRequestSchema,
  OrderListResponseSchema,
  CustomerOrdersResponseSchema,
  DashboardKPISchema,
  BusinessSettingsSchema,
  UpdateBusinessSettingsRequestSchema,
  IdParamSchema,
  OrderListQuerySchema,
  SuccessMessageSchema,
} from '../schemas';

// ============================================
// 创建 OpenAPI Hono 实例
// ============================================

const app = new OpenAPIHono();

// ============================================
// CORS
// ============================================

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// ============================================
// 挂载子路由：/api/auth/*
// ============================================

app.route('/api/auth', authRoutes);

// ============================================
// 公开路由
// ============================================

// GET /api/health
const healthRoute = createRoute({
  method: 'get',
  path: '/api/health',
  tags: ['Public'],
  summary: '健康检查',
  responses: {
    200: {
      content: { 'application/json': { schema: HealthSchema } },
      description: '服务正常',
    },
  },
});
app.openapi(healthRoute, (c) => c.json({ status: 'ok' }, 200));

// GET /api/menu-items
const listMenuItemsRoute = createRoute({
  method: 'get',
  path: '/api/menu-items',
  tags: ['Menu'],
  summary: '获取菜品列表',
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(MenuItemSchema) } },
      description: '菜品列表',
    },
  },
});
app.openapi(listMenuItemsRoute, async (c) => {
  const items = await db
    .select({
      id: schema.menuItems.id,
      name: schema.menuItems.name,
      description: schema.menuItems.description,
      price: schema.menuItems.price,
      image: schema.menuItems.image,
      categoryId: schema.menuItems.categoryId,
      categoryName: schema.categories.name,
      available: schema.menuItems.available,
      stock: schema.menuItems.stock,
      sortOrder: schema.menuItems.sortOrder,
    })
    .from(schema.menuItems)
    .leftJoin(schema.categories, eq(schema.menuItems.categoryId, schema.categories.id))
    .orderBy(schema.menuItems.sortOrder);
  return c.json(items as any, 200);
});

// POST /api/menu-items - admin 新增菜品
const createMenuItemRoute = createRoute({
  method: 'post',
  path: '/api/menu-items',
  tags: ['Menu'],
  summary: '新增菜品（admin）',
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireAdmin] as const,
  request: {
    body: { content: { 'application/json': { schema: CreateMenuItemRequestSchema } } },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: MenuItemSchema } },
      description: '创建成功',
    },
    400: { content: { 'application/json': { schema: ErrorSchema } }, description: '参数错误' },
    401: { content: { 'application/json': { schema: ErrorSchema } }, description: '未认证' },
    403: { content: { 'application/json': { schema: ErrorSchema } }, description: '无权限' },
  },
});
app.openapi(createMenuItemRoute, async (c) => {
  const body = c.req.valid('json');
  const [created] = await db.insert(schema.menuItems).values(body as any).returning();
  // 拼上 categoryName
  const [cat] = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.id, created.categoryId));
  return c.json({ ...created, categoryName: cat?.name ?? null } as any, 201);
});

// PATCH /api/menu-items/:id
const updateMenuItemRoute = createRoute({
  method: 'patch',
  path: '/api/menu-items/{id}',
  tags: ['Menu'],
  summary: '修改菜品（admin）',
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireAdmin] as const,
  request: {
    params: IdParamSchema,
    body: { content: { 'application/json': { schema: UpdateMenuItemRequestSchema } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: MenuItemSchema } }, description: '更新成功' },
    400: { content: { 'application/json': { schema: ErrorSchema } }, description: '参数错误' },
    404: { content: { 'application/json': { schema: ErrorSchema } }, description: '菜品不存在' },
  },
});
app.openapi(updateMenuItemRoute, async (c) => {
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');
  const [updated] = await db
    .update(schema.menuItems)
    .set({ ...(body as any), updatedAt: new Date() })
    .where(eq(schema.menuItems.id, parseInt(id)))
    .returning();
  if (!updated) {
    return c.json({ error: 'menu_item_not_found' }, 404);
  }
  const [cat] = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.id, updated.categoryId));
  return c.json({ ...updated, categoryName: cat?.name ?? null } as any, 200);
});

// DELETE /api/menu-items/:id
const deleteMenuItemRoute = createRoute({
  method: 'delete',
  path: '/api/menu-items/{id}',
  tags: ['Menu'],
  summary: '删除菜品（admin）',
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireAdmin] as const,
  request: { params: IdParamSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: SuccessMessageSchema } },
      description: '删除成功',
    },
    404: { content: { 'application/json': { schema: ErrorSchema } }, description: '菜品不存在' },
  },
});
app.openapi(deleteMenuItemRoute, async (c) => {
  const { id } = c.req.valid('param');
  const result = await db
    .delete(schema.menuItems)
    .where(eq(schema.menuItems.id, parseInt(id)))
    .returning();
  if (result.length === 0) {
    return c.json({ error: 'menu_item_not_found' }, 404);
  }
  return c.json({ success: true, message: '删除成功' }, 200);
});

// ============================================
// 订单 API
// ============================================

// GET /api/orders
const listOrdersRoute = createRoute({
  method: 'get',
  path: '/api/orders',
  tags: ['Orders'],
  summary: '订单列表（admin/staff）',
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireRole('admin', 'staff')] as const,
  request: { query: OrderListQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: OrderListResponseSchema } },
      description: '订单列表',
    },
    401: { content: { 'application/json': { schema: ErrorSchema } }, description: '未认证' },
    403: { content: { 'application/json': { schema: ErrorSchema } }, description: '无权限' },
  },
});
app.openapi(listOrdersRoute, async (c) => {
  const { status, page, pageSize, startDate, endDate } = c.req.valid('query');
  const result = await getOrders({
    status: status as any,
    page: page ? parseInt(page) : 1,
    pageSize: pageSize ? parseInt(pageSize) : 20,
    startDate,
    endDate,
  });
  return c.json(result as any, 200);
});

// POST /api/orders
const createOrderRoute = createRoute({
  method: 'post',
  path: '/api/orders',
  tags: ['Orders'],
  summary: '创建订单',
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireRole('admin', 'staff', 'customer')] as const,
  request: {
    body: { content: { 'application/json': { schema: CreateOrderRequestSchema } } },
  },
  responses: {
    201: { content: { 'application/json': { schema: OrderSchema } }, description: '创建成功' },
    400: { content: { 'application/json': { schema: ErrorSchema } }, description: '参数错误' },
    401: { content: { 'application/json': { schema: ErrorSchema } }, description: '未认证' },
  },
});
app.openapi(createOrderRoute, async (c) => {
  const body = c.req.valid('json');
  const result = await createOrder(body);
  if (!result.success) {
    return c.json({ error: result.error!, message: result.message }, 400);
  }
  return c.json(result.order as any, 201);
});

// GET /api/orders/:id
const getOrderRoute = createRoute({
  method: 'get',
  path: '/api/orders/{id}',
  tags: ['Orders'],
  summary: '获取订单详情',
  security: [{ Bearer: [] }],
  middleware: [authMiddleware] as const,
  request: { params: IdParamSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: OrderWithItemsSchema } },
      description: '订单详情',
    },
    404: { content: { 'application/json': { schema: ErrorSchema } }, description: '订单不存在' },
  },
});
app.openapi(getOrderRoute, async (c) => {
  const { id } = c.req.valid('param');
  const order = await getOrderById(parseInt(id));
  if (!order) {
    return c.json({ error: 'order_not_found' }, 404);
  }
  return c.json(order as any, 200);
});

// POST /api/orders/:id/confirm
const confirmOrderRoute = createRoute({
  method: 'post',
  path: '/api/orders/{id}/confirm',
  tags: ['Orders'],
  summary: '接单（staff/admin）',
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireStaff] as const,
  request: { params: IdParamSchema },
  responses: {
    200: { content: { 'application/json': { schema: OrderSchema } }, description: '已接单' },
    400: { content: { 'application/json': { schema: ErrorSchema } }, description: '状态转换失败' },
  },
});
app.openapi(confirmOrderRoute, async (c) => {
  const { id } = c.req.valid('param');
  const result = await confirmOrder(parseInt(id));
  if (!result.success) {
    return c.json({ error: result.error!, message: result.message }, 400);
  }
  return c.json(result.order as any, 200);
});

// POST /api/orders/:id/ready
const readyOrderRoute = createRoute({
  method: 'post',
  path: '/api/orders/{id}/ready',
  tags: ['Orders'],
  summary: '出餐（staff/admin）',
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireStaff] as const,
  request: { params: IdParamSchema },
  responses: {
    200: { content: { 'application/json': { schema: OrderSchema } }, description: '待取餐' },
    400: { content: { 'application/json': { schema: ErrorSchema } }, description: '状态转换失败' },
  },
});
app.openapi(readyOrderRoute, async (c) => {
  const { id } = c.req.valid('param');
  const result = await readyOrder(parseInt(id));
  if (!result.success) {
    return c.json({ error: result.error!, message: result.message }, 400);
  }
  return c.json(result.order as any, 200);
});

// POST /api/orders/:id/complete
const completeOrderRoute = createRoute({
  method: 'post',
  path: '/api/orders/{id}/complete',
  tags: ['Orders'],
  summary: '完成（staff/admin）',
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireStaff] as const,
  request: { params: IdParamSchema },
  responses: {
    200: { content: { 'application/json': { schema: OrderSchema } }, description: '已完成' },
    400: { content: { 'application/json': { schema: ErrorSchema } }, description: '状态转换失败' },
  },
});
app.openapi(completeOrderRoute, async (c) => {
  const { id } = c.req.valid('param');
  const result = await completeOrder(parseInt(id));
  if (!result.success) {
    return c.json({ error: result.error!, message: result.message }, 400);
  }
  return c.json(result.order as any, 200);
});

// POST /api/orders/:id/cancel
const cancelOrderRoute = createRoute({
  method: 'post',
  path: '/api/orders/{id}/cancel',
  tags: ['Orders'],
  summary: '取消（admin/staff）',
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireRole('admin', 'staff')] as const,
  request: { params: IdParamSchema },
  responses: {
    200: { content: { 'application/json': { schema: OrderSchema } }, description: '已取消' },
    400: { content: { 'application/json': { schema: ErrorSchema } }, description: '状态转换失败' },
  },
});
app.openapi(cancelOrderRoute, async (c) => {
  const { id } = c.req.valid('param');
  const result = await cancelOrder(parseInt(id));
  if (!result.success) {
    return c.json({ error: result.error!, message: result.message }, 400);
  }
  return c.json(result.order as any, 200);
});

// PATCH /api/orders/:id - 修改 notes
const updateOrderRoute = createRoute({
  method: 'patch',
  path: '/api/orders/{id}',
  tags: ['Orders'],
  summary: '修改订单备注（禁止改 status）',
  security: [{ Bearer: [] }],
  middleware: [authMiddleware] as const,
  request: {
    params: IdParamSchema,
    body: { content: { 'application/json': { schema: UpdateOrderRequestSchema } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: OrderSchema } }, description: '已更新' },
    400: { content: { 'application/json': { schema: ErrorSchema } }, description: '禁止改 status' },
  },
});
app.openapi(updateOrderRoute, async (c) => {
  const { id } = c.req.valid('param');
  const body = c.req.valid('json') as Record<string, unknown>;
  if ('status' in body) {
    return c.json(
      {
        error: 'direct_status_update_forbidden',
        message: '禁止直接修改订单状态，请使用状态操作接口',
      },
      400
    );
  }
  const [updated] = await db
    .update(schema.orders)
    .set(body as any)
    .where(eq(schema.orders.id, parseInt(id)))
    .returning();
  return c.json(updated as any, 200);
});

// ============================================
// 客户 API
// ============================================

// GET /api/customers - 客户列表（admin/staff）
const listCustomersRoute = createRoute({
  method: 'get',
  path: '/api/customers',
  tags: ['Customers'],
  summary: '客户列表（admin/staff）',
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireRole('admin', 'staff')] as const,
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(CustomerSchema) } },
      description: '客户列表',
    },
  },
});
app.openapi(listCustomersRoute, async (c) => {
  const customers = await db
    .select()
    .from(schema.customers)
    .orderBy(desc(schema.customers.createdAt));
  return c.json(customers as any, 200);
});

// POST /api/customers - 新建客户
const createCustomerRoute = createRoute({
  method: 'post',
  path: '/api/customers',
  tags: ['Customers'],
  summary: '新建客户',
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireRole('admin', 'staff')] as const,
  request: {
    body: { content: { 'application/json': { schema: CreateCustomerRequestSchema } } },
  },
  responses: {
    201: { content: { 'application/json': { schema: CustomerSchema } }, description: '创建成功' },
    400: { content: { 'application/json': { schema: ErrorSchema } }, description: '参数错误' },
  },
});
app.openapi(createCustomerRoute, async (c) => {
  const body = c.req.valid('json');
  const [created] = await db.insert(schema.customers).values(body as any).returning();
  return c.json(created as any, 201);
});

// PATCH /api/customers/:id
const updateCustomerRoute = createRoute({
  method: 'patch',
  path: '/api/customers/{id}',
  tags: ['Customers'],
  summary: '修改客户',
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireRole('admin', 'staff')] as const,
  request: {
    params: IdParamSchema,
    body: { content: { 'application/json': { schema: UpdateCustomerRequestSchema } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: CustomerSchema } }, description: '更新成功' },
    404: { content: { 'application/json': { schema: ErrorSchema } }, description: '客户不存在' },
  },
});
app.openapi(updateCustomerRoute, async (c) => {
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');
  const [updated] = await db
    .update(schema.customers)
    .set({ ...(body as any), updatedAt: new Date() })
    .where(eq(schema.customers.id, parseInt(id)))
    .returning();
  if (!updated) {
    return c.json({ error: 'customer_not_found' }, 404);
  }
  return c.json(updated as any, 200);
});

// GET /api/customers/:id/orders
const customerOrdersRoute = createRoute({
  method: 'get',
  path: '/api/customers/{id}/orders',
  tags: ['Customers'],
  summary: '客户订单 + 累计消费',
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireRole('admin', 'staff', 'customer')] as const,
  request: { params: IdParamSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: CustomerOrdersResponseSchema } },
      description: '客户订单',
    },
    403: { content: { 'application/json': { schema: ErrorSchema } }, description: '无权限' },
  },
});
app.openapi(customerOrdersRoute, async (c) => {
  const { id } = c.req.valid('param');
  const customerId = parseInt(id);
  const user = c.get('user') as { userId: number; role: string } | undefined;

  if (user?.role === 'customer') {
    const [me] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, user.userId));
    if (!me || me.customerId !== customerId) {
      return c.json({ error: 'forbidden', message: '只能查看自己的订单' }, 403);
    }
  }

  const orders = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.customerId, customerId))
    .orderBy(desc(schema.orders.createdAt));

  const [spendResult] = await db
    .select({ total: sql<number>`sum(total)` })
    .from(schema.orders)
    .where(
      and(
        eq(schema.orders.customerId, customerId),
        sql`${schema.orders.status} != 'cancelled'`
      )
    );

  return c.json(
    {
      orders: orders as any,
      totalSpend: Number(spendResult?.total ?? 0),
      orderCount: orders.length,
    },
    200
  );
});

// ============================================
// Dashboard API
// ============================================

const kpiRoute = createRoute({
  method: 'get',
  path: '/api/dashboard/kpi',
  tags: ['Dashboard'],
  summary: '运营 KPI',
  security: [{ Bearer: [] }],
  middleware: [authMiddleware] as const,
  responses: {
    200: { content: { 'application/json': { schema: DashboardKPISchema } }, description: 'KPI' },
  },
});
app.openapi(kpiRoute, async (c) => {
  const [totalResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.orders);

  const today = new Date().toISOString().slice(0, 10);
  const [todayResult] = await db
    .select({
      count: sql<number>`count(*)::int`,
      revenue: sql<number>`sum(total)`,
    })
    .from(schema.orders)
    .where(gte(schema.orders.createdAt, new Date(today)));

  const [pendingResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.orders)
    .where(sql`${schema.orders.status} IN ('pending', 'confirmed', 'ready')`);

  const popularItems = await db
    .select({
      name: schema.orderItems.menuItemName,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.orderItems)
    .leftJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
    .where(sql`${schema.orders.status} != 'cancelled'`)
    .groupBy(schema.orderItems.menuItemName)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  return c.json(
    {
      totalOrders: totalResult?.count ?? 0,
      todayOrders: todayResult?.count ?? 0,
      todayRevenue: Number(todayResult?.revenue ?? 0),
      pendingOrders: pendingResult?.count ?? 0,
      popularItems,
    },
    200
  );
});

// ============================================
// 设置 API
// ============================================

const getSettingsRoute = createRoute({
  method: 'get',
  path: '/api/settings',
  tags: ['Settings'],
  summary: '获取业务设置',
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireAdmin] as const,
  responses: {
    200: {
      content: { 'application/json': { schema: BusinessSettingsSchema } },
      description: '业务设置',
    },
  },
});
app.openapi(getSettingsRoute, async (c) => {
  const [settings] = await db
    .select()
    .from(schema.businessSettings)
    .orderBy(schema.businessSettings.id)
    .limit(1);
  return c.json(settings as any, 200);
});

const updateSettingsRoute = createRoute({
  method: 'patch',
  path: '/api/settings',
  tags: ['Settings'],
  summary: '更新业务设置',
  security: [{ Bearer: [] }],
  middleware: [authMiddleware, requireAdmin] as const,
  request: {
    body: { content: { 'application/json': { schema: UpdateBusinessSettingsRequestSchema } } },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: BusinessSettingsSchema } },
      description: '已更新',
    },
  },
});
app.openapi(updateSettingsRoute, async (c) => {
  const body = c.req.valid('json');
  const [existing] = await db
    .select()
    .from(schema.businessSettings)
    .orderBy(schema.businessSettings.id)
    .limit(1);
  if (!existing) {
    const [created] = await db
      .insert(schema.businessSettings)
      .values({ ...(body as any) })
      .returning();
    return c.json(created as any, 200);
  }
  const [updated] = await db
    .update(schema.businessSettings)
    .set({ ...(body as any), updatedAt: new Date() })
    .where(eq(schema.businessSettings.id, existing.id))
    .returning();
  return c.json(updated as any, 200);
});

// ============================================
// OpenAPI 文档 + security scheme
// ============================================

app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    title: 'Restaurant Operations API',
    version: '1.0.0',
    description: 'Odyssey 餐厅运营系统 API - JWT 认证',
  },
});

export default app;
