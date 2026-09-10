import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseQuestionChoices } from './questionChoices.ts';

test('single-line and multiline options submit indices, not displayed values', () => {
  for (const separator of [' ', '\n', '\r\n\r\n']) {
    const q = parseQuestionChoices('값은?\n' + ['① 10', '② 20', '③ $\\frac{1}{2}$', '④ 40', '⑤ 50'].join(separator));
    assert.equal(q.stem, '값은?');
    assert.deepEqual(q.choices.map(c => c.value), ['1','2','3','4','5']);
    assert.equal(q.choices[2].content, '$\\frac{1}{2}$');
  }
});
test('ordinary questions, subitems, incomplete or repeated markers keep text entry', () => {
  for(const content of ['값을 구하시오.', '(1) 12 (2) 34', '문제 ① 1 ② 2', '문제 ① 1 ② 2 ③ 3 ④ 4 ⑤', '조건 ① 참고\n① 1 ② 2 ③ 3 ④ 4 ⑤ 5']) {
    assert.equal(parseQuestionChoices(content), null);
  }
});
test('markers inside formulas are not choices', () => {
  const q = parseQuestionChoices('식 $\\text{①}$의 값은? ① 1 ② 2 ③ 3 ④ 4 ⑤ 5');
  assert.equal(q.stem, '식 $\\text{①}$의 값은?');
});
