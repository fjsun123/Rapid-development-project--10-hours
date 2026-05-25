// 菜单/分类 hooks
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../axios';
import type { Category, MenuItem, MenuItemWithCategory } from '@restaurant/types';

export function useMenuItems() {
  return useQuery({
    queryKey: ['menu-items'],
    queryFn: async (): Promise<MenuItemWithCategory[]> => {
      const { data } = await api.get('/api/menu-items');
      return data;
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      // 后端没有独立 categories 端点，从 menu-items 派生
      const { data } = await api.get('/api/menu-items');
      const items = data as MenuItemWithCategory[];
      const map = new Map<number, Category>();
      for (const item of items) {
        if (!map.has(item.categoryId)) {
          map.set(item.categoryId, {
            id: item.categoryId,
            name: item.categoryName,
            sortOrder: 0,
          });
        }
      }
      return Array.from(map.values()).sort((a, b) => a.sortOrder - b.sortOrder);
    },
  });
}

export interface UpsertMenuItemInput {
  id?: number;
  categoryId: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  available: boolean;
  image?: string;
}

export function useUpsertMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertMenuItemInput): Promise<MenuItem> => {
      if (input.id) {
        const { data } = await api.patch(`/api/menu-items/${input.id}`, input);
        return data;
      }
      const { data } = await api.post('/api/menu-items', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
  });
}

export function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/api/menu-items/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
  });
}

export function useToggleMenuItemAvailable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: number; available: boolean }): Promise<MenuItem> => {
      const { data } = await api.patch(`/api/menu-items/${vars.id}`, { available: vars.available });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
  });
}
