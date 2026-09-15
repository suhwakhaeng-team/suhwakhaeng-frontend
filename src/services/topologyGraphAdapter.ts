import type { TopologyResponse } from '../types/topology';
import type { LearningGraphData } from '../types/learningGraph';

interface CourseUnitDefinition {
  id: string;
  name: string;
  prerequisites: readonly string[];
  concepts: readonly string[];
}

const COURSE_UNITS: readonly CourseUnitDefinition[] = [
  { id: 'course:data-basics', name: '자료의 정리', prerequisites: [] as string[], concepts: ['평균', '최빈값', '도수분포표', '히스토그램', '도수분포다각형', '산점도'] },
  { id: 'course:counting', name: '경우의 수', prerequisites: [] as string[], concepts: ['합의 법칙', '곱의 법칙', '팩토리얼'] },
  { id: 'course:permutation', name: '순열과 조합', prerequisites: ['course:counting'], concepts: ['순열', '조합', '중복조합', '중복조합의 활용', '이항정리', '이항계수의 활용'] },
  { id: 'course:probability', name: '확률의 기초', prerequisites: ['course:permutation'], concepts: ['표본공간과 사건', '수학적 확률', '배반사건', '확률의 덧셈 정리'] },
  { id: 'course:conditional', name: '조건부확률', prerequisites: ['course:probability'], concepts: ['확률의 곱셈정리', '사건의 독립', '독립사건', '독립시행의 확률'] },
  { id: 'course:distribution', name: '확률분포', prerequisites: ['course:conditional'], concepts: ['이산확률변수', '확률분포', '확률질량함수', '기댓값', '이항분포'] },
  { id: 'course:normal', name: '정규분포', prerequisites: ['course:distribution'], concepts: ['연속확률변수', '확률밀도함수', '정규분포', '표준정규분포', '표준화', '이항분포의 정규근사'] },
  { id: 'course:inference', name: '통계적 추정', prerequisites: ['course:data-basics', 'course:normal'], concepts: ['모집단', '표본조사', '임의추출', '표본평균', '표본비율', '신뢰구간'] },
] as const;

const courseUnitByConcept = new Map(COURSE_UNITS.flatMap(unit => unit.concepts.map(name => [name, unit] as const)));

function gradeLabel(value: number | string | null | undefined) {
  if (typeof value === 'number' && value >= 1 && value <= 6) return value <= 3 ? `중${value}` : `고${value - 3}`;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function adaptTopology(topology: TopologyResponse): { data: LearningGraphData; warnings: string[] } {
  const idsByName = new Map<string, string[]>();
  const warnings: string[] = [];
  const subject = { id: 'my-curriculum', name: '내 커리큘럼', description: '현재 커리큘럼의 개념 관계와 학습 상태입니다.' };
  const concepts = topology.nodes.map(n => {
    const id = String(n.id);
    const courseUnit = courseUnitByConcept.get(n.tagName);
    idsByName.set(n.tagName, [...(idsByName.get(n.tagName) ?? []), id]);
    return {
      id,
      unitId: courseUnit?.id ?? `category:${n.categoryPath || '미분류'}`,
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
  const usedUnitIds = new Set(concepts.map(concept => concept.unitId));
  const canonicalUnits = COURSE_UNITS.filter(unit => usedUnitIds.has(unit.id)).map(unit => ({
    id: unit.id,
    subjectId: subject.id,
    name: unit.name,
    prerequisites: unit.prerequisites.filter(id => usedUnitIds.has(id)),
  }));
  const canonicalUnitIds = new Set(canonicalUnits.map(unit => unit.id));
  const fallbackCategories = [...new Set(topology.nodes
    .filter(node => !courseUnitByConcept.has(node.tagName))
    .map(node => node.categoryPath || '미분류'))];
  return { warnings, data: {
    id: 'live-topology-v1', subject,
    units: [
      ...canonicalUnits,
      ...fallbackCategories
        .map(category => ({ id: `category:${category}`, subjectId: subject.id, name: category, prerequisites: [] as string[] }))
        .filter(unit => !canonicalUnitIds.has(unit.id)),
    ],
    concepts,
    // The recommendation engine uses its existing three-state model, while the
    // exact four-state server value remains on metadata for labels and colours.
    initialProgress: Object.fromEntries(topology.nodes.map(node => [String(node.id),
      node.status === 'MASTERED' ? 'known' : node.status === 'WEAK' ? 'unknown' : 'unset',
    ])),
  } };
}
