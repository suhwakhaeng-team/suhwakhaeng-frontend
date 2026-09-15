import type { AnswerItem, LearningRouteResponse } from '../types/learning';

export type DiagnosticStatus = 'stable' | 'unstable' | 'needs-review' | 'not-diagnosed';
export type DiagnosticArea = '경우의 수' | '확률' | '통계';

interface ConceptDefinition {
  question: number;
  sourceTopic: string;
  area: DiagnosticArea;
  label: string;
  findings: Record<Exclude<DiagnosticStatus, 'not-diagnosed'>, string>;
  learningSteps: string[];
  relationshipConcept: boolean;
}

export interface DiagnosticConceptResult {
  area: DiagnosticArea;
  label: string;
  status: DiagnosticStatus;
  score: number | null;
}

export interface DiagnosticLearningPlan {
  area: DiagnosticArea;
  concepts: DiagnosticConceptResult[];
}

export interface DiagnosticReport {
  concepts: DiagnosticConceptResult[];
  counts: Record<DiagnosticStatus, number>;
  learningPlans: DiagnosticLearningPlan[];
}

const CONCEPTS: ConceptDefinition[] = [
  {
    question: 1,
    sourceTopic: '경우의 수 기초',
    area: '경우의 수',
    label: '경우의 수 기초',
    findings: {
      stable: '기본 경우의 수 계산을 안정적으로 수행합니다.',
      unstable: '기본 원리는 알지만 복합 조건에서 경우를 빠뜨릴 수 있습니다.',
      'needs-review': '합의 법칙과 곱의 법칙부터 다시 연결할 필요가 있습니다.',
    },
    learningSteps: ['경우의 수 원리', '조건 나누기'],
    relationshipConcept: false,
  },
  {
    question: 2,
    sourceTopic: '여러 가지 순열 및 여사건 제한형',
    area: '경우의 수',
    label: '여러 가지 순열·여사건',
    findings: {
      stable: '여러 가지 순열과 여사건을 적절히 활용합니다.',
      unstable: '공식은 알지만 제한 조건을 반영할 때 흔들립니다.',
      'needs-review': '순열의 의미와 여사건을 이용한 세기부터 보완해야 합니다.',
    },
    learningSteps: ['순열 점검', '여사건 활용', '제한 조건 문제'],
    relationshipConcept: true,
  },
  {
    question: 3,
    sourceTopic: '기하학적 나열 및 공간 제약형',
    area: '경우의 수',
    label: '원순열·경우의 수',
    findings: {
      stable: '원형 배치와 공간 제약을 구분해 적용합니다.',
      unstable: '배치 기준을 정하는 과정에서 중복 계산 가능성이 있습니다.',
      'needs-review': '원순열의 기준점과 중복 제거 원리부터 학습해야 합니다.',
    },
    learningSteps: ['원순열', '기준점 고정', '공간 제약 문제'],
    relationshipConcept: true,
  },
  {
    question: 4,
    sourceTopic: '중복조합 및 함수의 개수 고난도 킬러형',
    area: '경우의 수',
    label: '중복조합',
    findings: {
      stable: '중복을 허용하는 선택 상황을 정확히 구분합니다.',
      unstable: '순열·조합·중복조합 중 사용할 개념을 가끔 혼동합니다.',
      'needs-review': '조합과 중복조합의 차이부터 다시 정리해야 합니다.',
    },
    learningSteps: ['조합 점검', '중복조합', '유형 구분 연습'],
    relationshipConcept: true,
  },
  {
    question: 5,
    sourceTopic: '이항 구조 전개 및 대수적 확률 연산형',
    area: '확률',
    label: '이항정리',
    findings: {
      stable: '이항계수와 전개 구조를 안정적으로 활용합니다.',
      unstable: '전개식과 확률 상황을 연결할 때 일부 실수가 있습니다.',
      'needs-review': '조합과 이항계수의 관계부터 보완할 필요가 있습니다.',
    },
    learningSteps: ['이항계수', '이항정리', '확률 연산'],
    relationshipConcept: true,
  },
  {
    question: 6,
    sourceTopic: '조건부확률 및 반복 독립시행 융합형',
    area: '확률',
    label: '조건부확률·독립',
    findings: {
      stable: '조건부확률과 독립사건의 관계를 정확히 판단합니다.',
      unstable: '각 공식은 알지만 두 사건의 관계 판단이 불안정합니다.',
      'needs-review': '독립·배반을 구분하고 조건부확률의 의미부터 학습해야 합니다.',
    },
    learningSteps: ['조건부확률', '독립사건', '관계 판단 문제'],
    relationshipConcept: true,
  },
  {
    question: 7,
    sourceTopic: '중등 기술 통계 및 산포도 복합형',
    area: '통계',
    label: '통계량·산포도',
    findings: {
      stable: '평균·분산·표준편차를 안정적으로 해석합니다.',
      unstable: '통계량 계산은 가능하지만 자료의 의미 해석이 흔들립니다.',
      'needs-review': '대푯값과 산포도의 의미부터 다시 정리해야 합니다.',
    },
    learningSteps: ['대푯값', '분산·표준편차', '산포도 해석'],
    relationshipConcept: false,
  },
  {
    question: 8,
    sourceTopic: '이산확률변수 통계량 및 선형 변환형',
    area: '통계',
    label: '확률변수',
    findings: {
      stable: '확률질량함수와 기댓값 계산을 안정적으로 수행합니다.',
      unstable: '확률변수의 변환과 통계량의 관계에서 실수가 있습니다.',
      'needs-review': '확률변수와 확률분포의 의미부터 보완해야 합니다.',
    },
    learningSteps: ['확률변수', '확률분포', '기댓값'],
    relationshipConcept: true,
  },
  {
    question: 9,
    sourceTopic: '연속확률밀도 및 정규분포 표준화 연계형',
    area: '통계',
    label: '정규분포',
    findings: {
      stable: '정규분포와 표준화를 상황에 맞게 적용합니다.',
      unstable: '표준화 공식은 알지만 어떤 값을 표준화할지 해석에서 실수합니다.',
      'needs-review': '정규분포의 구조와 표준화의 의미부터 학습해야 합니다.',
    },
    learningSteps: ['표준편차 점검', '정규분포', '표준화 적용'],
    relationshipConcept: true,
  },
  {
    question: 10,
    sourceTopic: '통계적 표본 추출 및 모평균 신뢰구간 추정형',
    area: '통계',
    label: '표본·신뢰구간',
    findings: {
      stable: '표본과 모집단의 관계 및 신뢰구간을 이해합니다.',
      unstable: '계산 절차는 알지만 추정 결과의 의미 해석이 불안정합니다.',
      'needs-review': '표본평균과 모평균의 관계 및 신뢰구간의 의미를 보완해야 합니다.',
    },
    learningSteps: ['표본과 모집단', '통계적 추정', '신뢰구간'],
    relationshipConcept: true,
  },
];

const PREVIEW_CONCEPTS: Record<string, string[]> = {
  '경우의 수 기초': ['곱의 법칙', '수학적 확률', '조합'],
  '여러 가지 순열 및 여사건 제한형': ['같은 것이 있는 순열', '여사건', '중복순열'],
  '기하학적 나열 및 공간 제약형': ['원순열'],
  '중복조합 및 함수의 개수 고난도 킬러형': ['중복조합', '중복조합의 활용'],
  '이항 구조 전개 및 대수적 확률 연산형': ['이항계수의 활용', '이항분포', '이항정리'],
  '조건부확률 및 반복 독립시행 융합형': ['독립사건', '독립시행', '독립시행의 확률', '사건의 독립', '조건부확률', '확률의 곱셈정리'],
  '중등 기술 통계 및 산포도 복합형': ['분산', '중앙값', '최빈값', '편차', '평균', '표준편차'],
  '이산확률변수 통계량 및 선형 변환형': ['기댓값', '분산', '확률변수', '확률질량함수'],
  '연속확률밀도 및 정규분포 표준화 연계형': ['정규분포', '확률밀도함수'],
  '통계적 표본 추출 및 모평균 신뢰구간 추정형': ['모집단', '모평균', '신뢰구간', '표본비율', '표본평균', '표준편차'],
};

// 발표·디자인 확인용 개발 환경 샘플. 실제 학생 결과 계산에는 사용하지 않는다.
export const DIAGNOSTIC_REPORT_PREVIEW: LearningRouteResponse = {
  topicMastery: {
    '경우의 수 기초': 0.64,
    '여러 가지 순열 및 여사건 제한형': 0.64,
    '기하학적 나열 및 공간 제약형': 0.64,
    '중복조합 및 함수의 개수 고난도 킬러형': 0.5,
    '이항 구조 전개 및 대수적 확률 연산형': 0.64,
    '조건부확률 및 반복 독립시행 융합형': 0.136,
    '중등 기술 통계 및 산포도 복합형': 0.64,
    '이산확률변수 통계량 및 선형 변환형': 0.64,
    '연속확률밀도 및 정규분포 표준화 연계형': 0.5,
    '통계적 표본 추출 및 모평균 신뢰구간 추정형': 0.136,
  },
  learningRoute: '',
  overallAssessment: '기본적인 공식과 계산은 안정적입니다. 다만 여러 개념을 구분하거나 조건의 관계를 해석하는 문제에서 정확도가 낮아지는 경향이 있습니다. 불안정한 개념을 빠르게 점검한 뒤 조건부확률과 통계적 추정을 중심으로 학습하는 것이 좋습니다.',
};

type PreviewStatus = 'stable' | 'unstable' | 'needs-review';

function createResultPreview(statuses: PreviewStatus[], assessment: string): LearningRouteResponse {
  const diagnosticAnswers = CONCEPTS.flatMap<AnswerItem>((concept, index) => {
    const status = statuses[index];
    const main: AnswerItem = {
      problemId: 10_000 + concept.question,
      topic: concept.sourceTopic,
      userAnswer: status === 'stable' ? '정답' : '오답',
      correct: status === 'stable',
      concepts: PREVIEW_CONCEPTS[concept.sourceTopic] ?? concept.learningSteps,
      diagnosticRole: 'main',
    };
    if (status === 'stable') return [main];
    return [main, {
      problemId: 20_000 + concept.question,
      topic: `${concept.label} 기초 확인`,
      userAnswer: status === 'unstable' ? '정답' : '오답',
      correct: status === 'unstable',
      diagnosticRole: 'drilldown',
    }];
  });

  return {
    topicMastery: Object.fromEntries(CONCEPTS.map((concept, index) => {
      const score = statuses[index] === 'stable' ? 0.64 : statuses[index] === 'unstable' ? 0.5 : 0.136;
      return [concept.sourceTopic, score];
    })),
    learningRoute: '',
    overallAssessment: assessment,
    diagnosticAnswers,
  };
}

export const DIAGNOSTIC_REPORT_PREVIEWS: Record<string, LearningRouteResponse> = {
  '1': DIAGNOSTIC_REPORT_PREVIEW,
  'all-correct': createResultPreview(
    Array<PreviewStatus>(10).fill('stable'),
    '주요 개념을 안정적으로 이해하고 있습니다. 복합 조건과 심화 적용 문제로 학습을 확장할 수 있습니다.',
  ),
  'mostly-correct': createResultPreview(
    ['stable', 'stable', 'stable', 'unstable', 'stable', 'needs-review', 'stable', 'stable', 'unstable', 'stable'],
    '기본 개념은 안정적이지만 일부 관계 해석 문제에서 흔들림이 확인되었습니다. 취약한 개념만 선별해 보완하는 것이 좋습니다.',
  ),
  mixed: createResultPreview(
    ['stable', 'unstable', 'stable', 'needs-review', 'stable', 'needs-review', 'stable', 'unstable', 'unstable', 'needs-review'],
    '안정적인 개념과 불안정한 개념이 함께 확인되었습니다. 관계 해석이 필요한 취약 영역부터 집중적으로 보완하는 것이 좋습니다.',
  ),
  'all-wrong': createResultPreview(
    Array<PreviewStatus>(10).fill('needs-review'),
    '핵심 개념의 의미와 선수 관계를 차근차근 다시 연결하는 학습이 필요합니다.',
  ),
};

const conceptTopics = new Set(CONCEPTS.map((concept) => concept.sourceTopic));

function fallbackStatus(score: number | undefined): DiagnosticStatus {
  if (score == null || score < 0) return 'not-diagnosed';
  // BN 한 문항 정답의 BKT 점수는 약 0.64이므로 0.6부터 안정으로 본다.
  if (score >= 0.6) return 'stable';
  if (score >= 0.4) return 'unstable';
  return 'needs-review';
}

function isMainAnswer(answer: AnswerItem): boolean {
  return answer.diagnosticRole === 'main'
    || (answer.diagnosticRole == null && conceptTopics.has(answer.topic));
}

function statusForAnswer(answers: AnswerItem[], index: number): DiagnosticStatus {
  if (answers[index].correct) return 'stable';
  for (let next = index + 1; next < answers.length; next += 1) {
    if (isMainAnswer(answers[next])) break;
    return answers[next].correct ? 'unstable' : 'needs-review';
  }
  return 'needs-review';
}

function areaForTopic(topic: string): DiagnosticArea {
  return CONCEPTS.find((concept) => concept.sourceTopic === topic)?.area ?? '확률';
}

const severity: Record<DiagnosticStatus, number> = {
  stable: 0,
  unstable: 1,
  'needs-review': 2,
  'not-diagnosed': -1,
};

export function buildDiagnosticReport(result: LearningRouteResponse): DiagnosticReport {
  const answers = result.diagnosticAnswers ?? [];
  const byConcept = new Map<string, DiagnosticConceptResult>();

  answers.forEach((answer, index) => {
    if (!isMainAnswer(answer)) return;
    const definition = CONCEPTS.find((concept) => concept.sourceTopic === answer.topic);
    const labels = answer.concepts?.length ? answer.concepts : [definition?.label ?? answer.topic];
    const status = statusForAnswer(answers, index);
    for (const label of labels) {
      const current = byConcept.get(label);
      if (!current || severity[status] > severity[current.status]) {
        byConcept.set(label, { area: areaForTopic(answer.topic), label, status, score: null });
      }
    }
  });

  if (byConcept.size === 0) {
    for (const definition of CONCEPTS) {
      const score = result.topicMastery[definition.sourceTopic];
      byConcept.set(definition.label, {
        area: definition.area,
        label: definition.label,
        status: fallbackStatus(score),
        score: score == null || score < 0 ? null : score,
      });
    }
  }

  const concepts = [...byConcept.values()];
  const counts = concepts.reduce<Record<DiagnosticStatus, number>>((acc, concept) => {
    acc[concept.status] += 1;
    return acc;
  }, { stable: 0, unstable: 0, 'needs-review': 0, 'not-diagnosed': 0 });
  const weak = concepts.filter((concept) => concept.status === 'unstable' || concept.status === 'needs-review');
  const learningPlans = (['경우의 수', '확률', '통계'] as DiagnosticArea[])
    .map((area) => ({ area, concepts: weak.filter((concept) => concept.area === area) }))
    .filter((plan) => plan.concepts.length > 0);

  return { concepts, counts, learningPlans };
}
