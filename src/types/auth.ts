export interface User {
  userId: number;
  uid: string;
  email: string | null;
  provider: string | null;
  name: string | null;
  nickname: string | null;
  grade: number | null;
  subject: string | null;
  selectedUnits: string | null;
  isTested: boolean;
}

// 온보딩 PUT/GET 응답 — `AuthContext.markOnboardingCompleted` 가 사용한다.
// BE `OnboardingStatusResponse` 와 1:1 매핑.
export interface OnboardingStatusResponse {
  uid: string;
  isTested: boolean;
  grade: number | null;
  subject: string | null;
  selectedUnits: string | null;
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
