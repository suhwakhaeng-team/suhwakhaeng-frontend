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

/**
 * 홈 게이지용 "전체 개념 노드 대비 이해도"(0.0~1.0).
 * - 분모 = 전체 개념 태그(같은 개념 이름은 하나로 합침 — 유형명 chapter 중복 태그 제거).
 * - 미진단(colorDepth null) = 0%. → 모든 개념을 마스터해야 100%.
 */
export function overallProgress(items: CurriculumMapItem[]): number {
  if (items.length === 0) return 0;
  const byName = new Map<string, number>();
  for (const it of items) {
    const cd = it.colorDepth ?? 0;
    byName.set(it.tagName, Math.max(byName.get(it.tagName) ?? 0, cd));
  }
  if (byName.size === 0) return 0;
  let sum = 0;
  byName.forEach((cd) => { sum += cd; });
  return sum / (byName.size * 100); // colorDepth 0~100 → 0~1
}
