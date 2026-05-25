// Dashboard KPI hooks
import { useQuery } from '@tanstack/react-query';
import { api } from '../axios';
import type { DashboardKPI } from '@restaurant/types';

export function useDashboardKPI() {
  return useQuery({
    queryKey: ['dashboard', 'kpi'],
    queryFn: async (): Promise<DashboardKPI> => {
      const { data } = await api.get('/api/dashboard/kpi');
      return data;
    },
  });
}
