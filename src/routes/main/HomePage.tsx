import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { colors, radius, spacing, typography } from '../../lib/designTokens';
import {
  reviewPlaceholder,
  type CurriculumItem,
  type ReviewItem,
} from '../../types/home';
import { fetchCurriculum } from '../../lib/curriculumClient';
import { fetchCurriculumOverview } from '../../lib/curriculumOverviewClient';
import { fetchMasteries, averageProgress, progressLabelFor } from '../../lib/masteryClient';
import { fetchDailyStats } from '../../lib/dailyStatsClient';
import { tokenStorage } from '../../lib/tokenStorage';
import type { CurriculumMapItem } from '../../types/curriculumMap';
import HomeHeader from '../../components/home/HomeHeader';
import CurriculumListSection from '../../components/home/CurriculumListSection';
import CurriculumMapSection from '../../components/home/CurriculumMapSection';
import ReviewListSection from '../../components/home/ReviewListSection';
import ProgressGauge from '../../components/home/ProgressGauge';
import DailyStatsCard from '../../components/home/DailyStatsCard';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.nickname || user?.name || '학생';

  // 커리큘럼 (GET /users/{uid}/curriculum)
  const [curriculumItems, setCurriculumItems] = useState<CurriculumItem[]>([]);
  const [activeCurriculumId, setActiveCurriculumId] = useState<string | null>(null);
  const [isCurriculumLoading, setIsCurriculumLoading] = useState(false);
  const [curriculumError, setCurriculumError] = useState<string | null>(null);

  // 전체 커리큘럼 미니맵 (GET /users/{uid}/curriculum/overview)
  // 실패 시 UI 에러 미표시, 빈 배열 유지 (상단 추천 흐름 보호).
  const [curriculumMapItems, setCurriculumMapItems] = useState<CurriculumMapItem[]>([]);

  // 학습 진도 (GET /users/{uid}/masteries 평균 기반).
  // 로드 전/실패 시 0/"시작 단계" 유지하고 UI 에러는 표시하지 않음 (iOS 와 동일 정책).
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressLabel, setProgressLabel] = useState('시작 단계');

  // 복습은 BE 미구현 → placeholder 유지
  const reviewItems = reviewPlaceholder;

  // 오늘 통계 (GET /users/{uid}/daily-stats).
  // 로드 전/실패 시 0 유지하고 UI 에러는 표시하지 않음 (iOS 와 동일 정책).
  const [todaySolvedCount, setTodaySolvedCount] = useState(0);
  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    const uid = tokenStorage.getUid();
    if (!uid) return; // 미로그인 상황은 AppRouter 차원에서 이미 차단됨. 방어용.

    let cancelled = false;
    setIsCurriculumLoading(true);
    setCurriculumError(null);

    fetchCurriculum(uid)
      .then((result) => {
        if (cancelled) return;
        setCurriculumItems(result.items);
        setActiveCurriculumId(result.activeId);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : '커리큘럼을 불러오지 못했습니다.';
        setCurriculumError(message);
      })
      .finally(() => {
        if (!cancelled) setIsCurriculumLoading(false);
      });

    // 전체 커리큘럼 미니맵 조회. 실패는 조용히 무시 (iOS 와 동일 정책).
    fetchCurriculumOverview(uid)
      .then((items) => {
        if (cancelled) return;
        setCurriculumMapItems(items);
      })
      .catch(() => {
        // 의도적으로 에러 UI 표시하지 않음.
      });

    // 숙련도 조회 (홈 반원 게이지용). 실패는 조용히 무시.
    fetchMasteries(uid)
      .then((masteries) => {
        if (cancelled) return;
        const percent = averageProgress(masteries);
        setProgressPercent(percent);
        setProgressLabel(progressLabelFor(percent));
      })
      .catch(() => {
        // 의도적으로 에러 UI 표시하지 않음.
      });

    // 오늘 통계 조회 (오늘 푼 문제 수 + 연속 학습일). 실패는 조용히 무시.
    fetchDailyStats(uid)
      .then((stats) => {
        if (cancelled) return;
        setTodaySolvedCount(stats.todaySolvedCount);
        setStreakDays(stats.streakDays);
      })
      .catch(() => {
        // 의도적으로 에러 UI 표시하지 않음.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSolveClick = () => navigate('/main/problem/start');
  const handleRetry = () => {
    const uid = tokenStorage.getUid();
    if (!uid) return;
    setIsCurriculumLoading(true);
    setCurriculumError(null);
    fetchCurriculum(uid)
      .then((result) => {
        setCurriculumItems(result.items);
        setActiveCurriculumId(result.activeId);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : '커리큘럼을 불러오지 못했습니다.';
        setCurriculumError(message);
      })
      .finally(() => setIsCurriculumLoading(false));
  };
  const handleReviewSeeAll = () => {
    // TODO: 복습 전체보기 화면 라우팅
  };
  const handleReviewItemClick = (_item: ReviewItem) => {
    // TODO: 복습 상세 화면 라우팅
  };

  return (
    <div
      style={{
        background: colors.gray100,
        minHeight: '100%',
        margin: `-${spacing.xl}px`,
        padding: spacing.xl,
      }}
    >
      <HomeHeader nickname={displayName} grade={user?.grade} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.lg,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: spacing.lg,
            alignItems: 'start',
          }}
        >
          {renderCurriculumSection({
            isLoading: isCurriculumLoading,
            error: curriculumError,
            items: curriculumItems,
            activeId: activeCurriculumId,
            onSolveClick: handleSolveClick,
            onRetry: handleRetry,
          })}

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
            <ReviewListSection
              items={reviewItems}
              onSeeAllClick={handleReviewSeeAll}
              onItemClick={handleReviewItemClick}
            />
            <ProgressGauge
              nickname={displayName}
              percent={progressPercent}
              label={progressLabel}
            />
            <DailyStatsCard
              todaySolvedCount={todaySolvedCount}
              streakDays={streakDays}
            />
          </div>
        </div>

        <CurriculumMapSection items={curriculumMapItems} />
      </div>
    </div>
  );
}

// MARK: - Curriculum Section (로딩/에러/빈/정상 4분기)

interface CurriculumSectionProps {
  isLoading: boolean;
  error: string | null;
  items: CurriculumItem[];
  activeId: string | null;
  onSolveClick: () => void;
  onRetry: () => void;
}

function renderCurriculumSection({
  isLoading,
  error,
  items,
  activeId,
  onSolveClick,
  onRetry,
}: CurriculumSectionProps) {
  if (isLoading) {
    return <CurriculumPlaceholderCard message="커리큘럼을 불러오는 중입니다…" />;
  }
  if (error) {
    return <CurriculumErrorCard message={error} onRetry={onRetry} />;
  }
  if (items.length === 0) {
    return <CurriculumPlaceholderCard message="표시할 커리큘럼이 아직 없어요." />;
  }
  return (
    <CurriculumListSection
      items={items}
      activeId={activeId}
      onSolveClick={onSolveClick}
    />
  );
}

function CurriculumPlaceholderCard({ message }: { message: string }) {
  return (
    <section
      style={{
        padding: spacing.xl,
        background: colors.white,
        borderRadius: radius.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
        minHeight: 200,
      }}
    >
      <h3 style={{ ...typography.headingLgBold, color: colors.gray900, margin: 0 }}>
        오늘의 추천
      </h3>
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.gray500,
          ...typography.bodyTextLgMedium,
        }}
      >
        {message}
      </div>
    </section>
  );
}

function CurriculumErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section
      style={{
        padding: spacing.xl,
        background: colors.white,
        borderRadius: radius.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
        minHeight: 200,
      }}
    >
      <h3 style={{ ...typography.headingLgBold, color: colors.gray900, margin: 0 }}>
        오늘의 추천
      </h3>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.md,
        }}
      >
        <p
          style={{
            ...typography.bodyTextLgMedium,
            color: colors.gray700,
            margin: 0,
            textAlign: 'center',
          }}
        >
          {message}
        </p>
        <button
          type="button"
          onClick={onRetry}
          style={{
            padding: `${spacing.sm}px ${spacing.lg}px`,
            background: colors.brand500,
            color: colors.white,
            border: 'none',
            borderRadius: radius.md,
            cursor: 'pointer',
            ...typography.bodyTextXLSemiBold,
          }}
        >
          다시 시도
        </button>
      </div>
    </section>
  );
}
