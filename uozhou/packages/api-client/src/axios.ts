// 全局唯一 axios 实例
// - 通过 EXPO_PUBLIC_API_BASE 或 VITE_API_BASE 读取后端地址
// - 自动注入 Authorization
// - 401 时清 token 并触发 listener

import axios, { AxiosError } from 'axios';

// 兼容浏览器/Node 环境读取 process.env（避免 @types/node 依赖外溢）
const env = ((globalThis as any).process?.env ?? {}) as Record<string, string | undefined>;
const baseURL =
  env.EXPO_PUBLIC_API_BASE ||
  env.NEXT_PUBLIC_API_BASE ||
  env.VITE_API_BASE ||
  'http://localhost:3001';

export const api = axios.create({
  baseURL,
  timeout: 15000,
});

// =========================================
// Token 提供 / 清除（由 app 注入）
// =========================================

type TokenProvider = () => string | null | Promise<string | null>;
type UnauthorizedHandler = () => void;

let tokenProvider: TokenProvider = () => null;
let unauthorizedHandler: UnauthorizedHandler = () => {};

export function configureAuth(opts: {
  getToken?: TokenProvider;
  onUnauthorized?: UnauthorizedHandler;
}) {
  if (opts.getToken) tokenProvider = opts.getToken;
  if (opts.onUnauthorized) unauthorizedHandler = opts.onUnauthorized;
}

// =========================================
// Interceptors
// =========================================

api.interceptors.request.use(async (config) => {
  const token = await tokenProvider();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      unauthorizedHandler();
    }
    return Promise.reject(err);
  },
);

// =========================================
// 错误归一化
// =========================================

export interface ApiError {
  code: string;
  message: string;
  status?: number;
}

export function normalizeError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; message?: string } | undefined;
    return {
      code: data?.error ?? err.code ?? 'unknown_error',
      message: data?.message ?? err.message,
      status: err.response?.status,
    };
  }
  if (err instanceof Error) {
    return { code: 'unknown_error', message: err.message };
  }
  return { code: 'unknown_error', message: 'Unknown error' };
}
