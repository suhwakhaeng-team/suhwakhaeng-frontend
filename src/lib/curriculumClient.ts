import { apiClient } from './apiClient';
import type { CurriculumItem } from '../types/home';

// MARK: - Network DTO (BE CurriculumItemResponse / CurriculumListResponse 와 1:1)

interface CurriculumItemDTO {
  topicId: string;
  topicName: string;
  categoryPath: string;
  questionCount: number;
  isActive: boolean;
  reasoning: string;
}

interface CurriculumListDTO {
  items: CurriculumItemDTO[];
  overallGuidance: string;
}

export interface CurriculumFetchResult {
  items: CurriculumItem[];
  activeId: string | null;
  guidance: string;
}

/**
 * GET /api/v1/users/{uid}/curriculum
 * - 실패: Error throw (에러 메시지는 `message` 에 담김)
 * - 성공: items + (isActive=true 인 항목의) activeId + overallGuidance
 *
 * iOS `CurriculumAPIClient.swift` 와 동일한 변환 규칙.
 */
export async function fetchCurriculum(uid: string): Promise<CurriculumFetchResult> {
  const res = await apiClient.get<CurriculumListDTO>(`/users/${uid}/curriculum`);
  if (!res.success || !res.data) {
    throw new Error(res.error ?? '커리큘럼을 불러오지 못했습니다.');
  }

  const items: CurriculumItem[] = res.data.items.map((dto) => ({
    id: dto.topicId,
    topicName: dto.topicName,
    categoryPath: dto.categoryPath,
    problemCount: dto.questionCount,
    reasoning: dto.reasoning,
  }));

  const activeId = res.data.items.find((dto) => dto.isActive)?.topicId ?? null;

  return {
    items,
    activeId,
    guidance: res.data.overallGuidance,
  };
}
