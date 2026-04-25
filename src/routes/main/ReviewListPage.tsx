import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, radius, spacing, typography } from '../../lib/designTokens';
import { tokenStorage } from '../../lib/tokenStorage';
import { fetchReviewItems } from '../../lib/reviewClient';
import type { ReviewItem } from '../../types/home';
import ReviewListSection from '../../components/home/ReviewListSection';

/**
 * 복습 전체보기 화면. 홈의 5개 섹션을 50개까지 확장.
 * 행 디자인은 `ReviewListSection` 컴포넌트 그대로 재사용.
 * 행 클릭 → `/main/review/:tagId` 로 이동(분할 상세 화면).
 */
export default function ReviewListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    const uid = tokenStorage.getUid();
    if (!uid) return;
    setIsLoading(true);
    setError(null);
    fetchReviewItems(uid, 50)
      .then(setItems)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : '복습 목록을 불러오지 못했습니다.';
        setError(msg);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleItemClick = (item: ReviewItem) => {
    navigate(`/main/review/${item.id}`, { state: { tagName: item.topicName } });
  };

  return (
    <div
      style={{
        background: colors.gray100,
        minHeight: '100%',
        margin: `-${spacing.xl}px`,
        padding: spacing.xl,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        <button
          type="button"
          onClick={() => navigate('/main/home')}
          style={{
            background: 'transparent',
            border: 'none',
            color: colors.gray700,
            ...typography.bodyTextXLSemiBold,
            cursor: 'pointer',
            padding: `${spacing.xs}px ${spacing.sm}px`,
          }}
        >
          ‹ 뒤로
        </button>
        <h2 style={{ ...typography.headingLgBold, color: colors.gray900, margin: 0 }}>복습하기</h2>
      </div>

      {isLoading && items.length === 0 && (
        <div
          style={{
            background: colors.white,
            borderRadius: radius.lg,
            padding: spacing.xl,
            textAlign: 'center',
            ...typography.bodyTextLgRegular,
            color: colors.gray500,
            minHeight: 200,
          }}
        >
          불러오는 중입니다…
        </div>
      )}
      {error && (
        <div
          style={{
            background: colors.white,
            borderRadius: radius.lg,
            padding: spacing.xl,
            textAlign: 'center',
          }}
        >
          <p style={{ ...typography.bodyTextLgMedium, color: colors.gray700, margin: 0 }}>{error}</p>
          <button
            type="button"
            onClick={load}
            style={{
              marginTop: spacing.md,
              padding: `${spacing.sm}px ${spacing.lg}px`,
              background: colors.brand500,
              color: colors.white,
              border: 'none',
              borderRadius: radius.sm,
              ...typography.bodyTextXLSemiBold,
              cursor: 'pointer',
            }}
          >
            다시 시도
          </button>
        </div>
      )}
      {!isLoading && !error && items.length === 0 && (
        <div
          style={{
            background: colors.white,
            borderRadius: radius.lg,
            padding: spacing.xl,
            textAlign: 'center',
            minHeight: 200,
          }}
        >
          <p style={{ ...typography.bodyTextXLSemiBold, color: colors.gray700, margin: 0 }}>
            복습할 항목이 없어요
          </p>
          <p style={{ ...typography.bodyTextLgRegular, color: colors.gray500, marginTop: spacing.xs }}>
            문제를 풀고 오답이 생기면 여기 모여요
          </p>
        </div>
      )}
      {items.length > 0 && (
        <ReviewListSection
          items={items}
          onSeeAllClick={() => { /* 본인이 전체보기 화면 */ }}
          onItemClick={handleItemClick}
        />
      )}
    </div>
  );
}
