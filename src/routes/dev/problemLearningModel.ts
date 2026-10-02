import type { NodeStatus } from './levelTestPreviewModel.ts';
import type { LevelTestQuestion } from './levelTestQuestionBank.ts';
import { isProblemAnswerCorrect } from '../../lib/answerEvaluation.ts';
import { realLearningGoals, realLearningNodes } from './problemLearningRealBank.ts';

export type LearningQuestion = Omit<LevelTestQuestion, 'choices' | 'answer'> & {
  choices?: LevelTestQuestion['choices']; answer: string; answerType?: 'NUMBER' | 'MULTIPLE_CHOICE';
  questionId?: number; reference?: string;
};
type Question = LearningQuestion;
export type LearningNode = {
  id: string; label: string; kind: 'BN' | 'AN' | 'concept';
  requires: string[]; questions: Question[]; conceptId?: string; note?: string;
  source?: 'bank' | 'scaffold' | 'concept-check'; questionId?: number; bankTags?: string[];
};
export type LearningGoal = {
  id: string; title: string; domain: string; rootId: string;
  positions: Record<string, [column: number, row: number]>;
  questionId?: number;
};
const q = (prompt: string, choices: Question['choices'], answer: Question['answer'], explanation: string): Question => ({ prompt, choices, answer, explanation });
const nodes: LearningNode[] = [
  { id: 'adjacent', label: '조건이 있는 줄 세우기', kind: 'BN', requires: ['block-order', 'inside-order'], questions: [
    q('서로 다른 학생 A, B, C, D, E를 한 줄로 세우려고 한다. A와 B가 서로 이웃하게 서는 방법의 수는?', ['24', '36', '48', '120'], 'C', 'A와 B를 한 묶음으로 보면 네 대상을 세우는 방법은 $4!=24$가지입니다. 묶음 안의 순서는 AB, BA 두 가지이므로 $24\\times2=48$가지입니다.'),
    q('서로 다른 학생 A, B, C, D를 한 줄로 세울 때, A와 B가 서로 이웃하게 서는 방법의 수는?', ['6', '12', '18', '24'], 'B', 'AB를 한 묶음으로 보면 세 대상을 세우는 $3!=6$가지와 묶음 내부의 2가지를 곱해 12가지입니다.'),
  ] },
  { id: 'block-order', label: '묶음 줄 세우기', kind: 'AN', requires: ['factorial-practice', 'block-count'], questions: [
    q('A와 B를 하나의 묶음으로 만들고, 묶음 안의 순서는 고정했다. 이 묶음과 C, D, E를 한 줄로 세우는 방법의 수는?', ['6', '12', '24', '120'], 'C', '묶음 하나와 C, D, E는 서로 다른 네 대상이므로 $4!=24$가지입니다.'),
    q('두 학생을 하나의 묶음으로 만들고 내부 순서를 고정했다. 이 묶음과 서로 다른 나머지 학생 4명을 한 줄로 세우는 방법의 수는?', ['24', '48', '60', '120'], 'D', '묶음 하나와 학생 네 명은 총 다섯 대상입니다. $5!=120$가지입니다.'),
  ] },
  { id: 'factorial-practice', label: '대상 배열하기', kind: 'AN', requires: ['c-factorial'], questions: [
    q('서로 다른 카드 4장을 모두 사용해 한 줄로 놓는 방법의 수는?', ['4', '12', '24', '16'], 'C', '첫 자리부터 선택지는 4, 3, 2, 1개이므로 $4!=24$가지입니다.'),
    q('서로 다른 카드 3장을 모두 사용해 한 줄로 놓는 방법의 수는?', ['3', '6', '9', '12'], 'B', '$3!=3\\times2\\times1=6$가지입니다.'),
  ] },
  { id: 'block-count', label: '묶음을 하나로 세기', kind: 'AN', requires: ['c-block'], questions: [
    q('학생 A, B, C, D, E 중 A와 B를 한 묶음으로 보면, 줄에 놓아야 할 대상은 모두 몇 개인가?', ['3', '4', '5', '6'], 'B', 'AB 묶음 하나와 C, D, E를 합해 네 대상입니다.'),
    q('학생 6명 중 특정한 3명을 한 묶음으로 보면, 배열할 대상은 모두 몇 개인가?', ['3', '4', '5', '6'], 'B', '묶음 하나와 나머지 세 명을 합해 네 대상입니다.'),
  ] },
  { id: 'inside-order', label: '묶음 순서 세기', kind: 'AN', requires: ['c-product'], questions: [
    q('학생 A와 B가 들어 있는 묶음 안에서 두 사람의 순서를 정하는 방법의 수는?', ['2', '1', '4', '6'], 'A', 'AB와 BA의 두 가지입니다.'),
    q('서로 다른 세 학생이 들어 있는 묶음 안에서 순서를 정하는 방법의 수는?', ['3', '4', '6', '9'], 'C', '첫 자리 3가지, 다음 자리 2가지, 마지막 자리 1가지로 $3\\times2\\times1=6$가지입니다.'),
  ] },
  { id: 'c-factorial', label: '팩토리얼', kind: 'concept', conceptId: 'factorial', requires: [],
    note: '서로 다른 대상을 모두 줄 세울 때, 한 자리를 채울 때마다 선택할 수 있는 대상이 하나씩 줄어요.\n\n$n!=n\\times(n-1)\\times\\cdots\\times1$\n\n예를 들어 두 대상을 놓는 방법은 $2!=2\\times1=2$가지예요.', questions: [q('$4!$의 값은?', ['8', '12', '24', '48'], 'C', '$4!=4\\times3\\times2\\times1=24$입니다.')] },
  { id: 'c-block', label: '묶어서 세기', kind: 'concept', conceptId: 'permutation', requires: [],
    note: '붙어 있어야 하는 대상들은 먼저 하나의 묶음으로 생각해요.\n\n예를 들어 A, B, C, D에서 A와 B를 묶으면 [AB], C, D의 세 대상을 배열하게 돼요. 묶음 안의 순서는 따로 셉니다.', questions: [q('A, B, C, D에서 A와 B를 하나의 묶음으로 보면 배열할 대상의 수는?', ['2', '3', '4', '5'], 'B', '[AB], C, D의 세 대상입니다.')] },
  { id: 'c-product', label: '곱의 법칙', kind: 'concept', conceptId: 'product-rule', requires: [],
    note: '두 선택을 차례로 하고, 첫 선택마다 다음 선택을 같은 수만큼 할 수 있다면 방법의 수를 곱해요.\n\n셔츠 2벌과 바지 3벌에서 하나씩 고르면 $2\\times3=6$가지예요. 줄 세우기에서는 자리마다 남은 선택지를 곱할 수 있어요.', questions: [q('모자 2개와 신발 4켤레 중 하나씩 고르는 방법의 수는?', ['2', '4', '6', '8'], 'D', '$2\\times4=8$가지입니다.')] },
  { id: 'mixed-team', label: '혼성 대표 팀의 확률', kind: 'BN', requires: ['mixed-count', 'all-teams', 'ratio-practice'], questions: [
    q('남학생 4명과 여학생 3명 중에서 대표 3명을 동시에 임의로 뽑는다. 남학생과 여학생이 각각 적어도 한 명씩 포함될 확률은?', ['$\\frac{1}{7}$', '$\\frac{3}{7}$', '$\\frac{5}{7}$', '$\\frac{6}{7}$'], 'D', '전체 팀은 ${}_7C_3=35$개입니다. 혼성 팀은 ${}_4C_2\\times3+4\\times{}_3C_2=30$개이므로 확률은 $30/35=6/7$입니다.'),
    q('남학생 3명과 여학생 3명 중에서 대표 3명을 동시에 임의로 뽑는다. 남학생과 여학생이 각각 적어도 한 명씩 포함될 확률은?', ['$\\frac{1}{2}$', '$\\frac{3}{5}$', '$\\frac{4}{5}$', '$\\frac{9}{10}$'], 'D', '전체 ${}_6C_3=20$개 중 한 성별만 뽑는 팀은 2개입니다. 따라서 $18/20=9/10$입니다.'),
  ] },
  { id: 'mixed-count', label: '혼성 팀 경우 세기', kind: 'AN', requires: ['pair-count', 'case-product'], questions: [
    q('남학생 4명과 여학생 3명 중 3명을 뽑는다. 남학생과 여학생이 각각 적어도 한 명씩 포함되는 팀의 수는?', ['12', '18', '24', '30'], 'D', '남2·여1은 $6\\times3=18$개, 남1·여2는 $4\\times3=12$개로 총 30개입니다.'),
    q('남학생 3명과 여학생 3명 중 3명을 뽑는다. 남학생과 여학생이 각각 적어도 한 명씩 포함되는 팀의 수는?', ['9', '12', '18', '20'], 'C', '남2·여1과 남1·여2를 나누어 세면 $3\\times3+3\\times3=18$개입니다.'),
  ] },
  { id: 'pair-count', label: '순서 없이 두 명 뽑기', kind: 'AN', requires: ['c-combination'], questions: [
    q('서로 다른 학생 4명 중 역할 구분 없이 대표 2명을 뽑는 방법의 수는?', ['4', '6', '8', '12'], 'B', '순서 없이 뽑으므로 ${}_4C_2=6$가지입니다.'),
    q('서로 다른 학생 5명 중 역할 구분 없이 대표 2명을 뽑는 방법의 수는?', ['5', '10', '15', '20'], 'B', '${}_5C_2=10$가지입니다.'),
  ] },
  { id: 'case-product', label: '두 선택 결합하기', kind: 'AN', requires: ['c-team-product'], questions: [
    q('남학생을 고르는 방법이 6가지, 여학생을 고르는 방법이 3가지일 때 두 선택을 함께 하는 방법의 수는?', ['9', '12', '18', '36'], 'C', '남학생 선택 하나마다 여학생 선택 3가지가 가능하므로 $6\\times3=18$가지입니다.'),
    q('첫 그룹에서 고르는 방법이 4가지, 둘째 그룹에서 고르는 방법이 3가지일 때 두 선택을 함께 하는 방법의 수는?', ['7', '9', '12', '16'], 'C', '$4\\times3=12$가지입니다.'),
  ] },
  { id: 'all-teams', label: '전체 대표 팀 세기', kind: 'AN', requires: ['c-combination'], questions: [
    q('서로 다른 7명 중 역할 구분 없이 대표 3명을 뽑는 방법의 수는?', ['21', '30', '35', '42'], 'C', '${}_7C_3=7\\times6\\times5/(3\\times2\\times1)=35$가지입니다.'),
    q('서로 다른 6명 중 역할 구분 없이 대표 3명을 뽑는 방법의 수는?', ['12', '15', '18', '20'], 'D', '${}_6C_3=20$가지입니다.'),
  ] },
  { id: 'ratio-practice', label: '경우의 수와 확률', kind: 'AN', requires: ['c-probability'], questions: [
    q('동일한 가능성을 가진 결과 8개 중 사건 A에 해당하는 결과가 3개일 때, A가 일어날 확률은?', ['$\\frac{3}{8}$', '$\\frac{5}{8}$', '$\\frac{1}{3}$', '$\\frac{8}{3}$'], 'A', '사건에 해당하는 결과 수를 전체 결과 수로 나누어 $3/8$입니다.'),
    q('동일한 가능성을 가진 결과 10개 중 사건 A에 해당하는 결과가 4개일 때, A가 일어날 확률은?', ['$\\frac{1}{4}$', '$\\frac{2}{5}$', '$\\frac{3}{5}$', '$\\frac{5}{2}$'], 'B', '$4/10=2/5$입니다.'),
  ] },
  { id: 'c-combination', label: '조합', kind: 'concept', conceptId: 'combination', requires: [], note: '역할이나 순서 없이 몇 명을 고르면 조합을 사용해요. A와 B를 뽑는 것과 B와 A를 뽑는 것은 같은 선택이에요.\n\n서로 다른 $n$개에서 $r$개를 고르는 수는 ${}_nC_r=\\frac{n!}{r!(n-r)!}$예요.', questions: [q('서로 다른 3명 중 역할 구분 없이 2명을 고르는 방법의 수는?', ['2', '3', '6', '9'], 'B', 'AB, AC, BC의 3가지입니다.')] },
  { id: 'c-team-product', label: '곱의 법칙', kind: 'concept', conceptId: 'product-rule', requires: [], note: '서로 다른 두 그룹에서 각각 선택하고 그 선택들을 결합하면 방법의 수를 곱해요.\n\n첫 그룹 2가지, 둘째 그룹 3가지라면 가능한 조합은 $2\\times3=6$가지예요.', questions: [q('첫 선택은 3가지, 각 첫 선택에 이어지는 둘째 선택은 4가지일 때 전체 방법의 수는?', ['7', '9', '12', '16'], 'C', '$3\\times4=12$가지입니다.')] },
  { id: 'c-probability', label: '수학적 확률', kind: 'concept', conceptId: 'math-probability', requires: [], note: '모든 결과가 일어날 가능성이 같을 때, 확률은 조건을 만족하는 결과 수를 전체 결과 수로 나누어 구해요.\n\n$P(A)=\\frac{\\text{A에 해당하는 결과 수}}{\\text{전체 결과 수}}$\n\n주사위에서 3의 배수는 3과 6이므로 확률은 $2/6=1/3$이에요.', questions: [q('공정한 주사위에서 5 이상의 눈이 나올 확률은?', ['$\\frac{1}{6}$', '$\\frac{1}{3}$', '$\\frac{1}{2}$', '$\\frac{2}{3}$'], 'B', '5와 6의 두 결과이므로 $2/6=1/3$입니다.')] },
  { id: 'table-probability', label: '표를 읽어 확률 구하기', kind: 'BN', requires: ['interval-total', 'table-ratio'], questions: [
    q('20명의 하루 독서 시간을 조사한 표이다. 이 중 한 명을 임의로 골랐을 때, 독서 시간이 20분 이상일 확률은?\n\n| 독서 시간(분) | 도수(명) |\n| --- | --- |\n| 0 이상 10 미만 | 2 |\n| 10 이상 20 미만 | 6 |\n| 20 이상 30 미만 | 8 |\n| 30 이상 40 미만 | 4 |', ['$\\frac{1}{5}$', '$\\frac{2}{5}$', '$\\frac{3}{5}$', '$\\frac{4}{5}$'], 'C', '20분 이상인 학생은 $8+4=12$명입니다. $12/20=3/5$입니다.'),
    q('독서 시간이 0 이상 10 미만인 학생 3명, 10 이상 20 미만 5명, 20 이상 30 미만 7명, 30 이상 40 미만 5명이다. 20명 중 한 명을 임의로 골랐을 때 30분 미만일 확률은?', ['$\\frac{1}{4}$', '$\\frac{1}{2}$', '$\\frac{3}{4}$', '$\\frac{4}{5}$'], 'C', '30분 미만인 학생은 $3+5+7=15$명입니다. $15/20=3/4$입니다.'),
  ] },
  { id: 'interval-total', label: '구간별 도수 더하기', kind: 'AN', requires: ['interval-read'], questions: [
    q('독서 시간이 20 이상 30 미만인 학생은 8명, 30 이상 40 미만인 학생은 4명이다. 20 이상 40 미만인 학생은 몇 명인가?', ['4', '8', '12', '20'], 'C', '서로 겹치지 않는 두 구간의 도수를 더해 $8+4=12$명입니다.'),
    q('점수가 60 이상 70 미만인 학생은 5명, 70 이상 80 미만인 학생은 7명이다. 60 이상 80 미만인 학생은 몇 명인가?', ['2', '5', '7', '12'], 'D', '$5+7=12$명입니다.'),
  ] },
  { id: 'interval-read', label: '구간과 도수 읽기', kind: 'AN', requires: ['c-frequency'], questions: [
    q('독서 시간 ‘20분 이상 30분 미만’ 구간에 포함되는 시간은?', ['19분', '20분', '30분', '31분'], 'B', '20은 포함하고 30은 포함하지 않으므로 20분입니다.'),
    q('키 ‘150cm 이상 160cm 미만’ 구간에 포함되지 않는 키는?', ['150cm', '153cm', '159cm', '160cm'], 'D', '미만은 경계값을 포함하지 않으므로 160cm는 포함되지 않습니다.'),
  ] },
  { id: 'table-ratio', label: '인원수로 확률 구하기', kind: 'AN', requires: ['c-table-probability'], questions: [
    q('학생 15명 중 6명이 버스로 등교한다. 15명 중 한 명을 임의로 골랐을 때 버스로 등교하는 학생일 확률은?', ['$\\frac{1}{5}$', '$\\frac{2}{5}$', '$\\frac{3}{5}$', '$\\frac{4}{5}$'], 'B', '$6/15=2/5$입니다.'),
    q('학생 12명 중 9명이 도서관을 이용했다. 한 명을 임의로 골랐을 때 도서관을 이용한 학생일 확률은?', ['$\\frac{1}{4}$', '$\\frac{1}{2}$', '$\\frac{2}{3}$', '$\\frac{3}{4}$'], 'D', '$9/12=3/4$입니다.'),
  ] },
  { id: 'c-frequency', label: '도수분포표', kind: 'concept', conceptId: 'frequency-table', requires: [], note: '도수분포표는 자료를 구간별로 나누고, 각 구간에 속하는 자료의 개수인 ‘도수’를 적은 표예요.\n\n‘10 이상 20 미만’은 10을 포함하고 20은 포함하지 않아요. 여러 구간에 속하는 인원을 구할 때는 해당 구간들의 도수를 더해요.', questions: [q('한 구간의 도수가 7이라는 것은 무엇을 뜻하는가?', ['구간의 폭이 7이다.', '그 구간의 자료가 7개이다.', '자료의 평균이 7이다.', '전체 자료가 항상 7개이다.'], 'B', '도수는 해당 구간에 속하는 자료의 개수입니다.')] },
  { id: 'c-table-probability', label: '수학적 확률', kind: 'concept', conceptId: 'math-probability', requires: [], note: '모든 학생을 같은 가능성으로 고른다면, 특정 조건을 만족할 확률은 해당 학생 수를 전체 학생 수로 나눈 값이에요.\n\n10명 중 2명이 조건에 해당하면 확률은 $2/10=1/5$예요.', questions: [q('학생 8명 중 2명이 안경을 쓴다. 한 명을 임의로 골랐을 때 안경을 쓴 학생일 확률은?', ['$\\frac{1}{4}$', '$\\frac{1}{2}$', '$\\frac{3}{4}$', '$\\frac{1}{8}$'], 'A', '$2/8=1/4$입니다.')] },
];
// Original examples remain as isolated regression fixtures, not recommendation candidates.
export const LEARNING_NODES = { ...Object.fromEntries(nodes.map(node => [node.id, node])), ...realLearningNodes };
export const EXAMPLE_LEARNING_GOALS: LearningGoal[] = [
  { id: 'counting', title: '조건이 있는 줄 세우기', domain: '경우의 수 · 순열과 조합', rootId: 'adjacent', positions: {
    'c-factorial': [0, 0], 'factorial-practice': [1, 0], 'c-block': [0, 1], 'block-count': [1, 1], 'block-order': [2, .5],
    'c-product': [0, 2.5], 'inside-order': [2, 2.5], adjacent: [3, 1.5],
  } },
  { id: 'probability', title: '혼성 대표 팀의 확률', domain: '확률', rootId: 'mixed-team', positions: {
    'c-combination': [0, .75], 'pair-count': [1, 0], 'c-team-product': [0, 2], 'case-product': [1, 2], 'mixed-count': [2, .5],
    'all-teams': [2, 1.5], 'c-probability': [0, 3.5], 'ratio-practice': [2, 3.5], 'mixed-team': [3, 1.5],
  } },
  { id: 'statistics', title: '표를 읽어 확률 구하기', domain: '자료 정리', rootId: 'table-probability', positions: {
    'c-frequency': [0, 0], 'interval-read': [1, 0], 'interval-total': [2, 0],
    'c-table-probability': [0, 2], 'table-ratio': [2, 2], 'table-probability': [3, 1],
  } },
];
export const LEARNING_GOALS: LearningGoal[] = realLearningGoals;
export type Diagnostic = Record<string, NodeStatus>;
export function conceptNodes(goal: LearningGoal) {
  return Object.keys(goal.positions).map(id => LEARNING_NODES[id]).filter(node => node.kind === 'concept');
}
export function rankGoals(diagnostic: Diagnostic, excluded: string[] = [], goals = LEARNING_GOALS) {
  return goals.filter(goal => !excluded.includes(goal.id)).map((goal, index) => {
    const concepts = conceptNodes(goal);
    const known = concepts.filter(node => diagnostic[node.conceptId!] === 'passed').length;
    const gaps = concepts.filter(node => diagnostic[node.conceptId!] === 'failed').length;
    const unknown = concepts.length - known - gaps;
    const boundedGap = gaps === 1 && known > 0 && unknown <= 1;
    // A confirmed, bounded gap is a clearer next step than several untested branches.
    // Prototype ordering only; no claim of a calibrated success probability.
    return { goal, known, gaps, unknown, boundedGap, score: known / concepts.length - gaps * .04 - unknown * .12 - index * .001 };
  }).sort((a, b) => Number(b.boundedGap) - Number(a.boundedGap) || b.score - a.score);
}
function pathTo(rootId: string, target: string): string[] | null {
  if (rootId === target) return [rootId];
  for (const child of LEARNING_NODES[rootId].requires) {
    const path = pathTo(child, target);
    if (path) return [rootId, ...path];
  }
  return null;
}
export function startingPath(goal: LearningGoal, diagnostic: Diagnostic) {
  const concepts = conceptNodes(goal);
  const needed = concepts.find(node => diagnostic[node.conceptId!] === 'failed')
    ?? concepts.find(node => diagnostic[node.conceptId!] !== 'passed');
  if (!needed) return [goal.rootId];
  // Probe the problem immediately above a concept, not a compulsory concept lesson.
  return pathTo(goal.rootId, needed.id)!.slice(0, -1);
}
export type LearningState = {
  goalId: string; currentId: string; parents: string[]; results: Record<string, 'passed' | 'failed'>;
  attempts: Record<string, number>; selected: Question['answer'] | null;
  feedback: 'correct' | 'wrong' | 'unknown' | null; reading: boolean; complete: boolean;
  history: { nodeId: string; variant: number; answer: string | null; correct: boolean; seconds: number }[];
  startedAt: number;
};
export function startLearning(goal: LearningGoal, diagnostic: Diagnostic, direct = false, now = Date.now()): LearningState {
  const path = direct ? [goal.rootId] : startingPath(goal, diagnostic);
  return { goalId: goal.id, currentId: path.at(-1)!, parents: path.slice(0, -1), results: {}, attempts: {}, selected: null,
    feedback: null, reading: false, complete: false, history: [], startedAt: now };
}
export function currentQuestion(state: LearningState) {
  const node = LEARNING_NODES[state.currentId];
  return node.questions[(state.attempts[node.id] ?? 0) % node.questions.length];
}
export function submitLearning(state: LearningState, answer: Question['answer'] | null, now = Date.now()): LearningState {
  if (state.complete || state.feedback || state.reading) return state;
  const question = currentQuestion(state);
  const correct = answer !== null && isProblemAnswerCorrect({ answer: question.answer, answerType: question.answerType }, answer);
  return { ...state, selected: answer, feedback: correct ? 'correct' : answer === null ? 'unknown' : 'wrong',
    results: { ...state.results, [state.currentId]: correct ? 'passed' : 'failed' },
    history: [...state.history, { nodeId: state.currentId, variant: state.attempts[state.currentId] ?? 0, answer, correct, seconds: Math.max(0, (now - state.startedAt) / 1000) }] };
}
function nextNode(state: LearningState, id: string, parents: string[], now: number): LearningState {
  return { ...state, currentId: id, parents, selected: null, feedback: null, reading: LEARNING_NODES[id].kind === 'concept', startedAt: now };
}
export function supportNode(state: LearningState, diagnostic: Diagnostic) {
  const children = LEARNING_NODES[state.currentId].requires.filter(id => state.results[id] !== 'passed');
  return children.find(id => conceptNodesFor(id).some(node => diagnostic[node.conceptId!] === 'failed' && state.results[node.id] !== 'passed'))
    ?? children[0];
}
function conceptNodesFor(id: string): LearningNode[] {
  const node = LEARNING_NODES[id];
  return node.kind === 'concept' ? [node] : node.requires.flatMap(conceptNodesFor);
}
export function continueLearning(state: LearningState, diagnostic: Diagnostic, now = Date.now()): LearningState {
  if (!state.feedback || state.complete) return state;
  if (state.feedback === 'correct') {
    const parent = state.parents.at(-1);
    if (!parent) return { ...state, complete: true, feedback: null };
    const returning = nextNode(state, parent, state.parents.slice(0, -1), now);
    // Example fixtures have variants. Real bank questions retain their original
    // content on retry; completing a child never auto-passes its parent.
    return { ...returning, attempts: { ...state.attempts, [parent]: (state.attempts[parent] ?? 0) + (state.results[parent] === 'failed' ? 1 : 0) } };
  }
  const child = supportNode(state, diagnostic);
  if (child) return nextNode(state, child, [...state.parents, state.currentId], now);
  return { ...state, selected: null, feedback: null, reading: LEARNING_NODES[state.currentId].kind === 'concept',
    attempts: { ...state.attempts, [state.currentId]: (state.attempts[state.currentId] ?? 0) + 1 }, startedAt: now };
}
export function finishReading(state: LearningState, now = Date.now()): LearningState {
  return state.reading ? { ...state, reading: false, startedAt: now } : state;
}
