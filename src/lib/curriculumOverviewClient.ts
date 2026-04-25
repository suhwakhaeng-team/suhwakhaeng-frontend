import { apiClient } from './apiClient';
import { coerceStatus, type CurriculumMapItem } from '../types/curriculumMap';

// MARK: - Network DTO (BE CurriculumOverviewResponse / CurriculumOverviewItem 와 1:1)

interface CurriculumOverviewItemDTO {
  tagId: string;
  tagName: string;
  categoryPath: string;
  status: string;
  colorDepth: number | null;
}

interface CurriculumOverviewListDTO {
  items: CurriculumOverviewItemDTO[];
}

/**
 * GET /api/v1/users/{uid}/curriculum/overview
 * 전체 태그 × 사용자 Mastery 조인. LLM/RAG 미호출.
 */
export async function fetchCurriculumOverview(uid: string): Promise<CurriculumMapItem[]> {
  const res = await apiClient.get<CurriculumOverviewListDTO>(`/users/${uid}/curriculum/overview`);
  if (!res.success || !res.data) {
    throw new Error(res.error ?? '전체 커리큘럼을 불러오지 못했습니다.');
  }

  return res.data.items.map((dto) => ({
    id: dto.tagId,
    tagName: dto.tagName,
    categoryPath: dto.categoryPath,
    status: coerceStatus(dto.status),
    colorDepth: dto.colorDepth ?? null,
  }));
}
