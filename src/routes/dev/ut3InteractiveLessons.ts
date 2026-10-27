const t = String.raw;
export type RegionId = 'a-only' | 'both' | 'b-only' | 'neither';
export type ActivityGroup = { id: string; label: string; multiple?: boolean; options: { id: string; label: string }[]; correct: string[] };
export type LessonActivity = { title: string; task: string; visual: 'people' | 'regions' | 'formula'; groups: ActivityGroup[]; hint: string; explanation: string; formula: string };
export const REGION_OPTIONS = [
  { id: 'a-only', label: 'A에만 속한 부분' }, { id: 'both', label: 'A와 B의 공통 부분' },
  { id: 'b-only', label: 'B에만 속한 부분' }, { id: 'neither', label: 'A도 B도 아닌 부분' },
];
const bases = [{ id: 'all', label: '전체 12명' }, { id: 'A', label: 'A인 6명' }, { id: 'B', label: 'B인 8명' }];
const probabilities = [{ id: 'AB', label: 'P(A ∩ B)' }, { id: 'union', label: 'P(A ∪ B)' }, { id: 'A', label: 'P(A)' }, { id: 'B', label: 'P(B)' }];
const fractions = [{ id: '2/10', label: '2/10' }, { id: '3/10', label: '3/10' }, { id: '4/10', label: '4/10' }, { id: '6/10', label: '6/10' }];

export const UT3_INTERACTIVE_LESSONS: Record<string, LessonActivity[]> = {
  'c-conditional': [
    { title: '조건이 되는 사람만 남겨 보세요', task: 'A는 안경을 쓴 사람, B는 모자를 쓴 사람이에요. P(A | B)를 구할 때 누구를 새로운 전체로 봐야 할까요?', visual: 'people',
      groups: [{ id: 'base', label: '새로운 전체 선택', options: bases, correct: ['B'] }],
      hint: '막대 오른쪽 B가 이미 주어진 조건이에요. B 밖의 사람은 후보에서 제외해 보세요.',
      explanation: 'B인 8명만 남기면, 그중 A에도 속하는 사람은 4명이에요. 분모는 처음의 12명이 아니라 8명이 돼요.', formula: t`$P(A\mid B)=\frac48=\frac12$` },
    { title: '조건을 반대로 바꿔 보세요', task: '이번에는 P(B | A)를 구해요. 같은 12명에서 새로운 전체를 다시 골라 보세요.', visual: 'people',
      groups: [{ id: 'base', label: '새로운 전체 선택', options: bases, correct: ['A'] }],
      hint: '이번 막대 오른쪽은 A예요. 공통인 4명은 같아도 기준이 되는 사람 수는 바뀌어요.',
      explanation: 'A인 6명 안에서 B에도 속하는 4명을 찾아요. 조건을 바꾸면 분모가 달라져서 두 조건부확률이 같지 않을 수 있어요.', formula: t`$P(B\mid A)=\frac46=\frac23\ne P(A\mid B)$` },
    { title: '직접 조건부확률 식을 완성해 보세요', task: '개수가 아니라 확률로 주어져도 기준은 같아요. P(A | B)의 분자와 분모를 골라 보세요.', visual: 'formula',
      groups: [{ id: 'numerator', label: '분자 선택', options: probabilities, correct: ['AB'] }, { id: 'denominator', label: '분모 선택', options: probabilities, correct: ['B'] }],
      hint: '분자는 A와 B를 동시에 만족하는 부분, 분모는 조건 B의 전체예요.',
      explanation: '공통 부분을 조건에 해당하는 전체로 나눠요. 조건 사건의 확률은 0보다 커야 해요.', formula: t`$P(A\mid B)=\frac{P(A\cap B)}{P(B)},\quad P(B)>0$` },
  ],
  'c-addition': [
    { title: 'A 또는 B에 속한 영역을 골라 보세요', task: '10가지 결과의 확률이 모두 같아요. A ∪ B에 포함되는 부분을 모두 선택해 보세요. 그림이나 아래 버튼을 누를 수 있어요.', visual: 'regions',
      groups: [{ id: 'region', label: '합집합 영역 선택', multiple: true, options: REGION_OPTIONS, correct: ['a-only', 'both', 'b-only'] }],
      hint: '‘또는’은 둘 다 만족하는 경우도 포함해요. 두 사건 중 적어도 하나에 속하는 부분을 찾아보세요.',
      explanation: 'A에만 있는 3가지, 둘 다인 2가지, B에만 있는 2가지를 한 번씩 합쳐요. 둘 다 아닌 3가지는 빠져요.', formula: t`$P(A\cup B)=\frac{3+2+2}{10}=\frac7{10}$` },
    { title: '교집합을 몇 번 세었는지 찾아보세요', task: 'A의 5/10과 B의 4/10을 그대로 더했어요. 공통 부분은 몇 번 세었고, 어떻게 고쳐야 할까요?', visual: 'regions',
      groups: [{ id: 'count', label: '공통 부분을 센 횟수', options: [{ id: '1', label: '1번' }, { id: '2', label: '2번' }], correct: ['2'] },
        { id: 'adjust', label: '고치는 방법', options: [{ id: 'add', label: '공통 부분을 한 번 더하기' }, { id: 'subtract', label: '공통 부분을 한 번 빼기' }], correct: ['subtract'] }],
      hint: '공통 부분 2/10은 A에도 들어 있고 B에도 들어 있어요. 한 번만 남기려면 어떻게 해야 할까요?',
      explanation: '두 번 센 공통 부분을 한 번 빼면 모든 영역을 한 번씩 세게 돼요.', formula: t`$\frac5{10}+\frac4{10}-\frac2{10}=\frac7{10}$` },
    { title: '덧셈정리를 완성해 보세요', task: 'P(A ∪ B) = P(A) + P(B) □ P(A ∩ B). 빈칸에 들어갈 연산을 골라 보세요.', visual: 'formula',
      groups: [{ id: 'operation', label: '교집합 앞의 연산', options: [{ id: '+', label: '+ 더하기' }, { id: '-', label: '− 빼기' }, { id: '*', label: '× 곱하기' }], correct: ['-'] }],
      hint: '교집합은 이미 두 번 더해졌어요. 한 번만 남기면 돼요.',
      explanation: '그래서 합집합의 확률은 두 사건의 확률을 더한 뒤 교집합을 한 번 빼요.', formula: t`$P(A\cup B)=P(A)+P(B)-P(A\cap B)$` },
  ],
  'c-complement': [
    { title: 'B가 아닌 영역을 직접 골라 보세요', task: '10가지 결과의 확률이 모두 같아요. Bᶜ에 속하는 부분을 모두 선택해 보세요. 그림이나 아래 버튼을 누를 수 있어요.', visual: 'regions',
      groups: [{ id: 'region', label: 'B의 여사건 영역 선택', multiple: true, options: REGION_OPTIONS, correct: ['a-only', 'neither'] }],
      hint: 'B 안에 있는 공통 부분과 B에만 있는 부분은 제외해요. B 바깥에는 무엇이 남을까요?',
      explanation: 'B 바깥에는 A에만 있는 3가지와 둘 다 아닌 3가지가 남아요. 전체에서 B의 확률을 빼도 같아요.', formula: t`$P(B^c)=1-\frac4{10}=\frac6{10}$` },
    { title: 'A도 B도 아닌 부분을 찾아보세요', task: '이번에는 Aᶜ ∩ Bᶜ에 속하는 영역을 선택해 보세요. 앞에서 선택한 Bᶜ와 같은 영역일까요?', visual: 'regions',
      groups: [{ id: 'region', label: '둘 다 아닌 영역 선택', multiple: true, options: REGION_OPTIONS, correct: ['neither'] }],
      hint: 'A에만 있는 부분도 A에는 속하므로 제외해야 해요. 두 원 모두의 바깥을 찾아보세요.',
      explanation: '둘 다 아닌 부분은 합집합 바깥과 같아요. 이것이 드모르간 법칙이에요. Bᶜ 전체와는 구분해요.', formula: t`$A^c\cap B^c=(A\cup B)^c,\quad P(A^c\cap B^c)=1-\frac7{10}=\frac3{10}$` },
    { title: '선택한 두 영역으로 식을 완성해 보세요', task: 'P(Aᶜ | Bᶜ)의 분자와 분모를 골라 보세요. 둘 다 아닌 부분은 3/10, B가 아닌 부분은 6/10이었어요.', visual: 'formula',
      groups: [{ id: 'numerator', label: '분자 선택', options: fractions, correct: ['3/10'] }, { id: 'denominator', label: '분모 선택', options: fractions, correct: ['6/10'] }],
      hint: '분자는 둘 다 아닌 부분, 분모는 조건 Bᶜ에 해당하는 전체예요. 두 영역을 바꾸어 넣지 않았는지 확인해 보세요.',
      explanation: '조건에 해당하는 Bᶜ 안에서 둘 다 아닌 부분이 차지하는 비율이에요.', formula: t`$P(A^c\mid B^c)=\frac{3/10}{6/10}=\frac12$` },
  ],
};

export function activityCorrect(activity: LessonActivity, answers: Record<string, string[]>): boolean {
  return activity.groups.every(group => {
    const chosen = answers[group.id] || [];
    return chosen.length === group.correct.length && group.correct.every(id => chosen.includes(id));
  });
}
