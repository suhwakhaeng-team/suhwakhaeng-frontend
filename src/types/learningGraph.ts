export type ConceptStatus = 'unset' | 'known' | 'unknown';
export type ProgressMap = Record<string, ConceptStatus>;

export interface Subject {
  id: string;
  name: string;
  description?: string;
}

export interface Unit {
  id: string;
  subjectId: string;
  name: string;
  description?: string;
  prerequisites: string[];
}

export interface Concept {
  id: string;
  unitId: string;
  name: string;
  description: string;
  prerequisites: string[];
  metadata?: { grade?: string; semester?: string; difficulty?: number; category?: string };
}

export interface LearningGraphData {
  id: string;
  subject: Subject;
  units: Unit[];
  concepts: Concept[];
  initialProgress?: ProgressMap;
}

export interface GraphIndex {
  data: LearningGraphData;
  concepts: Map<string, Concept>;
  units: Map<string, Unit>;
  unitConcepts: Map<string, Concept[]>;
  successors: Map<string, string[]>;
  unitEdges: { source: string; target: string }[];
}
