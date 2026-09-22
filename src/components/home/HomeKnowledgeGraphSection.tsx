import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, radius, spacing, typography } from '../../lib/designTokens';

const KnowledgeGraphPage = lazy(() => import('../../routes/main/KnowledgeGraphPage'));

export default function HomeKnowledgeGraphSection() {
  const navigate = useNavigate();

  return (
    <section
      id="concept-map"
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
          개념 지도
        </h3>
        <button
          type="button"
          onClick={() => navigate('/main/curriculum')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            ...typography.captionSemiBold,
            color: colors.brand500,
            padding: 0,
          }}
        >
          전체 커리큘럼 보기 →
        </button>
      </div>

      <Suspense
        fallback={(
          <div style={{ minHeight: 620, display: 'grid', placeItems: 'center', color: colors.gray500 }}>
            개념 지도를 준비하고 있어요…
          </div>
        )}
      >
        <KnowledgeGraphPage embedded />
      </Suspense>
    </section>
  );
}
