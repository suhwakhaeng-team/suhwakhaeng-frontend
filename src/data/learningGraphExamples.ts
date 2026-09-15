import type { Concept, ConceptStatus, LearningGraphData, Unit } from '../types/learningGraph';

type UnitRow = [id: string, name: string, description: string, prerequisites: string[]];
type ConceptRow = [id: string, unitId: string, name: string, description: string, prerequisites: string[], status?: ConceptStatus];

// Earliest formal introduction used by this demo. Production data should
// supply its own grade per topology node instead of inheriting this fixture.
const probabilityGrade: Record<string, string> = {
  sum: '중2', product: '중2', 'sample-space': '중2', classical: '중2', complement: '중2',
  factorial: '고1', permutations: '고1', combinations: '고1',
  'repeat-permutation': '고2', 'repeat-combination': '고2', 'binomial-theorem': '고2',
  addition: '고2', 'conditional-prob': '고2', multiplication: '고2', independence: '고2',
  'independent-trials': '고2', 'random-variable': '고2', discrete: '고2', expectation: '고2',
  variance: '고2', binomial: '고2', density: '고2', 'normal-dist': '고2', standardization: '고2',
  'normal-approx': '고2', sampling: '고2', 'sample-mean': '고2', 'sample-proportion': '고2', confidence: '고2',
};

function example(id: string, name: string, description: string, units: UnitRow[], concepts: ConceptRow[]): LearningGraphData {
  return {
    id, subject: { id, name, description },
    units: units.map(([key, title, detail, prerequisites]): Unit => ({ id: key, subjectId: id, name: title, description: detail, prerequisites })),
    concepts: concepts.map(([key, unitId, title, detail, prerequisites]): Concept => ({
      id: key,
      unitId,
      name: title,
      description: detail,
      prerequisites,
      metadata: { grade: id === 'demo-probability-v1' ? probabilityGrade[key] ?? null : '공통' },
    })),
    initialProgress: Object.fromEntries(concepts.map(([key, , , , , status]) => [key, status ?? 'unset'])),
  };
}

// Demonstration content only. Relationships and subject vocabulary never live in the renderer.
export const probabilityExample = example('demo-probability-v1', '확률과 통계', '작은 개념들이 연결되어, 더 큰 이해가 되는 순간.', [
  ['counting', '경우의 수', '가능한 결과를 빠짐없이 세는 방법', []],
  ['permutation', '순열과 조합', '순서가 있는 선택과 없는 선택', ['counting']],
  ['probability', '확률의 기초', '사건의 가능성을 수로 표현하기', ['permutation']],
  ['conditional', '조건부확률', '새로운 정보가 확률을 바꾸는 방식', ['probability']],
  ['distribution', '확률분포', '확률변수의 값과 가능성의 구조', ['conditional']],
  ['normal', '정규분포', '연속적인 자료의 분포 이해하기', ['distribution']],
  ['inference', '통계적 추정', '표본으로 모집단에 대해 추론하기', ['distribution', 'normal']],
], [
  ['sum', 'counting', '합의 법칙', '동시에 일어나지 않는 경우들의 수를 더해 전체 경우의 수를 구합니다.', [], 'known'],
  ['product', 'counting', '곱의 법칙', '연속되는 선택의 경우의 수를 곱해 전체 경우의 수를 구합니다.', [], 'known'],
  ['factorial', 'counting', '팩토리얼', '1부터 자연수 n까지의 곱을 n!로 나타냅니다.', ['product'], 'known'],
  ['permutations', 'permutation', '순열', '서로 다른 대상에서 순서를 고려하여 일부를 선택합니다.', ['factorial'], 'known'],
  ['combinations', 'permutation', '조합', '서로 다른 대상에서 순서 없이 일부를 선택합니다.', ['permutations'], 'known'],
  ['repeat-permutation', 'permutation', '중복순열', '같은 대상을 반복해서 선택할 수 있는 순열입니다.', ['product'], 'known'],
  ['repeat-combination', 'permutation', '중복조합', '같은 대상을 여러 번 선택할 수 있는 조합입니다.', ['combinations'], 'unknown'],
  ['binomial-theorem', 'permutation', '이항정리', '두 항의 거듭제곱을 조합을 이용해 전개합니다.', ['combinations']],
  ['sample-space', 'probability', '표본공간과 사건', '가능한 모든 결과의 집합과 관심 있는 결과의 집합을 구분합니다.', ['sum'], 'known'],
  ['classical', 'probability', '수학적 확률', '각 결과가 같은 가능성을 가질 때 사건의 확률을 경우의 수의 비로 구합니다.', ['sample-space', 'combinations'], 'known'],
  ['complement', 'probability', '여사건', '사건이 일어나지 않을 확률은 1에서 그 사건의 확률을 뺀 값입니다.', ['classical'], 'known'],
  ['addition', 'probability', '확률의 덧셈정리', '두 사건의 합사건 확률은 각 확률의 합에서 교사건 확률을 뺀 값입니다.', ['classical']],
  ['conditional-prob', 'conditional', '조건부확률', '어떤 사건이 일어났다는 조건 아래에서 다른 사건의 확률을 구합니다.', ['classical', 'addition'], 'unknown'],
  ['multiplication', 'conditional', '확률의 곱셈정리', '교사건의 확률을 한 사건의 확률과 조건부확률의 곱으로 구합니다.', ['conditional-prob']],
  ['independence', 'conditional', '사건의 독립', '한 사건의 발생 여부가 다른 사건의 확률에 영향을 주지 않는 관계입니다.', ['conditional-prob'], 'unknown'],
  ['independent-trials', 'conditional', '독립시행', '앞선 시행의 결과가 다음 시행에 영향을 주지 않는 반복 시행입니다.', ['independence']],
  ['random-variable', 'distribution', '확률변수', '실험의 각 결과에 수를 대응시키는 변수입니다.', ['sample-space'], 'known'],
  ['discrete', 'distribution', '이산확률분포', '이산확률변수가 취하는 값과 각 값의 확률을 연결합니다.', ['random-variable', 'classical'], 'known'],
  ['expectation', 'distribution', '기댓값', '확률변수의 각 값에 그 확률을 곱한 것의 합입니다.', ['discrete']],
  ['variance', 'distribution', '분산과 표준편차', '확률변수가 평균에서 얼마나 퍼져 있는지를 나타냅니다.', ['expectation']],
  ['binomial', 'distribution', '이항분포', '성공 확률이 일정한 독립시행을 반복했을 때 성공 횟수의 분포입니다.', ['independent-trials', 'combinations', 'discrete'], 'unknown'],
  ['density', 'normal', '확률밀도함수', '연속확률변수의 구간 확률을 곡선 아래 넓이로 표현합니다.', ['random-variable']],
  ['normal-dist', 'normal', '정규분포', '평균을 중심으로 대칭이고 평균과 분산으로 결정되는 연속확률분포입니다.', ['density', 'variance']],
  ['standardization', 'normal', '표준화', '변수에서 평균을 빼고 표준편차로 나누어 공통 척도로 바꿉니다.', ['normal-dist']],
  ['normal-approx', 'normal', '이항분포의 정규근사', '시행 횟수가 충분하고 조건이 맞을 때 이항분포를 정규분포로 근사합니다.', ['binomial', 'standardization']],
  ['sampling', 'inference', '모집단과 표본', '조사 대상 전체와 그중 실제로 관측한 일부를 구분합니다.', ['sample-space'], 'known'],
  ['sample-mean', 'inference', '표본평균', '표본에서 얻은 관측값의 평균으로 모평균을 추정합니다.', ['sampling', 'expectation']],
  ['sample-proportion', 'inference', '표본비율', '표본에서 특정 속성을 가진 대상의 비율입니다.', ['sampling', 'binomial']],
  ['confidence', 'inference', '신뢰구간', '표본 정보를 이용해 정해진 신뢰수준에 따른 모수의 추정 구간을 만듭니다.', ['sample-mean', 'standardization']],
]);

export const algorithmsExample = example('demo-algorithms-v1', '자료구조와 알고리즘', '기초 자료구조부터 최단경로까지, 이해의 연결을 따라가세요.', [
  ['basics', '프로그래밍 기초', '값을 저장하고 계산하는 기본 단위', []],
  ['linear', '선형 자료구조', '순서대로 연결되는 데이터', ['basics']],
  ['trees', '트리', '계층적인 관계를 가진 데이터', ['linear']],
  ['queues', '우선순위 큐', '가장 우선하는 값을 효율적으로 찾기', ['trees']],
  ['graphs', '그래프', '대상 사이의 관계를 표현하기', ['linear']],
  ['traversal', '그래프 탐색', '연결된 대상들을 방문하는 방법', ['graphs']],
  ['shortest', '최단경로', '가중치를 고려한 최적 경로 찾기', ['queues', 'traversal']],
], [
  ['variable', 'basics', '변수', '값에 이름을 붙여 저장합니다.', [], 'known'],
  ['loop', 'basics', '반복문', '조건에 따라 같은 작업을 반복합니다.', ['variable'], 'known'],
  ['function', 'basics', '함수', '입력과 출력을 갖는 재사용 가능한 작업 단위입니다.', ['variable'], 'known'],
  ['recursion', 'basics', '재귀', '종료 조건을 두고 함수가 자기 자신을 호출합니다.', ['function'], 'known'],
  ['array', 'linear', '배열', '인덱스로 접근할 수 있도록 원소를 순서대로 저장합니다.', ['variable'], 'known'],
  ['linked-list', 'linear', '연결 리스트', '다음 원소를 가리키는 연결로 데이터를 저장합니다.', ['variable']],
  ['stack', 'linear', '스택', '나중에 들어온 원소를 먼저 꺼냅니다.', ['array'], 'known'],
  ['queue', 'linear', '큐', '먼저 들어온 원소를 먼저 꺼냅니다.', ['array'], 'known'],
  ['tree', 'trees', '트리 구조', '사이클 없이 모든 정점이 연결된 계층적 구조입니다.', ['linked-list'], 'known'],
  ['binary-tree', 'trees', '이진 트리', '각 노드가 최대 두 개의 자식 노드를 가집니다.', ['tree'], 'known'],
  ['bst', 'trees', '이진 탐색 트리', '각 노드의 왼쪽과 오른쪽 서브트리를 값의 순서에 따라 구성합니다.', ['binary-tree']],
  ['heap', 'queues', '힙', '완전 이진 트리 형태와 부모·자식 사이의 우선순위 조건을 만족합니다.', ['binary-tree'], 'unknown'],
  ['heapify', 'queues', '힙 복구', '원소를 이동해 힙의 우선순위 조건을 다시 만족시킵니다.', ['heap']],
  ['priority-queue', 'queues', '우선순위 큐', '가장 우선순위가 높은 원소를 먼저 반환하는 자료구조입니다.', ['heap'], 'unknown'],
  ['graph', 'graphs', '정점과 간선', '대상은 정점, 대상 사이의 연결은 간선으로 표현합니다.', ['array'], 'known'],
  ['adjacency', 'graphs', '인접 리스트', '각 정점에 연결된 이웃을 리스트로 저장합니다.', ['graph', 'linked-list']],
  ['weight', 'graphs', '간선 가중치', '연결의 비용이나 거리를 간선에 부여합니다.', ['graph'], 'known'],
  ['weighted-graph', 'graphs', '가중 그래프', '각 간선이 비용이나 거리 같은 가중치를 가진 그래프입니다.', ['graph', 'weight'], 'known'],
  ['dfs', 'traversal', '깊이 우선 탐색', '갈 수 있는 방향으로 깊이 들어간 뒤 되돌아와 탐색합니다.', ['graph', 'stack', 'recursion']],
  ['bfs', 'traversal', '너비 우선 탐색', '시작점과 가까운 정점부터 큐를 이용해 탐색합니다.', ['graph', 'queue'], 'known'],
  ['visited', 'traversal', '방문 상태 관리', '이미 방문한 정점을 기록하여 중복 탐색과 무한 반복을 막습니다.', ['graph'], 'known'],
  ['relaxation', 'shortest', '간선 완화', '새 경로의 비용이 더 작으면 현재 최단거리 추정치를 갱신합니다.', ['weighted-graph']],
  ['dijkstra', 'shortest', '다익스트라', '음수 가중치가 없는 그래프에서 한 시작점으로부터 최단거리를 구합니다. 여기서는 우선순위 큐를 사용하는 구현을 다룹니다.', ['weighted-graph', 'priority-queue'], 'unknown'],
  ['path-reconstruction', 'shortest', '경로 복원', '이전 정점을 저장한 정보를 따라 실제 최단경로를 구성합니다.', ['dijkstra']],
]);

export const learningGraphExamples = [probabilityExample, algorithmsExample];
