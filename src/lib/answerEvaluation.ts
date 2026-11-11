export interface AnswerableProblem {
  answer: string;
  answerType?: 'NUMBER' | 'MULTIPLE_CHOICE' | null;
  choiceA?: string | null;
  choiceB?: string | null;
  choiceC?: string | null;
  choiceD?: string | null;
  numericTolerance?: number | null;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function parseNumber(value: string): number | null {
  const normalized = value.trim().replaceAll(',', '');
  if (!/^[-+]?\d+(?:\.\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function rational(value: string): [bigint, bigint] | null {
  const parts = value.replaceAll(',', '').split(/\s*\/\s*/);
  if (value.length > 200 || parts.length > 2 || parts.some(part => parseNumber(part) === null)) return null;
  const decimal = (part: string): [bigint, bigint] => {
    const [whole, fraction = ''] = part.split('.');
    return [BigInt(whole + fraction), 10n ** BigInt(fraction.length)];
  };
  const [a, b] = decimal(parts[0]);
  const [c, d] = decimal(parts[1] ?? '1');
  return c === 0n ? null : [a * d, b * c];
}

export function hasStructuredChoices(problem: AnswerableProblem | null | undefined): boolean {
  return problem?.answerType === 'MULTIPLE_CHOICE'
    && [problem.choiceA, problem.choiceB, problem.choiceC, problem.choiceD]
      .every((choice) => typeof choice === 'string' && choice.trim().length > 0);
}

export function isProblemAnswerCorrect(problem: AnswerableProblem, userAnswer: string): boolean {
  let expected = normalizeText(problem.answer);
  let actual = normalizeText(userAnswer);
  if (!actual) return false;
  if (/^[①②③④⑤]$/.test(expected)) {
    return actual === expected || actual === String('①②③④⑤'.indexOf(expected) + 1);
  }
  if (/^약\s*\d+\s*개$/.test(expected)) {
    expected = expected.replace(/[^0-9]/g, '');
    actual = actual.replace(/^약\s*/, '').replace(/\s*개$/, '');
  }
  const left = rational(expected);
  const right = rational(actual);
  if (left && right) {
    const tolerance = Math.max(0, Number(problem.numericTolerance ?? 0));
    return tolerance === 0
      ? left[0] * right[1] === right[0] * left[1]
      : Math.abs(Number(left[0]) / Number(left[1]) - Number(right[0]) / Number(right[1])) <= tolerance;
  }

  return expected === actual;
}
