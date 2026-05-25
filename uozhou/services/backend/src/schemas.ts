// 统一 OpenAPI Zod Schema 定义
// 所有 schema 调用 .openapi('Name')，方便 Orval 生成命名类型
// 注意：本文件只导出 Zod schema（用于 OpenAPI 文档/请求校验），业务运行时类型走 db/schema.ts

import { z } from '@hono/zod-openapi';

// ============================================
// 通用
// ============================================

export const ErrorSchema = z
  .object({
    error: z.string().openapi({ example: 'invalid_request' }),
    message: z.string().optional().openapi({ example: '请求参数错误' }),
  })
  .openapi('Error');

export const SuccessMessageSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    message: z.string().openapi({ example: '操作成功' }),
  })
  .openapi('SuccessMessage');

export const HealthSchema = z
  .object({
    status: z.string().openapi({ example: 'ok' }),
  })
  .openapi('Health');

// ============================================
// 枚举
// ============================================

export const OrderStatusSchema = z
  .enum(['pending', 'confirmed', 'ready', 'completed', 'cancelled'])
  .openapi('OrderStatus');

export const UserRoleSchema = z.enum(['admin', 'staff', 'customer']).openapi('UserRole');

// ============================================
// User / Token
// ============================================

export const UserSchema = z
  .object({
    id: z.number().int(),
    phone: z.string(),
    name: z.string(),
    avatar: z.string().nullable().optional(),
    role: UserRoleSchema,
    customerId: z.number().int().nullable().optional(),
  })
  .openapi('User');

export const TokenPairSchema = z
  .object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number().int(),
  })
  .openapi('TokenPair');

export const LoginResponseSchema = z
  .object({
    user: UserSchema,
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number().int(),
  })
  .openapi('LoginResponse');

// ============================================
// Auth 请求
// ============================================

export const SendSmsCodeRequestSchema = z
  .object({
    phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').openapi({ example: '13800138000' }),
  })
  .openapi('SendSmsCodeRequest');

export const SendSmsCodeResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string(),
    _code: z.string().optional().openapi({ description: '仅开发环境返回' }),
  })
  .openapi('SendSmsCodeResponse');

export const LoginRequestSchema = z
  .object({
    phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
    code: z.string().length(6, '验证码为6位数字'),
  })
  .openapi('LoginRequest');

export const AdminLoginRequestSchema = z
  .object({
    username: z.string().min(1),
    password: z.string().min(6),
  })
  .openapi('AdminLoginRequest');

export const RefreshTokenRequestSchema = z
  .object({
    refreshToken: z.string(),
  })
  .openapi('RefreshTokenRequest');

// ============================================
// MenuItem
// ============================================

export const MenuItemSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    description: z.string().nullable().optional(),
    price: z.number().int().openapi({ description: '以分为单位' }),
    image: z.string().nullable().optional(),
    categoryId: z.number().int(),
    categoryName: z.string().nullable().optional(),
    available: z.boolean(),
    stock: z.number().int().openapi({ description: '-1 表示无限库存' }),
    sortOrder: z.number().int().nullable().optional(),
  })
  .openapi('MenuItem');

export const CreateMenuItemRequestSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.number().int().positive(),
    image: z.string().optional(),
    categoryId: z.number().int().positive(),
    available: z.boolean().optional(),
    stock: z.number().int().min(-1).optional(),
    sortOrder: z.number().int().optional(),
  })
  .openapi('CreateMenuItemRequest');

export const UpdateMenuItemRequestSchema = CreateMenuItemRequestSchema.partial().openapi(
  'UpdateMenuItemRequest'
);

// ============================================
// Customer
// ============================================

export const CustomerSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    phone: z.string(),
    avatar: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi('Customer');

export const CreateCustomerRequestSchema = z
  .object({
    name: z.string().min(1),
    phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
    avatar: z.string().optional(),
    notes: z.string().optional(),
  })
  .openapi('CreateCustomerRequest');

export const UpdateCustomerRequestSchema = z
  .object({
    name: z.string().min(1).optional(),
    phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').optional(),
    avatar: z.string().optional(),
    notes: z.string().optional(),
  })
  .openapi('UpdateCustomerRequest');

// ============================================
// Order
// ============================================

export const OrderItemSchema = z
  .object({
    id: z.number().int(),
    orderId: z.number().int(),
    menuItemId: z.number().int(),
    menuItemName: z.string(),
    quantity: z.number().int(),
    unitPrice: z.number().int(),
    subtotal: z.number().int(),
  })
  .openapi('OrderItem');

export const OrderSchema = z
  .object({
    id: z.number().int(),
    orderNo: z.string(),
    customerId: z.number().int(),
    customerName: z.string().nullable().optional(),
    status: OrderStatusSchema,
    total: z.number().int(),
    notes: z.string().nullable().optional(),
    createdAt: z.string(),
    confirmedAt: z.string().nullable().optional(),
    readyAt: z.string().nullable().optional(),
    completedAt: z.string().nullable().optional(),
    cancelledAt: z.string().nullable().optional(),
  })
  .openapi('Order');

export const OrderWithItemsSchema = OrderSchema.extend({
  items: z.array(OrderItemSchema).optional(),
  customer: CustomerSchema.nullable().optional(),
}).openapi('OrderWithItems');

export const CreateOrderRequestSchema = z
  .object({
    customerId: z.number().int().positive(),
    items: z
      .array(
        z.object({
          menuItemId: z.number().int().positive(),
          quantity: z.number().int().positive(),
        })
      )
      .min(1, '至少需要一个菜品'),
    notes: z.string().optional(),
  })
  .openapi('CreateOrderRequest');

export const UpdateOrderRequestSchema = z
  .object({
    notes: z.string().optional(),
  })
  .openapi('UpdateOrderRequest');

export const OrderListResponseSchema = z
  .object({
    data: z.array(OrderSchema),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
  })
  .openapi('OrderListResponse');

export const CustomerOrdersResponseSchema = z
  .object({
    orders: z.array(OrderSchema),
    totalSpend: z.number(),
    orderCount: z.number().int().optional(),
  })
  .openapi('CustomerOrdersResponse');

// ============================================
// Dashboard
// ============================================

export const PopularItemSchema = z
  .object({
    name: z.string().nullable(),
    count: z.number().int(),
  })
  .openapi('PopularItem');

export const DashboardKPISchema = z
  .object({
    totalOrders: z.number().int(),
    todayOrders: z.number().int(),
    todayRevenue: z.number(),
    pendingOrders: z.number().int(),
    popularItems: z.array(PopularItemSchema),
  })
  .openapi('DashboardKPI');

// ============================================
// Business Settings
// ============================================

export const BusinessSettingsSchema = z
  .object({
    id: z.number().int(),
    openingTime: z.string(),
    closingTime: z.string(),
    autoAcceptOrders: z.boolean(),
    estimatedPrepTime: z.number().int(),
    serviceAvailable: z.boolean(),
    updatedAt: z.string(),
  })
  .openapi('BusinessSettings');

export const UpdateBusinessSettingsRequestSchema = z
  .object({
    openingTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    closingTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    autoAcceptOrders: z.boolean().optional(),
    estimatedPrepTime: z.number().int().min(1).max(120).optional(),
    serviceAvailable: z.boolean().optional(),
  })
  .openapi('UpdateBusinessSettingsRequest');

// ============================================
// 路径参数
// ============================================

export const IdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'id 必须为整数')
    .openapi({ param: { name: 'id', in: 'path' }, example: '1' }),
});

// ============================================
// 列表查询参数
// ============================================

export const OrderListQuerySchema = z.object({
  status: OrderStatusSchema.optional().openapi({ param: { name: 'status', in: 'query' } }),
  page: z.string().optional().openapi({ param: { name: 'page', in: 'query' }, example: '1' }),
  pageSize: z
    .string()
    .optional()
    .openapi({ param: { name: 'pageSize', in: 'query' }, example: '20' }),
  startDate: z.string().optional().openapi({ param: { name: 'startDate', in: 'query' } }),
  endDate: z.string().optional().openapi({ param: { name: 'endDate', in: 'query' } }),
});
