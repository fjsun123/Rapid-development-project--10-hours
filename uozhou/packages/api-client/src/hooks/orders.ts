// 订单 hooks - 状态机用 4 个独立端点
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../axios';
import type {
  Order,
  CreateOrderRequest,
  OrderListResponse,
  OrderStatus,
} from '@restaurant/types';

export interface OrderListFilters {
  status?: OrderStatus | string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export function useOrders(filters?: OrderListFilters) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: async (): Promise<OrderListResponse> => {
      const { data } = await api.get('/api/orders', { params: filters });
      // 后端可能返回数组也可能返回 {data, total, ...}
      if (Array.isArray(data)) {
        return { data, total: data.length, page: 1, pageSize: data.length };
      }
      return data;
    },
  });
}

export function useOrder(id: number | undefined) {
  return useQuery({
    queryKey: ['orders', id],
    enabled: !!id,
    queryFn: async (): Promise<Order> => {
      const { data } = await api.get(`/api/orders/${id}`);
      return data;
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateOrderRequest): Promise<Order> => {
      const { data } = await api.post('/api/orders', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['menu-items'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'kpi'] });
    },
  });
}

// 状态机 4 个端点
function makeStatusMutation(action: 'confirm' | 'ready' | 'complete' | 'cancel') {
  return function useStatusMutation() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (orderId: number): Promise<Order> => {
        const { data } = await api.post(`/api/orders/${orderId}/${action}`);
        return data;
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['orders'] });
        qc.invalidateQueries({ queryKey: ['dashboard', 'kpi'] });
      },
    });
  };
}

export const useConfirmOrder = makeStatusMutation('confirm');
export const useReadyOrder = makeStatusMutation('ready');
export const useCompleteOrder = makeStatusMutation('complete');
export const useCancelOrder = makeStatusMutation('cancel');

// 客户订单（用 customer id 查）
export function useCustomerOrders(customerId: number | undefined) {
  return useQuery({
    queryKey: ['customers', customerId, 'orders'],
    enabled: !!customerId,
    queryFn: async (): Promise<{ orders: Order[]; totalSpend: number; orderCount: number }> => {
      const { data } = await api.get(`/api/customers/${customerId}/orders`);
      return data;
    },
  });
}
