import { colors, radius, spacing, typography } from '../../lib/designTokens';
import type { CurriculumItem } from '../../types/home';
import CurriculumItemCard from './CurriculumItemCard';

interface Props {
  items: CurriculumItem[];
  activeId: string | null;
  onSolveClick: () => void;
}

export default function CurriculumListSection({ items, activeId, onSolveClick }: Props) {
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
        오늘의 추천
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {items.map((item) => (
          <CurriculumItemCard
            key={item.id}
            item={item}
            isActive={item.id === activeId}
            onSolveClick={onSolveClick}
          />
        ))}
      </div>
    </section>
  );
}
