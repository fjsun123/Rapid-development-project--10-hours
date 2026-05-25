// 订单创建测试
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { db, schema } from '../../db';
import { eq } from 'drizzle-orm';
import { createOrder } from '../../services/order-service';
import { clearAuthTables, createTestCustomer, createTestCategory, createTestMenuItem } from '../helpers';

describe('Create Order', () => {
  let customerId: number;
  let menuItemId1: number;
  let menuItemId2: number;
  let unavailableMenuItemId: number;

  beforeAll(async () => {
    await clearAuthTables();

    const customer = await createTestCustomer({
      name: '测试客户',
      phone: '13800138000',
    });
    customerId = customer.id;

    const category = await createTestCategory('主食');

    const menuItem1 = await createTestMenuItem({
      name: '牛肉面',
      price: 2800,
      stock: 100,
      available: true,
    }, category.id);
    menuItemId1 = menuItem1.id;

    const menuItem2 = await createTestMenuItem({
      name: '可乐',
      price: 600,
      stock: 50,
      available: true,
    }, category.id);
    menuItemId2 = menuItem2.id;

    const unavailableMenuItem = await createTestMenuItem({
      name: '已下架菜品',
      price: 1500,
      stock: 10,
      available: false,
    }, category.id);
    unavailableMenuItemId = unavailableMenuItem.id;
  });

  afterAll(async () => {
    await clearAuthTables();
  });

  describe('Valid Order Creation', () => {
    it('should create order with valid payload', async () => {
      const request = {
        customerId,
        items: [
          { menuItemId: menuItemId1, quantity: 2 },
          { menuItemId: menuItemId2, quantity: 1 },
        ],
        notes: '少放辣',
      };

      const result = await createOrder(request);

      expect(result.success).toBe(true);
      expect(result.order).toBeDefined();
      expect(result.order?.status).toBe('pending');
      expect(result.order?.notes).toBe('少放辣');
      expect(result.items).toHaveLength(2);

      // 清理
      if (result.order) {
        await db.delete(schema.orderItems).where(eq(schema.orderItems.orderId, result.order.id));
        await db.delete(schema.orders).where(eq(schema.orders.id, result.order.id));
      }
    });

    it('should calculate total correctly', async () => {
      const request = {
        customerId,
        items: [
          { menuItemId: menuItemId1, quantity: 2 }, // 28 * 2 = 56
          { menuItemId: menuItemId2, quantity: 3 }, // 6 * 3 = 18
        ],
      };

      const result = await createOrder(request);

      expect(result.success).toBe(true);
      expect(result.order?.total).toBe(7400); // 56 + 18 = 74 元 = 7400 分

      // 清理
      if (result.order) {
        await db.delete(schema.orderItems).where(eq(schema.orderItems.orderId, result.order.id));
        await db.delete(schema.orders).where(eq(schema.orders.id, result.order.id));
      }
    });

    it('should deduct stock when order created', async () => {
      // 创建库存有限的菜品
      const [limitedMenuItem] = await db.insert(schema.menuItems).values({
        categoryId: 1,
        name: '限量菜品',
        price: 1000,
        stock: 10,
        available: true,
      }).returning();

      const request = {
        customerId,
        items: [
          { menuItemId: limitedMenuItem.id, quantity: 3 },
        ],
      };

      const result = await createOrder(request);

      expect(result.success).toBe(true);

      // 验证库存扣减
      const [updatedMenuItem] = await db.select().from(schema.menuItems)
        .where(eq(schema.menuItems.id, limitedMenuItem.id));
      expect(updatedMenuItem.stock).toBe(7); // 10 - 3 = 7

      // 清理
      if (result.order) {
        await db.delete(schema.orderItems).where(eq(schema.orderItems.orderId, result.order.id));
        await db.delete(schema.orders).where(eq(schema.orders.id, result.order.id));
      }
      await db.delete(schema.menuItems).where(eq(schema.menuItems.id, limitedMenuItem.id));
    });
  });

  describe('Validation Errors', () => {
    it('should reject missing customerId', async () => {
      const request = {
        items: [
          { menuItemId: menuItemId1, quantity: 2 },
        ],
      };

      const result = await createOrder(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('validation_error');
    });

    it('should reject empty items', async () => {
      const request = {
        customerId,
        items: [],
      };

      const result = await createOrder(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('validation_error');
    });

    it('should reject missing menuItemId in item', async () => {
      const request = {
        customerId,
        items: [
          { quantity: 2 },
        ],
      };

      const result = await createOrder(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('validation_error');
    });

    it('should reject missing quantity in item', async () => {
      const request = {
        customerId,
        items: [
          { menuItemId: menuItemId1 },
        ],
      };

      const result = await createOrder(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('validation_error');
    });

    it('should reject non-existent customer', async () => {
      const request = {
        customerId: 99999,
        items: [
          { menuItemId: menuItemId1, quantity: 2 },
        ],
      };

      const result = await createOrder(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('customer_not_found');
    });

    it('should reject non-existent menu item', async () => {
      const request = {
        customerId,
        items: [
          { menuItemId: 99999, quantity: 2 },
        ],
      };

      const result = await createOrder(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('item_not_found');
    });

    it('should reject unavailable menu item', async () => {
      const request = {
        customerId,
        items: [
          { menuItemId: unavailableMenuItemId, quantity: 2 },
        ],
      };

      const result = await createOrder(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('item_unavailable');
    });

    it('should reject insufficient stock', async () => {
      // 创建库存很少的菜品
      const [lowStockMenuItem] = await db.insert(schema.menuItems).values({
        categoryId: 1,
        name: '低库存菜品',
        price: 1000,
        stock: 2,
        available: true,
      }).returning();

      const request = {
        customerId,
        items: [
          { menuItemId: lowStockMenuItem.id, quantity: 5 },
        ],
      };

      const result = await createOrder(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('insufficient_stock');
      expect(result.message).toMatch(/库存不足/);

      // 清理
      await db.delete(schema.menuItems).where(eq(schema.menuItems.id, lowStockMenuItem.id));
    });

    it('should allow order with unlimited stock (-1)', async () => {
      // 创建无限库存的菜品
      const [unlimitedMenuItem] = await db.insert(schema.menuItems).values({
        categoryId: 1,
        name: '无限库存菜品',
        price: 1000,
        stock: -1,
        available: true,
      }).returning();

      const request = {
        customerId,
        items: [
          { menuItemId: unlimitedMenuItem.id, quantity: 100 },
        ],
      };

      const result = await createOrder(request);

      expect(result.success).toBe(true);

      // 清理
      if (result.order) {
        await db.delete(schema.orderItems).where(eq(schema.orderItems.orderId, result.order.id));
        await db.delete(schema.orders).where(eq(schema.orders.id, result.order.id));
      }
      await db.delete(schema.menuItems).where(eq(schema.menuItems.id, unlimitedMenuItem.id));
    });
  });

  describe('Order Number Generation', () => {
    it('should generate unique order number', async () => {
      const request = {
        customerId,
        items: [
          { menuItemId: menuItemId1, quantity: 1 },
        ],
      };

      const result1 = await createOrder(request);
      const result2 = await createOrder(request);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.order?.orderNo).not.toBe(result2.order?.orderNo);

      // 清理
      if (result1.order) {
        await db.delete(schema.orderItems).where(eq(schema.orderItems.orderId, result1.order.id));
        await db.delete(schema.orders).where(eq(schema.orders.id, result1.order.id));
      }
      if (result2.order) {
        await db.delete(schema.orderItems).where(eq(schema.orderItems.orderId, result2.order.id));
        await db.delete(schema.orders).where(eq(schema.orders.id, result2.order.id));
      }
    });

    it('should have correct order number format', async () => {
      const request = {
        customerId,
        items: [
          { menuItemId: menuItemId1, quantity: 1 },
        ],
      };

      const result = await createOrder(request);

      expect(result.success).toBe(true);
      expect(result.order?.orderNo).toMatch(/^ORD\d{8}\d{4}$/); // ORD + YYYYMMDD + 4位序号

      // 清理
      if (result.order) {
        await db.delete(schema.orderItems).where(eq(schema.orderItems.orderId, result.order.id));
        await db.delete(schema.orders).where(eq(schema.orders.id, result.order.id));
      }
    });
  });
});
