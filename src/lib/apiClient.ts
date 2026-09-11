import type { ApiResponse, TokenResponse, TokenRefreshRequest } from '../types/auth';
import { tokenStorage } from './tokenStorage';

const CONFIGURED_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 운영 브라우저에서는 Vercel의 same-origin 프록시를 사용한다.
// API 서브도메인을 광고 차단 확장 프로그램이 막아도 요청이 끊기지 않는다.
const BASE_URL = import.meta.env.PROD ? '/api/v1' : CONFIGURED_BASE_URL;
if (!BASE_URL) throw new Error('VITE_API_BASE_URL 환경변수가 설정되지 않았습니다.');

let refreshPromise: Promise<boolean> | null = null;
let refreshFailed = false;

export function resetAuthState() {
  refreshFailed = false;
  refreshPromise = null;
}

export async function refreshTokens(): Promise<boolean> {
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
  const liveReadOnly = import.meta.env.DEV && import.meta.env.VITE_LIVE_READONLY === 'true';
  const method = (options.method ?? 'GET').toUpperCase();
  const authAction = method === 'POST' && ['/auth/login', '/auth/refresh', '/auth/logout'].includes(path);
  if (liveReadOnly && !['GET', 'HEAD'].includes(method) && !authAction) {
    return { success: false, data: null, error: '운영 문제 조회 모드: 답 제출·수정·삭제는 차단되어 있습니다.' };
  }
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
