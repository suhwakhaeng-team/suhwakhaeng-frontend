import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import ts from 'typescript';
import katex from 'katex';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CONCEPT_LESSONS, DICE_OUTCOMES, inDiceEvent, EXAMPLE_PEOPLE, referenceCounts, ADDITION_REGIONS } from '../src/routes/dev/conditionalConceptLessons.ts';
import { CONDITIONAL_NODES } from '../src/routes/dev/conditionalProblemBreakdown.ts';

test('all five UT2 concept nodes have complete three-step explanations, not BN/AN lessons', () => {
  const concepts = Object.values(CONDITIONAL_NODES).filter(node => node.kind === 'concept').map(node => node.id).sort();
  assert.deepEqual(Object.keys(CONCEPT_LESSONS).sort(), concepts);
  for (const lesson of Object.values(CONCEPT_LESSONS)) {
    assert(lesson.lead);
    assert.equal(lesson.steps.length, 3);
    assert.equal(new Set(lesson.steps.map(step => step.title)).size, 3);
    assert(lesson.steps.some(step => step.diagram));
    for (const step of lesson.steps) {
      assert(step.title && step.paragraphs.length && step.takeaway);
      for (const content of [...step.paragraphs, ...(step.formulas ?? []), step.takeaway]) {
        assert.equal((content.match(/\$/g) ?? []).length % 2, 0, content);
        for (const match of content.matchAll(/\$([^$\n]+)\$/g)) {
          assert.doesNotThrow(() => katex.renderToString(match[1], { throwOnError: true, trust: false }));
        }
      }
    }
  }
  const text = JSON.stringify(CONCEPT_LESSONS);
  assert(text.includes('가능성이 같을 때'));
  assert(text.includes('0보다 커야'));
  assert(text.includes('조건부확률을 그대로'));
});

test('dice diagrams include both events in union and only shared results in intersection', () => {
  const select = event => DICE_OUTCOMES.filter(value => inDiceEvent(value, event));
  assert.deepEqual(select('all'), [1,2,3,4,5,6]);
  assert.deepEqual(select('A'), [2,4,6]);
  assert.deepEqual(select('B'), [3,6]);
  assert.deepEqual(select('union'), [2,3,4,6]);
  assert.deepEqual(select('intersection'), [6]);
});

test('switching the reference group changes denominators without changing the joint event', () => {
  assert.equal(new Set(EXAMPLE_PEOPLE.map(person => person.id)).size, 12);
  assert.deepEqual(referenceCounts('all'), { total: 12, matches: 6, ids: [1,2,3,4,5,6,7,8,9,10,11,12] });
  assert.deepEqual(referenceCounts('A'), { total: 6, matches: 4, ids: [1,2,3,4,5,6] });
  assert.deepEqual(referenceCounts('B'), { total: 8, matches: 4, ids: [1,2,3,4,7,8,9,10] });
  const a = referenceCounts('A'), b = referenceCounts('B');
  assert.notEqual(a.matches / a.total, b.matches / b.total);
  assert.equal((a.total / 12) * (a.matches / a.total), 4 / 12);
  assert.equal((b.total / 12) * (b.matches / b.total), 4 / 12);
});

test('addition diagram regions sum to one and duplicate only the intersection', () => {
  const { aOnly, both, bOnly, neither } = ADDITION_REGIONS;
  assert.equal(aOnly + both + bOnly + neither, 10);
  const a = aOnly + both, b = bOnly + both;
  assert.equal(a, 5); assert.equal(b, 4);
  assert.equal(a + b, 9);
  assert.equal(a + b - both, 7);
  assert.equal((aOnly + both + bOnly) - b, aOnly);
});

// Render real TSX + MathText through the project's TypeScript compiler, ignoring CSS only.
const require = createRequire(import.meta.url);
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const source = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  const localRequire = name => {
    if (name.endsWith('.css')) return {};
    if (!name.startsWith('.')) return require(name);
    const base = resolve(dirname(file), name);
    const target = [base, `${base}.ts`, `${base}.tsx`].find(path => existsSync(path));
    assert(target, name); return load(target);
  };
  new Function('require', 'module', 'exports', source)(localRequire, module, module.exports);
  return module.exports;
}
const Lesson = load(fileURLToPath(new URL('../src/routes/dev/ConditionalConceptLesson.tsx', import.meta.url))).default;

test('lesson entry renders real diagrams and next step, never marks a node passed by reading', () => {
  let completed = 0;
  for (const id of Object.keys(CONCEPT_LESSONS)) {
    const html = renderToStaticMarkup(createElement(Lesson, { nodeId: id, onConfirm: () => completed++ }));
    assert(html.includes(CONCEPT_LESSONS[id].steps[0].title));
    assert(html.includes('aria-current="step"'));
    assert(html.includes('다음 →'));
    assert(!html.includes('확인 문제 풀기 →'));
    assert(!html.includes('수식 문법을 확인해주세요'));
    assert(!html.includes('katex-error'));
    assert(html.includes('role="img"'));
    assert(html.includes('aria-pressed="true"'));
  }
  assert.equal(completed, 0);
  assert.equal(renderToStaticMarkup(createElement(Lesson, { nodeId: 'bn-1', onConfirm() {} })), '');
});

test('Venn diagrams use separate IDs when several lessons are rendered together', () => {
  const html = renderToStaticMarkup(createElement('div', null,
    createElement(Lesson, { nodeId: 'c-complement', onConfirm() {} }),
    createElement(Lesson, { nodeId: 'c-addition', onConfirm() {} }),
  ));
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert(ids.length >= 6);
  assert.equal(new Set(ids).size, ids.length);
  for (const reference of html.matchAll(/url\(#([^\)]+)\)/g)) assert(ids.includes(reference[1]));
});
