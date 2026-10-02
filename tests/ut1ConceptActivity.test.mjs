import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import katex from 'katex';
import { addOutfit, chainAnswer, chainLevels, chainProblem, checkProductExpression, classifyProduct, hasGuidedActivity,
  missingOutfits, outfitKey, PRODUCT_PANTS, PRODUCT_SHIRTS, readWhole } from '../src/routes/dev/ut1ConceptActivityModel.ts';
import { arrangementCount, barsToBins, binsToSymbols, combinationCount, countingPractice, distributionCount,
  fallingFactors, groupedChoices, orderedChoices, remainingAfterMinimum } from '../src/routes/dev/ut1ConceptActivityModel.ts';
import { UT_NODES } from '../src/routes/dev/ut1Model.ts';

test('조합 학습 공식은 분수 두 개로 렌더링된다', () => {
  const source = ts.createSourceFile('UT1ConceptActivities.tsx',
    readFileSync(new URL('../src/routes/dev/UT1ConceptActivities.tsx', import.meta.url), 'utf8'),
    ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const formulas = [];
  function visit(node) {
    if (ts.isStringLiteral(node) && node.text.includes('dfrac')) formulas.push(node.text);
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.equal(formulas.length, 1);
  const formula = formulas[0].split('$')[1];
  assert.ok(!formula.includes('\\\\'), 'TeX 명령 앞에는 역슬래시 하나만 전달해야 한다');
  const rendered = katex.renderToString(formula, { throwOnError: true });
  assert.equal((rendered.match(/<mfrac>/g) ?? []).length, 2);
});

test('새 학습 활동은 실제 개념 노드 ID에만 연결된다', () => {
  for (const id of ['c-product', 'c-factorial', 'c-permutation', 'c-combination', 'c-repetition', 'c-minimum']) {
    assert.equal(hasGuidedActivity(id), true); assert.equal(UT_NODES[id].kind, 'concept');
  }
  for (const id of ['a-product', 'bn-1', 'unknown']) assert.equal(hasGuidedActivity(id), false);
});

test('옷차림 만들기: 같은 조합은 한 번만 세고, 빠진 칸을 정확히 찾는다', () => {
  let made = [];
  ({ made } = addOutfit(made, 'white', 'jeans'));
  const again = addOutfit(made, 'white', 'jeans');
  assert.equal(again.duplicate, true);
  assert.equal(again.made, made);
  assert.equal(missingOutfits(made, PRODUCT_SHIRTS, PRODUCT_PANTS).length, PRODUCT_SHIRTS.length * PRODUCT_PANTS.length - 1);
  for (const shirt of PRODUCT_SHIRTS) for (const pants of PRODUCT_PANTS) ({ made } = addOutfit(made, shirt.id, pants.id));
  assert.deepEqual(missingOutfits(made, PRODUCT_SHIRTS, PRODUCT_PANTS), []);
  assert.equal(made.length, 6);
  assert.ok(made.includes(outfitKey('gray', 'black')));
});

test('식 완성은 순서와 상관없이 줄 수 × 칸 수 = 전체만 맞다', () => {
  assert.equal(checkProductExpression(3, 2, 6, 3, 2), true);
  assert.equal(checkProductExpression(2, 3, 6, 3, 2), true);
  assert.equal(checkProductExpression(3, 2, 5, 3, 2), false);
  assert.equal(checkProductExpression(1, 6, 6, 3, 2), false);
  assert.equal(checkProductExpression(null, 2, 6, 3, 2), false);
});

test('틀린 답의 원인을 분류한다: 더하기, 일부만 곱하기, 1만 더하기', () => {
  assert.equal(classifyProduct(8, [4, 2], 6), 'correct');
  assert.equal(classifyProduct(7, [4, 2], 6), 'added-one');
  assert.equal(classifyProduct(6, [4, 2], 6), 'added');
  assert.equal(classifyProduct(7, [2, 3, 2]), 'added');
  assert.equal(classifyProduct(6, [2, 3, 2]), 'partial');
  assert.equal(classifyProduct(4, [2, 3, 2]), 'partial');
  assert.equal(classifyProduct(20, [2, 3, 2]), 'other');
});

test('혼자 풀기: 틀리면 숫자가 바뀐 문제가 나오고 가지 그림 개수는 답과 같다', () => {
  const answers = [0, 1, 2, 3].map(variant => chainAnswer(chainProblem(variant)));
  assert.deepEqual(answers, [12, 24, 16, 18]);
  for (let variant = 0; variant < 4; variant++) {
    assert.notEqual(chainAnswer(chainProblem(variant)), chainAnswer(chainProblem(variant + 1)));
    const problem = chainProblem(variant); const levels = chainLevels(problem);
    assert.equal(levels.at(-1).total, chainAnswer(problem));
    assert.equal(levels[0].groups, 1);
  }
  assert.deepEqual(chainProblem(4), chainProblem(0));
});

test('활동 숫자 입력은 0 이상의 정수만 받는다', () => {
  assert.equal(readWhole(' 12 '), 12);
  assert.equal(readWhole('1,200'), 1200);
  for (const value of ['', '-1', '2.5', '여섯', '1,,2', '1,20', '9007199254740992']) assert.equal(readWhole(value), null);
});

test('팩토리얼은 전부, 순열은 필요한 자리까지만: 직접 배열과 계산이 같다', () => {
  for (let n = 0; n <= 6; n++) for (let r = 0; r <= n; r++) {
    const orders = orderedChoices(Array.from({ length: n }, (_, i) => String(i)), r);
    assert.equal(orders.length, arrangementCount(n, r));
    assert.equal(new Set(orders.map(order => order.join(','))).size, orders.length);
    assert.ok(orders.every(order => new Set(order).size === order.length));
  }
  assert.deepEqual(fallingFactors(4, 2), [4, 3]);
  assert.deepEqual(fallingFactors(4, 4), [4, 3, 2, 1]);
  assert.equal(arrangementCount(0), 1);
});

test('조합은 같은 구성원의 배열을 r!개씩 묶는다 (두 명과 세 명 모두)', () => {
  for (let n = 2; n <= 6; n++) for (let r = 1; r <= n; r++) {
    const groups = groupedChoices(Array.from({ length: n }, (_, i) => String(i)), r);
    assert.equal(Object.keys(groups).length, combinationCount(n, r));
    assert.ok(Object.values(groups).every(group => group.length === arrangementCount(r)));
  }
  assert.equal(groupedChoices(['A', 'B', 'C'], 3).ABC.length, 6);
});

test('칸막이 위치와 공 배분은 일대일 대응: 빈 상자와 연속 칸막이를 포함', () => {
  for (let stars = 0; stars <= 6; stars++) for (let boxes = 1; boxes <= 4; boxes++) {
    const groups = groupedChoices(Array.from({ length: stars + boxes - 1 }, (_, i) => String(i)), boxes - 1);
    const bins = Object.values(groups).map(group => barsToBins(stars, boxes, group[0].map(Number)));
    assert.equal(bins.length, distributionCount(stars, boxes));
    assert.equal(new Set(bins.map(counts => counts.join(','))).size, bins.length);
    for (const counts of bins) {
      assert.equal(counts.reduce((a, b) => a + b, 0), stars);
      const positions = binsToSymbols(counts).flatMap((symbol, i) => symbol === 'bar' ? [i] : []);
      assert.deepEqual(barsToBins(stars, boxes, positions), counts);
    }
  }
  assert.deepEqual(barsToBins(3, 3, [0, 1]), [0, 0, 3]);
  assert.deepEqual(barsToBins(3, 3, [3, 4]), [3, 0, 0]);
  assert.equal(barsToBins(3, 3, [1, 1]), null);
  assert.equal(barsToBins(3, 3, [0, 5]), null);
  assert.equal(barsToBins(3, 3, [0]), null);
});

test('학습 내부 변형의 계산을 직접 열거해 검산하며 연속 오답은 다른 답의 문제로 간다', () => {
  for (const skill of ['factorial', 'permutation', 'combination', 'repetition', 'minimum']) for (let variant = 0; variant < 4; variant++) {
    const problem = countingPractice(skill, variant);
    assert.notEqual(problem.answer, countingPractice(skill, variant + 1).answer);
    let expected;
    if (skill === 'factorial' || skill === 'permutation') expected = orderedChoices(Array.from({ length: problem.n }, (_, i) => String(i)), problem.r).length;
    else if (skill === 'combination') expected = Object.keys(groupedChoices(Array.from({ length: problem.n }, (_, i) => String(i)), problem.r)).length;
    else {
      const boxes = skill === 'minimum' ? problem.minima.length : problem.n;
      const minima = problem.minima ?? Array(boxes).fill(0);
      const total = skill === 'minimum' ? problem.n : problem.r;
      function enumerate(i, remaining) {
        if (i === boxes - 1) return remaining >= minima[i] ? 1 : 0;
        let result = 0;
        for (let count = minima[i]; count <= remaining; count++) result += enumerate(i + 1, remaining - count);
        return result;
      }
      expected = enumerate(0, total);
    }
    assert.equal(problem.answer, expected, `${skill} ${variant}`);
  }
  assert.equal(remainingAfterMinimum(7, [1, 2, 0]), 4);
  assert.equal(remainingAfterMinimum(8, [1, 3, 0]), 4);
  assert.notEqual(remainingAfterMinimum(8, [1, 3, 0]), 8 - 3);
});
