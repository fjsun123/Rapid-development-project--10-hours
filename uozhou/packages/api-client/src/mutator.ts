// Orval mutator - 把 generated hooks 的 axios 调用统一接到我们的 api 实例（含 JWT/401 拦截器）
import { api as instance } from './axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

export const api = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const res: AxiosResponse<T> = await instance.request<T>(config);
  return res.data;
};

export default api;
