import type { User } from '../types/auth';

const KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  UID: 'auth_uid',
  USER: 'auth_user',
} as const;

export const tokenStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem(KEYS.ACCESS_TOKEN);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(KEYS.REFRESH_TOKEN);
  },

  getUid(): string | null {
    return localStorage.getItem(KEYS.UID);
  },

  getUser(): User | null {
    const raw = localStorage.getItem(KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  save(accessToken: string, refreshToken: string, uid: string, user: User) {
    localStorage.setItem(KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(KEYS.UID, uid);
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  saveUser(user: User) {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  clear() {
    localStorage.removeItem(KEYS.ACCESS_TOKEN);
    localStorage.removeItem(KEYS.REFRESH_TOKEN);
    localStorage.removeItem(KEYS.UID);
    localStorage.removeItem(KEYS.USER);
  },

  hasTokens(): boolean {
    return !!(this.getAccessToken() && this.getRefreshToken() && this.getUid());
  },
};
