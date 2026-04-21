import { colors, radius, spacing, typography } from '../../lib/designTokens';
import type { CurriculumItem } from '../../types/home';
import CurriculumItemCard from './CurriculumItemCard';

interface Props {
  items: CurriculumItem[];
  activeId: number | null;
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
        커리큘럼
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
