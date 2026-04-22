import { apiClient } from './apiClient';

// BE `UserTagMasteryResponse` 와 1:1. masteryScore 는 0.0~1.0 또는 미진단시 -1.0.
export interface UserTagMastery {
  masteryId: number;
  tagId: number;
  tagName: string;
  masteryScore: number;
  correctCount: number;
  colorDepth: number;
}

/**
 * GET /api/v1/users/{uid}/masteries
 * 실패: Error throw. 성공: 배열 (비어있을 수 있음).
 */
export async function fetchMasteries(uid: string): Promise<UserTagMastery[]> {
  const res = await apiClient.get<UserTagMastery[]>(`/users/${uid}/masteries`);
  if (!res.success || !res.data) {
    throw new Error(res.error ?? '숙련도를 불러오지 못했습니다.');
  }
  return res.data;
}

/**
 * BE가 내려보낸 숙련도 리스트에서 홈 반원 게이지용 진도율(0.0~1.0)을 계산.
 * - 미진단 항목(masteryScore <= 0)은 평균에서 제외.
 * - 모두 미진단이거나 리스트가 비어있으면 0 을 반환.
 * iOS `UserTagMastery.averageProgress` 와 동일 규칙.
 */
export function averageProgress(masteries: UserTagMastery[]): number {
  const valid = masteries.filter((m) => m.masteryScore > 0);
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, m) => acc + m.masteryScore, 0);
  return sum / valid.length;
}

/** 진도율(0~1) 에 따른 라벨. iOS `UserTagMastery.progressLabel` 과 동일. */
export function progressLabelFor(percent: number): string {
  if (percent < 0.3) return '시작 단계';
  if (percent < 0.7) return '성장 중';
  return '숙련 단계';
}
