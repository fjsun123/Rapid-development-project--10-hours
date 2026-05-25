// 鉴权相关 hooks
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../axios';

export interface User {
  id: number;
  phone: string;
  name: string;
  avatar?: string | null;
  role: 'admin' | 'staff' | 'customer';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export function useSendSmsCode() {
  return useMutation({
    mutationFn: async (phone: string): Promise<{ _code?: string }> => {
      const { data } = await api.post('/api/auth/sms/code', { phone });
      return data;
    },
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (vars: { phone: string; code: string }): Promise<TokenPair> => {
      const { data } = await api.post('/api/auth/login', vars);
      return data;
    },
  });
}

export function useAdminLogin() {
  return useMutation({
    mutationFn: async (vars: { username: string; password: string }): Promise<TokenPair> => {
      const { data } = await api.post('/api/auth/admin/login', vars);
      return data;
    },
  });
}

export function useMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async (): Promise<User> => {
      const { data } = await api.get('/api/auth/me');
      return data;
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async (): Promise<void> => {
      await api.post('/api/auth/logout');
    },
  });
}
