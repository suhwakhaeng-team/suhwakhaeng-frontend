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

export function hasStructuredChoices(problem: AnswerableProblem | null | undefined): boolean {
  return problem?.answerType === 'MULTIPLE_CHOICE'
    && [problem.choiceA, problem.choiceB, problem.choiceC, problem.choiceD]
      .every((choice) => typeof choice === 'string' && choice.trim().length > 0);
}

export function isProblemAnswerCorrect(problem: AnswerableProblem, userAnswer: string): boolean {
  if (problem.answerType === 'NUMBER') {
    const expected = parseNumber(problem.answer);
    const actual = parseNumber(userAnswer);
    if (expected === null || actual === null) return false;
    const tolerance = Math.max(0, Number(problem.numericTolerance ?? 0));
    return Math.abs(expected - actual) <= tolerance;
  }

  return normalizeText(problem.answer) === normalizeText(userAnswer);
}
