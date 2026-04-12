import { spacing } from '../lib/designTokens';
import type { CurriculumCardItem } from '../lib/curriculumDefinition';
import CurriculumCardView from './CurriculumCardView';

interface Props {
  cards: CurriculumCardItem[];
}

export default function CurriculumCardsScrollView({ cards }: Props) {
  return (
    <div
      className="cards-scroll"
      style={{
        width: '100%',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollSnapType: 'x mandatory',
        display: 'flex',
        gap: spacing.md,
        padding: `${spacing.sm}px ${spacing.xl}px`,
        boxSizing: 'border-box',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}
    >
      {cards.map((card) => (
        <div key={card.id} style={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
          <CurriculumCardView card={card} />
        </div>
      ))}
    </div>
  );
}
