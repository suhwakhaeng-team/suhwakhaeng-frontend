import { useNavigate } from 'react-router-dom';
import { useOnboarding, type StartNodeLevel } from '../../contexts/OnboardingContext';
import { colors, radius, spacing, typography } from '../../lib/designTokens';

interface LevelOption {
  key: StartNodeLevel;
  label: string;
  desc: string;
  disabled?: boolean;
}

const LEVEL_OPTIONS: LevelOption[] = [
  { key: 'BN', label: '복합개념', desc: '여러 개념이 합쳐진 문제부터 풀어요' },
  { key: 'AN', label: '핵심개념', desc: '현재 선택할 수 없어요', disabled: true },
  { key: 'SAN', label: '기초개념', desc: '현재 선택할 수 없어요', disabled: true },
];

export default function TestIntroPage() {
  const navigate = useNavigate();
  const { startNodeLevel, setStartNodeLevel } = useOnboarding();

  const selected = LEVEL_OPTIONS.find((o) => o.key === startNodeLevel && !o.disabled) ?? LEVEL_OPTIONS[0];

  return (
    <div style={{ textAlign: 'center', paddingTop: spacing.x3l, paddingBottom: spacing.x3l }}>
      <h2 style={{ ...typography.headingXLBold, color: colors.black, margin: 0 }}>커리큘럼 테스트</h2>
      <p style={{ ...typography.bodyTextXLRegular, color: colors.gray600, marginTop: spacing.lg, lineHeight: 1.6 }}>
        맞춤형 커리큘럼을 만들기 위해 레벨테스트를 시작합니다. (10-15문제)<br />
        원활한 레벨테스트를 위해 필기도구를 준비해주세요.
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
              type="button"
              disabled={opt.disabled}
              aria-disabled={opt.disabled}
              title={opt.disabled ? '현재는 복합개념 테스트만 이용할 수 있습니다.' : undefined}
              onClick={() => {
                if (!opt.disabled) setStartNodeLevel(opt.key);
              }}
              style={{
                flex: 1,
                maxWidth: 120,
                padding: `${spacing.md}px ${spacing.sm}px`,
                border: `1px solid ${isSelected ? colors.brand500 : colors.gray200}`,
                background: isSelected ? colors.brand50 : (opt.disabled ? colors.gray100 : colors.white),
                color: isSelected ? colors.brand600 : (opt.disabled ? colors.gray400 : colors.gray700),
                borderRadius: radius.md,
                ...typography.headingMdSemiBold,
                cursor: opt.disabled ? 'not-allowed' : 'pointer',
                opacity: opt.disabled ? 0.65 : 1,
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
        onClick={() => {
          setStartNodeLevel('BN');
          navigate('/onboarding/level-test');
        }}
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
