/** Original teaching examples based on the supplied reference, not textbook page copies. */
export type LessonDiagram = 'dice' | 'events' | 'complement' | 'partition' | 'addition' | 'conditional' | 'multiplication' | 'neither';
export type LessonStep = {
  title: string;
  paragraphs: string[];
  diagram?: LessonDiagram;
  formulas?: string[];
  takeaway: string;
};
export type ConceptLesson = { lead: string; steps: LessonStep[] };
const text = String.raw;

export const CONCEPT_LESSONS: Record<string, ConceptLesson> = {
  'c-events': {
    lead: '가능한 결과 전체와, 그중 우리가 찾는 결과를 구분해요.',
    steps: [
      {
        title: '주사위 한 번에서 나올 수 있는 결과',
        paragraphs: ['주사위 한 개를 던지는 일을 시행이라고 해요. 결과는 아직 모르지만, 나올 수 있는 눈은 1부터 6까지예요.', '이처럼 가능한 결과를 모두 모은 집합이 표본공간 S예요. 그중 특정 조건을 만족하는 결과를 모으면 사건이 돼요.'],
        diagram: 'dice',
        formulas: [text`$S=\{1,2,3,4,5,6\}$`, text`$A=\{2,4,6\}$: 짝수 눈이 나오는 사건`],
        takeaway: '결과 하나는 4, 사건 A는 {2, 4, 6}, 표본공간 S는 가능한 결과 전체예요.',
      },
      {
        title: '두 사건을 합치거나, 공통 부분만 찾거나',
        paragraphs: ['A를 짝수 눈, B를 3의 배수 눈이 나오는 사건이라고 해 볼게요. 아래 버튼으로 찾는 부분을 바꿔 보세요.', text`$A\cup B$는 A 또는 B 중 적어도 하나를 만족하는 결과예요. 둘 다 만족하는 결과도 포함해요. $A\cap B$는 두 조건을 모두 만족하는 결과예요.`],
        diagram: 'events',
        formulas: [text`$A\cup B=\{2,3,4,6\}$`, text`$A\cap B=\{6\}$`],
        takeaway: '합집합은 둘 중 적어도 하나, 교집합은 둘 다예요. ‘또는’이 ‘둘 다’를 제외하는 말은 아니에요.',
      },
      {
        title: '확률은 전체 중에서 차지하는 비율',
        paragraphs: ['공정한 주사위라면 여섯 눈이 나올 가능성이 모두 같아요. 이때 사건의 결과 개수를 전체 결과 개수로 나누면 확률을 구할 수 있어요.', '짝수 눈은 2, 4, 6의 세 가지예요. 전체 여섯 가지 중 세 가지이므로 확률은 1/2이에요.'],
        diagram: 'dice',
        formulas: [text`$P(A)=\frac{n(A)}{n(S)}=\frac36=\frac12$`, text`$0\le P(A)\le1$`],
        takeaway: '개수로 계산하는 공식은 각 결과의 가능성이 같을 때 써요. 항상 일어나는 사건의 확률은 1, 불가능한 사건의 확률은 0이에요.',
      },
    ],
  },
  'c-complement': {
    lead: '‘일어나지 않는 경우’를 세면 원하는 확률을 더 쉽게 구할 수 있어요.',
    steps: [
      {
        title: 'A가 아닌 나머지가 여사건',
        paragraphs: [text`사건 A가 일어나지 않는 사건을 $A^c$라고 써요. 그림에서 A의 바깥 부분이에요.`, 'A와 A의 여사건은 겹치지 않아요. 둘을 합치면 가능한 결과 전체가 되므로 확률의 합은 1이에요.'],
        diagram: 'complement',
        formulas: [text`$P(A)+P(A^c)=1$`, text`$P(A^c)=1-P(A)$`],
        takeaway: '전체를 기준으로 한 여사건은 1에서 빼요.',
      },
      {
        title: '알고 있는 쪽을 전체에서 빼기',
        paragraphs: [text`$P(A)=\frac25$라면 A가 아닌 나머지의 확률을 구해 볼게요. 전체 1을 같은 분모인 $\frac55$로 쓰면 계산이 보여요.`],
        diagram: 'complement',
        formulas: [text`$P(A^c)=1-\frac25=\frac55-\frac25=\frac35$`],
        takeaway: '여사건은 확률을 뒤집는 게 아니에요. 전체 1에서 해당 사건의 확률을 빼는 거예요.',
      },
      {
        title: 'B 안에서도 A와 A가 아닌 부분으로 나눌 수 있어요',
        paragraphs: [text`B라는 영역 안을 보면, A에도 속하는 $A\cap B$와 A에는 속하지 않는 $A^c\cap B$로 나뉘어요. 두 부분은 겹치지 않아요.`, '여기서 빼는 기준은 전체 1이 아니라 B의 확률이에요.'],
        diagram: 'partition',
        formulas: [text`$P(A^c\cap B)=P(B)-P(A\cap B)$`],
        takeaway: '전체의 나머지인지, B 안의 나머지인지 먼저 확인해요.',
      },
    ],
  },
  'c-addition': {
    lead: '겹치는 부분을 몇 번 셌는지 보면 더하고 빼는 이유가 보여요.',
    steps: [
      {
        title: '그냥 더하면 공통 부분을 두 번 세요',
        paragraphs: ['A의 확률에는 공통 부분이 들어 있고, B의 확률에도 같은 공통 부분이 들어 있어요. 두 확률을 그대로 더하면 그 부분만 두 번 세게 돼요.', '아래에서 A와 B를 각각 세어 본 뒤, 겹침을 한 번 빼 보세요.'],
        diagram: 'addition',
        formulas: [text`$P(A\cup B)=P(A)+P(B)-P(A\cap B)$`],
        takeaway: '둘을 합친 확률은 각 확률을 더한 뒤, 두 번 센 교집합을 한 번 빼요.',
      },
      {
        title: '겹치지 않는 부분이라면 바로 더해요',
        paragraphs: [text`A를 B 안쪽의 $A\cap B$와 B 바깥쪽의 $A\cap B^c$로 나눠 보세요. 두 부분은 동시에 속할 수 없어요.`, '이처럼 서로 겹치지 않는 사건을 배반사건이라고 해요. 교집합의 확률이 0이므로, 뺄 것이 없이 그대로 더하면 돼요.'],
        diagram: 'partition',
        formulas: [text`$P(A)=P(A\cap B)+P(A\cap B^c)$`],
        takeaway: '겹침이 없으면 더하기만 해요. 여사건과 원래 사건도 서로 겹치지 않아요.',
      },
      {
        title: '합친 영역에서 B를 통째로 빼면?',
        paragraphs: [text`$A\cup B$에서 B 전체를 빼면, A 중에서 B 바깥에 있는 $A\cap B^c$만 남아요. 교집합도 B에 포함되어 있으니 함께 빠져요.`],
        diagram: 'partition',
        formulas: [text`$P(A\cap B^c)=P(A\cup B)-P(B)$`],
        takeaway: '공식을 외우기 전에, 남겨야 하는 영역이 어디인지 먼저 찾아요.',
      },
    ],
  },
  'c-conditional': {
    lead: '조건이 주어지면, 확률을 구할 때 전체로 보는 범위가 달라져요.',
    steps: [
      {
        title: '12명 전체가 아니라, B인 사람 안에서 보기',
        paragraphs: ['12명 중 A인 사람은 6명, B인 사람은 8명, 둘 다인 사람은 4명이에요. 한 사람을 같은 가능성으로 뽑는다고 할게요.', '뽑힌 사람이 B라는 사실을 알고 있다면, 이제 B인 8명만 후보로 봐요. 그중 A이기도 한 사람은 4명이에요.'],
        diagram: 'conditional',
        formulas: [text`$P(A\mid B)=\frac48=\frac12$`],
        takeaway: '조건 밖의 사람은 후보에서 빠져요. 조건 안에 남은 사람을 새로운 전체로 봐요.',
      },
      {
        title: '조건을 바꾸면 분모도 바뀌어요',
        paragraphs: ['이번에는 A라는 사실을 알고 있다고 해 볼게요. 후보는 A인 6명이 되고, 그중 B이기도 한 사람은 여전히 4명이에요.', '공통 부분은 같아도 전체로 보는 범위가 달라서 두 조건부확률은 같지 않을 수 있어요.'],
        diagram: 'conditional',
        formulas: [text`$P(A\mid B)=\frac48=\frac12$`, text`$P(B\mid A)=\frac46=\frac23$`],
        takeaway: '세로 막대 오른쪽의 사건이 조건이에요. 그 사건이 분모가 돼요.',
      },
      {
        title: '개수가 없어도 확률로 같은 비율을 구해요',
        paragraphs: ['공통 부분의 개수와 조건 사건의 개수를 각각 전체 개수로 나누어도, 두 값의 비율은 그대로예요.', text`따라서 개수 대신 확률이 주어졌다면 $P(A\cap B)$를 $P(B)$로 나눠요. 조건 사건의 확률은 0보다 커야 해요.`],
        formulas: [text`$\frac48=\frac{4/12}{8/12}$`, text`$P(A\mid B)=\frac{P(A\cap B)}{P(B)}$`, text`$P(B)>0$`],
        takeaway: '조건 사건이 여사건이면 그 여사건의 확률이 분모예요. 예를 들어 P(A | Bᶜ)는 P(Bᶜ)로 나눠요.',
      },
    ],
  },
  'c-multiplication': {
    lead: '조건부확률로 알게 된 비율을 원래 전체의 확률로 돌려놓아요.',
    steps: [
      {
        title: 'A 안에서의 비율을 전체로 돌리기',
        paragraphs: ['12명 중 A인 사람은 6명이고, 그 6명 중 B이기도 한 사람은 4명이에요.', '전체에서 A가 차지하는 비율에, A 안에서 B가 차지하는 비율을 곱하면 둘 다인 사람이 전체에서 차지하는 비율이 돼요.'],
        diagram: 'multiplication',
        formulas: [text`$\frac6{12}\times\frac46=\frac4{12}=\frac13$`],
        takeaway: '‘전체 중 A’ × ‘A 중 B’ = ‘전체 중 A와 B 모두’예요.',
      },
      {
        title: '조건부확률의 식을 옮기면 곱셈정리',
        paragraphs: [text`$P(B\mid A)$의 분모는 $P(A)$예요. 양변에 $P(A)$를 곱하면 교집합의 확률이 남아요. B를 기준으로 시작해도 같은 공통 부분을 구할 수 있어요.`],
        formulas: [text`$P(B\mid A)=\frac{P(A\cap B)}{P(A)}$`, text`$P(A\cap B)=P(A)P(B\mid A)$`, text`$P(A\cap B)=P(B)P(A\mid B)$`],
        takeaway: '기준 사건의 확률과, 그 사건을 조건으로 한 확률을 짝지어 곱해요. 사용한 조건 사건의 확률은 0보다 커야 해요.',
      },
      {
        title: '조건부확률을 그냥 P(B)로 바꾸지 않기',
        paragraphs: [text`$P(A)=\frac12$, $P(B\mid A)=\frac13$이라면 두 사건이 모두 일어날 확률은 아래처럼 구해요.`, text`$P(B\mid A)$는 A라는 조건 안의 확률이고, $P(B)$는 원래 전체에서의 확률이에요. 문제에서 같다고 보장하지 않았다면 바꿔 쓸 수 없어요.`],
        formulas: [text`$P(A\cap B)=\frac12\times\frac13=\frac16$`],
        takeaway: '이번 문제들에는 독립이라는 조건이 없어요. 조건부확률을 그대로 사용해요.',
      },
    ],
  },
};

export const DICE_OUTCOMES = [1, 2, 3, 4, 5, 6] as const;
export type DiceEvent = 'all' | 'A' | 'B' | 'union' | 'intersection';
export function inDiceEvent(value: number, event: DiceEvent): boolean {
  const a = value % 2 === 0, b = value % 3 === 0;
  return event === 'all' || (event === 'A' ? a : event === 'B' ? b : event === 'union' ? a || b : a && b);
}

// A: 6 people; B: 8 people; intersection: 4. All 12 have equal selection chances.
export const EXAMPLE_PEOPLE = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, a: i < 6, b: i < 4 || (i >= 6 && i < 10) }));
export type ReferenceGroup = 'all' | 'A' | 'B';
export function referenceCounts(group: ReferenceGroup) {
  const selected = EXAMPLE_PEOPLE.filter(person => group === 'all' || (group === 'A' ? person.a : person.b));
  const matches = selected.filter(person => group === 'A' ? person.b : person.a);
  return { total: selected.length, matches: matches.length, ids: selected.map(person => person.id) };
}

export const ADDITION_REGIONS = { aOnly: 3, both: 2, bOnly: 2, neither: 3 } as const;
