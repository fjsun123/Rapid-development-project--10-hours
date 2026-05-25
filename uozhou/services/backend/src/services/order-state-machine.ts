// 订单状态机服务
// 强制执行有效的订单状态转换

import { db, schema } from '../db';
import { eq } from 'drizzle-orm';
import type { Order, OrderStatus } from '../db/schema';

// ============================================
// 状态转换规则
// ============================================

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['ready', 'cancelled'],
  ready: ['completed'],
  completed: [],
  cancelled: [],
};

const STATUS_MESSAGES: Record<string, string> = {
  pending_to_confirmed: '订单已接单',
  pending_to_cancelled: '订单已取消',
  confirmed_to_ready: '订单已出餐',
  confirmed_to_cancelled: '订单已取消',
  ready_to_completed: '订单已完成',
  invalid_transition: '无效的状态转换',
  already_final: '订单已处于终态，无法更改',
};

// ============================================
// 状态转换验证
// ============================================

export function canTransition(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(targetStatus) ?? false;
}

export function getValidTransitions(currentStatus: OrderStatus): OrderStatus[] {
  return VALID_TRANSITIONS[currentStatus] ?? [];
}

// ============================================
// 订单状态操作
// ============================================

interface StatusTransitionResult {
  success: boolean;
  order?: Order;
  error?: string;
  message?: string;
}

export async function confirmOrder(orderId: number): Promise<StatusTransitionResult> {
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));

  if (!order) {
    return { success: false, error: 'order_not_found' };
  }

  if (!canTransition(order.status as OrderStatus, 'confirmed')) {
    return {
      success: false,
      error: 'invalid_transition',
      message: getTransitionErrorMessage(order.status as OrderStatus, 'confirmed'),
    };
  }

  const [updated] = await db
    .update(schema.orders)
    .set({
      status: 'confirmed',
      confirmedAt: new Date(),
    })
    .where(eq(schema.orders.id, orderId))
    .returning();

  return {
    success: true,
    order: updated,
    message: STATUS_MESSAGES['pending_to_confirmed'],
  };
}

export async function readyOrder(orderId: number): Promise<StatusTransitionResult> {
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));

  if (!order) {
    return { success: false, error: 'order_not_found' };
  }

  if (!canTransition(order.status as OrderStatus, 'ready')) {
    return {
      success: false,
      error: 'invalid_transition',
      message: getTransitionErrorMessage(order.status as OrderStatus, 'ready'),
    };
  }

  const [updated] = await db
    .update(schema.orders)
    .set({
      status: 'ready',
      readyAt: new Date(),
    })
    .where(eq(schema.orders.id, orderId))
    .returning();

  return {
    success: true,
    order: updated,
    message: STATUS_MESSAGES['confirmed_to_ready'],
  };
}

export async function completeOrder(orderId: number): Promise<StatusTransitionResult> {
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));

  if (!order) {
    return { success: false, error: 'order_not_found' };
  }

  if (!canTransition(order.status as OrderStatus, 'completed')) {
    return {
      success: false,
      error: 'invalid_transition',
      message: getTransitionErrorMessage(order.status as OrderStatus, 'completed'),
    };
  }

  const [updated] = await db
    .update(schema.orders)
    .set({
      status: 'completed',
      completedAt: new Date(),
    })
    .where(eq(schema.orders.id, orderId))
    .returning();

  return {
    success: true,
    order: updated,
    message: STATUS_MESSAGES['ready_to_completed'],
  };
}

export async function cancelOrder(orderId: number): Promise<StatusTransitionResult> {
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));

  if (!order) {
    return { success: false, error: 'order_not_found' };
  }

  if (!canTransition(order.status as OrderStatus, 'cancelled')) {
    return {
      success: false,
      error: 'invalid_transition',
      message: getTransitionErrorMessage(order.status as OrderStatus, 'cancelled'),
    };
  }

  // 取消订单时恢复库存
  const items = await db
    .select()
    .from(schema.orderItems)
    .where(eq(schema.orderItems.orderId, orderId));

  // 使用事务恢复库存
  for (const item of items) {
    const [menuItem] = await db
      .select()
      .from(schema.menuItems)
      .where(eq(schema.menuItems.id, item.menuItemId));

    if (menuItem && menuItem.stock !== -1) {
      await db
        .update(schema.menuItems)
        .set({
          stock: menuItem.stock + item.quantity,
        })
        .where(eq(schema.menuItems.id, item.menuItemId));
    }
  }

  const [updated] = await db
    .update(schema.orders)
    .set({
      status: 'cancelled',
      cancelledAt: new Date(),
    })
    .where(eq(schema.orders.id, orderId))
    .returning();

  return {
    success: true,
    order: updated,
    message: STATUS_MESSAGES['confirmed_to_cancelled'],
  };
}

// ============================================
// 错误消息生成
// ============================================

function getTransitionErrorMessage(current: OrderStatus, target: OrderStatus): string {
  if (current === 'completed' || current === 'cancelled') {
    return STATUS_MESSAGES['already_final'];
  }

  const validTargets = VALID_TRANSITIONS[current];
  if (!validTargets?.length) {
    return `订单当前状态「${getStatusName(current)}」无法进行任何操作`;
  }

  const validNames = validTargets.map(getStatusName).join('、');
  return `订单当前状态为「${getStatusName(current)}」，只能转换为：${validNames}`;
}

function getStatusName(status: OrderStatus): string {
  const names: Record<OrderStatus, string> = {
    pending: '待接单',
    confirmed: '已接单',
    ready: '待取餐',
    completed: '已完成',
    cancelled: '已取消',
  };
  return names[status];
}
