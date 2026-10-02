// 개념 학습 활동(연습)의 판정 로직. 여기 결과는 저장하지 않으며
// 학습 전후 테스트 점수나 노드 통과 처리에 쓰지 않는다. 통과는 기존 확인 문제 채점만 따른다.

/** 활동 완료는 확인 문제를 열 뿐이며, UT 점수나 노드 상태는 바꾸지 않는다. */
export const GUIDED_ACTIVITY_NODES = ['c-product', 'c-factorial', 'c-permutation', 'c-combination', 'c-repetition', 'c-minimum'] as const;
export function hasGuidedActivity(nodeId: string): boolean {
  return (GUIDED_ACTIVITY_NODES as readonly string[]).includes(nodeId);
}

export type Item = { id: string; label: string; color: string };

// ── 곱의 법칙 ────────────────────────────────────────────────
export const PRODUCT_SHIRTS: Item[] = [
  { id: 'white', label: '흰 티', color: '#F9FAFB' },
  { id: 'blue', label: '파란 티', color: '#60A5FA' },
  { id: 'gray', label: '회색 티', color: '#9CA3AF' },
];
/** 규칙 찾기 단계에서 새로 생기는 티셔츠. */
export const PRODUCT_EXTRA_SHIRT: Item = { id: 'yellow', label: '노란 티', color: '#EAB308' };
export const PRODUCT_PANTS: Item[] = [
  { id: 'jeans', label: '청바지', color: '#1D4ED8' },
  { id: 'black', label: '검은 바지', color: '#1F2937' },
];

export const outfitKey = (shirtId: string, pantsId: string) => `${shirtId}+${pantsId}`;

/** 옷차림 하나를 추가한다. 이미 만든 조합이면 목록을 바꾸지 않고 duplicate로 알린다. */
export function addOutfit(made: string[], shirtId: string, pantsId: string): { made: string[]; duplicate: boolean } {
  const key = outfitKey(shirtId, pantsId);
  return made.includes(key) ? { made, duplicate: true } : { made: [...made, key], duplicate: false };
}

export function missingOutfits(made: string[], shirts: Item[], pants: Item[]): string[] {
  return shirts.flatMap(shirt => pants.map(item => outfitKey(shirt.id, item.id))).filter(key => !made.includes(key));
}

/** 활동 안의 숫자 입력. 0 이상의 정수만 받는다. */
export function readWhole(input: string): number | null {
  const text = input.trim();
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(text)) return null;
  const value = Number(text.replaceAll(',', ''));
  return Number.isSafeInteger(value) ? value : null;
}

const productOf = (values: number[]) => values.reduce((a, b) => a * b, 1);
const sumOf = (values: number[]) => values.reduce((a, b) => a + b, 0);

export type ProductMistake = 'correct' | 'added' | 'partial' | 'added-one' | 'other';

/**
 * 곱의 법칙 답을 판정하고, 틀렸다면 무엇을 잘못 셌는지 분류한다.
 * - added: 단계별 가짓수를 더함
 * - partial: 일부 단계만 곱함 (한 단계를 빠뜨림)
 * - added-one: 선택지가 하나 늘었을 때 전체에 1만 더함 (previousTotal을 줄 때만)
 */
export function classifyProduct(answer: number, factors: number[], previousTotal?: number): ProductMistake {
  if (answer === productOf(factors)) return 'correct';
  if (factors.length > 1 && answer === sumOf(factors)) return 'added';
  if (previousTotal !== undefined && answer === previousTotal + 1) return 'added-one';
  if (factors.length > 2 && factors.some((_, skip) => answer === productOf(factors.filter((__, i) => i !== skip)))) return 'partial';
  return 'other';
}

/** "□ × □ = □" 식 완성. 두 수의 순서는 상관없다. */
export function checkProductExpression(left: number | null, right: number | null, total: number | null, rows: number, columns: number): boolean {
  if (left === null || right === null || total === null) return false;
  const sameFactors = (left === rows && right === columns) || (left === columns && right === rows);
  return sameFactors && total === rows * columns;
}

export type ChainProblem = { steps: { label: string; count: number; unit: string }[] };

// 혼자 해보기: 세 단계 선택. 틀리면 숫자를 바꾼 다음 문제로 다시 푼다.
const CHAIN_VARIANTS: [number, number, number][] = [[2, 3, 2], [3, 2, 4], [4, 2, 2], [3, 3, 2]];
export function chainProblem(variant: number): ChainProblem {
  const [hats, shirts, shoes] = CHAIN_VARIANTS[((variant % CHAIN_VARIANTS.length) + CHAIN_VARIANTS.length) % CHAIN_VARIANTS.length];
  return { steps: [
    { label: '모자', count: hats, unit: '종류' },
    { label: '티셔츠', count: shirts, unit: '종류' },
    { label: '운동화', count: shoes, unit: '종류' },
  ] };
}
export const chainAnswer = (problem: ChainProblem) => productOf(problem.steps.map(step => step.count));

/** 가지 그림의 단계별 묶음: [1단계 개수], [그룹 수, 그룹당 개수] ... */
export function chainLevels(problem: ChainProblem): { groups: number; perGroup: number; total: number }[] {
  let groups = 1;
  return problem.steps.map(step => {
    const level = { groups, perGroup: step.count, total: groups * step.count };
    groups = level.total;
    return level;
  });
}

export const PRODUCT_STAGES = ['예상하기', '직접 만들기', '규칙 찾기', '혼자 풀기'] as const;

// 작은 경우는 직접 열거하고, 큰 경우는 같은 원리로 계산한다.
export function fallingFactors(n: number, r: number): number[] {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) return [];
  return Array.from({ length: r }, (_, i) => n - i);
}
export const arrangementCount = (n: number, r = n) => !Number.isInteger(n) || !Number.isInteger(r) || r > n || r < 0 || n < 0 ? 0 : productOf(fallingFactors(n, r));
export const combinationCount = (n: number, r: number) => arrangementCount(r) > 0 ? arrangementCount(n, r) / arrangementCount(r) : 0;

export function orderedChoices(items: string[], size: number): string[][] {
  if (size === 0) return [[]];
  if (size < 0 || size > items.length) return [];
  return items.flatMap((item, i) => orderedChoices(items.filter((_, index) => index !== i), size - 1).map(rest => [item, ...rest]));
}
export const selectionKey = (items: string[]) => [...items].sort().join('');
export function groupedChoices(items: string[], size: number): Record<string, string[][]> {
  const groups: Record<string, string[][]> = {};
  for (const order of orderedChoices(items, size)) (groups[selectionKey(order)] ??= []).push(order);
  return groups;
}

/** 처음·끝·연속 칸막이도 허용해, 공이 0개인 상자를 빠뜨리지 않는다. */
export function binsToSymbols(bins: number[]): string[] {
  return bins.flatMap((count, i) => [...Array<string>(count).fill('star'), ...(i < bins.length - 1 ? ['bar'] : [])]);
}
export function barsToBins(stars: number, boxes: number, positions: number[]): number[] | null {
  const slots = stars + boxes - 1;
  if (!Number.isInteger(stars) || stars < 0 || !Number.isInteger(boxes) || boxes < 1 || positions.length !== boxes - 1
    || new Set(positions).size !== positions.length || positions.some(p => !Number.isInteger(p) || p < 0 || p >= slots)) return null;
  const bins = Array<number>(boxes).fill(0);
  let box = 0;
  for (let i = 0; i < slots; i++) { if (positions.includes(i)) box++; else bins[box]++; }
  return bins;
}
export function distributionCount(stars: number, boxes: number): number {
  return stars < 0 || boxes < 1 ? 0 : combinationCount(stars + boxes - 1, boxes - 1);
}
export function remainingAfterMinimum(total: number, minima: number[]): number {
  return total - sumOf(minima);
}

export type CountingSkill = 'factorial' | 'permutation' | 'combination' | 'repetition' | 'minimum';
export type CountingPractice = { prompt: string; answer: number; explanation: string; n: number; r: number; minima?: number[] };
export function countingPractice(skill: CountingSkill, variant: number): CountingPractice {
  const index = ((variant % 4) + 4) % 4;
  if (skill === 'factorial') {
    const n = [5, 4, 6, 3][index]; const answer = arrangementCount(n);
    return { n, r: n, answer, prompt: `서로 다른 카드 ${n}장을 모두 한 줄로 놓는 방법은 몇 가지인가요?`, explanation: `${fallingFactors(n, n).join(' × ')} = ${answer}. 모든 카드를 한 번씩 쓰므로 ${n}!이에요.` };
  }
  if (skill === 'permutation') {
    const [n, r] = [[5, 2], [6, 2], [5, 3], [6, 3]][index]; const answer = arrangementCount(n, r);
    return { n, r, answer, prompt: `학생 ${n}명 중 서로 다른 ${r}명을 뽑아 ${r === 2 ? '회장과 부회장' : '회장, 부회장, 총무'}을 정해요. 한 사람은 한 역할만 맡을 때 몇 가지인가요?`, explanation: `역할이 다르면 다른 경우예요. ${fallingFactors(n, r).join(' × ')} = ${answer}. ${r}자리를 채우면 멈춰요.` };
  }
  if (skill === 'combination') {
    const [n, r] = [[5, 2], [6, 2], [5, 3], [6, 3]][index]; const answer = combinationCount(n, r);
    return { n, r, answer, prompt: `학생 ${n}명 중 역할 구별 없이 대표 ${r}명을 뽑아요. 같은 구성원은 한 번만 셀 때 몇 가지인가요?`, explanation: `각 구성원을 ${r}! = ${arrangementCount(r)}번씩 셌어요. (${fallingFactors(n, r).join(' × ')}) ÷ ${arrangementCount(r)} = ${answer}.` };
  }
  if (skill === 'repetition') {
    const [n, r] = [[3, 4], [4, 3], [3, 5], [4, 4]][index]; const answer = distributionCount(r, n);
    return { n, r, answer, prompt: `${n}종류의 과자를 중복해서 ${r}개 골라요. 고른 순서는 구별하지 않고, 안 고르는 종류도 있을 수 있어요. 몇 가지인가요?`, explanation: `별 ${r}개와 칸막이 ${n - 1}개. 총 ${r + n - 1}자리 중 칸막이 ${n - 1}자리를 고르므로 ${r + n - 1}C${n - 1} = ${answer}.` };
  }
  const cases: [number, number[]][] = [[9, [1, 2, 0]], [11, [2, 1, 1]], [8, [1, 1, 1]], [14, [2, 3, 1]]];
  const [total, limits] = cases[index]; const left = remainingAfterMinimum(total, limits); const answer = distributionCount(left, limits.length);
  return { n: total, r: left, minima: limits, answer, prompt: `같은 공 ${total}개를 상자 A, B, C에 모두 넣어요. ${limits.map((count, i) => `${'ABC'[i]}에는 적어도 ${count}개`).join(', ')}를 넣는 방법은 몇 가지인가요?`, explanation: `먼저 ${limits.join(' + ')} = ${sumOf(limits)}개를 넣어요. 남은 ${left}개와 칸막이 2개를 배열하므로 ${left + 2}C2 = ${answer}.` };
}
