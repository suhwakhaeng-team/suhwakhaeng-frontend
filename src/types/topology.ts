import type { MasteryStatus } from './curriculumMap';

export interface TopologyNode {
  id: string;       // tagId (ForceGraph2D의 id 필드)
  tagName: string;
  categoryPath: string;
  status: MasteryStatus;
  colorDepth: number | null;
  /** Optional until the topology API exposes the chapter grade. */
  grade?: number | string | null;
}

export interface TopologyEdge {
  source: string;   // tagName (선수, 기존 API 호환)
  target: string;   // tagName (후수, 기존 API 호환)
  sourceTagId?: string;
  targetTagId?: string;
}

export interface TopologyResponse {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}
