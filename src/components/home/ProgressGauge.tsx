import { colors, radius, spacing, typography } from '../../lib/designTokens';

interface Props {
  nickname: string;
  percent: number; // 0.0 ~ 1.0
  label: string;
}

// 웹 대시보드 스타일 — 수평 프로그레스 바 + 큰 퍼센트 + 라벨 배지.
// iOS의 반원 게이지는 iPad/모바일 한정이고, 데스크톱에선 폭을 꽉 채우는 막대가 더 자연스러움.
export default function ProgressGauge({ nickname, percent, label }: Props) {
  const clamped = Math.max(0, Math.min(1, percent));
  const percentText = `${Math.round(clamped * 100)}%`;

  return (
    <section
      style={{
        padding: spacing.xl,
        background: colors.white,
        borderRadius: radius.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
      }}
    >
      <h3 style={{ ...typography.headingLgBold, color: colors.gray900, margin: 0 }}>
        <span style={{ color: colors.brand600 }}>{nickname}</span>
        <span>님의 학습 숙련도</span>
      </h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
        <span
          style={{
            ...typography.displayXLBold,
            fontSize: 32,
            lineHeight: 1,
            color: colors.gray900,
          }}
        >
          {percentText}
        </span>
        <span
          style={{
            ...typography.captionSemiBold,
            color: colors.brand600,
            background: colors.brand50,
            padding: `${spacing.xs}px ${spacing.md}px`,
            borderRadius: radius.full,
          }}
        >
          {label}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped * 100)}
        style={{
          width: '100%',
          height: 10,
          background: colors.gray200,
          borderRadius: radius.full,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${clamped * 100}%`,
            height: '100%',
            background: colors.brand500,
            borderRadius: radius.full,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </section>
  );
}
