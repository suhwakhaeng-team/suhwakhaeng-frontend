import test from 'node:test';
import assert from 'node:assert/strict';
import { checkCalculation, checkTransfer, closeAnswer, contains, histogram, interval, mean, MODEL, sample, seededRandom, simulateMeans, standardError, standardNormal } from '../src/routes/dev/confidenceCourse.ts';

test('sampling is reproducible, finite and computes the unrounded mean', () => {
  const a = sample(9, seededRandom(123));
  assert.deepEqual(a, sample(9, seededRandom(123)));
  assert.equal(a.length, 9);
  assert.ok(a.every(Number.isFinite));
  assert.equal(mean([30, 40, 50]), 40);
  assert.ok(Number.isFinite(standardNormal(() => 0)));
  assert.throws(() => sample(0, seededRandom(1)), RangeError);
  assert.throws(() => sample(2.5, seededRandom(1)), RangeError);
  assert.throws(() => mean([]), RangeError);
});
test('known-sigma intervals have the correct center, margin and width relationships', () => {
  const row = interval(41, 6, 9, 95);
  assert.ok(Math.abs(row.margin - 3.919927969080108) < 1e-12);
  assert.ok(Math.abs(row.lower - 37.08007203091989) < 1e-12);
  assert.ok(Math.abs((row.lower + row.upper) / 2 - 41) < 1e-12);
  assert.equal(standardError(6, 9), 2);
  assert.equal(standardError(6, 36), 1);
  assert.ok(interval(41, 6, 36, 95).margin < row.margin);
  assert.ok(interval(41, 6, 9, 99).margin > row.margin);
  assert.ok(interval(41, 6, 9, 90).margin < row.margin);
  assert.equal(contains(40, 42), true);
  assert.equal(contains(41, 42), false);
  assert.throws(() => interval(NaN, 6, 9, 95), RangeError);
  assert.throws(() => interval(41, 6, 9, 96), RangeError);
  assert.throws(() => standardError(6, 0), RangeError);
});
test('same draws narrow as sample size grows; histogram accounts for every observation', () => {
  const small = simulateMeans(10, 240, seededRandom(317));
  const large = simulateMeans(100, 240, seededRandom(317));
  for (let i = 0; i < small.length; i++) assert.ok(Math.abs(large[i] - MODEL.mean) <= Math.abs(small[i] - MODEL.mean));
  const { counts, outside } = histogram([...small, 1, 100]);
  assert.equal(counts.reduce((a, b) => a + b, 0) + outside, 242);
  assert.equal(histogram([32, 48]).counts.reduce((a, b) => a + b, 0), 2);
});
test('normal-model repeated intervals approximate nominal coverage without forcing counts', () => {
  let hits = 0;
  for (let seed = 1; seed <= 20; seed++) {
    for (const center of simulateMeans(9, 1000, seededRandom(seed))) {
      const row = interval(center, 6, 9, 95);
      hits += Number(contains(row.lower, row.upper));
    }
  }
  assert.ok(hits / 20000 > 0.94 && hits / 20000 < 0.96);
});
test('calculation and transfer require every value and both interpretation answers', () => {
  assert.equal(checkCalculation(['3.92', '37.08', '44.92']), true);
  assert.equal(checkCalculation(['3.91', '37.08', '44.92']), false);
  assert.equal(checkTransfer(['40.05', '43.96', 'repeat', 'narrow']), false);
  assert.equal(checkTransfer(['40.04', '43.96', 'repeat', 'narrow']), true);
  for (const answers of [[], ['3.92', '', '44.92'], ['3.92', '44.92', '37.08']]) assert.equal(checkCalculation(answers), false);
  for (const answers of [[], ['40.04', '43.96', 'students', 'narrow'], ['40.04', '43.96', 'repeat', 'wide'], ['', '43.96', 'repeat', 'narrow']]) assert.equal(checkTransfer(answers), false);
  for (const raw of ['', ' ', 'NaN', 'Infinity']) assert.equal(closeAnswer(raw, 0), false);
});
