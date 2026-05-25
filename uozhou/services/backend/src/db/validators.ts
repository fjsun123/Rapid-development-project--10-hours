// drizzle-zod 验证 Schema 生成
// 从 Drizzle schema 自动生成 Zod 验证 schema

import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import {
  categories,
  menuItems,
  customers,
  orders,
  orderItems,
  businessSettings,
  orderStatusEnum,
} from './schema';

// ============================================
// 分类验证 Schema
// ============================================

export const insertCategorySchema = createInsertSchema(categories);
export const selectCategorySchema = createSelectSchema(categories);

// ============================================
// 菜品验证 Schema
// ============================================

export const insertMenuItemSchema = createInsertSchema(menuItems, {
  price: z.number().int().positive('价格必须为正数'),
  stock: z.number().int().min(-1, '库存不能小于-1'),
});

export const selectMenuItemSchema = createSelectSchema(menuItems);

export const updateMenuItemSchema = insertMenuItemSchema.partial().required({ id: true });

// ============================================
// 客户验证 Schema
// ============================================

export const insertCustomerSchema = createInsertSchema(customers, {
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
});

export const selectCustomerSchema = createSelectSchema(customers);

// ============================================
// 订单验证 Schema
// ============================================

export const insertOrderSchema = createInsertSchema(orders);
export const selectOrderSchema = createSelectSchema(orders);

// 创建订单请求 Schema
export const createOrderRequestSchema = z.object({
  customerId: z.number().int().positive(),
  items: z.array(z.object({
    menuItemId: z.number().int().positive(),
    quantity: z.number().int().positive(),
  })).min(1, '至少需要一个菜品'),
  notes: z.string().optional(),
});

// ============================================
// 订单项验证 Schema
// ============================================

export const insertOrderItemSchema = createInsertSchema(orderItems);
export const selectOrderItemSchema = createSelectSchema(orderItems);

// ============================================
// 业务设置验证 Schema
// ============================================

export const insertBusinessSettingsSchema = createInsertSchema(businessSettings);
export const selectBusinessSettingsSchema = createSelectSchema(businessSettings);

export const updateBusinessSettingsSchema = z.object({
  openingTime: z.string().regex(/^\d{2}:\d{2}$/, '时间格式不正确').optional(),
  closingTime: z.string().regex(/^\d{2}:\d{2}$/, '时间格式不正确').optional(),
  autoAcceptOrders: z.boolean().optional(),
  estimatedPrepTime: z.number().int().min(1).max(120).optional(),
  serviceAvailable: z.boolean().optional(),
});

// ============================================
// 订单状态枚举 Schema
// ============================================

export const orderStatusSchema = z.enum(orderStatusEnum.enumValues);

// ============================================
// 类型导出
// ============================================

export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;
export type UpdateBusinessSettingsRequest = z.infer<typeof updateBusinessSettingsSchema>;
