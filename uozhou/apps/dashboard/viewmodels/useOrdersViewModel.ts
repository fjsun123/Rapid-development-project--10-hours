// Orders 页面的 ViewModel：筛选 + 状态机操作
import { useMemo, useState } from 'react';
import {
  useOrders,
  useConfirmOrder,
  useReadyOrder,
  useCompleteOrder,
  useCancelOrder,
} from '@restaurant/api-client';
import type { Order, OrderStatus } from '@restaurant/types';
import { toastApi } from '../components/Toast';

export type OrderAction = 'confirm' | 'ready' | 'complete' | 'cancel';

const ACTION_LABEL: Record<OrderAction, string> = {
  confirm: '已接单',
  ready: '已出餐',
  complete: '订单已完成',
  cancel: '订单已取消',
};

export function useOrdersViewModel() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus[]>([]);

  const queryParams = useMemo(
    () => ({ status: statusFilter.join(','), page: 1, pageSize: 50 }),
    [statusFilter],
  );
  const ordersQuery = useOrders(queryParams);

  const confirm = useConfirmOrder();
  const ready = useReadyOrder();
  const complete = useCompleteOrder();
  const cancel = useCancelOrder();

  const pending = confirm.isPending || ready.isPending || complete.isPending || cancel.isPending;

  function toggleStatus(s: OrderStatus) {
    setStatusFilter((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function resetFilter() {
    setStatusFilter([]);
  }

  async function handleAction(action: OrderAction, order: Order) {
    if (action === 'cancel') {
      const ok =
        typeof window !== 'undefined' && typeof window.confirm === 'function'
          ? window.confirm(`确定取消订单 ${order.orderNo} 吗？`)
          : true;
      if (!ok) return;
    }
    try {
      const mutation =
        action === 'confirm' ? confirm
        : action === 'ready' ? ready
        : action === 'complete' ? complete
        : cancel;
      await mutation.mutateAsync(order.id);
      toastApi.success(ACTION_LABEL[action]);
    } catch (e: any) {
      toastApi.error(e?.response?.data?.message ?? '操作失败');
    }
  }

  return {
    orders: ordersQuery.data?.data ?? [],
    isLoading: ordersQuery.isLoading,
    statusFilter,
    toggleStatus,
    resetFilter,
    handleAction,
    actionPending: pending,
  };
}
