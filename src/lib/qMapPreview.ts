export type QMapProblemStatus = 'diagnostic-wrong' | 'solved' | 'today';
export type QMapConnectionKind = 'repair' | 'deepen' | 'combine';

export interface QMapProblem {
  id: string;
  code: string;
  title: string;
  prompt: string;
  level: 'AN' | 'BN';
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  status: QMapProblemStatus;
  todayOrder?: number;
  x: number;
  y: number;
}

export interface QMapConnection {
  from: string;
  to: string;
  kind: QMapConnectionKind;
  label: string;
  sharedTags: string[];
}

/** 화면 검토용 고정 사례. 추천·채점 결과나 실제 학생 기록이 아니다. */
export const qMapPreviewProblems: QMapProblem[] = [
  { id: 'bn-start', code: 'Q01', title: '복합 진단 문제', prompt: '도수분포표를 보고 자료가 가장 많이 모인 계급을 고른 뒤, 최빈값과의 관계를 설명해 보세요.', level: 'BN', difficulty: 3, tags: ['도수분포표', '최빈값'], status: 'diagnostic-wrong', x: 95, y: 340 },
  { id: 'an-table', code: 'Q02', title: '도수 읽기', prompt: '도수분포표에서 20 이상 30 미만 계급의 도수를 찾으세요.', level: 'AN', difficulty: 1, tags: ['도수분포표'], status: 'solved', x: 285, y: 125 },
  { id: 'an-mode', code: 'Q03', title: '최빈값 찾기', prompt: '자료 2, 3, 3, 4, 4, 4의 최빈값을 구하세요.', level: 'AN', difficulty: 1, tags: ['최빈값'], status: 'solved', x: 285, y: 300 },
  { id: 'an-histogram', code: 'Q04', title: '히스토그램 읽기', prompt: '히스토그램에서 막대의 높이가 나타내는 정보를 읽으세요.', level: 'AN', difficulty: 2, tags: ['히스토그램'], status: 'solved', x: 285, y: 475 },
  { id: 'an-polygon', code: 'Q05', title: '도수분포다각형', prompt: '도수분포다각형의 점은 각 계급의 어떤 값과 도수를 사용해 표시할까요?', level: 'AN', difficulty: 2, tags: ['도수분포다각형'], status: 'solved', x: 285, y: 650 },
  { id: 'today-table', code: 'Q06', title: '구간을 비교하기', prompt: '전체 도수는 같지만 계급 구간이 다른 두 도수분포표를 비교하고 해석하세요.', level: 'AN', difficulty: 4, tags: ['도수분포표'], status: 'today', todayOrder: 1, x: 505, y: 100 },
  { id: 'today-mode', code: 'Q07', title: '최빈값이 여러 개라면?', prompt: '자료의 최빈값이 두 개인 경우를 판별하고 그 이유를 설명하세요.', level: 'AN', difficulty: 4, tags: ['최빈값'], status: 'today', todayOrder: 2, x: 505, y: 285 },
  { id: 'today-combine', code: 'Q08', title: '표와 그래프 연결', prompt: '도수분포표와 히스토그램을 함께 보고 두 표현이 같은 자료를 나타내는지 판단하세요.', level: 'BN', difficulty: 3, tags: ['도수분포표', '히스토그램'], status: 'today', todayOrder: 3, x: 505, y: 485 },
  { id: 'today-histogram', code: 'Q09', title: '막대의 의미 해석', prompt: '계급의 크기가 서로 다른 히스토그램에서 각 계급의 도수를 비교하세요.', level: 'AN', difficulty: 4, tags: ['히스토그램'], status: 'today', todayOrder: 4, x: 765, y: 365 },
  { id: 'today-visualize', code: 'Q10', title: '두 그래프로 비교하기', prompt: '히스토그램과 도수분포다각형을 이용해 두 집단의 분포를 비교하세요.', level: 'BN', difficulty: 4, tags: ['히스토그램', '도수분포다각형'], status: 'today', todayOrder: 5, x: 765, y: 600 },
];

export const qMapPreviewConnections: QMapConnection[] = [
  { from: 'bn-start', to: 'an-table', kind: 'repair', label: '도수분포표를 단독으로 확인', sharedTags: ['도수분포표'] },
  { from: 'bn-start', to: 'an-mode', kind: 'repair', label: '최빈값을 단독으로 확인', sharedTags: ['최빈값'] },
  { from: 'an-table', to: 'today-table', kind: 'deepen', label: '도수분포표 심화', sharedTags: ['도수분포표'] },
  { from: 'an-mode', to: 'today-mode', kind: 'deepen', label: '최빈값 심화', sharedTags: ['최빈값'] },
  { from: 'an-table', to: 'today-combine', kind: 'combine', label: '도수분포표를 함께 적용', sharedTags: ['도수분포표'] },
  { from: 'an-histogram', to: 'today-combine', kind: 'combine', label: '히스토그램을 함께 적용', sharedTags: ['히스토그램'] },
  { from: 'an-histogram', to: 'today-histogram', kind: 'deepen', label: '히스토그램 심화', sharedTags: ['히스토그램'] },
  { from: 'an-histogram', to: 'today-visualize', kind: 'combine', label: '히스토그램을 함께 적용', sharedTags: ['히스토그램'] },
  { from: 'an-polygon', to: 'today-visualize', kind: 'combine', label: '도수분포다각형을 함께 적용', sharedTags: ['도수분포다각형'] },
  { from: 'today-histogram', to: 'today-visualize', kind: 'combine', label: '읽은 그래프를 비교 문제에 적용', sharedTags: ['히스토그램'] },
];

export function qMapProblemById(id: string): QMapProblem | undefined {
  return qMapPreviewProblems.find(problem => problem.id === id);
}

export function qMapConnectionsFor(id: string): QMapConnection[] {
  return qMapPreviewConnections.filter(connection => connection.from === id || connection.to === id);
}

export function qMapTodayProblems(): QMapProblem[] {
  return qMapPreviewProblems.filter(problem => problem.todayOrder != null)
    .sort((a, b) => (a.todayOrder ?? 0) - (b.todayOrder ?? 0));
}
