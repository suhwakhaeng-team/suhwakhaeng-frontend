import { colors, radius, spacing, typography } from '../../lib/designTokens';
import type { CurriculumItem } from '../../types/home';

interface Props {
  item: CurriculumItem;
  isActive: boolean;
  onSolveClick: () => void;
}

export default function CurriculumItemCard({ item, isActive, onSolveClick }: Props) {
  return (
    <div
      style={{
        padding: spacing.lg,
        background: isActive ? colors.brand50 : colors.gray50,
        borderRadius: radius.md,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: spacing.sm, flexWrap: 'wrap' }}>
        <span style={{ ...typography.headingMdSemiBold, color: colors.gray900 }}>
          {item.topicName}
        </span>
        <span style={{ ...typography.bodyTextLgRegular, color: colors.gray500 }}>
          {item.categoryPath}
        </span>
      </div>

      <span style={{ ...typography.captionMedium, color: colors.gray500 }}>
        {item.problemCount}문제
      </span>

      {isActive && (
        <button
          type="button"
          onClick={onSolveClick}
          style={{
            marginTop: spacing.xs,
            padding: `${spacing.md}px 0`,
            width: '100%',
            background: colors.brand500,
            color: colors.white,
            border: 'none',
            borderRadius: radius.md,
            cursor: 'pointer',
            ...typography.headingMdSemiBold,
          }}
        >
          문제 풀기
        </button>
      )}
    </div>
  );
}
