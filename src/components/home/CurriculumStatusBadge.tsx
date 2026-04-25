import { colors, radius, spacing, typography } from '../../lib/designTokens';
import type { MasteryStatus } from '../../types/curriculumMap';

interface Props {
  status: MasteryStatus;
}

export default function CurriculumStatusBadge({ status }: Props) {
  const { label, bg, fg } = style(status);
  return (
    <span
      style={{
        ...typography.captionMedium,
        color: fg,
        background: bg,
        padding: `${spacing.xxs}px ${spacing.sm}px`,
        borderRadius: radius.xs,
        display: 'inline-block',
      }}
    >
      {label}
    </span>
  );
}

function style(status: MasteryStatus): { label: string; bg: string; fg: string } {
  switch (status) {
    case 'MASTERED':
      return { label: '통과', bg: colors.brand50, fg: colors.brand700 };
    case 'IN_PROGRESS':
      return { label: '진행', bg: colors.gray100, fg: colors.gray900 };
    case 'WEAK':
      return { label: '약점', bg: colors.red500, fg: colors.white };
    case 'UNDIAGNOSED':
    default:
      return { label: '미진단', bg: colors.gray50, fg: colors.gray500 };
  }
}
