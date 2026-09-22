import { useEffect, useState } from 'react';
import CurriculumMapSection from '../../components/home/CurriculumMapSection';
import { fetchCurriculumOverview } from '../../lib/curriculumOverviewClient';
import { colors, radius, spacing, typography } from '../../lib/designTokens';
import { tokenStorage } from '../../lib/tokenStorage';
import type { CurriculumMapItem } from '../../types/curriculumMap';

export default function CurriculumOverviewPage() {
  const uid = tokenStorage.getUid();
  const [items, setItems] = useState<CurriculumMapItem[]>([]);
  const [loading, setLoading] = useState(() => Boolean(uid));
  const [error, setError] = useState(() => uid ? '' : '로그인 정보를 확인할 수 없어요.');

  useEffect(() => {
    if (!uid) return;

    let cancelled = false;
    void fetchCurriculumOverview(uid)
      .then(result => {
        if (!cancelled) setItems(result);
      })
      .catch(reason => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : '전체 커리큘럼을 불러오지 못했어요.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [uid]);

  if (loading || error) {
    return (
      <section
        style={{
          minHeight: 320,
          display: 'grid',
          placeItems: 'center',
          background: colors.white,
          borderRadius: radius.lg,
          color: error ? colors.red500 : colors.gray500,
          ...typography.bodyTextLgRegular,
        }}
      >
        {error || '전체 커리큘럼을 불러오는 중이에요…'}
      </section>
    );
  }

  return (
    <div style={{ background: colors.gray100, minHeight: '100%', margin: `-${spacing.xl}px`, padding: spacing.xl }}>
      <CurriculumMapSection items={items} actionPath="/main/home#concept-map" />
    </div>
  );
}
