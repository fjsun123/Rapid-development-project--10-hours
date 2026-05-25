// Drizzle Schema - 数据库表定义
// 这是所有数据真理的源头：Drizzle schema -> drizzle-zod -> Hono/OpenAPI -> Orval -> 前端类型

import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  boolean,
  text,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// 枚举定义
// ============================================

export const orderStatusEnum = pgEnum('order_status', [
  'pending',    // 待接单
  'confirmed',  // 已接单
  'ready',      // 待取餐
  'completed',  // 已完成
  'cancelled',  // 已取消
]);

export const userRoleEnum = pgEnum('user_role', [
  'admin',    // 管理员 - 后台管理端
  'staff',    // 员工 - 商家端
  'customer', // 客户 - 客户端
]);

// ============================================
// 用户表（统一认证）
// ============================================

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  avatar: varchar('avatar', { length: 500 }),
  role: userRoleEnum('role').notNull().default('customer'),
  active: boolean('active').default(true).notNull(),
  // 关联实体ID（根据角色不同）
  customerId: integer('customer_id').references(() => customers.id),
  // 登录信息
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// 分类表
// ============================================

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// 菜品表
// ============================================

export const menuItems = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  price: integer('price').notNull(), // 以分为单位存储
  image: varchar('image', { length: 500 }),
  stock: integer('stock').default(-1), // -1 表示无限库存
  available: boolean('available').default(true).notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// 客户表
// ============================================

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  avatar: varchar('avatar', { length: 500 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// 订单表
// ============================================

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNo: varchar('order_no', { length: 50 }).notNull().unique(),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  status: orderStatusEnum('status').default('pending').notNull(),
  total: integer('total').notNull(), // 以分为单位存储
  notes: text('notes'),
  // 状态时间戳
  createdAt: timestamp('created_at').defaultNow().notNull(),
  confirmedAt: timestamp('confirmed_at'),
  readyAt: timestamp('ready_at'),
  completedAt: timestamp('completed_at'),
  cancelledAt: timestamp('cancelled_at'),
});

// ============================================
// 订单项表
// ============================================

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  menuItemId: integer('menu_item_id').notNull().references(() => menuItems.id),
  menuItemName: varchar('menu_item_name', { length: 200 }).notNull(), // 快照
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(), // 下单时的价格快照
  subtotal: integer('subtotal').notNull(), // unitPrice * quantity
});

// ============================================
// 业务设置表
// ============================================

export const businessSettings = pgTable('business_settings', {
  id: serial('id').primaryKey(),
  openingTime: varchar('opening_time', { length: 10 }).default('09:00').notNull(),
  closingTime: varchar('closing_time', { length: 10 }).default('22:00').notNull(),
  autoAcceptOrders: boolean('auto_accept_orders').default(false).notNull(),
  estimatedPrepTime: integer('estimated_prep_time').default(15).notNull(), // 分钟
  serviceAvailable: boolean('service_available').default(true).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// 关系定义
// ============================================

export const categoriesRelations = relations(categories, ({ many }) => ({
  menuItems: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  category: one(categories, {
    fields: [menuItems.categoryId],
    references: [categories.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));

// ============================================
// 类型导出
// ============================================

export type OrderStatus = typeof orderStatusEnum.enumValues[number];

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type BusinessSettings = typeof businessSettings.$inferSelect;
