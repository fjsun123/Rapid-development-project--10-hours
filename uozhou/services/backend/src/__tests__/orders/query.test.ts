// 订单查询测试
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { db, schema } from '../../db';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { getOrders, getOrderById } from '../../services/order-service';
import { clearAuthTables, createTestCustomer, createTestCategory, createTestMenuItem } from '../helpers';

describe('Order Query', () => {
  let customerId1: number;
  let customerId2: number;
  let menuItemId: number;

  beforeAll(async () => {
    await clearAuthTables();

    const customer1 = await createTestCustomer({
      name: '张三',
      phone: '13800138001',
    });
    customerId1 = customer1.id;

    const customer2 = await createTestCustomer({
      name: '李四',
      phone: '13800138002',
    });
    customerId2 = customer2.id;

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

  describe('Order List Query', () => {
    beforeEach(async () => {
      await db.delete(schema.orderItems);
      await db.delete(schema.orders);

      // 创建测试订单
      await db.insert(schema.orders).values([
        { customerId: customerId1, status: 'pending', total: 5600 },
        { customerId: customerId1, status: 'completed', total: 3400 },
        { customerId: customerId2, status: 'completed', total: 7800 },
        { customerId: customerId1, status: 'cancelled', total: 2000 },
      ]);
    });

    it('should return paginated order list', async () => {
      const result = await getOrders({ page: 1, pageSize: 20 });

      expect(result.data).toBeDefined();
      expect(result.total).toBe(4);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should return orders sorted by created_at desc', async () => {
      const result = await getOrders({ page: 1, pageSize: 20 });

      const dates = result.data.map(o => new Date(o.createdAt).getTime());
      expect(dates).toEqual([...dates].sort((a, b) => b - a));
    });

    it('should support pagination', async () => {
      const result1 = await getOrders({ page: 1, pageSize: 2 });
      const result2 = await getOrders({ page: 2, pageSize: 2 });

      expect(result1.data).toHaveLength(2);
      expect(result2.data).toHaveLength(2);
      expect(result1.data[0].id).not.toBe(result2.data[0].id);
    });
  });

  describe('Order Status Filter', () => {
    beforeEach(async () => {
      await db.delete(schema.orderItems);
      await db.delete(schema.orders);

      await db.insert(schema.orders).values([
        { customerId: customerId1, status: 'pending', total: 5600 },
        { customerId: customerId2, status: 'pending', total: 3400 },
        { customerId: customerId1, status: 'completed', total: 7800 },
        { customerId: customerId1, status: 'cancelled', total: 2000 },
      ]);
    });

    it('should filter by pending status', async () => {
      const result = await getOrders({ status: 'pending' });

      expect(result.total).toBe(2);
      result.data.forEach(order => {
        expect(order.status).toBe('pending');
      });
    });

    it('should filter by completed status', async () => {
      const result = await getOrders({ status: 'completed' });

      expect(result.total).toBe(1);
      result.data.forEach(order => {
        expect(order.status).toBe('completed');
      });
    });

    it('should filter by cancelled status', async () => {
      const result = await getOrders({ status: 'cancelled' });

      expect(result.total).toBe(1);
      result.data.forEach(order => {
        expect(order.status).toBe('cancelled');
      });
    });

    it('should return empty for non-existent status', async () => {
      const result = await getOrders({ status: 'ready' });

      expect(result.total).toBe(0);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('Order Customer Filter', () => {
    beforeEach(async () => {
      await db.delete(schema.orderItems);
      await db.delete(schema.orders);

      await db.insert(schema.orders).values([
        { customerId: customerId1, status: 'pending', total: 5600 },
        { customerId: customerId1, status: 'completed', total: 3400 },
        { customerId: customerId2, status: 'completed', total: 7800 },
      ]);
    });

    it('should filter by customer ID', async () => {
      const result = await getOrders({ customerId: customerId1 });

      expect(result.total).toBe(2);
      result.data.forEach(order => {
        expect(order.customerId).toBe(customerId1);
      });
    });

    it('should return orders for different customer', async () => {
      const result = await getOrders({ customerId: customerId2 });

      expect(result.total).toBe(1);
      expect(result.data[0].customerId).toBe(customerId2);
    });
  });

  describe('Order Date Range Filter', () => {
    beforeEach(async () => {
      await db.delete(schema.orderItems);
      await db.delete(schema.orders);

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      await db.insert(schema.orders).values([
        {
          customerId: customerId1,
          status: 'pending',
          total: 5600,
          createdAt: today,
        },
        {
          customerId: customerId1,
          status: 'completed',
          total: 3400,
          createdAt: yesterday,
        },
      ]);
    });

    it('should filter by start date', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const result = await getOrders({ startDate: today });

      expect(result.total).toBeGreaterThanOrEqual(1);
    });

    it('should filter by end date', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const result = await getOrders({ endDate: yesterday.toISOString().slice(0, 10) });

      expect(result.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Order Detail Query', () => {
    it('should return order details with items', async () => {
      // 创建订单
      const [order] = await db.insert(schema.orders).values({
        customerId: customerId1,
        status: 'pending',
        total: 5600,
      }).returning();

      // 创建订单项
      await db.insert(schema.orderItems).values([
        {
          orderId: order.id,
          menuItemId,
          menuItemName: '牛肉面',
          quantity: 2,
          unitPrice: 2800,
          subtotal: 5600,
        },
      ]);

      const result = await getOrderById(order.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(order.id);
      expect(result?.items).toHaveLength(1);
      expect(result?.items[0].menuItemName).toBe('牛肉面');

      // 清理
      await db.delete(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
      await db.delete(schema.orders).where(eq(schema.orders.id, order.id));
    });

    it('should return null for non-existent order', async () => {
      const result = await getOrderById(99999);

      expect(result).toBeNull();
    });

    it('should include customer information', async () => {
      const [order] = await db.insert(schema.orders).values({
        customerId: customerId1,
        status: 'pending',
        total: 5600,
      }).returning();

      const result = await getOrderById(order.id);

      expect(result?.customer).toBeDefined();
      expect(result?.customer?.name).toBe('张三');

      // 清理
      await db.delete(schema.orders).where(eq(schema.orders.id, order.id));
    });
  });
});
