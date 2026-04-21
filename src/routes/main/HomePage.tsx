import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing } from '../../lib/designTokens';
import {
  curriculumPlaceholder,
  reviewPlaceholder,
  type ReviewItem,
} from '../../types/home';
import HomeHeader from '../../components/home/HomeHeader';
import CurriculumListSection from '../../components/home/CurriculumListSection';
import ReviewListSection from '../../components/home/ReviewListSection';
import ProgressGauge from '../../components/home/ProgressGauge';
import DailyStatsCard from '../../components/home/DailyStatsCard';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.nickname || user?.name || '학생';

  // TODO: 추후 `GET /users/{uid}/curriculum`, `/review`, `/daily-stats`, `/streak`, `/progress` 연동
  const curriculumItems = curriculumPlaceholder;
  const activeCurriculumId = curriculumPlaceholder[0]?.id ?? null;
  const reviewItems = reviewPlaceholder;
  const progressPercent = 0.35;
  const progressLabel = '성장 중';
  const todaySolvedCount = 10;
  const streakDays = 3;

  const handleSolveClick = () => navigate('/main/problem/start');
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
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: spacing.lg,
          alignItems: 'start',
        }}
      >
        <CurriculumListSection
          items={curriculumItems}
          activeId={activeCurriculumId}
          onSolveClick={handleSolveClick}
        />

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
    </div>
  );
}
