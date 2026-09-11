import { colors, radius, spacing, typography } from '../../lib/designTokens';

interface Props {
  onClick: () => void;
}

export default function FeedbackCard({ onClick }: Props) {
  return (
    <section
      style={{
        padding: spacing.xl,
        background: colors.white,
        borderRadius: radius.lg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.lg,
      }}
    >
      <div>
        <p
          style={{
            ...typography.captionSemiBold,
            color: colors.brand600,
            margin: `0 0 ${spacing.xs}px`,
            letterSpacing: '0.08em',
          }}
        >
          FEEDBACK
        </p>
        <h3 style={{ ...typography.headingLgBold, color: colors.gray900, margin: 0 }}>
          수확행을 함께 개선해주세요
        </h3>
        <p
          style={{
            ...typography.bodyTextLgRegular,
            color: colors.gray500,
            margin: `${spacing.xs}px 0 0`,
          }}
        >
          사용 경험을 들려주시면 더 나은 학습 서비스로 만들게요.
        </p>
      </div>
      <button
        type="button"
        onClick={onClick}
        style={{
          flexShrink: 0,
          padding: `${spacing.md}px ${spacing.lg}px`,
          border: 'none',
          borderRadius: radius.md,
          background: colors.brand500,
          color: colors.white,
          cursor: 'pointer',
          ...typography.bodyTextXLSemiBold,
        }}
      >
        의견 남기기
      </button>
    </section>
  );
}
