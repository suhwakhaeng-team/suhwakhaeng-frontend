import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User, OnboardingStatusResponse } from '../types/auth';
import { tokenStorage } from '../lib/tokenStorage';
import { loginWithGoogle } from '../lib/googleAuth';
import { apiClient, resetAuthState } from '../lib/apiClient';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credential: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
  // 온보딩 완료 PUT — 학년/과목/단원 모두 optional. 미전달 필드는 BE 가 partial update 로 무시.
  markOnboardingCompleted: (
    grade?: number,
    subject?: string,
    selectedUnits?: string,
  ) => Promise<boolean>;
  deleteAccount: () => Promise<void>;
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

  const login = useCallback(async (credential: string): Promise<User> => {
    resetAuthState();
    const result = await loginWithGoogle(credential);
    setUser(result.user);
    return result.user;
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

  // 레벨테스트 완료 직후 서버에 온보딩 완료(isTested=true)를 기록한다.
  // 이 호출이 있어야 재로그인/재시작 시 메인으로 직행한다.
  // 서버는 PUT /users/{uid}/onboarding 호출 시에만 isTested 를 플립한다.
  // 학년/과목/단원은 optional — undefined 인 필드는 본문에서 빼서 BE 가 해당 컬럼을 건드리지 않게 한다.
  const markOnboardingCompleted = useCallback(async (
    grade?: number,
    subject?: string,
    selectedUnits?: string,
  ): Promise<boolean> => {
    const uid = tokenStorage.getUid();
    if (!uid) return false;

    // partial update 본문 — 정의된 값만 포함시킨다.
    const body: Record<string, unknown> = { isTested: true };
    if (grade !== undefined) body.grade = grade;
    if (subject !== undefined) body.subject = subject;
    if (selectedUnits !== undefined) body.selectedUnits = selectedUnits;

    const res = await apiClient.put<OnboardingStatusResponse>(
      `/users/${uid}/onboarding`,
      body,
    );

    if (!res.success || !res.data?.isTested) {
      return false;
    }

    // 응답에 포함된 grade/subject/selectedUnits 도 로컬 user 에 반영해 재로그인 휘발 방지.
    const responseData = res.data;
    setUser((prev) => {
      if (!prev) return prev;
      const next: User = {
        ...prev,
        isTested: true,
        grade: responseData.grade,
        subject: responseData.subject,
        selectedUnits: responseData.selectedUnits,
      };
      tokenStorage.saveUser(next);
      return next;
    });
    return true;
  }, []);

  // 회원 탈퇴: 서버 레코드 삭제 + 로컬 상태 초기화 + 로그인 화면 이동.
  // 서버 호출 실패 시에도 로컬은 초기화해 재로그인 유도 (iOS와 동일 정책).
  const deleteAccount = useCallback(async () => {
    const uid = tokenStorage.getUid();
    if (uid) {
      try {
        await apiClient.delete(`/users/${uid}`);
      } catch {
        // 서버 실패해도 로컬 초기화 진행
      }
    }
    tokenStorage.clear();
    setUser(null);
    window.location.href = '/onboarding/login';
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
        markOnboardingCompleted,
        deleteAccount,
      }}
    >
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
