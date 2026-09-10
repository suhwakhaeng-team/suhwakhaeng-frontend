export interface QuestionChoice { value: string; label: string; content: string }
export interface ChoiceQuestion { stem: string; choices: QuestionChoice[] }

/** The current question bank stores five circled options in content and an index (1–5) as answer. */
export function parseQuestionChoices(content: string): ChoiceQuestion | null {
  // Ignore circled symbols inside math; require exactly one ordered five-option group.
  const masked = content.replace(/\$\$[\s\S]*?\$\$|\$[^$\n]*?\$/g, m => ' '.repeat(m.length));
  const matches = [...masked.matchAll(/[①②③④⑤]/g)];
  if (matches.length !== 5 || matches.map(m => m[0]).join('') !== '①②③④⑤') return null;
  const stem = content.slice(0, matches[0].index).trim();
  const choices = matches.map((m, i) => ({
    value: String(i + 1), label: m[0],
    content: content.slice(m.index! + 1, matches[i + 1]?.index ?? content.length).trim(),
  }));
  if (!stem || choices.some(c => !c.content)) return null;
  return { stem, choices };
}
