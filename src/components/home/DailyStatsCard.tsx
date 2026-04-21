import { colors, spacing } from '../../lib/designTokens';
import DailyStatCell from './DailyStatCell';

interface Props {
  todaySolvedCount: number;
  streakDays: number;
}

export default function DailyStatsCard({ todaySolvedCount, streakDays }: Props) {
  return (
    <div style={{ display: 'flex', gap: spacing.md }}>
      <DailyStatCell
        icon="✓"
        iconColor={colors.brand500}
        title="오늘 푼 문제"
        value={`${todaySolvedCount}문제`}
      />
      <DailyStatCell
        icon="🔥"
        iconColor={colors.red500}
        title="연속 학습"
        value={`${streakDays}일째`}
      />
    </div>
  );
}
