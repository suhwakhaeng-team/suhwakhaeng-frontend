import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { LearningRouteResponse } from '../types/learning';

// 온보딩 스텝(학년/과목/단원/실력테스트 결과)을 스텝 간 공유하기 위한 컨텍스트.
// iOS에서는 TCA State로 관리되는 값이다 — 웹에서는 Router 상위에 Provider를 걸어 동일한 공유를 구현한다.

export type Grade = 'middle1' | 'middle2' | 'middle3' | 'high1' | 'high2' | 'high3';

// 레벨테스트 시작 계층(BN 복합 / AN 핵심 / SAN 기초). UT 에서 어느 계층부터 푸는 게 좋은지 비교용.
export type StartNodeLevel = 'BN' | 'AN' | 'SAN';

interface OnboardingContextValue {
  grade: Grade | null;
  subject: string | null;
  units: string[];
  startNodeLevel: StartNodeLevel;
  levelTestResult: LearningRouteResponse | null;
  setGrade: (grade: Grade) => void;
  setSubject: (subject: string) => void;
  setUnits: (units: string[]) => void;
  setStartNodeLevel: (level: StartNodeLevel) => void;
  setLevelTestResult: (result: LearningRouteResponse) => void;
  reset: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [grade, setGradeState] = useState<Grade | null>(null);
  const [subject, setSubjectState] = useState<string | null>(null);
  const [units, setUnitsState] = useState<string[]>([]);
  // 레벨 테스트는 복합개념(BN)에서만 시작한다.
  const [startNodeLevel, setStartNodeLevelState] = useState<StartNodeLevel>('BN');
  const [levelTestResult, setLevelTestResultState] = useState<LearningRouteResponse | null>(null);

  const setGrade = useCallback((g: Grade) => setGradeState(g), []);
  const setSubject = useCallback((s: string) => setSubjectState(s), []);
  const setUnits = useCallback((u: string[]) => setUnitsState(u), []);
  const setStartNodeLevel = useCallback((l: StartNodeLevel) => setStartNodeLevelState(l), []);
  const setLevelTestResult = useCallback((r: LearningRouteResponse) => setLevelTestResultState(r), []);
  const reset = useCallback(() => {
    setGradeState(null);
    setSubjectState(null);
    setUnitsState([]);
    setStartNodeLevelState('BN');
    setLevelTestResultState(null);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{ grade, subject, units, startNodeLevel, levelTestResult, setGrade, setSubject, setUnits, setStartNodeLevel, setLevelTestResult, reset }}
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
