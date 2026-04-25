import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { colors, radius, spacing, typography } from '../../lib/designTokens';

// iOS/BE 시드와 통일. 전체선택은 baseUnits 모두 토글하는 가상 옵션.
const SELECT_ALL = '전체선택';
const baseUnits = ['경우의 수', '확률', '통계'];
const unitOptions = [SELECT_ALL, ...baseUnits];

export default function UnitSelectionPage() {
  const navigate = useNavigate();
  const { setUnits } = useOnboarding();
  const [selected, setSelected] = useState<string[]>([]);

  // iOS UnitSelectionReducer 의 토글 로직 포팅 (Reducer:42-60).
  // - 전체선택 클릭: 모든 baseUnits 가 선택돼 있으면 전부 해제, 아니면 전부 선택.
  // - 개별 단원 클릭: 토글 후 baseUnits 가 모두 선택되면 SELECT_ALL 자동 ON, 아니면 OFF.
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
    // 서버/컨텍스트에는 가상 옵션 SELECT_ALL 을 빼고 실제 단원만 저장.
    const actualUnits = selected.filter((u) => u !== SELECT_ALL);
    setUnits(actualUnits);
    navigate('/onboarding/nickname');
  };

  // 실제 단원 1개 이상 선택돼야 진행 가능.
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
