import { useNavigate } from 'react-router-dom';
import { useOnboarding, type StartNodeLevel } from '../../contexts/OnboardingContext';
import { colors, radius, spacing, typography } from '../../lib/designTokens';

interface LevelOption {
  key: StartNodeLevel;
  label: string;
  desc: string;
}

const LEVEL_OPTIONS: LevelOption[] = [
  { key: 'BN', label: '복합개념', desc: '여러 개념이 합쳐진 문제부터 풀어요' },
  { key: 'AN', label: '핵심개념', desc: '단원별 핵심 개념 문제부터 풀어요' },
  { key: 'SAN', label: '기초개념', desc: '가장 작은 기초 개념부터 풀어요' },
];

export default function TestIntroPage() {
  const navigate = useNavigate();
  const { startNodeLevel, setStartNodeLevel } = useOnboarding();

  const selected = LEVEL_OPTIONS.find((o) => o.key === startNodeLevel) ?? LEVEL_OPTIONS[2];

  return (
    <div style={{ textAlign: 'center', paddingTop: spacing.x3l, paddingBottom: spacing.x3l }}>
      <h2 style={{ ...typography.headingXLBold, color: colors.black, margin: 0 }}>커리큘럼 테스트</h2>
      <p style={{ ...typography.bodyTextXLRegular, color: colors.gray600, marginTop: spacing.lg, lineHeight: 1.6 }}>
        간단한 테스트를 통해<br />
        맞춤형 커리큘럼을 만들어드려요!
      </p>

      <p
        style={{
          ...typography.captionSemiBold,
          color: colors.gray700,
          marginTop: spacing.xxl,
          marginBottom: spacing.md,
        }}
      >
        어떤 개념부터 풀어볼까요?
      </p>

      <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'center' }}>
        {LEVEL_OPTIONS.map((opt) => {
          const isSelected = opt.key === startNodeLevel;
          return (
            <button
              key={opt.key}
              onClick={() => setStartNodeLevel(opt.key)}
              style={{
                flex: 1,
                maxWidth: 120,
                padding: `${spacing.md}px ${spacing.sm}px`,
                border: `1px solid ${isSelected ? colors.brand500 : colors.gray200}`,
                background: isSelected ? colors.brand50 : colors.white,
                color: isSelected ? colors.brand600 : colors.gray700,
                borderRadius: radius.md,
                ...typography.headingMdSemiBold,
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <p style={{ ...typography.bodyTextLgRegular, color: colors.gray500, marginTop: spacing.md }}>
        {selected.desc}
      </p>

      <button
        onClick={() => navigate('/onboarding/level-test')}
        style={{
          marginTop: spacing.x3l,
          padding: `${spacing.lg}px ${spacing.x3l}px`,
          background: colors.brand500,
          color: colors.white,
          border: 'none',
          borderRadius: radius.md,
          ...typography.headingMdBold,
          cursor: 'pointer',
        }}
      >
        테스트 시작하기
      </button>
    </div>
  );
}
