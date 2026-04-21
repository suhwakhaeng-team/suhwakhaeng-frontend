import { colors, spacing, typography } from '../../lib/designTokens';
import type { ReviewItem } from '../../types/home';

interface Props {
  item: ReviewItem;
  onClick: () => void;
}

export default function ReviewItemRow({ item, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: `${spacing.md}px 0`,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span style={{ ...typography.bodyTextXLSemiBold, color: colors.gray900 }}>
        {item.topicName}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        <span style={{ ...typography.bodyTextXLRegular, color: colors.gray500 }}>
          {item.categoryName}
        </span>
        <span style={{ color: colors.gray400, fontSize: 14 }}>›</span>
      </span>
    </button>
  );
}
