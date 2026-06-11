const API_BASE = '/api';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T | null;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const userId = localStorage.getItem('asset_disposal_user_id');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (userId) {
    headers['x-user-id'] = userId;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
    const data = await res.json();
    return data as ApiResponse<T>;
  } catch (err) {
    return {
      code: -1,
      message: err instanceof Error ? err.message : 'Network error',
      data: null,
    };
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export function setApiUser(userId: string | null): void {
  if (userId) {
    localStorage.setItem('asset_disposal_user_id', userId);
  } else {
    localStorage.removeItem('asset_disposal_user_id');
  }
}
