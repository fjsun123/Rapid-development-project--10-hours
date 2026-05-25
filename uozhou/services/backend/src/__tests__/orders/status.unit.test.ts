// 订单状态机测试（纯单元测试，不含数据库）
import { describe, it, expect } from 'vitest';

// 订单状态类型
export type OrderStatus = 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled';

// 状态转换规则
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

// 状态转换验证
export function canTransition(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(targetStatus) ?? false;
}

export function getValidTransitions(currentStatus: OrderStatus): OrderStatus[] {
  return VALID_TRANSITIONS[currentStatus] ?? [];
}

// 错误消息生成
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

describe('Order State Machine Unit Tests', () => {
  describe('Valid Transitions', () => {
    it('should allow pending -> confirmed', () => {
      expect(canTransition('pending', 'confirmed')).toBe(true);
    });

    it('should allow pending -> cancelled', () => {
      expect(canTransition('pending', 'cancelled')).toBe(true);
    });

    it('should allow confirmed -> ready', () => {
      expect(canTransition('confirmed', 'ready')).toBe(true);
    });

    it('should allow confirmed -> cancelled', () => {
      expect(canTransition('confirmed', 'cancelled')).toBe(true);
    });

    it('should allow ready -> completed', () => {
      expect(canTransition('ready', 'completed')).toBe(true);
    });
  });

  describe('Invalid Transitions', () => {
    it('should reject pending -> ready (skip confirm)', () => {
      expect(canTransition('pending', 'ready')).toBe(false);
    });

    it('should reject pending -> completed', () => {
      expect(canTransition('pending', 'completed')).toBe(false);
    });

    it('should reject confirmed -> pending (reverse)', () => {
      expect(canTransition('confirmed', 'pending')).toBe(false);
    });

    it('should reject ready -> confirmed (reverse)', () => {
      expect(canTransition('ready', 'confirmed')).toBe(false);
    });

    it('should reject ready -> cancelled', () => {
      expect(canTransition('ready', 'cancelled')).toBe(false);
    });

    it('should reject any transition from completed', () => {
      expect(canTransition('completed', 'pending')).toBe(false);
      expect(canTransition('completed', 'confirmed')).toBe(false);
      expect(canTransition('completed', 'ready')).toBe(false);
      expect(canTransition('completed', 'cancelled')).toBe(false);
    });

    it('should reject any transition from cancelled', () => {
      expect(canTransition('cancelled', 'pending')).toBe(false);
      expect(canTransition('cancelled', 'confirmed')).toBe(false);
      expect(canTransition('cancelled', 'ready')).toBe(false);
      expect(canTransition('cancelled', 'completed')).toBe(false);
    });
  });

  describe('Valid Transitions List', () => {
    it('should return correct transitions for pending', () => {
      expect(getValidTransitions('pending')).toEqual(['confirmed', 'cancelled']);
    });

    it('should return correct transitions for confirmed', () => {
      expect(getValidTransitions('confirmed')).toEqual(['ready', 'cancelled']);
    });

    it('should return correct transitions for ready', () => {
      expect(getValidTransitions('ready')).toEqual(['completed']);
    });

    it('should return empty array for completed', () => {
      expect(getValidTransitions('completed')).toEqual([]);
    });

    it('should return empty array for cancelled', () => {
      expect(getValidTransitions('cancelled')).toEqual([]);
    });
  });

  describe('Status Messages', () => {
    it('should have message for pending to confirmed', () => {
      expect(STATUS_MESSAGES['pending_to_confirmed']).toBe('订单已接单');
    });

    it('should have message for confirmed to ready', () => {
      expect(STATUS_MESSAGES['confirmed_to_ready']).toBe('订单已出餐');
    });

    it('should have message for ready to completed', () => {
      expect(STATUS_MESSAGES['ready_to_completed']).toBe('订单已完成');
    });

    it('should have message for invalid transition', () => {
      expect(STATUS_MESSAGES['invalid_transition']).toBe('无效的状态转换');
    });

    it('should have message for already final state', () => {
      expect(STATUS_MESSAGES['already_final']).toBe('订单已处于终态，无法更改');
    });
  });

  describe('Error Messages', () => {
    it('should generate correct error for pending -> ready', () => {
      const message = getTransitionErrorMessage('pending', 'ready');
      expect(message).toContain('待接单');
      expect(message).toContain('已接单');
      expect(message).toContain('已取消');
    });

    it('should generate correct error for completed state', () => {
      const message = getTransitionErrorMessage('completed', 'pending');
      expect(message).toBe('订单已处于终态，无法更改');
    });

    it('should generate correct error for cancelled state', () => {
      const message = getTransitionErrorMessage('cancelled', 'pending');
      expect(message).toBe('订单已处于终态，无法更改');
    });
  });

  describe('Status Names', () => {
    it('should have correct Chinese names for all statuses', () => {
      expect(getStatusName('pending')).toBe('待接单');
      expect(getStatusName('confirmed')).toBe('已接单');
      expect(getStatusName('ready')).toBe('待取餐');
      expect(getStatusName('completed')).toBe('已完成');
      expect(getStatusName('cancelled')).toBe('已取消');
    });
  });

  describe('State Machine Properties', () => {
    it('should have exactly 5 states', () => {
      const states = Object.keys(VALID_TRANSITIONS);
      expect(states).toHaveLength(5);
      expect(states).toContain('pending');
      expect(states).toContain('confirmed');
      expect(states).toContain('ready');
      expect(states).toContain('completed');
      expect(states).toContain('cancelled');
    });

    it('should have terminal states with no outgoing transitions', () => {
      expect(VALID_TRANSITIONS['completed']).toEqual([]);
      expect(VALID_TRANSITIONS['cancelled']).toEqual([]);
    });

    it('should have initial state with at least one outgoing transition', () => {
      expect(VALID_TRANSITIONS['pending'].length).toBeGreaterThan(0);
    });

    it('should not allow self-transitions', () => {
      for (const status of Object.keys(VALID_TRANSITIONS) as OrderStatus[]) {
        expect(canTransition(status, status)).toBe(false);
      }
    });
  });
});
