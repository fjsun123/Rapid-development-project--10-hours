// 自动生成的类型定义
// 源自: Drizzle Schema -> OpenAPI -> Orval

// ============================================
// 订单状态枚举
// ============================================

export type OrderStatus = 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待接单',
  confirmed: '已接单',
  ready: '待取餐',
  completed: '已完成',
  cancelled: '已取消',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'warning',
  confirmed: 'info',
  ready: 'primary',
  completed: 'success',
  cancelled: 'error',
};

// ============================================
// 订单类型
// ============================================

export interface Order {
  id: number;
  orderNo: string;
  customerId: number;
  customerName?: string;
  status: OrderStatus;
  total: number; // 以分为单位
  notes?: string | null;
  createdAt: string;
  confirmedAt?: string | null;
  readyAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  items?: OrderItem[];
  customer?: Customer;
}

export interface OrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  unitPrice: number; // 以分为单位
  subtotal: number;  // 以分为单位
}

// ============================================
// 客户类型
// ============================================

export interface Customer {
  id: number;
  name: string;
  phone: string;
  avatar?: string | null;
  notes?: string | null;
  createdAt: string;
  orderCount?: number;
  totalSpend?: number;
}

// ============================================
// 菜品类型
// ============================================

export interface Category {
  id: number;
  name: string;
  description?: string | null;
  sortOrder: number;
}

export interface MenuItem {
  id: number;
  categoryId: number;
  name: string;
  description?: string | null;
  price: number; // 以分为单位
  image?: string | null;
  stock: number; // -1 表示无限库存
  available: boolean;
  sortOrder: number;
}

export interface MenuItemWithCategory extends MenuItem {
  categoryName: string;
}

// ============================================
// 业务设置类型
// ============================================

export interface BusinessSettings {
  id: number;
  openingTime: string;
  closingTime: string;
  autoAcceptOrders: boolean;
  estimatedPrepTime: number;
  serviceAvailable: boolean;
}

// ============================================
// API 请求/响应类型
// ============================================

export interface CreateOrderRequest {
  customerId: number;
  items: Array<{
    menuItemId: number;
    quantity: number;
  }>;
  notes?: string;
}

export interface OrderListResponse {
  data: Order[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardKPI {
  totalOrders: number;
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  popularItems: Array<{
    name: string;
    count: number;
  }>;
}

// ============================================
// 订单状态转换
// ============================================

export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['ready', 'cancelled'],
  ready: ['completed'],
  completed: [],
  cancelled: [],
};

export function canTransition(current: OrderStatus, target: OrderStatus): boolean {
  return VALID_ORDER_TRANSITIONS[current]?.includes(target) ?? false;
}

export function getValidTransitions(current: OrderStatus): OrderStatus[] {
  return VALID_ORDER_TRANSITIONS[current] ?? [];
}
