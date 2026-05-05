import { apiClient } from './apiClient';
import { coerceStatus } from '../types/curriculumMap';
import type { TopologyNode, TopologyEdge, TopologyResponse } from '../types/topology';

interface TopologyNodeDTO {
  tagId: string;
  tagName: string;
  categoryPath: string;
  status: string;
  colorDepth: number | null;
}

interface TopologyEdgeDTO {
  source: string;
  target: string;
}

interface TopologyResponseDTO {
  nodes: TopologyNodeDTO[];
  edges: TopologyEdgeDTO[];
}

/**
 * GET /api/v1/users/{uid}/curriculum/topology
 * 전체 태그 노드 + 선수관계 엣지 반환.
 */
export async function fetchTopology(uid: string): Promise<TopologyResponse> {
  const res = await apiClient.get<TopologyResponseDTO>(`/users/${uid}/curriculum/topology`);
  if (!res.success || !res.data) {
    throw new Error(res.error ?? '토폴로지 데이터를 불러오지 못했습니다.');
  }

  const nodes: TopologyNode[] = res.data.nodes.map((dto) => ({
    id: dto.tagId,
    tagName: dto.tagName,
    categoryPath: dto.categoryPath,
    status: coerceStatus(dto.status),
    colorDepth: dto.colorDepth ?? null,
  }));

  const edges: TopologyEdge[] = res.data.edges.map((dto) => ({
    source: dto.source,
    target: dto.target,
  }));

  return { nodes, edges };
}
