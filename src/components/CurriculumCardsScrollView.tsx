import { spacing } from '../lib/designTokens';
import type { CurriculumCardItem } from '../lib/curriculumDefinition';
import CurriculumCardView from './CurriculumCardView';

interface Props {
  cards: CurriculumCardItem[];
}

export default function CurriculumCardsScrollView({ cards }: Props) {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexWrap: 'wrap',
        gap: spacing.md,
        padding: `${spacing.sm}px ${spacing.xl}px`,
        boxSizing: 'border-box',
      }}
    >
      {cards.map((card) => (
        <CurriculumCardView key={card.id} card={card} />
      ))}
    </div>
  );
}
