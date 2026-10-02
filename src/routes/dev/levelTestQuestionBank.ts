export type LevelTestQuestion = {
  prompt: string;
  choices: [string, string, string, string];
  answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
};

export const LEVEL_TEST_QUESTIONS: Record<string, LevelTestQuestion> = {
  'sum-rule': {
    prompt: '빨간 펜 3자루와 파란 펜 4자루 중에서 펜 한 자루를 고르는 방법의 수는?',
    choices: ['7', '12', '3', '4'], answer: 'A',
    explanation: '빨간 펜을 고르는 3가지와 파란 펜을 고르는 4가지는 동시에 일어나지 않으므로 합의 법칙에 따라 $3+4=7$가지입니다.',
  },
  'product-rule': {
    prompt: '서로 다른 셔츠 3벌과 바지 2벌 중에서 셔츠와 바지를 하나씩 골라 입는 방법의 수는?',
    choices: ['5', '6', '8', '9'], answer: 'B',
    explanation: '셔츠를 고른 뒤 바지를 고르므로 곱의 법칙에 따라 $3\\times2=6$가지입니다.',
  },
  factorial: {
    prompt: '$5!$의 값은?',
    choices: ['25', '60', '100', '120'], answer: 'D',
    explanation: '$5!=5\\times4\\times3\\times2\\times1=120$입니다.',
  },
  permutation: {
    prompt: '서로 다른 5명 중에서 회장과 부회장을 한 명씩 뽑는 방법의 수는?',
    choices: ['10', '15', '20', '25'], answer: 'C',
    explanation: '역할이 서로 다르므로 순서를 고려합니다. ${}_5P_2=5\\times4=20$입니다.',
  },
  combination: {
    prompt: '서로 다른 6명 중에서 대표 2명을 뽑는 방법의 수는?',
    choices: ['12', '15', '20', '30'], answer: 'B',
    explanation: '대표 사이에 순서가 없으므로 ${}_6C_2=15$입니다.',
  },
  circular: {
    prompt: '서로 다른 5명이 원탁에 둘러앉는 방법의 수는?',
    choices: ['20', '24', '60', '120'], answer: 'B',
    explanation: '회전해서 같은 배치는 하나로 보므로 원순열의 수는 $(5-1)!=24$입니다.',
  },
  'repeated-permutation': {
    prompt: '숫자 0, 1, 2, 3을 중복 사용하여 만들 수 있는 두 자리 자연수의 개수는?',
    choices: ['8', '9', '12', '16'], answer: 'C',
    explanation: '십의 자리에는 0을 제외한 3가지, 일의 자리에는 4가지가 가능하므로 $3\\times4=12$개입니다.',
  },
  'repeated-combination': {
    prompt: '$x+y+z=5$를 만족하는 음이 아닌 정수해의 개수는?',
    choices: ['15', '18', '20', '21'], answer: 'D',
    explanation: '서로 다른 3종류에서 중복을 허용해 5개를 고르는 것과 같으므로 ${}_3H_5={}_7C_2=21$입니다.',
  },
  'binomial-theorem': {
    prompt: '$(1+x)^4$의 전개식에서 $x^2$의 계수는?',
    choices: ['4', '6', '8', '12'], answer: 'B',
    explanation: '이항정리에 의해 $x^2$의 계수는 ${}_4C_2=6$입니다.',
  },
  'same-permutation': {
    prompt: '문자 BANANA의 여섯 문자를 모두 사용하여 만들 수 있는 서로 다른 문자열의 개수는?',
    choices: ['30', '60', '90', '120'], answer: 'B',
    explanation: 'A가 3개, N이 2개이므로 $\\frac{6!}{3!2!}=60$입니다.',
  },
  'combination-use': {
    prompt: '$x+y+z=7$을 만족하는 양의 정수해의 개수는?',
    choices: ['10', '15', '21', '28'], answer: 'B',
    explanation: '각 변수에서 1씩 빼면 합이 4인 음이 아닌 정수해가 되므로 ${}_3H_4={}_6C_2=15$입니다.',
  },
  'binomial-coeff': {
    prompt: '$(1+x)^5$의 전개식에 나타나는 모든 계수의 합은?',
    choices: ['16', '25', '32', '64'], answer: 'C',
    explanation: '$x=1$을 대입하면 모든 계수의 합은 $(1+1)^5=32$입니다.',
  },
  'sample-space': {
    prompt: '주사위 한 개를 한 번 던지는 시행의 표본공간에 포함되는 원소의 개수는?',
    choices: ['4', '5', '6', '12'], answer: 'C',
    explanation: '가능한 결과는 $1,2,3,4,5,6$으로 모두 6개입니다.',
  },
  'math-probability': {
    prompt: '공정한 주사위 한 개를 던질 때 짝수의 눈이 나올 확률은?',
    choices: ['$\\frac{1}{6}$', '$\\frac{1}{3}$', '$\\frac{1}{2}$', '$\\frac{2}{3}$'], answer: 'C',
    explanation: '전체 6개 결과 중 짝수는 2, 4, 6의 3개이므로 확률은 $\\frac{3}{6}=\\frac{1}{2}$입니다.',
  },
  complement: {
    prompt: '공정한 주사위를 두 번 던질 때 적어도 한 번 6이 나올 확률은?',
    choices: ['$\\frac{1}{6}$', '$\\frac{5}{18}$', '$\\frac{11}{36}$', '$\\frac{25}{36}$'], answer: 'C',
    explanation: '한 번도 6이 나오지 않을 확률은 $(\\frac{5}{6})^2$이므로 구하는 확률은 $1-\\frac{25}{36}=\\frac{11}{36}$입니다.',
  },
  disjoint: {
    prompt: '주사위 한 개를 던질 때 두 사건 $A$: 홀수의 눈, $B$: 짝수의 눈 사이의 관계는?',
    choices: ['서로 배반이다.', '서로 독립이다.', '$A$가 $B$에 포함된다.', '항상 동시에 일어난다.'], answer: 'A',
    explanation: '한 번의 시행에서 홀수와 짝수가 동시에 나올 수 없으므로 $A\\cap B=\\varnothing$인 배반사건입니다.',
  },
  addition: {
    prompt: '$P(A)=0.5$, $P(B)=0.4$, $P(A\\cap B)=0.2$일 때 $P(A\\cup B)$는?',
    choices: ['0.3', '0.5', '0.7', '0.9'], answer: 'C',
    explanation: '확률의 덧셈정리에 따라 $P(A\\cup B)=0.5+0.4-0.2=0.7$입니다.',
  },
  multiplication: {
    prompt: '$P(A)=\\frac{1}{2}$이고 $P(B\\mid A)=\\frac{1}{3}$일 때 $P(A\\cap B)$는?',
    choices: ['$\\frac{1}{6}$', '$\\frac{1}{3}$', '$\\frac{1}{2}$', '$\\frac{5}{6}$'], answer: 'A',
    explanation: '곱셈정리에 따라 $P(A\\cap B)=P(A)P(B\\mid A)=\\frac{1}{2}\\times\\frac{1}{3}=\\frac{1}{6}$입니다.',
  },
  conditional: {
    prompt: '52장의 카드에서 한 장을 뽑았다. 뽑은 카드가 빨간색이라는 조건에서 하트일 확률은?',
    choices: ['$\\frac{1}{4}$', '$\\frac{1}{3}$', '$\\frac{1}{2}$', '$\\frac{3}{4}$'], answer: 'C',
    explanation: '빨간색 카드 26장 중 하트가 13장이므로 조건부확률은 $\\frac{13}{26}=\\frac{1}{2}$입니다.',
  },
  independence: {
    prompt: '$P(A)=0.3$, $P(B)=0.4$, $P(A\\cap B)=0.12$일 때 두 사건 $A$, $B$에 대한 설명으로 옳은 것은?',
    choices: ['서로 독립이다.', '서로 배반이다.', '$A=B$이다.', '주어진 정보로 판단할 수 없다.'], answer: 'A',
    explanation: '$P(A)P(B)=0.3\\times0.4=0.12=P(A\\cap B)$이므로 두 사건은 독립입니다.',
  },
  'independent-trials': {
    prompt: '공정한 동전을 3번 던질 때 앞면이 정확히 2번 나올 확률은?',
    choices: ['$\\frac{1}{8}$', '$\\frac{1}{4}$', '$\\frac{3}{8}$', '$\\frac{1}{2}$'], answer: 'C',
    explanation: '앞면이 나올 두 번을 고르는 방법이 ${}_3C_2$가지이므로 ${}_3C_2(\\frac12)^3=\\frac38$입니다.',
  },
  'random-variable': {
    prompt: '확률변수에 대한 설명으로 가장 알맞은 것은?',
    choices: ['시행의 결과를 실수에 대응시키는 함수', '항상 같은 값을 갖는 상수', '확률의 총합', '표본공간의 원소 수'], answer: 'A',
    explanation: '확률변수는 표본공간의 각 결과에 하나의 실수를 대응시키는 함수입니다.',
  },
  discrete: {
    prompt: '다음 중 이산확률변수로 가장 알맞은 것은?',
    choices: ['학생의 키', '전구의 수명', '하루 동안 발생한 불량품의 개수', '물의 온도'], answer: 'C',
    explanation: '불량품의 개수는 0, 1, 2처럼 셀 수 있는 값을 가지므로 이산확률변수입니다.',
  },
  continuous: {
    prompt: '다음 중 연속확률변수로 가장 알맞은 것은?',
    choices: ['동전의 앞면 횟수', '학생의 키', '주사위의 눈', '가족 구성원 수'], answer: 'B',
    explanation: '키는 일정한 구간 안에서 연속적인 값을 가질 수 있으므로 연속확률변수입니다.',
  },
  pmf: {
    prompt: '이산확률변수 $X$의 확률질량함수 $p(x)$가 반드시 만족해야 하는 식은?',
    choices: ['$\\sum p(x)=0$', '$\\sum p(x)=1$', '$\\sum p(x)=x$', '$p(x)>1$'], answer: 'B',
    explanation: '가능한 모든 값에 대한 확률의 합은 반드시 1이어야 합니다.',
  },
  expected: {
    prompt: '공정한 주사위 한 개를 던져 나온 눈을 $X$라 할 때 $E(X)$는?',
    choices: ['3', '3.5', '4', '4.5'], answer: 'B',
    explanation: '$E(X)=\\frac{1+2+3+4+5+6}{6}=3.5$입니다.',
  },
  pdf: {
    prompt: '연속확률변수 $X$에 대하여 항상 성립하는 것은?',
    choices: ['$P(X=a)=0$', '$P(X=a)=1$', '$P(X<a)=0$', '$P(X>a)=0$'], answer: 'A',
    explanation: '연속확률변수는 한 점이 차지하는 면적이 0이므로 특정 값 하나를 가질 확률은 0입니다.',
  },
  binomial: {
    prompt: '$X\\sim B(10,0.3)$일 때 $E(X)$는?',
    choices: ['1', '3', '7', '10'], answer: 'B',
    explanation: '이항분포의 평균은 $np$이므로 $10\\times0.3=3$입니다.',
  },
  variance: {
    prompt: '$E(X)=2$, $E(X^2)=7$일 때 $V(X)$는?',
    choices: ['3', '4', '5', '9'], answer: 'A',
    explanation: '$V(X)=E(X^2)-[E(X)]^2=7-4=3$입니다.',
  },
  normal: {
    prompt: '정규분포의 성질로 옳은 것은?',
    choices: ['평균을 중심으로 좌우 대칭이다.', '항상 오른쪽으로 치우친다.', '값이 정수만 가능하다.', '평균과 중앙값은 항상 다르다.'], answer: 'A',
    explanation: '정규분포의 곡선은 평균을 중심으로 좌우 대칭이며 평균·중앙값·최빈값이 일치합니다.',
  },
  stddev: {
    prompt: '어떤 확률변수의 분산이 9일 때 표준편차는?',
    choices: ['3', '4.5', '9', '81'], answer: 'A',
    explanation: '표준편차는 분산의 양의 제곱근이므로 $\\sqrt9=3$입니다.',
  },
  'standard-normal': {
    prompt: '표준정규분포 $N(0,1)$의 평균과 분산을 순서대로 바르게 나타낸 것은?',
    choices: ['0, 0', '0, 1', '1, 0', '1, 1'], answer: 'B',
    explanation: '표준정규분포는 평균이 0이고 분산이 1인 정규분포입니다.',
  },
  standardization: {
    prompt: '$X\\sim N(70,10^2)$일 때 $X=80$에 대응하는 표준화 값 $Z$는?',
    choices: ['-1', '0', '1', '10'], answer: 'C',
    explanation: '$Z=\\frac{X-\\mu}{\\sigma}=\\frac{80-70}{10}=1$입니다.',
  },
  'normal-approx': {
    prompt: '$X\\sim B(100,0.5)$를 정규분포로 근사할 때 평균과 분산은?',
    choices: ['50, 5', '50, 25', '100, 25', '100, 50'], answer: 'B',
    explanation: '평균은 $np=50$, 분산은 $np(1-p)=25$이므로 $N(50,25)$로 근사합니다.',
  },
  'frequency-table': {
    prompt: '도수분포표에서 각 계급에 속하는 자료의 개수를 무엇이라 하는가?',
    choices: ['계급값', '도수', '상대도수', '계급의 크기'], answer: 'B',
    explanation: '각 계급에 포함된 자료의 개수를 그 계급의 도수라고 합니다.',
  },
  histogram: {
    prompt: '계급 구간을 가로축에 놓고 각 계급의 도수를 직사각형으로 나타낸 그래프는?',
    choices: ['히스토그램', '산점도', '원그래프', '줄기와 잎 그림'], answer: 'A',
    explanation: '연속된 계급 구간별 도수를 직사각형으로 나타낸 그래프가 히스토그램입니다.',
  },
  'frequency-polygon': {
    prompt: '도수분포다각형을 그릴 때 각 계급에서 점을 찍는 가로축의 위치는?',
    choices: ['계급의 최솟값', '계급의 최댓값', '계급값', '누적도수'], answer: 'C',
    explanation: '각 계급의 가운데 값인 계급값에 해당 도수만큼 높이의 점을 찍고 선분으로 연결합니다.',
  },
  average: {
    prompt: '자료 2, 4, 6의 평균은?',
    choices: ['3', '4', '5', '6'], answer: 'B',
    explanation: '평균은 $\\frac{2+4+6}{3}=4$입니다.',
  },
  median: {
    prompt: '자료 1, 3, 8, 10, 15의 중앙값은?',
    choices: ['3', '7', '8', '10'], answer: 'C',
    explanation: '크기순으로 나열된 5개 자료의 가운데인 세 번째 값 8이 중앙값입니다.',
  },
  mode: {
    prompt: '자료 1, 2, 2, 3, 5의 최빈값은?',
    choices: ['1', '2', '2.6', '3'], answer: 'B',
    explanation: '가장 많이 나타난 값은 두 번 나타난 2이므로 최빈값은 2입니다.',
  },
  spread: {
    prompt: '두 자료의 평균이 같을 때 분산이 더 큰 자료에 대한 설명으로 옳은 것은?',
    choices: ['자료가 평균 주변에 더 모여 있다.', '자료가 평균에서 더 넓게 퍼져 있다.', '자료의 개수가 반드시 더 많다.', '최빈값이 반드시 더 크다.'], answer: 'B',
    explanation: '분산은 자료가 평균에서 떨어진 정도를 나타내므로 분산이 클수록 더 넓게 퍼져 있습니다.',
  },
  scatter: {
    prompt: '산점도의 점들이 왼쪽 아래에서 오른쪽 위로 모여 있을 때 나타나는 경향은?',
    choices: ['양의 상관관계', '음의 상관관계', '상관관계가 없음', '인과관계가 확정됨'], answer: 'A',
    explanation: '한 변수가 커질수록 다른 변수도 커지는 경향은 양의 상관관계입니다.',
  },
  correlation: {
    prompt: '상관계수 $r=-0.9$에 대한 설명으로 가장 알맞은 것은?',
    choices: ['강한 양의 상관관계', '약한 양의 상관관계', '강한 음의 상관관계', '상관관계가 없음'], answer: 'C',
    explanation: '$r$이 -1에 가까우므로 강한 음의 선형 상관관계가 있습니다.',
  },
  population: {
    prompt: '어떤 조사에서 관심의 대상이 되는 전체 집단을 무엇이라 하는가?',
    choices: ['표본', '모집단', '변량', '계급'], answer: 'B',
    explanation: '조사하려는 대상 전체를 모집단이라고 합니다.',
  },
  'sample-survey': {
    prompt: '전국 고등학생의 평균 수면 시간을 추정하기 위한 가장 현실적인 방법은?',
    choices: ['모든 학생을 조사한다.', '일부 학생을 대표성 있게 뽑아 조사한다.', '한 학생만 조사한다.', '자료 없이 평균을 정한다.'], answer: 'B',
    explanation: '모집단 전체 조사가 어렵기 때문에 대표성 있는 표본을 뽑는 표본조사가 적합합니다.',
  },
  'random-sampling': {
    prompt: '모집단의 각 원소가 같은 확률로 표본에 뽑히도록 하는 추출 방법은?',
    choices: ['임의추출', '편의추출', '전수조사', '계통오차'], answer: 'A',
    explanation: '모집단의 각 원소가 같은 기회를 갖도록 뽑는 방법을 임의추출이라고 합니다.',
  },
  'sample-mean': {
    prompt: '표본 자료가 4, 6, 8, 10일 때 표본평균은?',
    choices: ['6', '7', '8', '9'], answer: 'B',
    explanation: '표본평균은 $\\frac{4+6+8+10}{4}=7$입니다.',
  },
  'sample-ratio': {
    prompt: '100명을 조사했더니 40명이 찬성했다. 표본비율은?',
    choices: ['0.04', '0.4', '0.6', '40'], answer: 'B',
    explanation: '표본비율은 표본에서 해당 특성을 가진 비율이므로 $\\frac{40}{100}=0.4$입니다.',
  },
  confidence: {
    prompt: '같은 방법으로 95% 신뢰구간을 반복해서 만들 때의 해석으로 가장 알맞은 것은?',
    choices: ['모든 구간이 모평균을 포함한다.', '만들어진 구간의 약 95%가 모평균을 포함한다.', '모평균이 항상 구간의 가운데에 있다.', '표본의 95%가 구간 안에 있다.'], answer: 'B',
    explanation: '같은 표본추출과 구간추정 절차를 반복하면 만들어진 신뢰구간 중 약 95%가 참 모수를 포함한다는 뜻입니다.',
  },
};
