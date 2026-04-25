import { apiClient } from './apiClient';
import type { ReviewItem } from '../types/home';

/**
 * GET /api/v1/users/{uid}/review[?limit=]
 * 사용자의 최근 오답 Tag 를 최신순으로 반환.
 * - limit 미지정 시 BE 기본값(5). 전체보기 화면에선 50 등 큰 값 전달.
 * 빈 배열 응답은 신규 사용자 또는 오답 이력 없는 사용자에게 정상.
 * iOS `ReviewAPIClient.fetchReviewItems` 와 동일 엔드포인트.
 */
export async function fetchReviewItems(uid: string, limit?: number): Promise<ReviewItem[]> {
  const qs = limit != null ? `?limit=${limit}` : '';
  const res = await apiClient.get<ReviewItem[]>(`/users/${uid}/review${qs}`);
  if (!res.success || !res.data) {
    throw new Error(res.error ?? '복습 목록을 불러오지 못했습니다.');
  }
  return res.data;
}
