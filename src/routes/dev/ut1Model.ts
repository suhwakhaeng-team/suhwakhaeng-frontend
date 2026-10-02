import { isProblemAnswerCorrect } from '../../lib/answerEvaluation.ts';
import type { Diagnostic, LearningGoal, LearningNode, LearningQuestion, LearningState } from './problemLearningModel.ts';

// Authored UT material, isolated from the live bank and account APIs.
export const UT_STORAGE_KEY = 'suhwakhaeng:ut1:local:v1';
export const SKILLS = ['product', 'factorial', 'permutation', 'combination', 'repetition'] as const;
export type Skill = typeof SKILLS[number];
export const LABELS: Record<Skill, string> = { product: '곱의 법칙', factorial: '팩토리얼', permutation: '순열', combination: '조합', repetition: '중복조합' };
export type UTQuestion = LearningQuestion & { id: string; skill: Skill; params: number[] };
export type Response = { questionId: string; answer: string | null; correct: boolean; seconds: number; answeredAt: number };
export type TestRun = { form: 'A' | 'B'; questions: UTQuestion[]; responses: Response[] };
export type Timer = { key: string; elapsed: number; startedAt: number | null };
export type UTLearningState = LearningState & { preparation?: string[]; preparationVersion?: 1 };
export type UTSession = {
  id: string; participant: string; createdAt: number; stage: 'pre' | 'learning' | 'post' | 'done';
  pre: TestRun; post: TestRun; completed: string[]; learning: UTLearningState | null;
  history: LearningState['history']; evidence: Diagnostic; timer: Timer | null;
};
export type UTStore = { version: 1; activeId: string | null; sessions: UTSession[] };
export const emptyStore = (): UTStore => ({ version: 1, activeId: null, sessions: [] });

export function factorial(n: number): number { let result = 1; for (let i = 2; i <= n; i++) result *= i; return result; }
export function choose(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  let result = 1; for (let i = 1; i <= Math.min(r, n - r); i++) result = result * (n - i + 1) / i;
  return Math.round(result);
}
export function distribute(total: number, boxes: number, minima: number[] = []): number {
  const remaining = total - minima.reduce((a, b) => a + b, 0);
  return remaining < 0 ? 0 : choose(remaining + boxes - 1, boxes - 1);
}
const q = (prompt: string, answer: number, explanation: string): LearningQuestion => ({ prompt, answer: String(answer), explanation, answerType: 'NUMBER' });
function item(id: string, skill: Skill, params: number[], question: LearningQuestion): UTQuestion { return { id, skill, params, ...question }; }

export function testForm(form: 'A' | 'B'): UTQuestion[] {
  const b = form === 'B'; const n = b ? 5 : 4; const p = b ? 6 : 5; const c = b ? 7 : 6; const t = b ? 5 : 4;
  return [
    item('product-1', 'product', b ? [3, 5] : [4, 3], q(`셔츠 ${b ? 3 : 4}벌과 바지 ${b ? 5 : 3}벌 중에서 각각 하나씩 고르는 방법의 수는?`, b ? 15 : 12, '두 단계의 선택지 수를 곱합니다.')),
    item('product-2', 'product', b ? [3, 4, 2] : [2, 3, 3], q(`샌드위치 ${b ? 3 : 2}종류, 음료 ${b ? 4 : 3}종류, 디저트 ${b ? 2 : 3}종류 중에서 각각 하나씩 고르는 방법의 수는?`, b ? 24 : 18, '각 단계에서 독립적으로 하나씩 골라 선택지 수를 모두 곱합니다.')),
    item('factorial-1', 'factorial', [n], q(`$${n}!$의 값은?`, factorial(n), `$${n}! = ${Array.from({ length: n }, (_, i) => n - i).join('\\times')} = ${factorial(n)}$입니다.`)),
    item('factorial-2', 'factorial', [n], q(`서로 다른 카드 ${n}장을 모두 사용해 한 줄로 놓는 방법의 수는?`, factorial(n), `빈자리에 들어갈 수 있는 카드 수를 곱하면 $${n}!$입니다.`)),
    item('permutation-1', 'permutation', [p, 2], q(`$_${p}P_2$의 값은?`, p * (p - 1), `$${p}\\times${p - 1}=${p * (p - 1)}$입니다.`)),
    item('permutation-2', 'permutation', [p, 3], q(`학생 ${p}명 중에서 회장, 부회장, 총무를 한 명씩 뽑는다. 한 사람이 두 역할을 맡을 수 없을 때 방법의 수는?`, p * (p - 1) * (p - 2), '역할이 다르므로 순서를 구별하며, 이미 뽑은 학생을 제외합니다.')),
    item('combination-1', 'combination', [c, 2], q(`$_${c}C_2$의 값은?`, choose(c, 2), `$\\frac{${c}\\times${c - 1}}{2!}=${choose(c, 2)}$입니다.`)),
    item('combination-2', 'combination', [c + 1, 3], q(`학생 ${c + 1}명 중에서 역할 구별 없이 대표 3명을 뽑는 방법의 수는?`, choose(c + 1, 3), `순서를 구별하지 않으므로 $_${c + 1}C_3=${choose(c + 1, 3)}$입니다.`)),
    item('repetition-1', 'repetition', [t, 3], q(`음이 아닌 정수 $x,y,z$에 대해 $x+y+z=${t}$를 만족하는 순서쌍 $(x,y,z)$의 개수는?`, distribute(t, 3), `별 ${t}개와 칸막이 2개를 배열하므로 $_${t + 2}C_2=${distribute(t, 3)}$입니다.`)),
    item('repetition-2', 'repetition', [t + 3, 3, 1], q(`구별되지 않는 공 ${t + 3}개를 서로 다른 상자 A, B, C에 모두 넣는다. 각 상자에 적어도 1개씩 넣는 방법의 수는?`, distribute(t + 3, 3, [1, 1, 1]), `먼저 1개씩 넣고 남은 ${t}개를 배분합니다. $_${t + 2}C_2=${distribute(t, 3)}$입니다.`)),
  ];
}
export function createSession(participant: string, ordinal = 0, now = Date.now()): UTSession {
  const form = ordinal % 2 === 0 ? 'A' : 'B';
  return { id: `ut-${now}-${ordinal}`, participant: participant.trim() || `참가자 ${ordinal + 1}`, createdAt: now, stage: 'pre',
    pre: { form, questions: testForm(form), responses: [] }, post: { form: form === 'A' ? 'B' : 'A', questions: testForm(form === 'A' ? 'B' : 'A'), responses: [] },
    completed: [], learning: null, history: [], evidence: {}, timer: null };
}
export function isNumericAnswer(answer: string): boolean { return /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.0+)?$/.test(answer.trim()); }
export function elapsedSeconds(timer: Timer | null, now = Date.now()): number {
  return timer ? Math.max(0, timer.elapsed + (timer.startedAt === null ? 0 : (now - timer.startedAt) / 1000)) : 0;
}
export function pauseTimer(session: UTSession, now = Date.now()): UTSession {
  return session.timer ? { ...session, timer: { ...session.timer, elapsed: elapsedSeconds(session.timer, now), startedAt: null } } : session;
}
export function resumeTest(session: UTSession, now = Date.now()): UTSession {
  if (session.stage !== 'pre' && session.stage !== 'post') return session;
  const run = session[session.stage]; const question = run.questions[run.responses.length];
  if (!question) return session;
  const key = `${session.stage}:${question.id}`;
  return { ...session, timer: { key, elapsed: session.timer?.key === key ? elapsedSeconds(session.timer, now) : 0, startedAt: now } };
}
export function submitTest(session: UTSession, answer: string | null, now = Date.now(), expectedId?: string): UTSession {
  if (session.stage !== 'pre' && session.stage !== 'post') return session;
  const stage = session.stage; const run = session[stage]; const question = run.questions[run.responses.length];
  if (!question || (expectedId && question.id !== expectedId) || (answer !== null && !isNumericAnswer(answer)) || session.timer?.key !== `${stage}:${question.id}` || session.timer.startedAt === null) return session;
  const response: Response = { questionId: question.id, answer, correct: answer !== null && isProblemAnswerCorrect(question, answer), seconds: elapsedSeconds(session.timer, now), answeredAt: now };
  const responses = [...run.responses, response];
  const nextStage = responses.length === run.questions.length ? stage === 'pre' ? 'learning' : 'done' : stage;
  return { ...session, [stage]: { ...run, responses }, stage: nextStage, timer: null };
}
export function runSummary(run: TestRun, skill?: Skill) {
  const questions = run.questions.filter(question => !skill || question.skill === skill);
  const responses = run.responses.filter(response => questions.some(question => question.id === response.questionId));
  const correct = responses.filter(response => response.correct).length;
  const seconds = responses.reduce((sum, response) => sum + response.seconds, 0);
  return { correct, answered: responses.length, total: questions.length, complete: responses.length === questions.length,
    accuracy: responses.length === questions.length ? correct / questions.length * 100 : null,
    unknown: responses.filter(response => response.answer === null).length, seconds, average: responses.length ? seconds / responses.length : null };
}
export function gain(session: UTSession, skill?: Skill): number | null {
  const pre = runSummary(session.pre, skill).accuracy; const post = runSummary(session.post, skill).accuracy;
  return pre === null || post === null ? null : post - pre;
}

type MiniNode = LearningNode & { make: (variant: number) => LearningQuestion };
const cycle = (variant: number) => Math.max(0, variant) % 6;
function concept(id: string, label: string, note: string, make: MiniNode['make']): MiniNode {
  return { id, label, kind: 'concept', conceptId: id, note, requires: [], questions: [make(0)], make, source: 'concept-check' };
}
function mini(id: string, label: string, requires: string[], make: MiniNode['make'], kind: 'AN' | 'BN' = 'AN'): MiniNode {
  return { id, label, kind, requires, questions: [make(0)], make, source: 'scaffold' };
}
const product = (v: number) => { const n = 2 + cycle(v); return q(`셔츠 ${n}벌과 바지 3벌 중에서 각각 하나씩 고르는 방법의 수는?`, n * 3, `$${n}\\times3=${n * 3}$입니다.`); };
const fact = (v: number) => { const n = 3 + cycle(v) % 4; return q(`서로 다른 카드 ${n}장을 모두 한 줄로 놓는 방법의 수는?`, factorial(n), `$${n}!=${factorial(n)}$입니다.`); };
const perm = (v: number) => { const n = 4 + cycle(v); return q(`학생 ${n}명 중에서 서로 다른 두 명을 회장과 부회장으로 뽑는 방법의 수는?`, n * (n - 1), `역할을 구별하므로 $${n}\\times${n - 1}=${n * (n - 1)}$입니다.`); };
const comb = (v: number) => { const n = 5 + cycle(v); return q(`학생 ${n}명 중에서 역할 구별 없이 대표 2명을 뽑는 방법의 수는?`, choose(n, 2), `같은 두 사람을 뽑는 순서 2가지를 나눠 $\\frac{${n}\\times${n - 1}}{2!}=${choose(n, 2)}$입니다.`); };
const repeat = (v: number) => { const n = 3 + cycle(v); return q(`3종류의 과자를 중복해서 ${n}개 고른다. 같은 종류의 과자는 구별하지 않을 때 방법의 수는?`, distribute(n, 3), `별 ${n}개와 칸막이 2개를 놓습니다. $_${n + 2}C_2=${distribute(n, 3)}$입니다.`); };
const modeling = (v: number) => { const n = 4 + cycle(v); return q(`공 ${n}개를 서로 다른 3개 상자에 배분한다. 별과 칸막이로 나타낼 때 칸막이를 포함한 전체 기호의 수는?`, n + 2, `공을 나타내는 별 ${n}개와 상자를 나누는 칸막이 2개를 합합니다.`); };
const minimum = (v: number) => { const n = 8 + cycle(v); return q(`공 ${n}개를 3개 상자에 넣는다. 먼저 각 상자에 1개씩 넣었을 때 자유롭게 배분할 수 있는 공은 몇 개인가?`, n - 3, `최솟값을 먼저 배분하면 $${n}-3=${n - 3}$개가 남습니다.`); };
export function goalQuestion(index: number, variant = 0): LearningQuestion {
  const shift = variant === 0 ? 0 : 1 + (variant - 1) % 7;
  const total = [8, 12, 7, 10, 5][index] + shift;
  if (index === 0) return q(`음이 아닌 정수 $x,y,z$에 대해 $x+y+z=${total}$를 만족하는 순서쌍 $(x,y,z)$의 개수는?`, distribute(total, 3), `별 ${total}개와 칸막이 2개를 놓습니다. $_${total + 2}C_2=${distribute(total, 3)}$입니다.`);
  if (index === 1) return q(`정수 $x,y,z$가 $x+y+z=${total}$, $x\\ge2$, $y\\ge3$, $z\\ge1$을 만족한다. 순서쌍 $(x,y,z)$의 개수는?`, distribute(total, 3, [2, 3, 1]), `최솟값의 합 6을 빼면 ${total - 6}을 자유롭게 배분합니다. $_${total - 4}C_2=${distribute(total, 3, [2, 3, 1])}$입니다.`);
  if (index === 2) return q(`구별되지 않는 공 ${total}개를 서로 다른 상자 A, B, C, D에 모두 넣는 방법의 수는? 빈 상자가 있어도 된다.`, distribute(total, 4), `별 ${total}개와 칸막이 3개를 놓습니다. $_${total + 3}C_3=${distribute(total, 4)}$입니다.`);
  if (index === 3) return q(`구별되지 않는 공 ${total}개를 서로 다른 상자 A, B, C에 모두 넣는다. 각 상자에 적어도 1개씩 넣는 방법의 수는?`, distribute(total, 3, [1, 1, 1]), `각 상자에 먼저 1개씩 넣고 ${total - 3}개를 배분합니다. $_${total - 1}C_2=${distribute(total, 3, [1, 1, 1])}$입니다.`);
  return q(`빨강, 파랑, 노랑 볼펜이 충분히 있다. 총 ${total}자루를 고르되 빨강은 적어도 1자루, 파랑은 적어도 2자루 고른다. 같은 색 볼펜은 구별하지 않을 때 방법의 수는?`, distribute(total, 3, [1, 2, 0]), `빨강 1자루와 파랑 2자루를 먼저 골라 ${total - 3}자루를 자유롭게 고릅니다. $_${total - 1}C_2=${distribute(total, 3, [1, 2, 0])}$입니다.`);
}
// Target-specific application checks have their own evidence IDs. Understanding
// a shared concept does not automatically pass a new problem's modeling step.
export const GOAL_SUPPORT_IDS = [
  ['a-g1-zero', 'a-g1-symbols', 'a-g1-positions'],
  ['a-g2-reserve', 'a-g2-remaining', 'a-g2-count'],
  ['a-g3-bars', 'a-g3-empty', 'a-g3-count'],
  ['a-g4-reserve', 'a-g4-remaining', 'a-g4-count'],
  ['a-g5-reserve', 'a-g5-yellow', 'a-g5-count'],
];
const goalSupportNodes = [
  mini('a-g1-zero', '0도 가능한 정수해', ['c-repetition'], v => {
    const n = 4 + cycle(v);
    return q(`음이 아닌 정수 $x,y,z$가 $x+y+z=${n}$을 만족한다. $x=0$인 순서쌍 $(x,y,z)$은 몇 개인가?`, n + 1,
      `$y$는 0부터 ${n}까지 가능하고, 각각 $z=${n}-y$로 정해집니다. 0도 허용하므로 ${n + 1}개입니다.`);
  }),
  mini('a-g1-symbols', '정수해를 별과 칸막이로', ['c-repetition'], v => {
    const n = 5 + cycle(v);
    return q(`$x+y+z=${n}$의 음이 아닌 정수해를 별과 칸막이로 나타낸다. 별과 칸막이를 합한 기호는 모두 몇 개인가?`, n + 2,
      `합 ${n}은 별 ${n}개, 세 변수는 칸막이 2개로 나타냅니다. 총 $${n}+2=${n + 2}$개입니다.`);
  }),
  mini('a-g1-positions', '칸막이 자리 고르기', ['c-combination'], v => {
    const n = 6 + cycle(v);
    return q(`별과 칸막이를 놓을 자리가 ${n}개이다. 이 중 칸막이 2개의 자리를 고르고 나머지는 별로 채운다. 가능한 배치의 수는?`, choose(n, 2),
      `칸막이끼리는 구별하지 않으므로 자리 2개를 순서 없이 고릅니다. $_${n}C_2=${choose(n, 2)}$입니다.`);
  }),
  mini('a-g2-reserve', '서로 다른 최솟값 더하기', ['c-minimum'], v => {
    const x = 2 + cycle(v);
    return q(`$x\\ge${x},\\ y\\ge3,\\ z\\ge1$을 만족시키려 한다. 세 변수에 먼저 확보해야 하는 값의 합은?`, x + 4,
      `변수마다 필요한 최솟값을 더합니다. $${x}+3+1=${x + 4}$입니다. 변수의 개수 3을 빼는 것이 아닙니다.`);
  }),
  mini('a-g2-remaining', '최솟값을 빼서 식 바꾸기', ['c-minimum'], v => {
    const n = 10 + 2 * cycle(v);
    return q(`$x+y+z=${n},\\ x\\ge2,\\ y\\ge3,\\ z\\ge1$이다. $u=x-2,\\ v=y-3,\\ w=z-1$로 놓으면 $u+v+w$는 얼마인가?`, n - 6,
      `$u,v,w$는 모두 0 이상입니다. 원래 합에서 최솟값의 합 6을 빼므로 $u+v+w=${n}-6=${n - 6}$입니다.`);
  }),
  mini('a-g2-count', '바꾼 식의 정수해 세기', ['c-repetition', 'c-combination'], v => {
    const n = 3 + cycle(v);
    return q(`최솟값을 뺀 뒤 $u+v+w=${n},\\ u,v,w\\ge0$이 되었다. 원래 정수해와 일대일로 대응하는 이 식의 정수해는 몇 개인가?`, distribute(n, 3),
      `최솟값은 이미 처리했으므로 다시 빼지 않습니다. 별 ${n}개와 칸막이 2개에서 $_${n + 2}C_2=${distribute(n, 3)}$입니다.`);
  }),
  mini('a-g3-bars', '상자 수에서 칸막이 수로', ['c-repetition'], v => {
    const boxes = 4 + cycle(v);
    return q(`구별되지 않는 공을 서로 다른 상자 ${boxes}개에 배분한다. 빈 상자도 허용하는 별과 칸막이 표현에 필요한 칸막이는 몇 개인가?`, boxes - 1,
      `칸막이 하나가 구간을 하나 늘립니다. 상자 ${boxes}개를 나타내려면 $${boxes}-1=${boxes - 1}$개가 필요합니다.`);
  }),
  mini('a-g3-empty', '빈 상자가 있는 배치 읽기', ['c-repetition'], v => {
    const a = cycle(v); const symbols = ['●'.repeat(a), '', '●●', '●'].join(' | ');
    return q(`상자 A, B, C, D의 공을 별(●)과 칸막이(|)로 나타내면 다음과 같다.\n\n${symbols}\n\n상자 A에 들어 있는 공은 몇 개인가?`, a,
      `첫 칸막이 앞의 별 ${a}개가 A의 공입니다. 연속된 첫째·둘째 칸막이 사이에는 별이 없으므로 B는 비어 있습니다.${a === 0 ? ' 첫 칸막이 앞도 비어 있으므로 A 역시 0개입니다.' : ''}`);
  }),
  mini('a-g3-count', '네 상자의 배분 세기', ['c-repetition', 'c-combination'], v => {
    const n = 3 + cycle(v);
    return q(`구별되지 않는 공 ${n}개를 서로 다른 상자 A, B, C, D에 모두 넣는다. 빈 상자가 있어도 될 때 배분의 수는?`, distribute(n, 4),
      `별 ${n}개와 칸막이 3개를 사용합니다. 총 ${n + 3}자리에서 칸막이 자리를 골라 $_${n + 3}C_3=${distribute(n, 4)}$입니다.`);
  }),
  mini('a-g4-reserve', '각 상자에 하나씩 먼저 넣기', ['c-minimum'], v => {
    const boxes = 3 + cycle(v);
    return q(`서로 다른 상자 ${boxes}개에 적어도 1개씩 공을 넣으려 한다. 먼저 확보해야 하는 공은 모두 몇 개인가?`, boxes,
      `상자마다 1개씩이므로 $${boxes}\\times1=${boxes}$개를 먼저 넣습니다.`);
  }),
  mini('a-g4-remaining', '남은 공만 자유롭게 배분하기', ['c-minimum'], v => {
    const n = 8 + 2 * cycle(v);
    return q(`공 ${n}개를 상자 A, B, C에 적어도 1개씩 넣는다. $a'=a-1,\\ b'=b-1,\\ c'=c-1$일 때 $a'+b'+c'$의 값은?`, n - 3,
      `먼저 넣은 공 3개를 제외한 $${n}-3=${n - 3}$개입니다. 추가로 넣는 개수 $a',b',c'$는 0이어도 됩니다.`);
  }),
  mini('a-g4-count', '남은 공의 배분 경우 세기', ['c-repetition', 'c-combination'], v => {
    const n = 4 + cycle(v);
    return q(`A, B, C에 공을 1개씩 이미 넣었다. 이제 구별되지 않는 공 ${n}개를 추가로 모두 넣는 방법의 수는? 추가로 0개를 받는 상자가 있어도 된다.`, distribute(n, 3),
      `하나 이상 조건은 이미 충족했습니다. 남은 ${n}개에서 또 3개를 빼지 않고 $_${n + 2}C_2=${distribute(n, 3)}$으로 셉니다.`);
  }),
  mini('a-g5-reserve', '색별 필수 개수 먼저 고르기', ['c-minimum'], v => {
    const red = 1 + cycle(v);
    return q(`빨강·파랑·노랑 볼펜을 고르되 빨강은 적어도 ${red}자루, 파랑은 적어도 2자루 필요하다. 노랑의 최솟값은 0이다. 먼저 골라야 하는 볼펜은 총 몇 자루인가?`, red + 2,
      `빨강 ${red}자루와 파랑 2자루만 먼저 고릅니다. 노랑은 의무가 없으므로 $${red}+2+0=${red + 2}$자루입니다.`);
  }),
  mini('a-g5-yellow', '필수 조건 없는 색 확인하기', ['c-repetition'], v => {
    const n = 4 + cycle(v);
    return q(`볼펜을 총 ${n}자루 고른다. 빨강은 적어도 1자루, 파랑은 적어도 2자루이고 노랑은 고르지 않아도 된다. 노랑은 최대 몇 자루까지 고를 수 있는가?`, n - 3,
      `빨강·파랑의 필수 3자루를 제외한 나머지를 모두 노랑으로 고를 수 있습니다. 최대 $${n}-3=${n - 3}$자루이며, 0자루도 가능합니다.`);
  }),
  mini('a-g5-count', '추가 볼펜을 중복해서 고르기', ['c-repetition', 'c-combination'], v => {
    const n = 3 + cycle(v);
    return q(`필수 빨강 1자루와 파랑 2자루를 이미 골랐다. 빨강·파랑·노랑 중에서 추가로 ${n}자루를 고르는 방법의 수는? 같은 색은 충분하며 구별하지 않고, 고른 순서도 구별하지 않는다.`, distribute(n, 3),
      `추가 ${n}자루는 세 색에 0개 이상 자유롭게 배분합니다. 필수 조건을 다시 적용하지 않고 $_${n + 2}C_2=${distribute(n, 3)}$으로 셉니다.`);
  }),
];
const miniNodes = [
  concept('c-product', '곱의 법칙', '셔츠를 하나 고른 뒤 바지를 하나 고르면 두 번 선택해요. 첫 선택마다 다음 선택을 할 수 있으므로 각 단계의 경우의 수를 곱합니다.', product),
  concept('c-factorial', '팩토리얼', '서로 다른 4개를 모두 배열하면 첫 자리는 4가지, 다음은 3가지, 그다음은 2가지, 마지막은 1가지예요. $4!=4\\times3\\times2\\times1$. $0!=1$입니다.', fact),
  concept('c-permutation', '순열', '회장과 부회장처럼 역할이나 자리의 순서가 다르면 순열이에요. 5명 중 두 역할을 정하면 $5\\times4=20$. 같은 두 사람이어도 역할을 바꾸면 다른 경우입니다.', perm),
  concept('c-combination', '조합', '대표 두 명을 고를 때는 뽑는 순서를 구별하지 않아요. AB와 BA가 같은 선택이므로 순열에서 중복된 순서 수를 나눠요. $_nC_r=\\frac{n!}{r!(n-r)!}$.', comb),
  concept('c-repetition', '중복조합', '같은 종류를 여러 번 골라도 되고, 고른 순서는 구별하지 않아요. 3종류에서 4개를 고르면 별 4개와 칸막이 2개로 표현해요. 총 6자리 중 칸막이 자리를 고르면 $_6C_2=15$입니다.\n\n$n$종류에서 $r$개를 고를 때는 별 $r$개와 칸막이 $n-1$개를 놓아요. 방법의 수는 $_{n+r-1}C_{n-1}$입니다.', repeat),
  concept('c-minimum', '최솟값 먼저 채우기', '상자마다 적어도 1개가 필요하면 먼저 1개씩 넣어요. 그다음 남은 공은 0개 이상 자유롭게 넣을 수 있어요. 서로 다른 최솟값도 먼저 채운 뒤 나머지를 배분합니다.', minimum),
  mini('a-product', '단계별 선택 세기', ['c-product'], product),
  mini('a-factorial', '모두 배열하기', ['c-factorial', 'a-product'], fact),
  mini('a-permutation', '역할을 구별해 뽑기', ['c-permutation', 'a-product'], perm),
  mini('a-combination', '순서 없이 뽑기', ['c-combination', 'a-factorial'], comb),
  mini('a-repetition', '중복해서 고르기', ['c-repetition', 'a-combination'], repeat),
  mini('a-model', '별과 칸막이 세기', ['c-repetition'], modeling),
  mini('a-minimum', '남은 개수 구하기', ['c-minimum'], minimum),
  ...goalSupportNodes,
  ...['음이 아닌 정수해', '최솟값이 다른 정수해', '빈 상자도 가능한 배분', '각 상자에 하나 이상', '조건에 맞게 볼펜 고르기'].map((label, i) => mini(`bn-${i + 1}`, label, GOAL_SUPPORT_IDS[i], v => goalQuestion(i, v), 'BN')),
];
export const UT_NODES: Record<string, MiniNode> = Object.fromEntries(miniNodes.map(node => [node.id, node]));
export function makeGoal(rootId: string, includeFoundations = false, additionalIds: string[] = []): LearningGoal {
  // Separate dependency lanes: no long edge passes through an unrelated node.
  const layout: LearningGoal['positions'] = {
    'c-product': [0, 4], 'a-product': [1, 4], 'c-factorial': [1, 2], 'a-factorial': [2, 3],
    'c-combination': [2, 1], 'a-combination': [3, 2], 'c-repetition': [3, 0],
    'a-repetition': [4, 1], 'a-model': [4, 0], 'c-minimum': [3, 4], 'a-minimum': [4, 3],
    'c-permutation': [1, 0], 'a-permutation': [2, 2],
    ...Object.fromEntries(GOAL_SUPPORT_IDS.flatMap(ids => ids.map((id, index) => [id, [5, index * 2] as [number, number]]))),
    ...Object.fromEntries(UT_GOAL_IDS.map(id => [id, [6, 2] as [number, number]])),
  };
  const positions: LearningGoal['positions'] = {};
  const visit = (id: string) => { if (positions[id]) return; positions[id] = layout[id]; UT_NODES[id].requires.forEach(visit); };
  visit(rootId);
  // UT preparation includes all five assessed skills; these are not extra BN prerequisites.
  if (includeFoundations) SKILLS.forEach(skill => visit(FOUNDATION_ROOTS[skill]));
  // Display an unfinished preparation path (including legacy nodes) without
  // treating every foundation exercise as a permanent prerequisite of each BN.
  additionalIds.forEach(visit);
  const targetIndex = UT_GOAL_IDS.indexOf(rootId);
  const targetIds = targetIndex < 0 ? [] : GOAL_SUPPORT_IDS[targetIndex];
  const compactTarget = targetIndex >= 0 && Object.keys(positions).every(id =>
    id === rootId || targetIds.includes(id) || UT_NODES[id].kind === 'concept');
  if (compactTarget) {
    // A target graph is three real columns, not a cropped slice of the full
    // preparation canvas. Every edge connects adjacent columns, so unrelated
    // nodes cannot sit in the middle of a long dependency line.
    const rowGap = 1.4;
    const concepts = ['c-minimum', 'c-repetition', 'c-combination', 'c-permutation', 'c-factorial', 'c-product']
      .filter(id => positions[id]);
    const firstRow = (targetIds.length - concepts.length) * rowGap / 2;
    concepts.forEach((id, index) => { positions[id] = [0, firstRow + index * rowGap]; });
    targetIds.forEach((id, index) => { positions[id] = [1, index * rowGap]; });
    positions[rootId] = [2, (targetIds.length - 1) * rowGap / 2];
  } else {
    // Partial preparation maps also close up unused columns without changing
    // the prerequisite order or any recorded learning state.
    const columns = [...new Set(Object.values(positions).map(([column]) => column))].sort((a, b) => a - b);
    Object.keys(positions).forEach(id => { positions[id] = [columns.indexOf(positions[id][0]), positions[id][1]]; });
  }
  const minColumn = Math.min(...Object.values(positions).map(([column]) => column));
  const minRow = Math.min(...Object.values(positions).map(([, row]) => row));
  Object.keys(positions).forEach(id => { const [column, row] = positions[id]; positions[id] = [column - minColumn, row - minRow]; });
  return { id: rootId, rootId, title: UT_NODES[rootId].label, domain: '중복조합 · 1차 UT', positions };
}
const UT_GOAL_IDS = Array.from({ length: 5 }, (_, i) => `bn-${i + 1}`);
export const UT_GOALS = Array.from({ length: 5 }, (_, i) => makeGoal(`bn-${i + 1}`));
export const FOUNDATION_ROOTS: Record<Skill, string> = { product: 'a-product', factorial: 'a-factorial', permutation: 'a-permutation', combination: 'a-combination', repetition: 'a-repetition' };
export function learningDiagnostic(session: UTSession): Diagnostic {
  const diagnostic: Diagnostic = {};
  SKILLS.forEach(skill => {
    const summary = runSummary(session.pre, skill);
    if (summary.complete) {
      diagnostic[`c-${skill}`] = summary.correct === summary.total ? 'passed' : 'failed';
      if (summary.correct === summary.total) diagnostic[FOUNDATION_ROOTS[skill]] = 'passed';
    }
  });
  return { ...diagnostic, ...session.evidence, ...session.learning?.results };
}
function preparationFor(rootId: string, diagnostic: Diagnostic): string[] {
  const skillIndex = SKILLS.findIndex(skill => FOUNDATION_ROOTS[skill] === rootId || `c-${skill}` === rootId);
  const skills = skillIndex < 0 ? SKILLS : SKILLS.slice(0, skillIndex + 1);
  return [...new Set([...skills.flatMap(skill => diagnostic[`c-${skill}`] !== 'passed'
    ? [`c-${skill}`, FOUNDATION_ROOTS[skill]] : diagnostic[FOUNDATION_ROOTS[skill]] !== 'passed' ? [FOUNDATION_ROOTS[skill]] : []), rootId])];
}
export function startPreparedUTLearning(rootId: string, diagnostic: Diagnostic, now = Date.now()): UTLearningState {
  const [currentId, ...preparation] = preparationFor(rootId, diagnostic);
  return { ...startUTLearning(rootId, now), currentId, reading: UT_NODES[currentId].kind === 'concept', preparation, preparationVersion: 1 };
}
export function prepareUTSession(session: UTSession, now = Date.now()): UTSession {
  const state = session.learning;
  if (session.stage !== 'learning' || !state || state.preparationVersion === 1) return session;
  // Upgrade the old BN-first route without deleting any responses or learning history.
  if (state.complete) return { ...session, learning: { ...state, preparation: [], preparationVersion: 1 } };
  const diagnostic = learningDiagnostic(session);
  const fresh = startPreparedUTLearning(state.goalId, diagnostic, now);
  if (fresh.currentId === state.goalId) return { ...session, learning: { ...state, preparation: [], preparationVersion: 1 } };
  // A concept already checked in this run need not be retaught; its AN still needs a direct answer.
  const attempted = state.history.some(record => record.nodeId === fresh.currentId);
  return { ...session, learning: { ...state, currentId: fresh.currentId, parents: [], selected: null, feedback: null,
    reading: fresh.reading, startedAt: now, preparation: fresh.preparation, preparationVersion: 1,
    attempts: attempted ? { ...state.attempts, [fresh.currentId]: (state.attempts[fresh.currentId] ?? 0) + 1 } : state.attempts } };
}
export function beginUTLearning(session: UTSession, rootId: string, now = Date.now()): UTSession {
  if (session.stage !== 'learning' || !UT_NODES[rootId]) return session;
  return session.learning ? prepareUTSession(session, now)
    : { ...session, learning: startPreparedUTLearning(rootId, learningDiagnostic(session), now) };
}
export function recommendedUTNode(session: UTSession, rootId: string): string {
  return prepareUTSession(session).learning?.currentId ?? preparationFor(rootId, learningDiagnostic(session))[0];
}
export function learningQuestion(state: LearningState): LearningQuestion { return UT_NODES[state.currentId].make(state.attempts[state.currentId] ?? 0); }
export function startUTLearning(rootId: string, now = Date.now()): UTLearningState {
  return { goalId: rootId, currentId: rootId, parents: [], results: {}, attempts: {}, selected: null, feedback: null, reading: false, complete: false, history: [], startedAt: now };
}
export function submitUTLearning(state: UTLearningState, answer: string | null, now = Date.now()): UTLearningState {
  if (state.feedback || state.reading || state.complete || (answer !== null && !isNumericAnswer(answer))) return state;
  const correct = answer !== null && isProblemAnswerCorrect(learningQuestion(state), answer);
  return { ...state, selected: answer, feedback: correct ? 'correct' : answer === null ? 'unknown' : 'wrong', results: { ...state.results, [state.currentId]: correct ? 'passed' : 'failed' },
    history: [...state.history, { nodeId: state.currentId, variant: state.attempts[state.currentId] ?? 0, answer, correct, seconds: Math.max(0, (now - state.startedAt) / 1000) }] };
}
export function nextUTLearning(state: UTLearningState, evidence: Diagnostic = {}, now = Date.now()): UTLearningState {
  if (!state.feedback || state.complete) return state;
  const move = (id: string, parents: string[]) => ({ ...state, currentId: id, parents, selected: null, feedback: null,
    reading: UT_NODES[id].kind === 'concept', startedAt: now });
  if (state.feedback === 'correct') {
    const parent = state.parents.at(-1);
    if (!parent) {
      if (state.preparation?.length) {
        const [nextId, ...preparation] = state.preparation;
        const attempted = state.history.some(record => record.nodeId === nextId);
        const sameCheck = UT_NODES[nextId].make(state.attempts[nextId] ?? 0).prompt === learningQuestion(state).prompt;
        return { ...move(nextId, []), preparation,
          attempts: attempted || sameCheck ? { ...state.attempts, [nextId]: (state.attempts[nextId] ?? 0) + 1 } : state.attempts };
      }
      return { ...state, feedback: null, complete: true };
    }
    return { ...move(parent, state.parents.slice(0, -1)), attempts: { ...state.attempts, [parent]: (state.attempts[parent] ?? 0) + 1 } };
  }
  const targetSpecific = /^a-g[1-5]-/.test(state.currentId) || /^bn-[1-5]$/.test(state.currentId);
  // Shared concept/foundation evidence survives across goals. A target-specific
  // mistake alone does not require replaying a mastered interactive lesson.
  const children = UT_NODES[state.currentId].requires.filter(id => state.results[id] !== 'passed'
    && (!targetSpecific || state.results[id] === 'failed' || evidence[id] !== 'passed'));
  const child = children.find(id => evidence[id] !== 'passed') ?? children[0]
    ?? (!targetSpecific && state.preparationVersion === 1 ? UT_NODES[state.currentId].requires.find(id => UT_NODES[id].kind === 'concept') : undefined);
  if (child) return move(child, [...state.parents, state.currentId]);
  return { ...move(state.currentId, state.parents), attempts: { ...state.attempts, [state.currentId]: (state.attempts[state.currentId] ?? 0) + 1 } };
}
export function archiveLearning(session: UTSession): UTSession {
  const state = session.learning;
  if (!state?.complete) return session;
  const evidence = { ...session.evidence };
  Object.entries(state.results).forEach(([id, result]) => { if (result === 'passed') evidence[id] = 'passed'; });
  return { ...session, evidence, history: [...session.history, ...state.history], learning: null,
    completed: UT_GOALS.some(goal => goal.id === state.goalId) ? [...new Set([...session.completed, state.goalId])] : session.completed };
}
export function beginPost(session: UTSession): UTSession {
  return session.stage === 'learning' && UT_GOALS.every(goal => session.completed.includes(goal.id)) && !session.learning
    ? { ...session, stage: 'post', timer: null } : session;
}
// Fresh sessions alternate A→B / B→A. This reduces a systematic form-order bias;
// matching structure is not a claim of psychometrically equivalent forms.
export function decodeStore(raw: string | null): UTStore {
  if (!raw) return emptyStore();
  try {
    const store = JSON.parse(raw) as UTStore;
    if (store.version !== 1 || !Array.isArray(store.sessions) || !(store.activeId === null || typeof store.activeId === 'string')) throw new Error('schema');
    for (let sessionIndex = 0; sessionIndex < store.sessions.length; sessionIndex++) {
      const session = store.sessions[sessionIndex];
      if (!session || typeof session.id !== 'string' || typeof session.participant !== 'string' || !Number.isFinite(session.createdAt) || !['pre', 'learning', 'post', 'done'].includes(session.stage) || !Array.isArray(session.completed) || session.completed.some(id => !UT_GOALS.some(goal => goal.id === id)) || !session.evidence || !Array.isArray(session.history)) throw new Error('session');
      for (const run of [session.pre, session.post]) {
        if (!run || !['A', 'B'].includes(run.form) || !Array.isArray(run.responses) || run.responses.length > 10 || JSON.stringify(run.questions) !== JSON.stringify(testForm(run.form))) throw new Error('run');
        run.responses.forEach((response, i) => { if (response.questionId !== run.questions[i].id || !(response.answer === null || typeof response.answer === 'string' && isNumericAnswer(response.answer)) || response.correct !== (response.answer !== null && isProblemAnswerCorrect(run.questions[i], response.answer)) || !Number.isFinite(response.seconds) || response.seconds < 0 || !Number.isFinite(response.answeredAt)) throw new Error('response'); });
      }
      if (session.pre.form === session.post.form || new Set(session.completed).size !== session.completed.length || (session.stage === 'pre' && runSummary(session.pre).complete) || (session.stage !== 'pre' && !runSummary(session.pre).complete) || (['pre', 'learning'].includes(session.stage) && session.post.responses.length > 0) || (['post', 'done'].includes(session.stage) && session.completed.length !== 5) || (session.stage === 'done' && !runSummary(session.post).complete)) throw new Error('phase');
      if (session.timer && (typeof session.timer.key !== 'string' || !Number.isFinite(session.timer.elapsed) || session.timer.elapsed < 0 || !(session.timer.startedAt === null || Number.isFinite(session.timer.startedAt)))) throw new Error('timer');
      if (session.learning) {
        const state = session.learning;
        if (session.stage !== 'learning' || !UT_NODES[state.goalId] || !UT_NODES[state.currentId] || !Array.isArray(state.parents) || state.parents.some(id => !UT_NODES[id]) || !state.results || !state.attempts || !Array.isArray(state.history) || !(state.selected === null || typeof state.selected === 'string') || typeof state.complete !== 'boolean' || typeof state.reading !== 'boolean' || !Number.isFinite(state.startedAt) || ![null, 'correct', 'wrong', 'unknown'].includes(state.feedback)) throw new Error('learning');
        if (Object.entries(state.results).some(([id, result]) => !UT_NODES[id] || !['passed', 'failed'].includes(result)) || Object.entries(state.attempts).some(([id, variant]) => !UT_NODES[id] || !Number.isSafeInteger(variant) || variant < 0)) throw new Error('learning-state');
        if (state.preparationVersion !== undefined && (state.preparationVersion !== 1 || !Array.isArray(state.preparation) || state.preparation.some(id => !UT_NODES[id]))) throw new Error('preparation');
      }
      for (const record of [...session.history, ...(session.learning?.history ?? [])]) {
        if (!UT_NODES[record.nodeId] || !Number.isSafeInteger(record.variant) || record.variant < 0 || !(record.answer === null || typeof record.answer === 'string' && isNumericAnswer(record.answer)) || !Number.isFinite(record.seconds) || record.seconds < 0 || record.correct !== (record.answer !== null && isProblemAnswerCorrect(UT_NODES[record.nodeId].make(record.variant), record.answer))) throw new Error('history');
      }
      // Off-page time is excluded on restoration, never added as solving time.
      if (session.timer) session.timer.startedAt = null;
      store.sessions[sessionIndex] = prepareUTSession(session);
    }
    if (store.activeId && !store.sessions.some(session => session.id === store.activeId)) throw new Error('active');
    return store;
  } catch { return emptyStore(); }
}
