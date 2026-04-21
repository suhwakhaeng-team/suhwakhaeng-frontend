import { colors, spacing, typography } from '../../lib/designTokens';
import { gradeLabel } from '../../types/home';

interface Props {
  nickname: string;
  grade: number | null | undefined;
}

export default function HomeHeader({ nickname, grade }: Props) {
  const label = gradeLabel(grade);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
      }}
    >
      <h2 style={{ ...typography.displayXLBold, color: colors.gray900, margin: 0 }}>
        <span style={{ color: colors.brand600 }}>{nickname}</span>
        <span>님, 오늘도 학습해볼까요?</span>
      </h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: colors.brand100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.brand600,
            fontSize: 20,
          }}
          aria-hidden
        >
          👤
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ ...typography.bodyTextXLSemiBold, color: colors.gray900 }}>
            <span style={{ color: colors.brand600 }}>{nickname}</span>
            <span>님</span>
          </span>
          {label && (
            <span style={{ ...typography.bodyTextLgRegular, color: colors.brand600 }}>
              {label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
