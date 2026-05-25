// 订单服务
// 包含订单创建、查询、验证逻辑

import { db, schema } from '../db';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { createOrderRequestSchema, type CreateOrderRequest } from '../db/validators';

// ============================================
// 订单创建
// ============================================

interface CreateOrderResult {
  success: boolean;
  order?: schema.Order;
  items?: schema.OrderItem[];
  error?: string;
  message?: string;
}

export async function createOrder(request: unknown): Promise<CreateOrderResult> {
  // 1. 验证请求
  const parseResult = createOrderRequestSchema.safeParse(request);
  if (!parseResult.success) {
    return {
      success: false,
      error: 'validation_error',
      message: parseResult.error.errors.map(e => e.message).join(', '),
    };
  }

  const { customerId, items, notes } = parseResult.data;

  // 2. 验证客户存在
  const [customer] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, customerId));

  if (!customer) {
    return {
      success: false,
      error: 'customer_not_found',
      message: '客户不存在',
    };
  }

  // 3. 验证菜品可用性并获取价格
  const menuItemIds = items.map(item => item.menuItemId);
  const menuItemsData = await db
    .select()
    .from(schema.menuItems)
    .where(sql`${schema.menuItems.id} IN ${menuItemIds}`);

  // 检查菜品是否存在
  const missingItems = menuItemIds.filter(id => !menuItemsData.find(m => m.id === id));
  if (missingItems.length > 0) {
    return {
      success: false,
      error: 'item_not_found',
      message: `菜品不存在: ${missingItems.join(', ')}`,
    };
  }

  // 检查菜品是否可用
  const unavailableItems = menuItemsData.filter(m => !m.available);
  if (unavailableItems.length > 0) {
    return {
      success: false,
      error: 'item_unavailable',
      message: `以下菜品已下架: ${unavailableItems.map(m => m.name).join(', ')}`,
    };
  }

  // 检查库存（-1 表示无限库存）
  const insufficientStock = items.filter(item => {
    const menuItem = menuItemsData.find(m => m.id === item.menuItemId);
    return menuItem && menuItem.stock !== -1 && menuItem.stock < item.quantity;
  });

  if (insufficientStock.length > 0) {
    const details = insufficientStock.map(item => {
      const menuItem = menuItemsData.find(m => m.id === item.menuItemId);
      return `${menuItem?.name}(库存:${menuItem?.stock}, 需要:${item.quantity})`;
    });
    return {
      success: false,
      error: 'insufficient_stock',
      message: `库存不足: ${details.join(', ')}`,
    };
  }

  // 4. 计算总价
  let total = 0;
  const orderItemsData: schema.NewOrderItem[] = items.map(item => {
    const menuItem = menuItemsData.find(m => m.id === item.menuItemId)!;
    const subtotal = menuItem.price * item.quantity;
    total += subtotal;
    return {
      menuItemId: item.menuItemId,
      menuItemName: menuItem.name,
      quantity: item.quantity,
      unitPrice: menuItem.price,
      subtotal,
    };
  });

  // 5. 生成订单号
  const orderNo = await generateOrderNo();

  // 6. 创建订单（事务）
  const [order] = await db
    .insert(schema.orders)
    .values({
      orderNo,
      customerId,
      status: 'pending',
      total,
      notes,
    })
    .returning();

  // 7. 创建订单项
  const orderItemsWithOrderId = orderItemsData.map(item => ({
    ...item,
    orderId: order.id,
  }));

  const createdItems = await db
    .insert(schema.orderItems)
    .values(orderItemsWithOrderId)
    .returning();

  // 8. 扣减库存（-1 表示无限库存）
  for (const item of items) {
    const menuItem = menuItemsData.find(m => m.id === item.menuItemId);
    if (menuItem && menuItem.stock !== -1) {
      await db
        .update(schema.menuItems)
        .set({
          stock: menuItem.stock - item.quantity,
        })
        .where(eq(schema.menuItems.id, item.menuItemId));
    }
  }

  return {
    success: true,
    order,
    items: createdItems,
    message: '订单创建成功',
  };
}

// ============================================
// 订单号生成
// ============================================

async function generateOrderNo(): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

  // 查询今天的订单数量
  const todayStart = new Date(now.toISOString().slice(0, 10) + 'T00:00:00Z');
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.orders)
    .where(gte(schema.orders.createdAt, todayStart));

  const seq = (result?.count ?? 0) + 1;
  return `ORD${dateStr}${seq.toString().padStart(4, '0')}`;
}

// ============================================
// 订单查询
// ============================================

interface OrderListParams {
  status?: schema.OrderStatus;
  customerId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export async function getOrders(params: OrderListParams) {
  const { status, customerId, startDate, endDate, page = 1, pageSize = 20 } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (status) {
    conditions.push(eq(schema.orders.status, status));
  }

  if (customerId) {
    conditions.push(eq(schema.orders.customerId, customerId));
  }

  if (startDate) {
    conditions.push(gte(schema.orders.createdAt, new Date(startDate)));
  }

  if (endDate) {
    // 包含结束日期的整天
    const endDateTime = new Date(endDate);
    endDateTime.setDate(endDateTime.getDate() + 1);
    conditions.push(lte(schema.orders.createdAt, endDateTime));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const orders = await db
    .select({
      id: schema.orders.id,
      orderNo: schema.orders.orderNo,
      customerId: schema.orders.customerId,
      customerName: schema.customers.name,
      status: schema.orders.status,
      total: schema.orders.total,
      notes: schema.orders.notes,
      createdAt: schema.orders.createdAt,
      confirmedAt: schema.orders.confirmedAt,
      readyAt: schema.orders.readyAt,
      completedAt: schema.orders.completedAt,
      cancelledAt: schema.orders.cancelledAt,
    })
    .from(schema.orders)
    .leftJoin(schema.customers, eq(schema.orders.customerId, schema.customers.id))
    .where(whereClause)
    .orderBy(desc(schema.orders.createdAt))
    .limit(pageSize)
    .offset(offset);

  // 获取总数
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.orders)
    .where(whereClause);

  return {
    data: orders,
    total: countResult?.count ?? 0,
    page,
    pageSize,
  };
}

export async function getOrderById(orderId: number) {
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, orderId));

  if (!order) {
    return null;
  }

  // 获取订单项
  const items = await db
    .select()
    .from(schema.orderItems)
    .where(eq(schema.orderItems.orderId, orderId));

  // 获取客户信息
  const [customer] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, order.customerId));

  return {
    ...order,
    customer,
    items,
  };
}
