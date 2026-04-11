import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { LearningRouteResponse } from '../types/learning';

// 온보딩 스텝(학년/과목/단원/실력테스트 결과)을 스텝 간 공유하기 위한 컨텍스트.
// iOS에서는 TCA State로 관리되는 값이다 — 웹에서는 Router 상위에 Provider를 걸어 동일한 공유를 구현한다.

export type Grade = 'middle1' | 'middle2' | 'middle3' | 'high1' | 'high2' | 'high3';

interface OnboardingContextValue {
  grade: Grade | null;
  subject: string | null;
  units: string[];
  levelTestResult: LearningRouteResponse | null;
  setGrade: (grade: Grade) => void;
  setSubject: (subject: string) => void;
  setUnits: (units: string[]) => void;
  setLevelTestResult: (result: LearningRouteResponse) => void;
  reset: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [grade, setGradeState] = useState<Grade | null>(null);
  const [subject, setSubjectState] = useState<string | null>(null);
  const [units, setUnitsState] = useState<string[]>([]);
  const [levelTestResult, setLevelTestResultState] = useState<LearningRouteResponse | null>(null);

  const setGrade = useCallback((g: Grade) => setGradeState(g), []);
  const setSubject = useCallback((s: string) => setSubjectState(s), []);
  const setUnits = useCallback((u: string[]) => setUnitsState(u), []);
  const setLevelTestResult = useCallback((r: LearningRouteResponse) => setLevelTestResultState(r), []);
  const reset = useCallback(() => {
    setGradeState(null);
    setSubjectState(null);
    setUnitsState([]);
    setLevelTestResultState(null);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{ grade, subject, units, levelTestResult, setGrade, setSubject, setUnits, setLevelTestResult, reset }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return ctx;
}
