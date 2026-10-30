export type UnitId = 'counting' | 'probability' | 'statistics';
export type Screen = 'login' | 'profile' | 'intro' | 'test' | 'generating' | 'home' | 'unit' | 'detail' | 'lesson' | 'notes' | 'ai';
export type Topic = { name: string; short?: string; children: string[]; description: string; formula: string; question: string; choices: string[]; answer: number; explanation: string };
export type Unit = { id: UnitId; name: string; color: string; topics: Topic[] };

function topic(name: string, children: string, description: string, formula: string, question: string, choices: string[], answer: number, explanation: string, short?: string): Topic {
  return { name, short, children: children.split('|'), description, formula, question, choices, answer, explanation };
}

/** Authored demonstration content, independent of production curriculum or mastery. */
export const UNITS: Unit[] = [
  { id: 'counting', name: '경우의 수', color: '#2878f0', topics: [
    topic('합의 법칙', '분류의 원칙|곱의 법칙과 구분|합의 법칙의 뜻|동시에와 또는', '서로 겹치지 않는 경우들을 나누고, 각 경우의 수를 더해 전체를 구해요.', '$m+n$', '빨간 펜 3자루와 파란 펜 4자루 중 한 자루를 고르는 방법은 몇 가지일까요?', ['7가지', '12가지', '4가지', '3가지'], 0, '빨간 펜을 고르는 경우와 파란 펜을 고르는 경우가 겹치지 않으므로 $3+4=7$가지예요.'),
    topic('순열', '순열의 뜻|전체를 줄 세우기|일부를 골라 줄 세우기|이웃하도록 배열|이웃하지 않도록 배열|특정 자리에 고정|사이에 오도록 배열|끝자리 조건', '서로 다른 대상 중 일부를 골라 순서 있게 배열해요. 같은 대상을 골라도 순서가 달라지면 다른 경우예요.', '${}_nP_r=\\frac{n!}{(n-r)!}$', '서로 다른 5명 중 회장과 부회장을 한 명씩 뽑는 방법은 몇 가지일까요?', ['10가지', '15가지', '20가지', '25가지'], 2, '회장은 5명 중에서, 부회장은 남은 4명 중에서 골라요. 역할이 다르므로 $5\\times4=20$가지예요.'),
    topic('조합', '조합의 뜻|순열과 조합의 구분|조합의 수|조 나누기|적어도 한 명 포함|특정 대상 미포함|포함 조건|조합의 성질', '대상을 고르는 데 순서를 고려하지 않아요. 뽑힌 대상이 같다면 같은 경우로 세어요.', '${}_nC_r=\\frac{n!}{r!(n-r)!}$', '서로 다른 5명 중 대표 2명을 뽑는 방법은 몇 가지일까요?', ['20가지', '10가지', '5가지', '25가지'], 1, '대표 두 명 사이에 순서가 없으므로 ${}_5C_2=10$가지예요.'),
    topic('원순열', '원순열의 뜻|회전해서 같은 배열|탁자에 둘러앉기', '회전해서 일치하는 배열을 같은 경우로 생각해요. 한 대상을 기준으로 고정하면 셀 수 있어요.', '$(n-1)!$', '서로 다른 5명이 원탁에 둘러앉는 방법은 몇 가지일까요?', ['120가지', '60가지', '24가지', '20가지'], 2, '한 사람을 고정하고 나머지 네 명을 배열하므로 $4!=24$가지예요.'),
    topic('같은 것이 있는 순열', '같은 대상 구분하기|중복해서 센 배열|같은 것 순열의 수|최단 경로|같은 것이 있는 문자열', '같은 대상끼리 자리를 바꿔 중복해서 센 경우를 나누어 줘요.', '$\\frac{n!}{p!q!}$', 'BANANA의 문자를 모두 사용해 만들 수 있는 서로 다른 문자열은 몇 개일까요?', ['30개', '60개', '90개', '120개'], 1, 'A가 3개, N이 2개이므로 $6!/(3!2!)=60$개예요.', '같은 것 순열'),
    topic('중복순열', '중복순열의 뜻|함수의 개수|조건이 있는 함수|호별 문제|빈방이 있는 배열|특정 대상 포함|자리별 선택', '같은 대상을 여러 번 골라도 되는 순서 있는 선택이에요. 자리마다 가능한 선택의 수를 곱해요.', '$n^r$', '숫자 1, 2, 3을 중복 사용해 만드는 세 자리 수는 몇 개일까요?', ['9개', '18개', '27개', '36개'], 2, '세 자리마다 3가지씩 고를 수 있으므로 $3^3=27$개예요.'),
    topic('중복조합', '중복조합의 뜻|대소 관계|홀수와 짝수 제약|음이 아닌 정수해|양의 정수해|일차방정식 활용|중복조합 기본|상한 조건|분배하는 방법|조건을 나누어 세기', '종류별로 여러 개 골라도 되고, 고르는 순서는 구분하지 않는 선택이에요.', '${}_nH_r={}_{n+r-1}C_r$', '서로 다른 과일 3종류에서 중복을 허용해 2개를 고르는 방법은 몇 가지일까요?', ['3가지', '6가지', '9가지', '12가지'], 1, '${}_3H_2={}_4C_2=6$가지예요.'),
    topic('이항정리', '이항정리의 뜻|전개식의 일반항|특정 항의 계수|이항계수의 성질|앞과 뒤의 항|홀수와 짝수 항|파스칼의 삼각형|모든 계수의 합|계수 관계 활용', '이항식의 거듭제곱을 전개할 때 조합의 수로 각 항의 계수를 구해요.', '$(a+b)^n=\\sum_{r=0}^n{}_nC_r a^{n-r}b^r$', '$(1+x)^4$의 전개식에서 $x^2$의 계수는 얼마일까요?', ['4', '6', '8', '12'], 1, '$x$를 네 번의 선택 중 두 번 고르므로 계수는 ${}_4C_2=6$이에요.'),
  ] },
  { id: 'probability', name: '확률', color: '#65c8f5', topics: [
    topic('확률의 뜻과 성질', '수학적 확률|확률의 기본 성질|여사건의 확률', '가능한 모든 결과를 기준으로 관심 있는 사건이 일어날 비율을 생각해요.', '$P(A)=\\frac{n(A)}{n(S)}$', '공정한 주사위 한 개를 던져 짝수가 나올 확률은 얼마일까요?', ['$1/6$', '$1/3$', '$1/2$', '$2/3$'], 2, '여섯 결과 중 짝수는 2, 4, 6의 세 개이므로 $3/6=1/2$예요.'),
    topic('사건과 확률', '표본공간과 사건|배반사건', '표본공간은 모든 가능한 결과의 집합이고, 사건은 그중 관심 있는 결과들의 집합이에요.', '$A\\subseteq S$', '주사위에서 사건 $A=\\{1,2\\}$가 일어날 확률은 얼마일까요?', ['$1/6$', '$1/3$', '$1/2$', '$2/3$'], 1, '가능한 여섯 결과 중 두 결과가 해당하므로 $2/6=1/3$이에요.'),
    topic('확률의 덧셈정리', '합사건의 확률|겹치는 부분 빼기', '두 사건 중 적어도 하나가 일어날 확률을 구할 때, 겹쳐서 센 부분을 한 번 빼요.', '$P(A\\cup B)=P(A)+P(B)-P(A\\cap B)$', '$P(A)=0.5$, $P(B)=0.4$, $P(A\\cap B)=0.2$일 때 합사건의 확률은?', ['0.3', '0.5', '0.7', '0.9'], 2, '$0.5+0.4-0.2=0.7$이에요.'),
    topic('조건부확률', '조건에 따른 표본공간|조건부확률의 계산|조건 방향 구분', '어떤 사건이 이미 일어났다는 조건 아래에서 다른 사건이 일어날 확률이에요.', '$P(A\\mid B)=\\frac{P(A\\cap B)}{P(B)}$', '$P(A\\cap B)=0.2$, $P(B)=0.5$일 때 $P(A\\mid B)$는?', ['0.1', '0.2', '0.4', '0.7'], 2, '조건 사건 B를 새로운 기준으로 생각하면 $0.2/0.5=0.4$예요.'),
    topic('사건의 독립', '독립과 종속|독립의 판단', '한 사건이 일어났다는 정보가 다른 사건의 확률을 바꾸지 않는 관계예요.', '$P(A\\cap B)=P(A)P(B)$', '독립인 두 사건에 대해 $P(A)=0.5$, $P(B)=0.4$라면 교사건의 확률은?', ['0.1', '0.2', '0.5', '0.9'], 1, '독립이므로 $P(A\\cap B)=0.5\\times0.4=0.2$예요.'),
    topic('독립시행', '독립시행의 뜻|반복 시행의 확률', '앞선 시행의 결과가 다음 시행의 확률에 영향을 주지 않는 반복 시행이에요.', '${}_nC_r p^r(1-p)^{n-r}$', '공정한 동전을 독립적으로 두 번 던져 두 번 모두 앞면일 확률은?', ['$1/4$', '$1/2$', '$3/4$', '$1$'], 0, '각 시행이 독립이므로 $1/2\\times1/2=1/4$이에요.'),
    topic('확률의 곱셈정리', '조건부확률과 곱셈|여러 사건의 확률', '한 사건의 확률과 그 사건 안에서 다른 사건이 일어날 조건부확률을 곱해요.', '$P(A\\cap B)=P(A)P(B\\mid A)$', '$P(A)=1/2$, $P(B\\mid A)=1/3$일 때 두 사건이 함께 일어날 확률은?', ['$1/6$', '$1/3$', '$1/2$', '$5/6$'], 0, '$1/2\\times1/3=1/6$이에요.'),
    topic('확률의 활용', '조건을 나누어 계산|확률 문제의 해석|여사건의 활용', '사건의 조건을 읽고 덧셈, 곱셈, 조건부확률 중 알맞은 방법을 선택해요.', '$P(A^c)=1-P(A)$', '공정한 동전을 두 번 던져 적어도 한 번 앞면이 나올 확률은?', ['$1/4$', '$1/2$', '$3/4$', '$1$'], 2, '두 번 모두 뒷면인 경우의 여사건이므로 $1-1/4=3/4$예요.'),
  ] },
  { id: 'statistics', name: '통계', color: '#65d8cc', topics: [
    topic('모집단과 표본', '모집단과 표본의 뜻|전수조사와 표본조사|임의추출', '알아보고 싶은 전체 집단과, 실제로 조사하기 위해 뽑은 일부를 구분해요.', '$\\text{표본}\\subseteq\\text{모집단}$', '학생 1,000명 중 100명을 뽑아 조사했어요. 표본의 크기는?', ['10명', '100명', '900명', '1,000명'], 1, '실제로 뽑아 조사한 100명이 표본이에요.'),
    topic('확률분포', '확률변수의 뜻|이산확률분포|확률의 합|이항분포', '확률변수가 가질 수 있는 값과 각 값이 나올 확률을 연결해요.', '$\\sum P(X=x)=1$', '$X$가 이항분포 $B(5,0.4)$를 따르면 기댓값은?', ['1', '2', '3', '4'], 1, '이항분포의 기댓값은 $np=5\\times0.4=2$예요.'),
    topic('기댓값과 분산', '기댓값의 의미|분산의 의미|표준편차|확률변수의 변환', '평균적인 값과 그 주위에 값들이 얼마나 퍼져 있는지 함께 살펴봐요.', '$V(X)=E(X^2)-\\{E(X)\\}^2$', '자료 2, 4, 6의 평균은 얼마일까요?', ['2', '3', '4', '6'], 2, '세 값을 더하고 개수로 나누면 $(2+4+6)/3=4$예요.'),
    topic('정규분포', '정규분포의 모양|표준정규분포|표준화|정규분포의 확률', '평균을 중심으로 좌우가 대칭인 종 모양의 확률분포예요.', '$Z=\\frac{X-\\mu}{\\sigma}$', '표준정규분포를 따르는 $Z$에 대해 $P(Z\\leq0)$는?', ['0', '0.25', '0.5', '1'], 2, '0을 중심으로 대칭이므로 왼쪽 절반의 확률은 0.5예요.'),
    topic('표본평균의 분포', '표본평균의 뜻|표본평균의 평균|표본평균의 표준편차|큰 표본의 분포', '같은 크기의 표본을 반복해 뽑으면 표본평균도 하나의 분포를 이뤄요.', '$\\sigma_{\\bar X}=\\frac{\\sigma}{\\sqrt n}$', '모표준편차가 10이고 표본 크기가 100일 때 표본평균의 표준편차는?', ['0.1', '1', '10', '100'], 1, '$10/\\sqrt{100}=1$이에요.'),
    topic('모평균의 추정', '점추정과 구간추정|모평균의 신뢰구간|표본 크기의 영향', '표본평균을 바탕으로 모집단의 평균이 있을 만한 구간을 추정해요.', '$\\bar x\\pm z\\frac{\\sigma}{\\sqrt n}$', '표본평균이 20이고 오차한계가 2라면 추정 구간은?', ['$[16,24]$', '$[18,22]$', '$[19,21]$', '$[20,22]$'], 1, '$20-2=18$, $20+2=22$이므로 $[18,22]$예요.'),
    topic('표본비율과 추정', '표본비율의 뜻|표본비율의 분포|모비율의 추정', '표본에서 특정 성질을 가진 비율을 이용해 모집단의 비율을 추정해요.', '$\\hat p=\\frac{x}{n}$', '100명 중 40명이 찬성했을 때 표본비율은?', ['0.04', '0.4', '0.6', '4'], 1, '찬성한 사람의 수를 표본 크기로 나누면 $40/100=0.4$예요.'),
    topic('신뢰구간', '신뢰수준의 의미|신뢰구간의 폭|신뢰구간의 해석', '정해진 절차로 구간을 반복해서 만들 때, 그중 일정 비율이 모수를 포함하도록 해요.', '$\\text{오차한계}=z\\frac{\\sigma}{\\sqrt n}$', '다른 조건이 같을 때 신뢰수준을 높이면 신뢰구간은 어떻게 될까요?', ['좁아져요', '넓어져요', '같아요', '한 점이 돼요'], 1, '더 높은 신뢰수준을 얻으려면 더 넓은 범위를 포함해야 해요.'),
    topic('통계적 해석', '자료와 근거|상관관계의 해석|통계적 결론', '자료에서 알 수 있는 것과, 추가적인 근거가 필요한 주장을 구분해요.', '$\\text{상관관계만으로 인과관계를 단정할 수 없어요}$', '두 변수 사이에 상관관계가 관찰됐어요. 바로 말할 수 있는 것은?', ['반드시 인과관계가 있어요', '반드시 우연이에요', '인과관계는 추가 검토가 필요해요', '두 변수는 같아요'], 2, '상관관계는 함께 변하는 경향이에요. 원인과 결과인지는 다른 요인과 연구 방법을 함께 확인해야 해요.'),
  ] },
];

export const TEST_QUESTIONS = [
  { unit: 0, topic: 0 }, { unit: 0, topic: 1 }, { unit: 0, topic: 4 },
  { unit: 1, topic: 0 }, { unit: 1, topic: 2 }, { unit: 1, topic: 3 },
  { unit: 2, topic: 2 }, { unit: 2, topic: 1 }, { unit: 2, topic: 5 },
].map((item, index) => ({ ...item, id: index, ...UNITS[item.unit].topics[item.topic] }));

// The first demonstration route has a different worked example at every step.
// Other topics use their representative authored example until the team's bank is ready.
export function learningContent(unitId: UnitId, topicIndex: number, childIndex: number): Topic {
  const base = UNITS.find(unit => unit.id === unitId)!.topics[topicIndex];
  if (unitId !== 'counting' || topicIndex !== 1 || childIndex === 0) return base;
  const steps = [
    null,
    { description: '서로 다른 대상을 모두 한 줄로 배열할 때는 첫 자리부터 가능한 선택의 수를 차례로 곱해요.', formula: '$n!=n(n-1)\\cdots1$', question: '서로 다른 책 4권을 책장에 한 줄로 꽂는 방법은 몇 가지일까요?', choices: ['12가지', '24가지', '16가지', '8가지'], answer: 1, explanation: '첫 자리는 4권 중에서, 다음은 3권 중에서 골라요. $4!=4\\times3\\times2\\times1=24$가지예요.' },
    { description: '모든 대상을 쓰지 않고 일부만 골라 배열해요. 골라진 대상뿐 아니라 순서도 구분해요.', formula: '${}_nP_r=n(n-1)\\cdots(n-r+1)$', question: '서로 다른 5명 중 3명을 골라 한 줄로 세우는 방법은 몇 가지일까요?', choices: ['10가지', '20가지', '60가지', '125가지'], answer: 2, explanation: '세 자리의 선택 수를 곱하면 $5\\times4\\times3=60$가지예요.' },
    { description: '반드시 이웃해야 하는 대상들을 하나의 묶음으로 생각해 배열하고, 묶음 안의 순서를 따로 세어요.', formula: '$2!\\times4!$', question: '서로 다른 5명을 한 줄로 세울 때 A와 B가 이웃하는 배열은 몇 가지일까요?', choices: ['24가지', '48가지', '72가지', '120가지'], answer: 1, explanation: 'A와 B를 한 묶음으로 보면 네 대상을 배열해요. 묶음 안 순서까지 $4!\\times2!=48$가지예요.' },
    { description: '이웃하지 않는 경우를 바로 세기 어려우면, 전체 경우에서 이웃하는 경우를 빼요.', formula: '$5!-2!\\times4!$', question: '서로 다른 5명을 한 줄로 세울 때 A와 B가 서로 이웃하지 않는 배열은 몇 가지일까요?', choices: ['24가지', '48가지', '72가지', '120가지'], answer: 2, explanation: '전체 $120$가지에서 이웃하는 $48$가지를 빼면 $72$가지예요.' },
    { description: '특정 자리에 올 대상이 정해졌다면 그 자리를 먼저 고정하고 남은 대상만 배열해요.', formula: '$(5-1)!=4!$', question: '서로 다른 5명을 한 줄로 세울 때 A가 맨 앞에 오는 배열은 몇 가지일까요?', choices: ['12가지', '24가지', '60가지', '120가지'], answer: 1, explanation: 'A를 맨 앞에 고정한 뒤 나머지 네 명을 배열하므로 $4!=24$가지예요.' },
    { description: '사이에 온다는 조건을 상대적인 순서로 해석해요. 양쪽 대상의 순서를 바꾼 경우도 확인해요.', formula: '$B-A-C,\\quad C-A-B$', question: 'A, B, C 세 명을 한 줄로 세울 때 A가 B와 C 사이에 오는 배열은 몇 가지일까요?', choices: ['1가지', '2가지', '3가지', '6가지'], answer: 1, explanation: 'B-A-C와 C-A-B의 두 가지예요.' },
    { description: '짝수나 홀수처럼 끝자리 조건이 있다면 끝자리를 먼저 정하고 남은 자리를 배열해요.', formula: '$2\\times{}_4P_2$', question: '숫자 1, 2, 3, 4, 5 중 서로 다른 숫자로 만드는 세 자리 짝수는 몇 개일까요?', choices: ['12개', '20개', '24개', '60개'], answer: 2, explanation: '일의 자리는 2 또는 4의 두 가지예요. 남은 두 자리는 $4\\times3$가지이므로 모두 $24$개예요.' },
  ];
  return { ...base, ...steps[childIndex] };
}

export type JourneyState = {
  version: 1; screen: Screen; nickname: string; grade: string;
  answers: (number | null | undefined)[]; questionIndex: number;
  unitId: UnitId; topicIndex: number; childIndex: number;
  completed: string[]; notes: string[]; tested: boolean;
};
export const STORAGE_KEY = 'suhwakhaeng-journey-prototype-v1';
export const freshState = (): JourneyState => ({ version: 1, screen: 'login', nickname: '', grade: '', answers: [], questionIndex: 0, unitId: 'counting', topicIndex: 1, childIndex: 0, completed: [], notes: [], tested: false });
export const childKey = (unit: UnitId, topicIndex: number, childIndex: number) => `${unit}:${topicIndex}:${childIndex}`;
export function knownTopics(state: JourneyState, unit: Unit): number[] {
  return TEST_QUESTIONS.filter(q => UNITS[q.unit].id === unit.id && state.answers[q.id] === q.answer).map(q => q.topic);
}
export function topicDone(state: JourneyState, unit: Unit, topicIndex: number) {
  return knownTopics(state, unit).includes(topicIndex) || unit.topics[topicIndex].children.every((_, i) => state.completed.includes(childKey(unit.id, topicIndex, i)));
}
export function nextTopic(state: JourneyState, unit: Unit) {
  const index = unit.topics.findIndex((_, i) => !topicDone(state, unit, i));
  return index < 0 ? 0 : index;
}
export function nextChild(state: JourneyState, unit: Unit, topicIndex: number) {
  const index = unit.topics[topicIndex].children.findIndex((_, i) => !state.completed.includes(childKey(unit.id, topicIndex, i)));
  return index < 0 ? 0 : index;
}

/** Picks the particle that matches the final syllable, e.g. josa('순열', '을', '를') → '순열을'. */
export function josa(word: string, withFinal: string, withoutFinal: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const hasFinal = code >= 0 && code <= 11171 ? code % 28 !== 0 : false;
  return word + (hasFinal ? withFinal : withoutFinal);
}

/** A nudge that points at the formula without giving away the practice answer. */
export const conceptHint = (lesson: Topic) => `식 ${lesson.formula}에서 각 기호가 문제의 무엇을 가리키는지 먼저 찾아보세요. 겹치는 경우나 순서가 중요한지도 함께 확인해 보세요.`;
