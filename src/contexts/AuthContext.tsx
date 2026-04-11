import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User } from '../types/auth';
import { tokenStorage } from '../lib/tokenStorage';
import { loginWithGoogle } from '../lib/googleAuth';
import { apiClient, resetAuthState } from '../lib/apiClient';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = tokenStorage.getUser();
    if (storedUser && tokenStorage.hasTokens()) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credential: string) => {
    resetAuthState();
    const result = await loginWithGoogle(credential);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    const uid = tokenStorage.getUid();
    const refreshToken = tokenStorage.getRefreshToken();

    if (uid && refreshToken) {
      try {
        await apiClient.post('/auth/logout', { uid, refreshToken });
      } catch {
        // 로그아웃 API 실패해도 로컬 토큰은 삭제
      }
    }

    tokenStorage.clear();
    setUser(null);
    window.location.href = '/onboarding/login';
  }, []);

  // 닉네임 등 부분 필드 갱신용. user가 null이면 아무 일도 하지 않는다.
  const updateUser = useCallback((partial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      tokenStorage.saveUser(next);
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
