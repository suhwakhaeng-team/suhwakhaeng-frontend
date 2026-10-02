export type NodeStatus = 'idle' | 'passed' | 'failed' | 'pruned';

export type MapNode = {
  id: string;
  label: string;
  domain: string;
  stage: number;
  y: number;
};

export type MapEdge = [from: string, to: string];

export type TransitionState = {
  kind: 'pass' | 'prune';
  nodeIds: string[];
  rootIds: string[];
  nextId?: string;
};

export const STAGE_LABELS = ['기초', '기본', '핵심', '연결', '적용', '종합'];
export const X_BY_STAGE = [54, 264, 474, 684, 894, 1104];
export const NODE_WIDTH = 174;
export const NODE_CENTER_Y = 38;
export const NODE_RADIUS = 16;

export const DOMAINS = [
  { name: '경우의 수 · 순열과 조합', y: 52, height: 286, tone: 'blue' },
  { name: '확률', y: 354, height: 286, tone: 'purple' },
  { name: '확률분포 · 정규분포', y: 656, height: 366, tone: 'green' },
  { name: '자료 정리 · 통계적 추정', y: 1038, height: 472, tone: 'orange' },
] as const;

export const NODES: MapNode[] = [
  { id: 'sum-rule', label: '합의 법칙', domain: DOMAINS[0].name, stage: 0, y: 108 },
  { id: 'product-rule', label: '곱의 법칙', domain: DOMAINS[0].name, stage: 0, y: 178 },
  { id: 'factorial', label: '팩토리얼', domain: DOMAINS[0].name, stage: 1, y: 178 },
  { id: 'permutation', label: '순열', domain: DOMAINS[0].name, stage: 2, y: 178 },
  { id: 'combination', label: '조합', domain: DOMAINS[0].name, stage: 3, y: 108 },
  { id: 'circular', label: '원순열', domain: DOMAINS[0].name, stage: 3, y: 178 },
  { id: 'repeated-permutation', label: '중복순열', domain: DOMAINS[0].name, stage: 3, y: 248 },
  { id: 'repeated-combination', label: '중복조합', domain: DOMAINS[0].name, stage: 4, y: 108 },
  { id: 'binomial-theorem', label: '이항정리', domain: DOMAINS[0].name, stage: 4, y: 178 },
  { id: 'same-permutation', label: '같은 것이 있는 순열', domain: DOMAINS[0].name, stage: 4, y: 248 },
  { id: 'combination-use', label: '중복조합의 활용', domain: DOMAINS[0].name, stage: 5, y: 108 },
  { id: 'binomial-coeff', label: '이항계수의 활용', domain: DOMAINS[0].name, stage: 5, y: 178 },

  { id: 'sample-space', label: '표본공간과 사건', domain: DOMAINS[1].name, stage: 0, y: 458 },
  { id: 'math-probability', label: '수학적 확률', domain: DOMAINS[1].name, stage: 1, y: 458 },
  { id: 'complement', label: '여사건', domain: DOMAINS[1].name, stage: 2, y: 410 },
  { id: 'disjoint', label: '배반사건', domain: DOMAINS[1].name, stage: 2, y: 506 },
  { id: 'addition', label: '확률의 덧셈 정리', domain: DOMAINS[1].name, stage: 3, y: 410 },
  { id: 'multiplication', label: '확률의 곱셈정리', domain: DOMAINS[1].name, stage: 3, y: 506 },
  { id: 'conditional', label: '조건부확률', domain: DOMAINS[1].name, stage: 4, y: 410 },
  { id: 'independence', label: '사건의 독립', domain: DOMAINS[1].name, stage: 4, y: 506 },
  { id: 'independent-trials', label: '독립시행의 확률', domain: DOMAINS[1].name, stage: 5, y: 458 },

  { id: 'random-variable', label: '확률변수', domain: DOMAINS[2].name, stage: 0, y: 800 },
  { id: 'discrete', label: '이산확률변수', domain: DOMAINS[2].name, stage: 1, y: 720 },
  { id: 'continuous', label: '연속확률변수', domain: DOMAINS[2].name, stage: 1, y: 896 },
  { id: 'pmf', label: '확률질량함수', domain: DOMAINS[2].name, stage: 2, y: 704 },
  { id: 'expected', label: '기댓값', domain: DOMAINS[2].name, stage: 2, y: 784 },
  { id: 'pdf', label: '확률밀도함수', domain: DOMAINS[2].name, stage: 2, y: 896 },
  { id: 'binomial', label: '이항분포', domain: DOMAINS[2].name, stage: 3, y: 704 },
  { id: 'variance', label: '분산', domain: DOMAINS[2].name, stage: 3, y: 784 },
  { id: 'normal', label: '정규분포', domain: DOMAINS[2].name, stage: 3, y: 896 },
  { id: 'stddev', label: '표준편차', domain: DOMAINS[2].name, stage: 4, y: 784 },
  { id: 'standard-normal', label: '표준정규분포', domain: DOMAINS[2].name, stage: 4, y: 856 },
  { id: 'standardization', label: '표준화', domain: DOMAINS[2].name, stage: 4, y: 928 },
  { id: 'normal-approx', label: '이항분포의 정규근사', domain: DOMAINS[2].name, stage: 5, y: 896 },

  { id: 'frequency-table', label: '도수분포표', domain: DOMAINS[3].name, stage: 0, y: 1216 },
  { id: 'population', label: '모집단', domain: DOMAINS[3].name, stage: 0, y: 1418 },
  { id: 'histogram', label: '히스토그램', domain: DOMAINS[3].name, stage: 1, y: 1080 },
  { id: 'frequency-polygon', label: '도수분포다각형', domain: DOMAINS[3].name, stage: 1, y: 1148 },
  { id: 'average', label: '평균', domain: DOMAINS[3].name, stage: 1, y: 1216 },
  { id: 'median', label: '중앙값', domain: DOMAINS[3].name, stage: 1, y: 1284 },
  { id: 'mode', label: '최빈값', domain: DOMAINS[3].name, stage: 1, y: 1352 },
  { id: 'sample-survey', label: '표본조사', domain: DOMAINS[3].name, stage: 1, y: 1418 },
  { id: 'spread', label: '산포도', domain: DOMAINS[3].name, stage: 2, y: 1216 },
  { id: 'random-sampling', label: '임의추출', domain: DOMAINS[3].name, stage: 2, y: 1418 },
  { id: 'scatter', label: '산점도', domain: DOMAINS[3].name, stage: 3, y: 1216 },
  { id: 'sample-mean', label: '표본평균', domain: DOMAINS[3].name, stage: 3, y: 1384 },
  { id: 'sample-ratio', label: '표본비율', domain: DOMAINS[3].name, stage: 3, y: 1452 },
  { id: 'correlation', label: '상관관계', domain: DOMAINS[3].name, stage: 4, y: 1216 },
  { id: 'confidence', label: '신뢰구간', domain: DOMAINS[3].name, stage: 4, y: 1418 },
];

export const EDGES: MapEdge[] = [
  ['sum-rule', 'product-rule'], ['product-rule', 'factorial'], ['factorial', 'permutation'],
  ['permutation', 'combination'], ['permutation', 'circular'], ['permutation', 'repeated-permutation'],
  ['combination', 'repeated-combination'], ['combination', 'binomial-theorem'],
  ['repeated-permutation', 'same-permutation'], ['repeated-combination', 'combination-use'],
  ['binomial-theorem', 'binomial-coeff'],
  ['sample-space', 'math-probability'], ['math-probability', 'complement'], ['math-probability', 'disjoint'],
  ['math-probability', 'multiplication'],
  ['complement', 'addition'], ['disjoint', 'addition'], ['addition', 'conditional'],
  ['multiplication', 'conditional'], ['multiplication', 'independence'],
  ['conditional', 'independent-trials'], ['independence', 'independent-trials'],
  ['random-variable', 'discrete'], ['random-variable', 'continuous'],
  ['discrete', 'pmf'], ['discrete', 'expected'], ['continuous', 'pdf'],
  ['expected', 'variance'], ['variance', 'stddev'], ['pmf', 'binomial'],
  ['pdf', 'normal'], ['binomial', 'normal'], ['normal', 'standard-normal'], ['normal', 'standardization'],
  ['standardization', 'normal-approx'], ['binomial', 'normal-approx'],
  ['frequency-table', 'histogram'], ['frequency-table', 'frequency-polygon'],
  ['frequency-table', 'average'], ['frequency-table', 'median'], ['frequency-table', 'mode'],
  ['average', 'spread'], ['spread', 'scatter'], ['scatter', 'correlation'],
  ['population', 'sample-survey'], ['sample-survey', 'random-sampling'],
  ['random-sampling', 'sample-mean'], ['random-sampling', 'sample-ratio'],
  ['sample-mean', 'confidence'], ['sample-ratio', 'confidence'],
];

// 새 레벨테스트의 우선순위. 선수개념을 모두 통과한 노드만 실제 다음 문항 후보가 된다.
// 첫 시작은 기획 의도대로 반드시 합의 법칙 → 곱의 법칙이다.
export const CONCEPT_TEST_ORDER = [
  // 경우의 수 · 순열과 조합을 먼저 끝낸다.
  'sum-rule', 'product-rule', 'factorial', 'permutation', 'combination',
  'circular', 'repeated-permutation', 'repeated-combination', 'binomial-theorem',
  'same-permutation', 'combination-use', 'binomial-coeff',
  // 그다음 확률 영역으로 이동한다.
  'sample-space', 'math-probability', 'complement', 'disjoint', 'addition',
  'multiplication', 'conditional', 'independence', 'independent-trials',
  // 확률분포와 통계는 앞 영역을 모두 확인한 뒤 진행한다.
  'random-variable', 'discrete', 'continuous', 'pmf', 'expected', 'pdf',
  'binomial', 'variance', 'normal', 'stddev', 'standard-normal', 'standardization', 'normal-approx',
  'frequency-table', 'histogram', 'frequency-polygon', 'average', 'median', 'mode',
  'spread', 'scatter', 'correlation', 'population', 'sample-survey', 'random-sampling',
  'sample-mean', 'sample-ratio', 'confidence',
];

export const NODE_BY_ID = new Map(NODES.map(node => [node.id, node]));
export const ADDITION_GATE_EDGES = new Set(['complement-addition', 'disjoint-addition']);

export function edgePath(from: MapNode, to: MapNode) {
  if (from.stage === to.stage) {
    const centerX = X_BY_STAGE[from.stage] + NODE_WIDTH / 2;
    const startY = from.y + NODE_CENTER_Y + NODE_RADIUS;
    const endY = to.y + NODE_CENTER_Y - NODE_RADIUS;
    const middleY = startY + (endY - startY) / 2;
    return `M ${centerX} ${startY} C ${centerX} ${middleY}, ${centerX} ${middleY}, ${centerX} ${endY}`;
  }
  const startX = X_BY_STAGE[from.stage] + NODE_WIDTH / 2 + NODE_RADIUS;
  const startY = from.y + NODE_CENTER_Y;
  const endX = X_BY_STAGE[to.stage] + NODE_WIDTH / 2 - NODE_RADIUS;
  const endY = to.y + NODE_CENTER_Y;
  const middle = startX + (endX - startX) / 2;
  return `M ${startX} ${startY} C ${middle} ${startY}, ${middle} ${endY}, ${endX} ${endY}`;
}

export function descendantDepths(ids: string[]) {
  const depths = new Map<string, number>();
  const queue = ids.map(id => ({ id, depth: 0 }));
  while (queue.length) {
    const current = queue.shift()!;
    EDGES.forEach(([from, to]) => {
      if (from !== current.id) return;
      const nextDepth = current.depth + 1;
      if ((depths.get(to) ?? Number.POSITIVE_INFINITY) <= nextDepth) return;
      depths.set(to, nextDepth);
      queue.push({ id: to, depth: nextDepth });
    });
  }
  return depths;
}


export function nextAvailableConcept(statuses: Record<string, NodeStatus>) {
  return CONCEPT_TEST_ORDER.find(id => {
    if (statuses[id]) return false;
    const prerequisites = EDGES.filter(([, to]) => to === id).map(([from]) => from);
    return prerequisites.every(prerequisite => statuses[prerequisite] === 'passed');
  });
}
