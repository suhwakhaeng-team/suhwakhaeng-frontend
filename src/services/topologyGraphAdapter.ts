import type { TopologyResponse } from '../types/topology';
import type { LearningGraphData } from '../types/learningGraph';

/** The legacy API uses names for edges. Ambiguous names are skipped, not silently joined. */
export function adaptTopology(topology: TopologyResponse): { data: LearningGraphData; warnings: string[] } {
  const names = new Map<string, string[]>();
  const categories = [...new Set(topology.nodes.map(n => n.categoryPath || '미분류'))];
  const warnings: string[] = [];
  const subject = { id: 'my-curriculum', name: '내 커리큘럼', description: '서버에서 조회한 개념 관계 · 학습 상태 변경은 이 브라우저에만 저장됩니다.' };
  const concepts = topology.nodes.map(n => {
    const id = String(n.id);
    names.set(n.tagName, [...(names.get(n.tagName) ?? []), id]);
    return { id, unitId: `category:${n.categoryPath || '미분류'}`, name: n.tagName, description: '현재 서버 데이터에는 이 개념의 상세 설명이 포함되어 있지 않습니다.', prerequisites: [] as string[] };
  });
  const byId = new Map(concepts.map(c => [c.id, c]));
  for (const edge of topology.edges) {
    const sources = names.get(edge.source), targets = names.get(edge.target);
    if (sources?.length !== 1 || targets?.length !== 1) {
      warnings.push(`이름을 유일하게 확인할 수 없는 관계: ${edge.source} → ${edge.target}`);
      continue;
    }
    const target = byId.get(targets[0])!;
    if (!target.prerequisites.includes(sources[0])) target.prerequisites.push(sources[0]);
  }
  return { warnings, data: {
    id: 'live-topology-v1', subject,
    units: categories.map(category => ({ id: `category:${category}`, subjectId: subject.id, name: category, prerequisites: [] })),
    concepts,
    // Do not reinterpret assessed mastery as self-reported knowledge. Users explicitly mark states.
  } };
}
