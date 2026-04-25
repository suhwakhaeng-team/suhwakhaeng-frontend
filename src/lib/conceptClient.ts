import { apiClient } from './apiClient';
import type { ConceptNote } from '../types/concept';

/**
 * GET /api/v1/concepts/{tagId}
 *
 * 단원 개념 정리 콘텐츠. 첫 호출 시 BE 가 LLM 으로 생성·캐싱하므로 수 초 지연 가능.
 * iOS `ConceptAPIClient.fetchConcept` 와 동일 엔드포인트.
 */
export async function fetchConcept(tagId: number): Promise<ConceptNote> {
  const res = await apiClient.get<ConceptNote>(`/concepts/${tagId}`);
  if (!res.success || !res.data) {
    throw new Error(res.error ?? '개념 정리를 불러오지 못했습니다.');
  }
  return res.data;
}
