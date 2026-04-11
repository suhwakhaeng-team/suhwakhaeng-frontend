import type { ApiResponse, TokenResponse, TokenRefreshRequest } from '../types/auth';
import { tokenStorage } from './tokenStorage';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
if (!BASE_URL) throw new Error('VITE_API_BASE_URL 환경변수가 설정되지 않았습니다.');

let refreshPromise: Promise<boolean> | null = null;
let refreshFailed = false;

export function resetAuthState() {
  refreshFailed = false;
  refreshPromise = null;
}

async function refreshTokens(): Promise<boolean> {
  const uid = tokenStorage.getUid();
  const refreshToken = tokenStorage.getRefreshToken();
  if (!uid || !refreshToken) return false;

  const body: TokenRefreshRequest = { uid, refreshToken, deviceInfo: 'web' };

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) return false;

    const json: ApiResponse<TokenResponse> = await res.json();
    if (!json.success || !json.data) return false;

    const { accessToken, refreshToken: newRefresh, user } = json.data;
    tokenStorage.save(accessToken, newRefresh, uid, user);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  const accessToken = tokenStorage.getAccessToken();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    return { success: false, data: null, error: `서버에 연결할 수 없습니다. (${BASE_URL}${path})` };
  }

  if (res.status === 401 && tokenStorage.hasTokens()) {
    if (refreshFailed) {
      tokenStorage.clear();
      window.location.href = '/onboarding/login';
      return { success: false, data: null, error: '인증이 만료되었습니다.' };
    }

    if (!refreshPromise) {
      refreshPromise = refreshTokens().finally(() => { refreshPromise = null; });
    }

    const refreshed = await refreshPromise;
    if (refreshed) {
      const newToken = tokenStorage.getAccessToken();
      headers.set('Authorization', `Bearer ${newToken}`);
      try {
        res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
      } catch {
        return { success: false, data: null, error: `서버에 연결할 수 없습니다. (${BASE_URL}${path})` };
      }
    } else {
      refreshFailed = true;
      tokenStorage.clear();
      window.location.href = '/onboarding/login';
      return { success: false, data: null, error: '인증이 만료되었습니다.' };
    }
  }

  const contentType = res.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return { success: false, data: null, error: `서버 오류 (${res.status})` };
  }

  return res.json();
}

export const apiClient = {
  get<T>(path: string) {
    return request<T>(path, { method: 'GET' });
  },
  post<T>(path: string, body?: unknown) {
    return request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  },
  put<T>(path: string, body?: unknown) {
    return request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
  },
  patch<T>(path: string, body?: unknown) {
    return request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
  },
  delete<T>(path: string) {
    return request<T>(path, { method: 'DELETE' });
  },
};
