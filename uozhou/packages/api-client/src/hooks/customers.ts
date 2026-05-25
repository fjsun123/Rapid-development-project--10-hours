// 客户 hooks（CRM）
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../axios';
import type { Customer } from '@restaurant/types';

export function useCustomers(params?: { keyword?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: async (): Promise<{ data: Customer[]; total: number }> => {
      const { data } = await api.get('/api/customers', { params });
      if (Array.isArray(data)) return { data, total: data.length };
      return data;
    },
  });
}

export interface UpsertCustomerInput {
  id?: number;
  name: string;
  phone: string;
  notes?: string;
}

export function useUpsertCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertCustomerInput): Promise<Customer> => {
      if (input.id) {
        const { data } = await api.patch(`/api/customers/${input.id}`, input);
        return data;
      }
      const { data } = await api.post('/api/customers', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}
