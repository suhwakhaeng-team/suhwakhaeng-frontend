import type { LearningGoal, LearningNode, LearningQuestion } from './problemLearningModel.ts';
export { parseProbabilityAnswer } from './conditionalProblemBreakdown.ts';

const t = String.raw;
const q = (prompt: string, answer: string, explanation: string): LearningQuestion => ({ prompt, answer, explanation, answerType: 'NUMBER' });
const nodes: LearningNode[] = [
  { id: 'c-conditional', label: '조건부확률', kind: 'concept', conceptId: '17', requires: [],
    note: t`조건부확률에서는 오른쪽 사건이 기준이 되어 분모에 와요.
$P(A\mid B)=\frac{P(A\cap B)}{P(B)}$, $P(B\mid A)=\frac{P(A\cap B)}{P(A)}$
두 식의 교집합은 같지만 분모는 달라요. $x=P(A\cap B)>0$으로 놓으면 각 사건의 확률을 x로 나타낼 수 있어요.`, questions: [
      q(t`$P(B)=\frac47$, $P(A\cap B)=\frac27$일 때 $P(A\mid B)$를 구하시오.`, '1/2', t`조건 사건 B의 확률로 나누면 $\frac{2/7}{4/7}=\frac12$입니다.`),
      q(t`$P(B)=\frac59$, $P(A\cap B)=\frac13$일 때 $P(A\mid B)$를 구하시오.`, '3/5', t`$\frac{1/3}{5/9}=\frac35$입니다.`),
    ] },
  { id: 'c-addition', label: '확률의 덧셈정리', kind: 'concept', conceptId: '16', requires: [],
    note: t`두 사건을 더하면 교집합을 두 번 세므로 한 번 빼요.
$P(A\cup B)=P(A)+P(B)-P(A\cap B)$
각 확률을 같은 미지수 x로 나타냈다면, 이 식에 대입해 x를 구할 수 있어요.`, questions: [
      q(t`$P(A)=\frac23$, $P(B)=\frac12$, $P(A\cap B)=\frac13$일 때 $P(A\cup B)$를 구하시오.`, '5/6', t`$\frac23+\frac12-\frac13=\frac56$입니다.`),
      q(t`$P(A)=\frac34$, $P(B)=\frac25$, $P(A\cap B)=\frac15$일 때 $P(A\cup B)$를 구하시오.`, '19/20', t`$\frac34+\frac25-\frac15=\frac{19}{20}$입니다.`),
    ] },
  { id: 'c-complement', label: '여사건과 드모르간', kind: 'concept', conceptId: '13', requires: [],
    note: t`어떤 사건이 일어나지 않을 확률은 1에서 그 사건의 확률을 빼요.
$P(B^c)=1-P(B)$
A도 B도 일어나지 않는 부분은 합집합 전체의 바깥이에요. 드모르간 법칙에 따라 $A^c\cap B^c=(A\cup B)^c$이므로
$P(A^c\cap B^c)=1-P(A\cup B)$입니다.`, questions: [
      q(t`$P(A\cup B)=\frac58$일 때 $P(A^c\cap B^c)$를 구하시오.`, '3/8', t`$A^c\cap B^c=(A\cup B)^c$이므로 $1-\frac58=\frac38$입니다.`),
      q(t`$P(A\cup B)=\frac79$일 때 $P(A^c\cap B^c)$를 구하시오.`, '2/9', t`$1-\frac79=\frac29$입니다.`),
    ] },
  { id: 'p-relations', label: '조건부확률을 관계식으로', kind: 'AN', requires: ['c-conditional'], questions: [
    q(t`$P(A\mid B)=\frac34$, $P(B\mid A)=\frac23$이다. $x=P(A\cap B)>0$일 때 $P(A)+P(B)=kx$를 만족하는 k를 구하시오.`, '17/6', t`$\frac{x}{P(B)}=\frac34$에서 $P(B)=\frac43x$, $\frac{x}{P(A)}=\frac23$에서 $P(A)=\frac32x$입니다. 따라서 $k=\frac43+\frac32=\frac{17}{6}$입니다.`),
    q(t`$P(A\mid B)=\frac35$, $P(B\mid A)=\frac23$이다. $x=P(A\cap B)>0$일 때 $P(A)+P(B)=kx$를 만족하는 k를 구하시오.`, '19/6', t`$P(B)=\frac53x$, $P(A)=\frac32x$이므로 $k=\frac{19}{6}$입니다.`),
  ] },
  { id: 'p-restore', label: '합집합 조건으로 확률 복원', kind: 'AN', requires: ['p-relations', 'c-addition'], questions: [
    q(t`$P(A\mid B)=\frac34$, $P(B\mid A)=\frac23$, $P(A\cup B)=\frac{11}{15}$이다. $P(B)$를 구하시오.`, '8/15', t`$x=P(A\cap B)$로 놓으면 $P(A)=\frac32x$, $P(B)=\frac43x$입니다. 덧셈정리로 $\frac{11}{6}x=\frac{11}{15}$이므로 $x=\frac25$, $P(B)=\frac43\times\frac25=\frac8{15}$입니다.`),
    q(t`$P(A\mid B)=\frac35$, $P(B\mid A)=\frac23$, $P(A\cup B)=\frac{13}{20}$이다. $P(B)$를 구하시오.`, '1/2', t`$P(A)=\frac32x$, $P(B)=\frac53x$이므로 $\frac{13}{6}x=\frac{13}{20}$입니다. $x=\frac3{10}$, $P(B)=\frac53\times\frac3{10}=\frac12$입니다.`),
  ] },
  { id: 'p-denominator', label: '분모 · B의 여사건', kind: 'AN', requires: ['p-restore', 'c-complement'], questions: [
    q(t`$P(B)=\frac8{15}$이다. $P(A^c\mid B^c)$의 분모인 $P(B^c)$를 구하시오.`, '7/15', t`$1-\frac8{15}=\frac7{15}$입니다.`),
    q(t`$P(B)=\frac12$이다. $P(A^c\mid B^c)$의 분모인 $P(B^c)$를 구하시오.`, '1/2', t`$1-\frac12=\frac12$입니다.`),
  ] },
  { id: 'p-numerator', label: '분자 · 합집합의 바깥', kind: 'AN', requires: ['c-complement'], questions: [
    q(t`$P(A\cup B)=\frac{11}{15}$이다. $P(A^c\mid B^c)$의 분자인 $P(A^c\cap B^c)$를 구하시오.`, '4/15', t`합집합의 여사건이므로 $1-\frac{11}{15}=\frac4{15}$입니다.`),
    q(t`$P(A\cup B)=\frac{13}{20}$이다. $P(A^c\cap B^c)$를 구하시오.`, '7/20', t`$1-\frac{13}{20}=\frac7{20}$입니다.`),
  ] },
  { id: 'p-ratio', label: '분자와 분모로 확률 완성', kind: 'AN', requires: ['p-denominator', 'p-numerator'], questions: [
    q(t`$P(A^c\cap B^c)=\frac4{15}$, $P(B^c)=\frac7{15}$이다. $P(A^c\mid B^c)$를 구하시오.`, '4/7', t`조건 사건은 $B^c$이므로 $\frac{P(A^c\cap B^c)}{P(B^c)}=\frac{4/15}{7/15}=\frac47$입니다.`),
    q(t`$P(A^c\cap B^c)=\frac7{20}$, $P(B^c)=\frac12$이다. $P(A^c\mid B^c)$를 구하시오.`, '7/10', t`$\frac{7/20}{1/2}=\frac7{10}$입니다.`),
  ] },
  { id: 'bn-conditional', label: '두 조건부확률로 여사건 추론', kind: 'BN', requires: ['p-ratio'], questions: [
    q(t`두 사건 A, B에 대하여 $P(A\mid B)=\frac34$, $P(B\mid A)=\frac23$, $P(A\cup B)=\frac{11}{15}$일 때 $P(A^c\mid B^c)$를 구하시오.`, '4/7', t`$x=P(A\cap B)$로 놓으면 $P(A)=\frac32x$, $P(B)=\frac43x$입니다. $\frac{11}{6}x=\frac{11}{15}$에서 $x=\frac25$, $P(B)=\frac8{15}$입니다. 분모는 $\frac7{15}$, 분자는 $1-\frac{11}{15}=\frac4{15}$이므로 답은 $\frac47$입니다.`),
    q(t`두 사건 A, B에 대하여 $P(A\mid B)=\frac35$, $P(B\mid A)=\frac23$, $P(A\cup B)=\frac{13}{20}$일 때 $P(A^c\mid B^c)$를 구하시오.`, '7/10', t`$P(A)=\frac32x$, $P(B)=\frac53x$에서 $\frac{13}{6}x=\frac{13}{20}$, $x=\frac3{10}$입니다. $P(B)=\frac12$, 분모는 $\frac12$, 분자는 $\frac7{20}$이므로 답은 $\frac7{10}$입니다.`),
  ] },
];
export const UT4_NODES: Record<string, LearningNode> = Object.fromEntries(nodes.map(node => [node.id, node]));
export const UT4_GOALS: LearningGoal[] = [{ id: 'conditional-inference', title: '두 조건부확률로 여사건 추론', domain: '조건부확률', rootId: 'bn-conditional', positions: {
  'c-conditional': [0, 0], 'c-addition': [1, 3], 'c-complement': [0, 5],
  'p-relations': [1, 0], 'p-restore': [2, 1], 'p-denominator': [3, 1],
  'p-numerator': [3, 5], 'p-ratio': [4, 3], 'bn-conditional': [5, 3],
} }];
const item = (id: string, nodeId: string, prompt: string, answer: string, group = 'foundation') => ({ id, nodeId, prompt, answer, group });
export function ut4Assessment(form: 'A' | 'B') {
  const b = form === 'B';
  return [
    item('conditional', 'c-conditional', b ? t`$P(B)=\frac58$, $P(A\cap B)=\frac14$일 때 $P(A\mid B)$를 구하시오.` : t`$P(B)=\frac35$, $P(A\cap B)=\frac15$일 때 $P(A\mid B)$를 구하시오.`, b ? '2/5' : '1/3'),
    item('addition', 'c-addition', b ? t`$P(A)=\frac58$, $P(B)=\frac13$, $P(A\cap B)=\frac14$일 때 $P(A\cup B)$를 구하시오.` : t`$P(A)=\frac35$, $P(B)=\frac12$, $P(A\cap B)=\frac14$일 때 $P(A\cup B)$를 구하시오.`, b ? '17/24' : '17/20'),
    item('complement', 'c-complement', b ? t`$P(A\cup B)=\frac{11}{16}$일 때 $P(A^c\cap B^c)$를 구하시오.` : t`$P(A\cup B)=\frac7{10}$일 때 $P(A^c\cap B^c)$를 구하시오.`, b ? '5/16' : '3/10'),
    item('application', 'bn-conditional', b ? t`두 사건 A, B에 대하여 $P(A\mid B)=\frac35$, $P(B\mid A)=\frac34$, $P(A\cup B)=\frac45$일 때 $P(A^c\mid B^c)$를 구하시오.` : t`두 사건 A, B에 대하여 $P(A\mid B)=\frac12$, $P(B\mid A)=\frac23$, $P(A\cup B)=\frac34$일 때 $P(A^c\mid B^c)$를 구하시오.`, b ? '3/5' : '5/8', 'application'),
    item('extension-reverse', 'bn-conditional', t`$P(B)=\frac25$, $P(A\mid B)=\frac14$, $P(A^c\cap B^c)=\frac3{10}$일 때 $P(B\mid A)$를 구하시오.`, '1/4', 'extension'),
    item('extension-complement', 'bn-conditional', t`$P(A)=\frac25$, $P(B)=\frac12$, $P(A\mid B)=\frac12$일 때 $P(A^c\mid B^c)$를 구하시오.`, '7/10', 'extension'),
  ];
}
export const UT4_BANK = { version: 1, forms: { A: ut4Assessment('A'), B: ut4Assessment('B') }, nodes: UT4_NODES };
