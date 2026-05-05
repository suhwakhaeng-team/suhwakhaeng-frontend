// 단원 선택 화면 — 현재 미사용으로 주석처리 (2026-05-05)
// 확률과 통계 단일 과목만 지원하므로 단원 선택 단계 불필요.
// 복원 시: SubjectSelectionPage navigate → '/onboarding/unit' 로 되돌리고 아래 원본 컴포넌트 주석 해제.

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function UnitSelectionPage() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/onboarding/nickname', { replace: true }); }, [navigate]);
  return null;
}

/*
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { colors, radius, spacing, typography } from '../../lib/designTokens';

const SELECT_ALL = '전체선택';
const baseUnits = ['경우의 수', '확률', '통계'];
const unitOptions = [SELECT_ALL, ...baseUnits];

export default function UnitSelectionPage() {
  const navigate = useNavigate();
  const { setUnits } = useOnboarding();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (unit: string) => {
    setSelected((prev) => {
      if (unit === SELECT_ALL) {
        const allBaseSelected = baseUnits.every((u) => prev.includes(u));
        return allBaseSelected ? [] : [...unitOptions];
      }
      const alreadySelected = prev.includes(unit);
      const withoutSelectAll = prev.filter((u) => u !== SELECT_ALL);
      const next = alreadySelected
        ? withoutSelectAll.filter((u) => u !== unit)
        : [...withoutSelectAll, unit];
      const allBaseNowSelected = baseUnits.every((u) => next.includes(u));
      return allBaseNowSelected ? [SELECT_ALL, ...next] : next;
    });
  };

  const handleNext = () => {
    const actualUnits = selected.filter((u) => u !== SELECT_ALL);
    setUnits(actualUnits);
    navigate('/onboarding/nickname');
  };

  const canProceed = selected.some((u) => u !== SELECT_ALL);

  return (
    <div>
      <h2 style={{ ...typography.headingXLBold, color: colors.gray900, margin: 0 }}>
        단원을 선택해주세요
      </h2>
      <p style={{ ...typography.bodyTextXLRegular, color: colors.gray500, marginTop: spacing.sm }}>
        학습 범위 설정 (복수 선택 가능)
      </p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
          marginTop: spacing.xl,
        }}
      >
        {unitOptions.map((unit) => {
          const isSelected = selected.includes(unit);
          return (
            <button
              key={unit}
              onClick={() => toggle(unit)}
              style={{
                padding: spacing.lg,
                ...typography.headingMdBold,
                border: `1px solid ${isSelected ? colors.brand500 : colors.gray200}`,
                borderRadius: radius.md,
                background: isSelected ? colors.brand50 : colors.white,
                color: isSelected ? colors.brand600 : colors.gray900,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {unit}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleNext}
        disabled={!canProceed}
        style={{
          width: '100%',
          padding: `${spacing.lg}px 0`,
          marginTop: spacing.xxl,
          background: canProceed ? colors.brand500 : colors.gray300,
          color: colors.white,
          border: 'none',
          borderRadius: radius.md,
          ...typography.headingMdBold,
          cursor: canProceed ? 'pointer' : 'default',
        }}
      >
        다음
      </button>
    </div>
  );
}
*/
