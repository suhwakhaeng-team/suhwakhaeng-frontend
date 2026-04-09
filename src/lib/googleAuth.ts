import type { ApiResponse, LoginRequest, TokenResponse } from '../types/auth';
import { apiClient } from './apiClient';
import { tokenStorage } from './tokenStorage';

interface GoogleIdTokenPayload {
  sub: string;
  email?: string;
  name?: string;
}

function decodeGoogleIdToken(credential: string): GoogleIdTokenPayload {
  const parts = credential.split('.');
  if (parts.length !== 3) throw new Error('Invalid ID token format');

  let payload = parts[1]
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  payload = payload.padEnd(payload.length + (4 - payload.length % 4) % 4, '=');

  const decoded = atob(payload);
  return JSON.parse(decoded);
}

export async function loginWithGoogle(credential: string): Promise<TokenResponse> {
  const { sub, email, name } = decodeGoogleIdToken(credential);

  const body: LoginRequest = {
    uid: sub,
    provider: 'google',
    email,
    name,
    deviceInfo: 'web',
  };

  const res: ApiResponse<TokenResponse> = await apiClient.post('/auth/login', body);

  if (!res.success || !res.data) {
    throw new Error(res.error ?? '로그인에 실패했습니다.');
  }

  const { accessToken, refreshToken, user } = res.data;
  tokenStorage.save(accessToken, refreshToken, sub, user);

  return res.data;
}
