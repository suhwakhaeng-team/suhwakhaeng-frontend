import { CONCEPT_LESSONS, type ConceptLesson } from './conditionalConceptLessons';

const t = String.raw;
export type UT3LearningSupport = { explanation: string; example: string; concepts: string[] };
// Worked examples use separate numbers; they teach the operation without solving the current goal.
export const UT3_LEARNING_SUPPORT: Record<string, UT3LearningSupport> = {
  'c-conditional': {
    explanation: t`조건부확률은 조건 안에서 다시 구하는 비율이에요. $P(A\mid B)$에서 막대 오른쪽의 B가 새로운 전체이므로 분모는 $P(B)$, 분자는 둘 다 일어나는 $P(A\cap B)$예요.`,
    example: t`예를 들어 20명 중 모자를 쓴 사람이 10명이고, 그중 안경도 쓴 사람이 3명이면 ‘모자를 쓴 사람 중 안경을 쓴 비율’은 $3/10$이에요. 전체 20명으로 나누지 않아요.`,
    concepts: ['c-conditional'],
  },
  'c-addition': {
    explanation: t`A와 B를 그대로 더하면 교집합을 두 번 세게 돼요. 합집합은 $P(A\cup B)=P(A)+P(B)-P(A\cap B)$로 구해요.`,
    example: t`예를 들어 $P(A)=2/5$, $P(B)=3/10$, $P(A\cap B)=1/10$이면 합집합은 $4/10+3/10-1/10=3/5$예요.`,
    concepts: ['c-addition'],
  },
  'c-complement': {
    explanation: t`‘A도 아니고 B도 아닌 경우’는 두 사건의 합집합 바깥이에요. 드모르간 법칙에 따라 $A^c\cap B^c=(A\cup B)^c$이므로 $P(A^c\cap B^c)=1-P(A\cup B)$예요.`,
    example: t`예를 들어 A 또는 B가 일어날 확률이 $3/5$이면 둘 다 일어나지 않을 확률은 $1-3/5=2/5$예요.`,
    concepts: ['c-complement'],
  },
  'p-relations': {
    explanation: t`교집합을 $x=P(A\cap B)$로 놓아요. $P(A\mid B)=x/P(B)$의 양변에 $P(B)$를 곱하면 $P(B)=x/P(A\mid B)$예요. 반대 조건으로는 $P(A)=x/P(B\mid A)$를 구해요.`,
    example: t`다른 예로 $P(A\mid B)=1/2$, $P(B\mid A)=2/3$이면 $P(B)=2x$, $P(A)=3x/2$예요. 따라서 $P(A)+P(B)=(7/2)x$로 나타낼 수 있어요.`,
    concepts: ['c-conditional'],
  },
  'p-restore': {
    explanation: t`먼저 두 조건부확률로 $P(A)$와 $P(B)$를 같은 교집합 x의 배수로 나타내요. 그다음 합집합 식 $P(A\cup B)=P(A)+P(B)-x$에 넣어 x를 구하고, 원하는 사건의 확률로 되돌려요.`,
    example: t`다른 예로 $P(A)=2x$, $P(B)=3x/2$, $P(A\cup B)=3/5$이면 $(2+3/2-1)x=3/5$예요. 따라서 $x=6/25$, $P(B)=(3/2)(6/25)=9/25$예요.`,
    concepts: ['c-conditional', 'c-addition'],
  },
  'p-denominator': {
    explanation: t`$P(A^c\mid B^c)$의 조건은 막대 오른쪽의 $B^c$예요. 따라서 분모는 $P(B)$가 아니라 $P(B^c)=1-P(B)$예요.`,
    example: t`예를 들어 $P(B)=2/5$라면 조건에 해당하는 분모는 $P(B^c)=1-2/5=3/5$예요.`,
    concepts: ['c-complement', 'c-conditional'],
  },
  'p-numerator': {
    explanation: t`분자는 조건과 구하려는 사건을 동시에 만족하는 부분이에요. 여기서는 $A^c\cap B^c$, 즉 A도 B도 아닌 부분이므로 $1-P(A\cup B)$로 구해요. 두 여사건의 확률을 임의로 곱하면 안 돼요.`,
    example: t`예를 들어 $P(A\cup B)=3/5$이면 분자는 $P(A^c\cap B^c)=1-3/5=2/5$예요.`,
    concepts: ['c-complement'],
  },
  'p-ratio': {
    explanation: t`조건 안에서의 비율로 마무리해요. $P(A^c\mid B^c)=P(A^c\cap B^c)/P(B^c)$이므로 ‘둘 다 아닌 부분’을 ‘B가 아닌 전체’로 나눠요.`,
    example: t`다른 예로 둘 다 아닌 부분의 확률이 $2/9$, B가 아닌 확률이 $2/3$이면 $(2/9)\div(2/3)=(2/9)(3/2)=1/3$이에요.`,
    concepts: ['c-conditional', 'c-complement'],
  },
  'bn-conditional': {
    explanation: t`이 문제는 세 개념을 연결해요. ① 조건부확률로 $P(A)$와 $P(B)$를 같은 교집합 x로 나타내기 ② 덧셈정리와 합집합 조건으로 x 구하기 ③ 여사건으로 분자·분모를 각각 구해 나누기예요.`,
    example: t`어디서 막혔는지 먼저 확인해 보세요. 조건을 식으로 옮기기 어렵다면 ‘조건부확률’, x를 구하기 어렵다면 ‘확률의 덧셈정리’, 둘 다 아닌 영역이 헷갈리면 ‘여사건과 드모르간’ 설명을 볼 수 있어요.`,
    concepts: ['c-conditional', 'c-addition', 'c-complement'],
  },
};

export const UT3_CONCEPT_LESSONS: Record<string, ConceptLesson> = {
  'c-conditional': CONCEPT_LESSONS['c-conditional'],
  'c-addition': CONCEPT_LESSONS['c-addition'],
  'c-complement': {
    lead: '‘아닌 부분’이 전체의 어디인지 그림으로 확인해요.',
    steps: [
      {
        title: '한 사건의 여사건은 전체 1에서 빼요',
        paragraphs: [t`사건 A가 일어나지 않는 경우를 $A^c$라고 써요. A 안쪽과 바깥쪽을 합치면 전체이므로 $P(A)+P(A^c)=1$이에요.`],
        diagram: 'complement', formulas: [t`$P(A^c)=1-P(A)$`, t`$P(A)=2/5$라면 $P(A^c)=3/5$`],
        takeaway: '여사건은 분수를 뒤집는 것이 아니라 전체에서 해당 부분을 빼는 거예요.',
      },
      {
        title: 'A도 B도 아닌 부분은 두 원의 바깥이에요',
        paragraphs: [t`$A^c\cap B^c$는 ‘A가 아니면서 B도 아닌 경우’예요. A 또는 B 중 하나라도 포함되는 $A\cup B$의 바깥과 같아요. 이것이 드모르간 법칙이에요.`],
        diagram: 'neither', formulas: [t`$A^c\cap B^c=(A\cup B)^c$`, t`$P(A^c\cap B^c)=1-P(A\cup B)$`],
        takeaway: '둘 다 아닌 부분을 구하려면 합집합의 확률을 1에서 빼요.',
      },
      {
        title: '분자와 조건에 해당하는 분모를 구분해요',
        paragraphs: [t`$P(A^c\mid B^c)$의 분자는 둘 다 아닌 부분, 분모는 B가 아닌 부분이에요. 두 값은 서로 다른 영역이에요.`, t`예를 들어 $P(A\cup B)=3/5$, $P(B)=2/5$이면 분자는 $2/5$, 분모는 $3/5$예요.`],
        diagram: 'neither', formulas: [t`$P(A^c\mid B^c)=\frac{1-P(A\cup B)}{1-P(B)}=\frac{2/5}{3/5}=\frac23$`],
        takeaway: '조건부확률의 막대 오른쪽 사건이 분모예요. 분자와 분모를 각각 구한 뒤 나눠요.',
      },
    ],
  },
};
