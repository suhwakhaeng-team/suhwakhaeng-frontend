import type { MasteryStatus } from './curriculumMap';

export interface TopologyNode {
  id: string;       // tagId (ForceGraph2D의 id 필드)
  tagName: string;
  categoryPath: string;
  status: MasteryStatus;
  colorDepth: number | null;
}

export interface TopologyEdge {
  source: string;   // tagName (선수)
  target: string;   // tagName (후수)
}

export interface TopologyResponse {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}
