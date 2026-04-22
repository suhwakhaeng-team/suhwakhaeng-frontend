import { apiClient } from './apiClient';
import type { DailyStats } from '../types/home';

/**
 * GET /api/v1/users/{uid}/daily-stats
 * 홈 화면 "오늘 푼 문제 수 / 연속 학습일" 집계.
 * 실패: Error throw. 성공: DailyStats.
 * iOS `DailyStatsAPIClient.fetchDailyStats` 와 동일 엔드포인트.
 */
export async function fetchDailyStats(uid: string): Promise<DailyStats> {
  const res = await apiClient.get<DailyStats>(`/users/${uid}/daily-stats`);
  if (!res.success || !res.data) {
    throw new Error(res.error ?? '오늘 통계를 불러오지 못했습니다.');
  }
  return res.data;
}
