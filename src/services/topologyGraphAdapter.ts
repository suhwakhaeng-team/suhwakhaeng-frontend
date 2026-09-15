import type { TopologyResponse } from '../types/topology';
import type { LearningGraphData } from '../types/learningGraph';

function gradeLabel(value: number | string | null | undefined) {
  if (typeof value === 'number' && value >= 1 && value <= 6) return value <= 3 ? `중${value}` : `고${value - 3}`;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function adaptTopology(topology: TopologyResponse): { data: LearningGraphData; warnings: string[] } {
  const idsByName = new Map<string, string[]>();
  const categories = [...new Set(topology.nodes.map(n => n.categoryPath || '미분류'))];
  const warnings: string[] = [];
  const subject = { id: 'my-curriculum', name: '내 커리큘럼', description: '현재 커리큘럼의 개념 관계와 학습 상태입니다.' };
  const concepts = topology.nodes.map(n => {
    const id = String(n.id);
    idsByName.set(n.tagName, [...(idsByName.get(n.tagName) ?? []), id]);
    return {
      id,
      unitId: `category:${n.categoryPath || '미분류'}`,
      name: n.tagName,
      description: '',
      prerequisites: [] as string[],
      metadata: { category: n.categoryPath || '미분류', assessmentStatus: n.status, grade: gradeLabel(n.grade) },
    };
  });
  const byId = new Map(concepts.map(c => [c.id, c]));
  for (const edge of topology.edges) {
    const legacySourceIds = idsByName.get(edge.source) ?? [];
    const legacyTargetIds = idsByName.get(edge.target) ?? [];
    const sourceId = edge.sourceTagId ?? (legacySourceIds.length === 1 ? legacySourceIds[0] : null);
    const targetId = edge.targetTagId ?? (legacyTargetIds.length === 1 ? legacyTargetIds[0] : null);
    const source = sourceId ? byId.get(String(sourceId)) : undefined;
    const target = targetId ? byId.get(String(targetId)) : undefined;
    if (!source || !target) {
      warnings.push(`노드를 찾을 수 없는 관계: ${edge.source} → ${edge.target}`);
      continue;
    }
    if (!target.prerequisites.includes(source.id)) target.prerequisites.push(source.id);
  }
  return { warnings, data: {
    id: 'live-topology-v1', subject,
    units: categories.map(category => ({ id: `category:${category}`, subjectId: subject.id, name: category, prerequisites: [] })),
    concepts,
    // The recommendation engine uses its existing three-state model, while the
    // exact four-state server value remains on metadata for labels and colours.
    initialProgress: Object.fromEntries(topology.nodes.map(node => [String(node.id),
      node.status === 'MASTERED' ? 'known' : node.status === 'WEAK' ? 'unknown' : 'unset',
    ])),
  } };
}
