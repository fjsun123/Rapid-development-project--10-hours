// 测试辅助工具
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db';

// ============================================
// 数据库清理工具
// ============================================

export async function clearAuthTables() {
  // 删除顺序：先删被引用的孩子，再删父表（避免 FK 约束错）
  await db.delete(schema.orderItems);
  await db.delete(schema.orders);
  await db.delete(schema.users);
  await db.delete(schema.customers);
  await db.delete(schema.menuItems);
  await db.delete(schema.categories);
}

// ============================================
// 创建种子数据工具
// ============================================

export interface TestCustomer {
  name: string;
  phone: string;
}

export interface TestMenuItem {
  name: string;
  price: number;
  stock: number;
  available?: boolean;
}

export async function createTestCustomer(customer: TestCustomer) {
  const [created] = await db.insert(schema.customers).values({
    name: customer.name,
    phone: customer.phone,
  }).returning();
  return created;
}

export async function createTestCategory(name: string) {
  const [created] = await db.insert(schema.categories).values({
    name,
  }).returning();
  return created;
}

export async function createTestMenuItem(menuItem: TestMenuItem, categoryId: number) {
  const [created] = await db.insert(schema.menuItems).values({
    categoryId,
    name: menuItem.name,
    price: menuItem.price,
    stock: menuItem.stock,
    available: menuItem.available ?? true,
  }).returning();
  return created;
}

export async function createTestOrder(customerId: number, items: Array<{ menuItemId: number; quantity: number }>) {
  const result = await db.insert(schema.orders).values({
    customerId,
    status: 'pending' as const,
    total: 0, // 后续计算
  }).returning();

  const orderId = result[0].id;

  // 创建订单项
  for (const item of items) {
    const [menuItem] = await db.select().from(schema.menuItems)
      .where(eq(schema.menuItems.id, item.menuItemId));

    const subtotal = menuItem?.price * item.quantity || 0;
    await db.insert(schema.orderItems).values({
      orderId,
      menuItemId: item.menuItemId,
      menuItemName: menuItem?.name || '',
      quantity: item.quantity,
      unitPrice: menuItem?.price || 0,
      subtotal,
    });
  }

  // 更新订单总额
  await db.update(schema.orders)
    .set({ total: 0 }) // 重新计算总额
    .where(eq(schema.orders.id, orderId));

  return result[0];
}

// ============================================
// 断言辅助工具
// ============================================

export function expectErrorCode(res: Response, expectedCode: string) {
  expect(res.status).toBe(400);
  const data = res.json();
  expect(data).toHaveProperty('error');
  expect(data.error).toBe(expectedCode);
}

export function expectUnauthorized(res: Response, message?: string) {
  expect(res.status).toBe(401);
  const data = res.json();
  expect(data).toHaveProperty('error');
  expect(data.error).toBe('unauthorized');
}

export function expectNotFound(res: Response) {
  expect(res.status).toBe(404);
}

export function expectSuccess<T>(res: Response, expectedData?: Partial<T>) {
  expect(res.status).toBe(200 || 201);
  if (expectedData) {
    const data = res.json();
    expect(data).toMatchObject(expectedData);
  }
}

// ============================================
// Zod Schema 请求辅助
// ============================================

export const phoneSchema = z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确');

export const createOrderRequestSchema = z.object({
  customerId: z.number().int().positive(),
  items: z.array(z.object({
    menuItemId: z.number().int().positive(),
    quantity: z.number().int().positive(),
  })).min(1, '至少需要一个菜品'),
  notes: z.string().optional(),
});

export const loginRequestSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  code: z.string().length(6, '验证码为6位数字'),
});

// ============================================
// Mock 数据
// ============================================

export const mockAdminUser = {
  id: 1,
  phone: 'admin',
  name: '管理员',
  role: 'admin' as const,
};

export const mockStaffUser = {
  id: 2,
  phone: '13800138000',
  name: '员工小王',
  role: 'staff' as const,
};

export const mockCustomerUser = {
  id: 3,
  phone: '13800138001',
  name: '张三',
  role: 'customer' as const,
};
