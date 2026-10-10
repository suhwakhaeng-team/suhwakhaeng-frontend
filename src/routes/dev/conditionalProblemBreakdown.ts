import type { LearningGoal, LearningNode, LearningQuestion } from './problemLearningModel.ts';

const q = (prompt: string, answer: string, explanation: string): LearningQuestion => ({ prompt, answer, explanation, answerType: 'NUMBER' });
const text = String.raw;
const nodes: LearningNode[] = [
  { id: 'c-events', label: '표본공간과 사건', kind: 'concept', conceptId: '108', requires: [],
    note: text`표본공간은 가능한 결과 전체이고, 사건은 그 안의 일부예요.
$A\cap B$는 A와 B가 모두 일어나는 부분, $A\cup B$는 둘 중 적어도 하나가 일어나는 부분이에요.
분수로 주어진 확률도 이 영역의 크기로 생각할 수 있어요.`, questions: [
      q('공정한 주사위 한 개를 한 번 던진다. 짝수 눈이 나올 확률을 구하시오.', '1/2', text`전체 결과는 6개이고 짝수는 2, 4, 6의 3개입니다. 각 결과의 가능성이 같으므로 $\frac36=\frac12$입니다.`),
      q('공정한 주사위 한 개를 한 번 던진다. 3의 배수 눈이 나올 확률을 구하시오.', '1/3', text`전체 6개의 결과 중 3의 배수는 3, 6의 2개입니다. $\frac26=\frac13$입니다.`),
    ] },
  { id: 'c-complement', label: '여사건', kind: 'concept', conceptId: '13', requires: ['c-events'],
    note: text`$A^c$는 A가 일어나지 않는 사건이에요. A와 A의 여사건은 겹치지 않고, 둘을 합하면 전체가 돼요.
$P(A^c)=1-P(A)$
같은 방식으로 B 안에서는 $A\cap B$와 $A^c\cap B$가 B를 둘로 나눠요.`, questions: [
      q(text`$P(A)=\frac25$일 때 $P(A^c)$를 구하시오.`, '3/5', text`$1-\frac25=\frac35$입니다.`),
      q(text`$P(A)=\frac14$일 때 $P(A^c)$를 구하시오.`, '3/4', text`$1-\frac14=\frac34$입니다.`),
    ] },
  { id: 'c-addition', label: '확률의 덧셈 정리', kind: 'concept', conceptId: '16', requires: ['c-events'],
    note: text`두 사건의 확률을 더하면 공통 부분을 두 번 세므로 한 번 빼요.
$P(A\cup B)=P(A)+P(B)-P(A\cap B)$
겹치지 않는 두 영역으로 나눈 경우에는 그대로 더해요.
$P(A)=P(A\cap B)+P(A\cap B^c)$`, questions: [
      q(text`$P(A)=\frac12$, $P(B)=\frac13$, $P(A\cap B)=\frac16$일 때 $P(A\cup B)$를 구하시오.`, '2/3', text`$\frac12+\frac13-\frac16=\frac23$입니다.`),
      q(text`$P(A)=\frac25$, $P(B)=\frac3{10}$, $P(A\cap B)=\frac1{10}$일 때 $P(A\cup B)$를 구하시오.`, '3/5', text`$\frac25+\frac3{10}-\frac1{10}=\frac35$입니다.`),
    ] },
  { id: 'c-conditional', label: '조건부확률', kind: 'concept', conceptId: '17', requires: ['c-events'],
    note: text`$P(A\mid B)$에서는 B가 일어났다는 조건이 있어요. 전체 대신 B 안에서 A의 비율을 구해요.
$P(A\mid B)=\frac{P(A\cap B)}{P(B)}\quad(P(B)>0)$
오른쪽 조건 사건이 분모예요. $P(B\mid A)$와 분모가 다르다는 점에 주의해요.`, questions: [
      q(text`$P(B)=\frac12$, $P(A\cap B)=\frac14$일 때 $P(A\mid B)$를 구하시오.`, '1/2', text`$\frac{1/4}{1/2}=\frac12$입니다. 조건 B의 확률로 나눕니다.`),
      q(text`$P(B)=\frac34$, $P(A\cap B)=\frac14$일 때 $P(A\mid B)$를 구하시오.`, '1/3', text`$\frac{1/4}{3/4}=\frac13$입니다.`),
    ] },
  { id: 'c-multiplication', label: '확률의 곱셈정리', kind: 'concept', conceptId: '18', requires: ['c-conditional'],
    note: text`조건부확률의 식 양변에 조건 사건의 확률을 곱해요.
$P(A\cap B)=P(A)P(B\mid A)$
독립이라는 조건이 없다면 $P(A)P(B)$로 바꾸면 안 돼요. 이번 세 문제에서도 독립을 가정하지 않아요.`, questions: [
      q(text`$P(A)=\frac12$, $P(B\mid A)=\frac13$일 때 $P(A\cap B)$를 구하시오.`, '1/6', text`$\frac12\times\frac13=\frac16$입니다.`),
      q(text`$P(A)=\frac34$, $P(B\mid A)=\frac25$일 때 $P(A\cap B)$를 구하시오.`, '3/10', text`$\frac34\times\frac25=\frac3{10}$입니다.`),
    ] },
  { id: 'p1-complement', label: '조건 사건의 확률 구하기', kind: 'AN', requires: ['c-complement'], questions: [
    q(text`$P(B)=\frac14$일 때, 조건 사건 $B^c$의 확률을 구하시오.`, '3/4', text`$P(B^c)=1-\frac14=\frac34$입니다.`),
    q(text`$P(B)=\frac25$일 때 $P(B^c)$를 구하시오.`, '3/5', text`$1-\frac25=\frac35$입니다.`),
  ] },
  { id: 'p1-outside', label: 'B 밖의 A 구하기', kind: 'AN', requires: ['c-addition', 'c-complement'], questions: [
    q(text`$P(A\cup B)=\frac58$, $P(B)=\frac14$이다. 합집합에서 B 전체를 제외한 $P(A\cap B^c)$를 구하시오.`, '3/8', text`$A\cup B$는 B와 $A\cap B^c$로 겹치지 않게 나뉩니다. 따라서 $\frac58-\frac14=\frac38$입니다.`),
    q(text`$P(A\cup B)=\frac34$, $P(B)=\frac12$일 때 $P(A\cap B^c)$를 구하시오.`, '1/4', text`$\frac34-\frac12=\frac14$입니다.`),
  ] },
  { id: 'p1-ratio', label: '여사건 안에서 비율 구하기', kind: 'AN', requires: ['p1-complement', 'p1-outside', 'c-conditional'], questions: [
    q(text`$P(A\cap B^c)=\frac38$, $P(B^c)=\frac34$일 때 $P(A\mid B^c)$를 구하시오.`, '1/2', text`$\frac{P(A\cap B^c)}{P(B^c)}=\frac{3/8}{3/4}=\frac12$입니다.`),
    q(text`$P(A\cap B^c)=\frac14$, $P(B^c)=\frac34$일 때 $P(A\mid B^c)$를 구하시오.`, '1/3', text`$\frac{1/4}{3/4}=\frac13$입니다.`),
  ] },
  { id: 'bn-1', label: '여사건을 조건으로 한 확률', kind: 'BN', requires: ['p1-ratio'], questions: [
    q(text`두 사건 A, B에 대하여 $P(A\cup B)=\frac58$, $P(B)=\frac14$일 때 $P(A\mid B^c)$의 값을 구하시오. (단, $B^c$는 B의 여사건이다.)`, '1/2', text`$P(B^c)=\frac34$, $P(A\cap B^c)=\frac58-\frac14=\frac38$이므로 $P(A\mid B^c)=\frac{3/8}{3/4}=\frac12$입니다.`),
    q(text`$P(A\cup B)=\frac7{10}$, $P(B)=\frac15$일 때 $P(A\mid B^c)$를 구하시오.`, '5/8', text`$P(B^c)=\frac45$, $P(A\cap B^c)=\frac12$이므로 $\frac{1/2}{4/5}=\frac58$입니다.`),
  ] },
  { id: 'p2-ratio', label: '조건부확률을 영역 비로 바꾸기', kind: 'AN', requires: ['c-conditional', 'c-complement'], questions: [
    q(text`$P(B^c\mid A)=2P(B\mid A)$이고 $P(A)>0$이다. $P(A\cap B^c)=kP(A\cap B)$가 되도록 하는 k의 값을 구하시오.`, '2', text`두 조건부확률의 분모가 모두 $P(A)$이므로 분모를 없애면 $P(A\cap B^c)=2P(A\cap B)$입니다.`),
    q(text`$P(B^c\mid A)=3P(B\mid A)$일 때 $P(A\cap B^c)=kP(A\cap B)$에서 k의 값은? (단, $P(A)>0$)`, '3', text`분모가 같으므로 영역의 확률도 3배입니다.`),
  ] },
  { id: 'p2-intersection', label: '나머지 영역의 확률 구하기', kind: 'AN', requires: ['p2-ratio'], questions: [
    q(text`$P(A\cap B)=\frac18$이고 $P(A\cap B^c)=2P(A\cap B)$일 때 $P(A\cap B^c)$를 구하시오.`, '1/4', text`$2\times\frac18=\frac14$입니다.`),
    q(text`$P(A\cap B)=\frac1{10}$이고 $P(A\cap B^c)=3P(A\cap B)$일 때 $P(A\cap B^c)$를 구하시오.`, '3/10', text`$3\times\frac1{10}=\frac3{10}$입니다.`),
  ] },
  { id: 'p2-partition', label: 'A의 두 영역 합치기', kind: 'AN', requires: ['p2-intersection', 'c-addition'], questions: [
    q(text`$P(A\cap B)=\frac18$, $P(A\cap B^c)=\frac14$이다. A의 두 영역을 합쳐 $P(A)$를 구하시오.`, '3/8', text`두 영역은 겹치지 않고 합치면 A입니다. $\frac18+\frac14=\frac38$입니다.`),
    q(text`$P(A\cap B)=\frac1{10}$, $P(A\cap B^c)=\frac3{10}$일 때 $P(A)$를 구하시오.`, '2/5', text`$\frac1{10}+\frac3{10}=\frac25$입니다.`),
  ] },
  { id: 'bn-2', label: '조건부확률의 비로 P(A) 구하기', kind: 'BN', requires: ['p2-partition'], questions: [
    q(text`두 사건 A, B에 대하여 $P(A\cap B)=\frac18$, $P(B^c\mid A)=2P(B\mid A)$일 때 $P(A)$를 구하시오. (단, $B^c$는 B의 여사건이다.)`, '3/8', text`조건부확률의 분모가 같으므로 $P(A\cap B^c)=2\times\frac18=\frac14$입니다. 따라서 $P(A)=\frac18+\frac14=\frac38$입니다.`),
    q(text`$P(A\cap B)=\frac1{10}$, $P(B^c\mid A)=3P(B\mid A)$일 때 $P(A)$를 구하시오.`, '2/5', text`$P(A\cap B^c)=\frac3{10}$이므로 $P(A)=\frac1{10}+\frac3{10}=\frac25$입니다.`),
  ] },
  { id: 'p3-base', label: 'B의 확률 복원하기', kind: 'AN', requires: ['c-complement'], questions: [
    q(text`$P(B^c)=\frac23$일 때 $P(B)$를 구하시오.`, '1/3', text`$1-\frac23=\frac13$입니다.`),
    q(text`$P(B^c)=\frac35$일 때 $P(B)$를 구하시오.`, '2/5', text`$1-\frac35=\frac25$입니다.`),
  ] },
  { id: 'p3-joint', label: '조건부확률로 교집합 구하기', kind: 'AN', requires: ['c-multiplication'], questions: [
    q(text`$P(A)=\frac12$, $P(B\mid A)=\frac16$일 때 $P(A\cap B)$를 구하시오.`, '1/12', text`$P(A\cap B)=P(A)P(B\mid A)=\frac12\times\frac16=\frac1{12}$입니다.`),
    q(text`$P(A)=\frac23$, $P(B\mid A)=\frac14$일 때 $P(A\cap B)$를 구하시오.`, '1/6', text`$\frac23\times\frac14=\frac16$입니다.`),
  ] },
  { id: 'p3-difference', label: 'B 안에서 A의 여사건 구하기', kind: 'AN', requires: ['p3-base', 'p3-joint', 'c-addition'], questions: [
    q(text`$P(B)=\frac13$, $P(A\cap B)=\frac1{12}$일 때 $P(A^c\cap B)$를 구하시오.`, '1/4', text`B는 $A\cap B$와 $A^c\cap B$로 나뉩니다. $\frac13-\frac1{12}=\frac14$입니다.`),
    q(text`$P(B)=\frac12$, $P(A\cap B)=\frac15$일 때 $P(A^c\cap B)$를 구하시오.`, '3/10', text`$\frac12-\frac15=\frac3{10}$입니다.`),
  ] },
  { id: 'p3-ratio', label: '조건 방향 바꿔 확률 구하기', kind: 'AN', requires: ['p3-difference'], questions: [
    q(text`$P(A^c\cap B)=\frac14$, $P(B)=\frac13$일 때 $P(A^c\mid B)$를 구하시오.`, '3/4', text`조건이 B이므로 $P(B)$로 나눕니다. $\frac{1/4}{1/3}=\frac34$입니다.`),
    q(text`$P(A^c\cap B)=\frac3{10}$, $P(B)=\frac12$일 때 $P(A^c\mid B)$를 구하시오.`, '3/5', text`$\frac{3/10}{1/2}=\frac35$입니다.`),
  ] },
  { id: 'bn-3', label: '반대 사건의 조건부확률', kind: 'BN', requires: ['p3-ratio'], questions: [
    q(text`두 사건 A, B에 대하여 $P(A)=\frac12$, $P(B^c)=\frac23$, $P(B\mid A)=\frac16$일 때 $P(A^c\mid B)$를 구하시오. (단, $A^c$는 A의 여사건이다.)`, '3/4', text`$P(B)=\frac13$, $P(A\cap B)=\frac12\times\frac16=\frac1{12}$입니다. $P(A^c\cap B)=\frac13-\frac1{12}=\frac14$이므로 $P(A^c\mid B)=\frac{1/4}{1/3}=\frac34$입니다.`),
    q(text`$P(A)=\frac35$, $P(B^c)=\frac12$, $P(B\mid A)=\frac13$일 때 $P(A^c\mid B)$를 구하시오.`, '3/5', text`$P(B)=\frac12$, $P(A\cap B)=\frac15$이고 $P(A^c\cap B)=\frac3{10}$입니다. 따라서 $\frac{3/10}{1/2}=\frac35$입니다.`),
  ] },
];

export const CONDITIONAL_NODES: Record<string, LearningNode> = Object.fromEntries(nodes.map(node => [node.id, node]));
export const CONDITIONAL_GOALS: LearningGoal[] = [
  { id: 'conditional-1', title: '여사건을 조건으로 한 확률', domain: '조건부확률', rootId: 'bn-1', positions: {
    'c-events': [0, 2], 'c-complement': [1, 0], 'c-addition': [1, 2], 'c-conditional': [1, 4],
    'p1-complement': [2, 0], 'p1-outside': [2, 2], 'p1-ratio': [3, 2], 'bn-1': [4, 2],
  } },
  { id: 'conditional-2', title: '조건부확률의 비로 P(A) 구하기', domain: '조건부확률', rootId: 'bn-2', positions: {
    'c-events': [0, 2], 'c-complement': [1, 0], 'c-conditional': [1, 2], 'c-addition': [1, 4],
    'p2-ratio': [2, 1], 'p2-intersection': [3, 1], 'p2-partition': [4, 2], 'bn-2': [5, 2],
  } },
  { id: 'conditional-3', title: '반대 사건의 조건부확률', domain: '조건부확률', rootId: 'bn-3', positions: {
    'c-events': [0, 2], 'c-complement': [1, 0], 'c-addition': [1, 2], 'c-conditional': [1, 4],
    'p3-base': [2, 0], 'c-multiplication': [2, 4], 'p3-joint': [3, 4], 'p3-difference': [4, 2], 'p3-ratio': [5, 2], 'bn-3': [6, 2],
  } },
];

export function breakdownQuestion(id: string, attempt = 0) {
  const node = CONDITIONAL_NODES[id];
  if (!node) throw new Error(`Unknown problem node: ${id}`);
  return node.questions[Math.max(0, Math.floor(attempt)) % node.questions.length];
}

/** Fractions and decimals, never eval. Zero denominators and incomplete inputs are invalid. */
export function parseProbabilityAnswer(input: string): number | null {
  const value = input.trim();
  const fraction = value.match(/^(\d{1,9})\s*\/\s*(\d{1,9})$/);
  if (fraction) return Number(fraction[2]) > 0 ? Number(fraction[1]) / Number(fraction[2]) : null;
  if (!/^(?:\d{1,9}(?:\.\d{1,8})?|\.\d{1,8})$/.test(value)) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
export function correctProbabilityAnswer(expected: string, actual: string) {
  const a = parseProbabilityAnswer(expected), b = parseProbabilityAnswer(actual);
  return a !== null && b !== null && Math.abs(a - b) <= 1e-6;
}
export function unresolvedSupport(id: string, passed: Readonly<Record<string, string>>) {
  return CONDITIONAL_NODES[id].requires.find(child => passed[child] !== 'passed');
}
