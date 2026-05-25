// 订单状态转换测试
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { db, schema } from '../../db';
import { eq } from 'drizzle-orm';
import {
  confirmOrder,
  readyOrder,
  completeOrder,
  cancelOrder,
  canTransition,
  getValidTransitions,
} from '../../services/order-state-machine';
import { clearAuthTables, createTestCustomer, createTestCategory, createTestMenuItem } from '../helpers';

describe('Order Status Transitions', () => {
  let customerId: number;
  let menuItemId: number;

  beforeAll(async () => {
    await clearAuthTables();

    const customer = await createTestCustomer({
      name: '测试客户',
      phone: '13800138000',
    });
    customerId = customer.id;

    const category = await createTestCategory('主食');
    const menuItem = await createTestMenuItem({
      name: '牛肉面',
      price: 2800,
      stock: 100,
      available: true,
    }, category.id);
    menuItemId = menuItem.id;
  });

  afterAll(async () => {
    await clearAuthTables();
  });

  describe('Valid Transitions', () => {
    it('should transition from pending to confirmed', async () => {
      const [order] = await db.insert(schema.orders).values({
        customerId,
        status: 'pending',
        total: 5600,
      }).returning();

      const result = await confirmOrder(order.id);

      expect(result.success).toBe(true);
      expect(result.order?.status).toBe('confirmed');
      expect(result.order?.confirmedAt).not.toBeNull();

      // 清理
      await db.delete(schema.orders).where(eq(schema.orders.id, order.id));
    });

    it('should transition from confirmed to ready', async () => {
      const [order] = await db.insert(schema.orders).values({
        customerId,
        status: 'confirmed',
        total: 5600,
        confirmedAt: new Date(),
      }).returning();

      const result = await readyOrder(order.id);

      expect(result.success).toBe(true);
      expect(result.order?.status).toBe('ready');
      expect(result.order?.readyAt).not.toBeNull();

      // 清理
      await db.delete(schema.orders).where(eq(schema.orders.id, order.id));
    });

    it('should transition from ready to completed', async () => {
      const [order] = await db.insert(schema.orders).values({
        customerId,
        status: 'ready',
        total: 5600,
        confirmedAt: new Date(),
        readyAt: new Date(),
      }).returning();

      const result = await completeOrder(order.id);

      expect(result.success).toBe(true);
      expect(result.order?.status).toBe('completed');
      expect(result.order?.completedAt).not.toBeNull();

      // 清理
      await db.delete(schema.orders).where(eq(schema.orders.id, order.id));
    });

    it('should allow cancel from pending', async () => {
      const [order] = await db.insert(schema.orders).values({
        customerId,
        status: 'pending',
        total: 5600,
      }).returning();

      const result = await cancelOrder(order.id);

      expect(result.success).toBe(true);
      expect(result.order?.status).toBe('cancelled');
      expect(result.order?.cancelledAt).not.toBeNull();

      // 清理
      await db.delete(schema.orders).where(eq(schema.orders.id, order.id));
    });

    it('should allow cancel from confirmed', async () => {
      const [order] = await db.insert(schema.orders).values({
        customerId,
        status: 'confirmed',
        total: 5600,
        confirmedAt: new Date(),
      }).returning();

      const result = await cancelOrder(order.id);

      expect(result.success).toBe(true);
      expect(result.order?.status).toBe('cancelled');

      // 清理
      await db.delete(schema.orders).where(eq(schema.orders.id, order.id));
    });
  });

  describe('Invalid Transitions', () => {
    it('should reject pending -> ready (skip confirm)', async () => {
      const [order] = await db.insert(schema.orders).values({
        customerId,
        status: 'pending',
        total: 5600,
      }).returning();

      const result = await readyOrder(order.id);

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_transition');
      expect(result.message).toMatch(/必须先接单|只能转换为/);

      // 验证数据库状态未变
      const [unchanged] = await db.select().from(schema.orders)
        .where(eq(schema.orders.id, order.id));
      expect(unchanged.status).toBe('pending');

      // 清理
      await db.delete(schema.orders).where(eq(schema.orders.id, order.id));
    });

    it('should reject reverse transition (ready -> confirmed)', async () => {
      const [order] = await db.insert(schema.orders).values({
        customerId,
        status: 'ready',
        total: 5600,
        confirmedAt: new Date(),
        readyAt: new Date(),
      }).returning();

      const result = await confirmOrder(order.id);

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_transition');

      // 清理
      await db.delete(schema.orders).where(eq(schema.orders.id, order.id));
    });

    it('should reject any transition from completed', async () => {
      const [order] = await db.insert(schema.orders).values({
        customerId,
        status: 'completed',
        total: 5600,
        confirmedAt: new Date(),
        readyAt: new Date(),
        completedAt: new Date(),
      }).returning();

      const result = await confirmOrder(order.id);

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/终态|无法更改/);

      // 清理
      await db.delete(schema.orders).where(eq(schema.orders.id, order.id));
    });

    it('should reject any transition from cancelled', async () => {
      const [order] = await db.insert(schema.orders).values({
        customerId,
        status: 'cancelled',
        total: 5600,
        cancelledAt: new Date(),
      }).returning();

      const result = await confirmOrder(order.id);

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_transition');

      // 清理
      await db.delete(schema.orders).where(eq(schema.orders.id, order.id));
    });
  });

  describe('Helper Functions', () => {
    it('should correctly identify valid transitions', () => {
      expect(canTransition('pending', 'confirmed')).toBe(true);
      expect(canTransition('pending', 'cancelled')).toBe(true);
      expect(canTransition('pending', 'ready')).toBe(false);

      expect(canTransition('confirmed', 'ready')).toBe(true);
      expect(canTransition('confirmed', 'cancelled')).toBe(true);
      expect(canTransition('confirmed', 'pending')).toBe(false);

      expect(canTransition('ready', 'completed')).toBe(true);
      expect(canTransition('ready', 'confirmed')).toBe(false);

      expect(canTransition('completed', 'pending')).toBe(false);
      expect(canTransition('cancelled', 'pending')).toBe(false);
    });

    it('should return correct valid transitions list', () => {
      expect(getValidTransitions('pending')).toEqual(['confirmed', 'cancelled']);
      expect(getValidTransitions('confirmed')).toEqual(['ready', 'cancelled']);
      expect(getValidTransitions('ready')).toEqual(['completed']);
      expect(getValidTransitions('completed')).toEqual([]);
      expect(getValidTransitions('cancelled')).toEqual([]);
    });
  });

  describe('Stock Management', () => {
    it('should restore stock when order is cancelled', async () => {
      // 创建库存有限的菜品
      const [menuItem] = await db.insert(schema.menuItems).values({
        categoryId: 1,
        name: '测试库存菜品',
        price: 1000,
        stock: 10,
        available: true,
      }).returning();

      // 创建订单
      const [order] = await db.insert(schema.orders).values({
        customerId,
        status: 'pending',
        total: 3000,
      }).returning();

      // 创建订单项
      await db.insert(schema.orderItems).values({
        orderId: order.id,
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        quantity: 3,
        unitPrice: menuItem.price,
        subtotal: 3000,
      });

      // 取消订单
      await cancelOrder(order.id);

      // 验证库存恢复
      const [updatedMenuItem] = await db.select().from(schema.menuItems)
        .where(eq(schema.menuItems.id, menuItem.id));
      expect(updatedMenuItem.stock).toBe(10); // 恢复到原始库存

      // 清理
      await db.delete(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
      await db.delete(schema.orders).where(eq(schema.orders.id, order.id));
      await db.delete(schema.menuItems).where(eq(schema.menuItems.id, menuItem.id));
    });
  });
});
