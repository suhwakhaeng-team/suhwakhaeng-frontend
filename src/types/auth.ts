export interface User {
  userId: number;
  uid: string;
  email: string | null;
  provider: string | null;
  name: string | null;
  grade: number | null;
  isTested: boolean;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface LoginRequest {
  uid: string;
  provider: string;
  email?: string;
  name?: string;
  deviceInfo?: string;
}

export interface TokenRefreshRequest {
  uid: string;
  refreshToken: string;
  deviceInfo?: string;
}

export interface LogoutRequest {
  uid: string;
  refreshToken: string;
}
