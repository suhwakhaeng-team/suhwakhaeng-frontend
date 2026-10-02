import type { ReactNode } from 'react';
import { colors, spacing } from '../../lib/designTokens';
import type { ReviewItem } from '../../types/home';
import HomeHeader from './HomeHeader';
import ReviewListSection from './ReviewListSection';
import ProgressGauge from './ProgressGauge';
import DailyStatsCard from './DailyStatsCard';

// Shared presentation only. Live HomePage owns its API calls; previews supply local data.
interface Props {
  nickname: string;
  grade?: number | null;
  recommendation: ReactNode;
  feedback: ReactNode;
  maps: ReactNode;
  reviewItems: ReviewItem[];
  progressPercent: number;
  progressLabel: string;
  progressHeading?: string;
  todaySolvedCount: number;
  streakDays: number;
  onReviewSeeAll: () => void;
  onReviewItemClick: (item: ReviewItem) => void;
}

export default function HomeDashboard(props: Props) {
  return <div className="home-dashboard" style={{ background: colors.gray100, minHeight: '100%', margin: `-${spacing.xl}px`, padding: spacing.xl }}>
    <HomeHeader nickname={props.nickname} grade={props.grade} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      <div className="home-dashboard-columns" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: spacing.lg, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          {props.recommendation}
          {props.feedback}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          <ReviewListSection items={props.reviewItems} onSeeAllClick={props.onReviewSeeAll} onItemClick={props.onReviewItemClick} />
          <ProgressGauge nickname={props.nickname} percent={props.progressPercent} label={props.progressLabel} heading={props.progressHeading} />
          <DailyStatsCard todaySolvedCount={props.todaySolvedCount} streakDays={props.streakDays} />
        </div>
      </div>
      {props.maps}
    </div>
  </div>;
}
