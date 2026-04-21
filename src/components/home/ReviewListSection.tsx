import { colors, radius, spacing, typography } from '../../lib/designTokens';
import type { ReviewItem } from '../../types/home';
import ReviewItemRow from './ReviewItemRow';

interface Props {
  items: ReviewItem[];
  onSeeAllClick: () => void;
  onItemClick: (item: ReviewItem) => void;
}

export default function ReviewListSection({ items, onSeeAllClick, onItemClick }: Props) {
  return (
    <section
      style={{
        padding: spacing.xl,
        background: colors.white,
        borderRadius: radius.lg,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <h3 style={{ ...typography.headingLgBold, color: colors.gray900, margin: 0 }}>
          복습하기
        </h3>
        <button
          type="button"
          onClick={onSeeAllClick}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: colors.gray500,
            ...typography.bodyTextLgMedium,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: 0,
          }}
        >
          전체보기 <span style={{ fontSize: 12 }}>›</span>
        </button>
      </div>

      <div>
        {items.map((item, index) => (
          <div key={item.id}>
            <ReviewItemRow item={item} onClick={() => onItemClick(item)} />
            {index < items.length - 1 && (
              <div style={{ height: 1, background: colors.gray200 }} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
