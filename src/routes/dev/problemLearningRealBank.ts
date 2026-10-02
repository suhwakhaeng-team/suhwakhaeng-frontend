import snapshot from './problemLearningBankSnapshot.json' with { type: 'json' };
import { LEVEL_TEST_QUESTIONS } from './levelTestQuestionBank.ts';
import type { LearningGoal, LearningNode, LearningQuestion } from './problemLearningModel.ts';

// Actual question IDs/content/choices/answers are preserved from the reviewed bank.
// Edges are manually reviewed solution dependencies, NOT inferred merely by shared tags.
// Supplementary ANs and concept checks are explicitly distinguished from bank questions.
const nodes: Record<string, LearningNode> = {};
const q = (prompt: string, choices: [string, string, string, string], answer: string, explanation: string): LearningQuestion => ({ prompt, choices, answer, explanation, answerType: 'MULTIPLE_CHOICE' });
function concept(id: string, label: string, note: string, check?: LearningQuestion) {
  const question = check ?? LEVEL_TEST_QUESTIONS[id];
  if (!question) throw new Error(`Missing concept check: ${id}`);
  const nodeId = `real-c-${id}`;
  nodes[nodeId] = { id: nodeId, label, kind: 'concept', conceptId: id, requires: [], note, questions: [question], source: 'concept-check' };
  return nodeId;
}
function guide(id: string, label: string, requires: string[], question: LearningQuestion) {
  nodes[id] = { id, label, kind: 'AN', requires, questions: [question], source: 'scaffold' };
  return id;
}
function bank(id: number, label: string, requires: string[], reference?: string) {
  const row = snapshot.questions.find(item => item.questionId === id);
  if (!row || !['BN', 'AN'].includes(row.nodeLevel)) throw new Error(`Missing bank question ${id}`);
  const nodeId = `bank-${id}`;
  const answerType = row.answerType as 'NUMBER' | 'MULTIPLE_CHOICE';
  nodes[nodeId] = { id: nodeId, label, kind: row.nodeLevel as 'BN' | 'AN', requires,
    source: 'bank', questionId: id, bankTags: row.tags.map(tag => tag.tag_name),
    questions: [{ prompt: row.content, answer: row.answer, explanation: row.explanation, answerType, questionId: id,
      ...(answerType === 'MULTIPLE_CHOICE' ? { choices: row.choices as [string, string, string, string] } : {}), ...(reference ? { reference } : {}) }] };
  return nodeId;
}

const factorial = concept('factorial', '팩토리얼', '서로 다른 대상을 모두 줄 세우면 첫 자리부터 선택지가 하나씩 줄어요.\n\n$n!=n\\times(n-1)\\times\\cdots\\times1$입니다.');
const combination = concept('combination', '조합', '순서나 역할을 구별하지 않고 고르는 방법의 수예요.\n\n${}_nC_r=\\frac{n!}{r!(n-r)!}$이고, ${}_nC_r={}_nC_{n-r}$입니다.');
const product = concept('product-rule', '곱의 법칙', '첫 선택 하나마다 다음 선택을 같은 수만큼 할 수 있으면 두 방법의 수를 곱해요.\n\n첫 선택 2가지, 다음 선택 3가지이면 $2\\times3=6$가지입니다.');
const probability = concept('math-probability', '수학적 확률', '모든 결과가 같은 가능성으로 일어나면, 조건을 만족하는 경우의 수를 전체 경우의 수로 나눠요.\n\n$P(A)=\\frac{n(A)}{n(S)}$입니다.');
const complement = concept('complement', '여사건', '적어도 한 번 같은 조건은 반대 조건을 세어 빼면 편할 때가 있어요.\n\n$P(A)=1-P(A^c)$이고, 개수를 셀 때도 전체에서 조건을 만족하지 않는 개수를 뺍니다.');
const circular = concept('circular', '원순열', '원형 배열에서는 회전해서 같은 배치를 하나로 봐요.\n\n한 사람을 고정하면 나머지를 줄 세우는 것과 같아 $(n-1)!$가지입니다.');
const block = concept('block-grouping', '묶어서 세기', '붙어 있어야 하는 대상은 하나의 묶음으로 봐요. 묶음끼리 배치하는 방법과 각 묶음 안의 순서를 따로 세어 곱해요.', q('A, B, C, D에서 A와 B를 한 묶음으로 보면 배열할 대상은 몇 개인가?', ['2', '3', '4', '5'], 'B', '[AB], C, D의 세 대상입니다.'));
const repetition = concept('repeated-permutation', '중복순열', '같은 선택을 다시 사용할 수 있으면 자리마다 가능한 선택지를 곱해요.\n\n숫자로 자연수를 만들 때는 첫 자리에 0이 올 수 없다는 조건을 따로 확인해요.');
const repeatedCombination = concept('repeated-combination', '중복조합', '순서 없이 고르면서 같은 종류를 다시 고를 수 있으면 중복조합이에요.\n\n$n$종류에서 $r$개를 고르는 수는 ${}_{n+r-1}C_r$입니다.');
const monotone = concept('monotone-values', '비감소 조건', '$f(1)\\le f(2)\\le f(3)\\le f(4)$에서는 앞의 값보다 뒤의 값이 작아질 수 없어요. 처음과 마지막 값이 정해지면 중간 값들의 범위도 정해져요.', q('$f(1)=2$, $f(4)=5$인 비감소 함수에서 중간 값들의 조건은?', ['$2\\le f(2)\\le f(3)\\le5$', '$f(2)<2$', '$f(3)>5$', '$f(2)>f(3)$'], 'A', '비감소 조건과 양 끝 값을 함께 적용합니다.'));
const binomial = concept('binomial-theorem', '이항정리', '$(a+b)^n$에서 $b$를 $r$번 선택한 항은 $\\binom nr a^{n-r}b^r$예요. 계수와 문자 부분을 따로 계산해요.');
const powers = concept('power-exponents', '문자 지수 계산', '같은 문자를 곱하면 지수를 더해요. $x^a x^b=x^{a+b}$입니다. 전개식에서 상수항은 문자의 지수가 0인 항이에요.', q('$x^4\\times x^{-4}$의 값은? (단, $x\\ne0$)', ['0', '1', '$x^8$', '$x^{-8}$'], 'B', '지수의 합은 0이고 $x^0=1$입니다.'));
const disjoint = concept('disjoint', '배반사건', '두 사건이 동시에 일어날 수 없으면 배반사건이에요. 교집합의 확률은 0입니다.');
const addition = concept('addition', '확률의 덧셈 정리', '$P(A\\cup B)=P(A)+P(B)-P(A\\cap B)$입니다. 배반사건이면 겹치는 부분이 없어서 두 확률을 바로 더해요.');
const multiplication = concept('multiplication', '확률의 곱셈정리', '$P(A\\cap B)=P(A)P(B\\mid A)$예요. 먼저 어떤 경우를 선택하고 그 경우에서 조건을 만족할 확률을 곱해요.');
const conditional = concept('conditional', '조건부확률', 'B가 일어났다는 조건이 주어지면 전체를 B로 좁혀요.\n\n$P(A\\mid B)=\\frac{P(A\\cap B)}{P(B)}$이고 분모는 반드시 조건 B의 확률입니다.');
const average = concept('average', '평균', '자료의 합을 자료의 개수로 나눈 값이에요. 반대로 평균에 개수를 곱하면 자료의 합을 알 수 있어요.');
const mode = concept('mode', '최빈값', '자료에서 가장 많이 나타난 값이에요. 얼마나 많이 나타나는지와 그 값 자체를 구분해요.');
const deviation = concept('deviation', '편차', '편차는 각 자료의 값에서 평균을 뺀 값이에요. 모든 편차를 더하면 0이 됩니다.', q('자료의 평균이 5이고 한 값이 7일 때 그 값의 편차는?', ['-2', '0', '2', '12'], 'C', '$7-5=2$입니다.'));
const variance = concept('variance', '분산', '일반 자료에서는 편차를 제곱한 값들의 평균이에요. 확률변수에서는 각 제곱 편차에 확률을 곱해 더합니다.\n\n$V(X)=E(X^2)-E(X)^2$도 사용할 수 있어요.');
const stddev = concept('stddev', '표준편차', '표준편차는 분산의 양의 제곱근이에요. 값들을 $a$배 하면 표준편차는 $|a|$배가 되고, 같은 수를 더하거나 빼는 것은 표준편차를 바꾸지 않아요.');
const pmf = concept('pmf', '확률질량함수', '이산확률변수의 각 값에 확률을 대응시킨 함수예요. 모든 확률은 0 이상이고 확률의 합은 1이어야 해요.');
const expected = concept('expected', '기댓값', '각 값에 그 값이 나올 확률을 곱해 모두 더한 값이에요.\n\n$E(X)=\\sum xP(X=x)$입니다.');
const normal = concept('normal', '정규분포', '평균을 중심으로 대칭인 종 모양의 분포예요. 구간의 확률은 곡선 아래의 넓이이고, 평균을 기준으로 양쪽 넓이는 각각 0.5예요.');
const standardization = concept('standardization', '표준화', '정규분포 $X\\sim N(\\mu,\\sigma^2)$를 $Z=(X-\\mu)/\\sigma$로 바꾸면 표준정규분포로 계산할 수 있어요.');
const standardNormal = concept('standard-normal', '표준정규분포', '평균 0, 표준편차 1인 정규분포예요. 표에 $P(0\\le Z\\le z)$가 있으면 오른쪽 꼬리 확률은 $0.5$에서 표의 값을 뺍니다.');
const sampleMean = concept('sample-mean', '표본평균', '독립적으로 뽑은 크기 $n$의 표본평균은 평균이 $\\mu$, 표준편차가 $\\sigma/\\sqrt n$이에요. 표본 크기가 커질수록 표본평균의 흔들림이 작아집니다.');
const confidence = concept('confidence', '신뢰구간', '모표준편차가 알려진 정규 모집단의 모평균 신뢰구간은 $\\bar X\\pm z\\sigma/\\sqrt n$이에요. 길이는 $2z\\sigma/\\sqrt n$입니다. 신뢰수준과 모표준편차가 같으면 길이는 $1/\\sqrt n$에 비례해요.');

// Statistical estimation: real AN 675 supports the sampling standard error.
bank(675, '표본평균의 표준편차', [sampleMean, stddev]);
guide('guide-ci-scale', '표본 크기와 구간 길이', ['bank-675', confidence], q('모표준편차와 신뢰수준이 같을 때 표본 크기를 9배로 늘리면 신뢰구간의 길이는 원래의 몇 배인가?', ['$\\frac19$', '$\\frac13$', '3', '9'], 'B', '길이는 $1/\\sqrt n$에 비례하므로 $1/\\sqrt9=1/3$배입니다.'));
bank(678, '표본 크기와 신뢰구간', ['guide-ci-scale']);

// Descriptive statistics: reconstruct the data, then compute its spread.
bank(685, '자료의 최빈값', [mode]);
guide('guide-data-sum', '평균에서 합 구하기', [average], q('자료 5개의 평균이 6일 때 자료의 합은?', ['11', '20', '30', '36'], 'C', '$5\\times6=30$입니다.'));
guide('guide-reconstruct', '자료의 남은 값 찾기', ['bank-685', 'guide-data-sum'], q('자료 $3,3,3,x,8$의 평균이 4일 때 $x$는?', ['1', '3', '4', '5'], 'B', '합이 20이므로 $x=20-(3+3+3+8)=3$입니다.'));
bank(694, '편차의 합 이용하기', [deviation]);
bank(700, '편차에서 분산 구하기', ['bank-694', variance, stddev]);
bank(705, '평균·최빈값으로 분산 구하기', ['guide-reconstruct', 'bank-700']);

// Discrete variables: probabilities -> expectation/variance -> scale transform.
bank(670, '확률표에서 기댓값', [pmf, expected]);
guide('guide-weighted-variance', '확률변수의 분산', ['bank-670', variance], q('$X$가 1, 2, 3을 각각 확률 $1/4,1/2,1/4$로 갖는다. $E(X)=2$일 때 분산은?', ['$\\frac14$', '$\\frac12$', '1', '2'], 'B', '편차 제곱에 확률을 곱하면 $1\\times1/4+0\\times1/2+1\\times1/4=1/2$입니다.'));
guide('guide-sd-transform', '변환된 표준편차', [stddev], q('$\\sigma(X)=2$일 때 $Y=3X-5$의 표준편차는?', ['1', '5', '6', '11'], 'C', '상수 -5는 흩어진 정도를 바꾸지 않고 3배 하면 표준편차도 3배가 됩니다. $3\\times2=6$입니다.'));
bank(708, '확률변수 변환과 표준편차', ['guide-weighted-variance', 'guide-sd-transform']);

// Normal distribution. The bank AN requires a normal table; provide it as a separate reference.
guide('guide-z-score', '값을 표준화하기', [standardization, normal], q('$X\\sim N(20,2^2)$일 때 $X=17$을 표준화한 값은?', ['-3', '-1.5', '1.5', '3'], 'B', '$(17-20)/2=-1.5$입니다.'));
bank(687, '정규분포의 꼬리 확률', ['guide-z-score', standardNormal], '| $z$ | $P(0\\le Z\\le z)$ |\n| --- | --- |\n| 0.5 | 0.1915 |\n| 1.0 | 0.3413 |\n| 1.5 | 0.4332 |');
bank(709, '무게가 구간 안일 확률', ['bank-687']);

// Representative selection. Shared tags alone do not create these edges.
guide('guide-choose-pair', '두 명을 순서 없이 뽑기', [combination], q('서로 다른 4명 중 역할 구분 없이 2명을 고르는 방법의 수는?', ['4', '6', '8', '12'], 'B', '${}_4C_2=6$입니다.'));
bank(719, '같은 성별 대표의 확률', ['guide-choose-pair', probability]);
guide('guide-group-product', '두 그룹의 선택 결합', [product], q('남학생을 고르는 방법이 6가지, 여학생을 고르는 방법이 3가지일 때 두 선택을 함께 하는 방법의 수는?', ['9', '12', '18', '36'], 'C', '$6\\times3=18$입니다.'));
bank(711, '남녀가 모두 포함될 확률', ['bank-719', 'guide-group-product', complement]);

guide('guide-zero-position', '자릿수와 0의 위치', [repetition, product], q('숫자 0,1,2,3으로 중복을 허용해 세 자리 자연수를 만든다. 0이 정확히 한 번 나타나는 수의 개수는?', ['9', '12', '18', '27'], 'C', '0의 위치는 십 또는 일의 자리의 2가지이고 나머지 자리는 각각 3가지여서 $2\\times3^2=18$입니다.'));
bank(737, '0의 개수에 따른 숫자 만들기', ['guide-zero-position']);
guide('guide-count-complement', '적어도 조건을 반대로 세기', [complement], q('전체 경우 100개 중 조건 A가 0번인 경우 15개, 정확히 1번인 경우 20개이다. A가 적어도 2번인 경우는?', ['35', '65', '80', '85'], 'B', '$100-15-20=65$개입니다.'));
bank(735, '1이 두 번 이상인 자연수', ['bank-737', 'guide-count-complement']);

bank(716, '회전해서 같은 배열', [circular, product, factorial]);
bank(733, '이웃 조건이 있는 원순열', [circular, product, factorial]);
guide('guide-circle-block', '원탁에서 묶음 배열', ['bank-733', block], q('서로 다른 남학생 3명과 여학생 3명을 성별 두 묶음으로 원탁에 배치한다. 각 묶음 내부의 순서를 정하는 방법의 수는?', ['6', '12', '18', '36'], 'D', '회전하여 같은 두 묶음의 배치는 하나입니다. 두 묶음 내부는 $3!\\times3!=36$가지입니다.'));
bank(738, '성별로 모여 앉는 확률', ['guide-circle-block', 'bank-716', probability]);

guide('guide-repeat-choice', '중복해서 두 값 고르기', [repeatedCombination], q('1,2,3 중 중복을 허용해 두 값을 순서 없이 고르는 방법의 수는?', ['3', '4', '6', '9'], 'C', '11,12,13,22,23,33의 여섯 가지입니다.'));
bank(740, '조건을 정수해로 바꾸기', ['guide-repeat-choice']);
guide('guide-monotone-range', '함수의 중간 값 범위', [monotone], q('$f(1)=1$, $f(4)=4$이고 비감소 함수일 때 가능한 $(f(2),f(3))$는?', ['(3,2)', '(0,2)', '(2,3)', '(3,5)'], 'C', '$1\\le f(2)\\le f(3)\\le4$를 만족해야 합니다.'));
bank(745, '비감소 함수의 개수', ['bank-740', 'guide-monotone-range']);

guide('guide-binomial-term', '전개식의 항 선택', [binomial, combination], q('$(a+b)^5$에서 $a^2b^3$의 계수는?', ['5', '10', '15', '20'], 'B', '$b$를 고를 세 위치를 선택하므로 ${}_5C_3=10$입니다.'));
bank(713, '이항정리로 계수 구하기', ['guide-binomial-term']);
bank(710, '배반사건의 확률', [disjoint, addition]);
guide('guide-constant-power', '상수항의 지수 찾기', [powers], q('$x^{10-2r}$이 상수항이 되게 하는 $r$의 값은?', ['2', '4', '5', '10'], 'C', '$10-2r=0$이므로 $r=5$입니다.'));
bank(757, '상수항과 배반사건의 확률', ['bank-713', 'guide-constant-power', 'bank-710']);

guide('guide-joint-probability', '선택과 결과를 곱하기', [multiplication], q('주머니 A를 고를 확률이 $1/3$, A에서 흰 공이 나올 확률이 $1/2$이다. A를 고르고 흰 공이 나올 확률은?', ['$\\frac16$', '$\\frac13$', '$\\frac12$', '$\\frac56$'], 'A', 'A를 선택하고 그 조건에서 흰 공이 나오는 확률을 곱해 $1/3\\times1/2=1/6$입니다.'));
bank(751, '두 주머니의 전체 확률', ['guide-joint-probability', addition]);
bank(721, '조건을 좁혀 확률 구하기', [conditional, probability]);
guide('guide-two-white', '동시에 두 공 뽑기', [combination, probability], q('흰 공 2개와 검은 공 3개 중 임의로 2개를 동시에 뽑을 때 모두 흰 공일 확률은?', ['$\\frac1{10}$', '$\\frac15$', '$\\frac25$', '$\\frac12$'], 'A', '전체 ${}_5C_2=10$가지 중 흰 공 두 개를 고르는 경우는 1가지입니다.'));
bank(769, '결과로 주머니 추정하기', ['bank-751', 'bank-721', 'guide-two-white']);

// Layer a DAG by prerequisite depth, keep parallel branches separate, reuse shared concepts.
function layout(rootId: string): LearningGoal['positions'] {
  const depth = new Map<string, number>();
  const rows = new Map<string, number>();
  const usedRows = new Map<number, number[]>();
  let leafRow = 0;
  function place(id: string): number {
    if (depth.has(id)) return depth.get(id)!;
    const children = nodes[id].requires;
    const column = children.length ? Math.max(...children.map(place)) + 1 : 0;
    let row = children.length ? children.reduce((sum, child) => sum + rows.get(child)!, 0) / children.length : leafRow++;
    const used = usedRows.get(column) ?? [];
    while (used.some(value => Math.abs(value - row) < .9)) row += .9;
    used.push(row); usedRows.set(column, used);
    depth.set(id, column); rows.set(id, row);
    return column;
  }
  place(rootId);
  return Object.fromEntries([...depth].map(([id, column]) => [id, [column, rows.get(id)!]]));
}
const goals: [number, string][] = [
  [711, '확률'], [705, '자료 정리'], [708, '확률분포'], [709, '정규분포'], [678, '통계적 추정'],
  [735, '경우의 수 · 순열과 조합'], [738, '경우의 수 · 순열과 조합'], [745, '경우의 수 · 순열과 조합'],
  [757, '이항정리 · 확률'], [769, '조건부확률'],
];
export const realLearningNodes = nodes;
export const realLearningGoals: LearningGoal[] = goals.map(([id, domain]) => ({
  id: `bn-${id}`, questionId: id, rootId: `bank-${id}`, title: nodes[`bank-${id}`].label, domain, positions: layout(`bank-${id}`),
}));
