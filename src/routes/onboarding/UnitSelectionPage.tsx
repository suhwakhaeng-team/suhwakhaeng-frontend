import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { colors, radius, spacing, typography } from '../../lib/designTokens';

const unitOptions = ['전체', '확률', '통계'];

export default function UnitSelectionPage() {
  const navigate = useNavigate();
  const { setUnits } = useOnboarding();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (unit: string) => {
    setSelected((prev) =>
      prev.includes(unit) ? prev.filter((u) => u !== unit) : [...prev, unit]
    );
  };

  const handleNext = () => {
    setUnits(selected);
    navigate('/onboarding/nickname');
  };

  const canProceed = selected.length > 0;

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
