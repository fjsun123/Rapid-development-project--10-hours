// 业务设置 hooks
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../axios';
import type { BusinessSettings } from '@restaurant/types';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<BusinessSettings> => {
      const { data } = await api.get('/api/settings');
      return data;
    },
  });
}

export interface UpdateSettingsInput {
  openingTime?: string;
  closingTime?: string;
  autoAcceptOrders?: boolean;
  estimatedPrepTime?: number;
  serviceAvailable?: boolean;
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateSettingsInput): Promise<BusinessSettings> => {
      const { data } = await api.patch('/api/settings', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}
