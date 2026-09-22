export const MODEL = { mean: 40, sigma: 6 };
export const LEVELS = { 90: 1.6448536269514722, 95: 1.959963984540054, 99: 2.5758293035489004 };
export type ConfidenceLevel = keyof typeof LEVELS;
export const CI_STEPS = ['선수 개념 확인해보기', '표본으로 평균 예상해보기', '표본을 다시 뽑아보기', '평균의 분포 만들어보기', '표본 수를 바꿔보기', '추정 구간 만들어보기', '신뢰수준 확인해보기', '공식으로 계산해보기', '새 자료에 적용해보기'];

export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return (state + 0.5) / 4294967296; };
}

export function standardNormal(random: () => number): number {
  const u = Math.max(Number.EPSILON, Math.min(1 - Number.EPSILON, random()));
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function sample(n: number, random: () => number): number[] {
  if (!Number.isInteger(n) || n < 1 || n > 1000) throw new RangeError('Invalid sample size');
  return Array.from({ length: n }, () => MODEL.mean + MODEL.sigma * standardNormal(random));
}

export function mean(values: readonly number[]): number {
  if (!values.length || values.some(value => !Number.isFinite(value))) throw new RangeError('Invalid sample');
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function standardError(sigma: number, n: number): number {
  if (!Number.isFinite(sigma) || sigma <= 0 || !Number.isInteger(n) || n < 1) throw new RangeError('Invalid parameters');
  return sigma / Math.sqrt(n);
}

export function interval(center: number, sigma: number, n: number, level: ConfidenceLevel) {
  if (!Number.isFinite(center) || !Object.hasOwn(LEVELS, level)) throw new RangeError('Invalid interval');
  const margin = LEVELS[level] * standardError(sigma, n);
  return { center, lower: center - margin, upper: center + margin, margin };
}

export function contains(lower: number, upper: number, value = MODEL.mean) {
  return lower <= value && value <= upper;
}

// The mean of independent normal observations is exactly normal in this model.
export function simulateMeans(n: number, count: number, random: () => number) {
  const error = standardError(MODEL.sigma, n);
  if (!Number.isInteger(count) || count < 0 || count > 1000) throw new RangeError('Invalid count');
  return Array.from({ length: count }, () => MODEL.mean + error * standardNormal(random));
}

export function histogram(values: readonly number[], lower = 32, upper = 48, bins = 16) {
  if (!Number.isInteger(bins) || bins < 1 || !(upper > lower)) throw new RangeError('Invalid bins');
  const counts = Array<number>(bins).fill(0);
  let outside = 0;
  for (const value of values) {
    if (!Number.isFinite(value) || value < lower || value > upper) { outside++; continue; }
    const index = Math.min(bins - 1, Math.floor((value - lower) / (upper - lower) * bins));
    counts[index]++;
  }
  return { counts, outside };
}

export function closeAnswer(raw: string, expected: number) {
  return raw.trim() !== '' && Number.isFinite(Number(raw)) && Math.abs(Number(raw) - expected) <= 0.0051;
}

export function checkCalculation(answers: string[]) {
  const expected = interval(41, 6, 9, 95);
  return closeAnswer(answers[0] ?? '', expected.margin) && closeAnswer(answers[1] ?? '', expected.lower) && closeAnswer(answers[2] ?? '', expected.upper);
}

export function checkTransfer(answers: string[]) {
  const expected = interval(42, 6, 36, 95);
  return closeAnswer(answers[0] ?? '', expected.lower) && closeAnswer(answers[1] ?? '', expected.upper) && answers[2] === 'repeat' && answers[3] === 'narrow';
}
