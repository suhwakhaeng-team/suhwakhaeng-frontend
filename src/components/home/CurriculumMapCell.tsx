import { colors, radius, spacing, typography } from '../../lib/designTokens';
import type { CurriculumMapItem } from '../../types/curriculumMap';
import CurriculumStatusBadge from './CurriculumStatusBadge';

interface Props {
  item: CurriculumMapItem;
}

export default function CurriculumMapCell({ item }: Props) {
  const showCategory =
    item.categoryPath.length > 0 && item.categoryPath !== item.tagName;
  return (
    <div
      style={{
        padding: spacing.md,
        background: colors.gray50,
        borderRadius: radius.sm,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.xs,
        alignItems: 'flex-start',
      }}
    >
      <span
        style={{
          ...typography.bodyTextLgRegular,
          color: colors.gray900,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {item.tagName}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        <CurriculumStatusBadge status={item.status} />
        {showCategory && (
          <span
            style={{
              ...typography.captionMedium,
              color: colors.gray500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 120,
            }}
          >
            {item.categoryPath}
          </span>
        )}
      </div>
    </div>
  );
}
