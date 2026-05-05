import { useNavigate } from 'react-router-dom';
import { colors, radius, spacing, typography } from '../../lib/designTokens';
import type { CurriculumMapItem } from '../../types/curriculumMap';
import CurriculumMapCell from './CurriculumMapCell';

interface Props {
  items: CurriculumMapItem[];
}

export default function CurriculumMapSection({ items }: Props) {
  const navigate = useNavigate();

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ ...typography.headingLgBold, color: colors.gray900, margin: 0 }}>
          전체 커리큘럼
        </h3>
        <button
          onClick={() => navigate('/main/topology')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            ...typography.captionSemiBold,
            color: colors.brand500,
            padding: 0,
          }}
        >
          개념 지도 보기 →
        </button>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            ...typography.bodyTextLgRegular,
            color: colors.gray500,
            padding: spacing.lg,
            textAlign: 'center',
          }}
        >
          표시할 단원이 없습니다.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: spacing.md,
          }}
        >
          {items.map((item) => (
            <CurriculumMapCell key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
