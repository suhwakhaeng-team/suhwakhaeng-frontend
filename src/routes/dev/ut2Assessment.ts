import { CONDITIONAL_NODES } from './conditionalProblemBreakdown.ts';

// Assessment-only parallel forms: not the examples or retry questions in lessons.
const t = String.raw;
const item = (id: string, nodeId: string, prompt: string, answer: string, group = 'foundation') => ({ id, nodeId, prompt, answer, group });
export function ut2Assessment(form: 'A' | 'B') {
  const b = form === 'B';
  return [
    item('events-1', 'c-events', `1부터 ${b ? 12 : 10}까지의 수가 적힌 카드를 한 장씩 넣고 무작위로 한 장 뽑는다. 3의 배수가 나올 확률은?`, b ? '1/3' : '3/10'),
    item('events-2', 'c-events', `같은 가능성으로 나오는 결과가 ${b ? 20 : 16}개이다. 사건 A에 속하는 결과는 ${b ? 9 : 7}개, B에 속하는 결과는 ${b ? 8 : 6}개, 두 사건에 모두 속하는 결과는 ${b ? 3 : 2}개이다. A 또는 B가 일어날 확률은?`, b ? '7/10' : '11/16'),
    item('complement-1', 'c-complement', b ? t`$P(A)=\frac7{12}$일 때 $P(A^c)$는?` : t`$P(A)=\frac38$일 때 $P(A^c)$는?`, b ? '5/12' : '5/8'),
    item('complement-2', 'c-complement', b ? t`$P(B)=\frac56$, $P(A\cap B)=\frac13$이다. $P(A^c\cap B)$는?` : t`$P(B)=\frac7{10}$, $P(A\cap B)=\frac15$이다. $P(A^c\cap B)$는?`, '1/2'),
    item('addition-1', 'c-addition', b ? t`$P(A)=\frac23$, $P(B)=\frac12$, $P(A\cup B)=\frac56$이다. $P(A\cap B)$는?` : t`$P(A)=\frac35$, $P(B)=\frac25$, $P(A\cup B)=\frac45$이다. $P(A\cap B)$는?`, b ? '1/3' : '1/5'),
    item('addition-2', 'c-addition', b ? t`$P(A\cup B)=\frac89$, $P(B)=\frac59$이다. $P(A\cap B^c)$는?` : t`$P(A\cup B)=\frac{11}{12}$, $P(B)=\frac7{12}$이다. $P(A\cap B^c)$는?`, '1/3'),
    item('conditional-1', 'c-conditional', `학생 ${b ? 24 : 20}명 중 A 동아리 학생은 ${b ? 10 : 8}명, B 동아리 학생은 ${b ? 15 : 12}명, 두 동아리 모두 가입한 학생은 ${b ? 5 : 4}명이다. A 동아리 학생 중 무작위로 한 명을 뽑을 때 B에도 가입했을 확률은?`, '1/2'),
    item('conditional-2', 'c-conditional', b ? t`$P(B^c)=\frac14$, $P(A\cap B)=\frac3{10}$일 때 $P(A\mid B)$는?` : t`$P(B^c)=\frac38$, $P(A\cap B)=\frac14$일 때 $P(A\mid B)$는?`, '2/5'),
    item('multiplication-1', 'c-multiplication', b ? t`$P(A)=\frac58$, $P(B\mid A)=\frac25$일 때 $P(A\cap B)$는?` : t`$P(A)=\frac35$, $P(B\mid A)=\frac5{12}$일 때 $P(A\cap B)$는?`, '1/4'),
    item('multiplication-2', 'c-multiplication', b ? t`$P(A\cap B)=\frac3{14}$, $P(B\mid A)=\frac37$일 때 $P(A)$는?` : t`$P(A\cap B)=\frac3{20}$, $P(B\mid A)=\frac3{10}$일 때 $P(A)$는?`, '1/2'),
    item('application-1', 'bn-1', b ? t`$P(A\cup B)=\frac7{12}$, $P(B)=\frac13$일 때 $P(A\mid B^c)$는?` : t`$P(A\cup B)=\frac45$, $P(B)=\frac25$일 때 $P(A\mid B^c)$는?`, b ? '3/8' : '2/3', 'application'),
    item('application-2', 'bn-2', b ? t`$P(A\cap B)=\frac1{12}$, $P(B^c\mid A)=5P(B\mid A)$일 때 $P(A)$는?` : t`$P(A\cap B)=\frac1{14}$, $P(B^c\mid A)=4P(B\mid A)$일 때 $P(A)$는?`, b ? '1/2' : '5/14', 'application'),
    item('application-3', 'bn-3', b ? t`$P(A)=\frac23$, $P(B^c)=\frac23$, $P(B\mid A)=\frac3{10}$일 때 $P(A^c\mid B)$는?` : t`$P(A)=\frac34$, $P(B^c)=\frac45$, $P(B\mid A)=\frac15$일 때 $P(A^c\mid B)$는?`, b ? '2/5' : '1/4', 'application'),
  ];
}
export const UT2_BANK = { version: 2, forms: { A: ut2Assessment('A'), B: ut2Assessment('B') }, nodes: CONDITIONAL_NODES };
