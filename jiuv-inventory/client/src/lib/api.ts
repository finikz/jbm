/**
 * API 客户端
 * 本地开发走 Vite proxy (/api → localhost:3001)
 * 生产环境用环境变量 VITE_API_URL
 */
import { useAuthStore } from '../store/auth';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const json = await res.json();

  if (!json.success) {
    throw new Error(json.error || '请求失败');
  }

  return json.data as T;
}
