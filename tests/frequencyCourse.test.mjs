import test from 'node:test';
import assert from 'node:assert/strict';
import { checkMission, DATASETS, frequencies, parseProgress } from '../src/routes/dev/frequencyCourse.ts';

test('each dataset has correct boundary-inclusive frequencies and totals', () => {
  assert.deepEqual(frequencies(DATASETS.practice), [2, 4, 2]);
  assert.deepEqual(frequencies(DATASETS.independent), [3, 2, 4]);
  assert.deepEqual(frequencies(DATASETS.challenge), [3, 4, 2]);
  assert.deepEqual(frequencies(DATASETS.review), [2, 2, 5]);
  for (const data of Object.values(DATASETS)) assert.equal(frequencies(data).reduce((a,b) => a+b, 0), data.length);
});

test('reading, card classification and counting reject wrong answers', () => {
  assert.equal(checkMission(0, ['1'], []), true);
  assert.equal(checkMission(0, ['0'], []), false);
  assert.equal(checkMission(1, [], [29, 20, 23]), true);
  assert.equal(checkMission(1, [], [20, 23, 29, 30]), false);
  assert.equal(checkMission(1, [], [20, 23]), false);
  assert.equal(checkMission(2, ['4'], []), true);
  for (const answer of ['', ' ', '3', '-1', '4.5', 'NaN']) assert.equal(checkMission(2, [answer], []), false);
});

test('table missions require every row and the final mission requires interpretation', () => {
  assert.equal(checkMission(3, ['2','4','2'], []), true);
  assert.equal(checkMission(3, ['2','4'], []), false);
  assert.equal(checkMission(4, ['3','2','4'], []), true);
  assert.equal(checkMission(4, ['2','4','2'], []), false);
  assert.equal(checkMission(5, ['3','4','2','1','9'], []), true);
  assert.equal(checkMission(5, ['3','4','2','0','9'], []), false);
  assert.equal(checkMission(5, ['3','4','2','1','8'], []), false);
  assert.equal(checkMission(5, ['3','4','2'], []), false);
  assert.equal(checkMission(5, ['2','2','5','2','9'], [], true), true);
  assert.equal(checkMission(5, ['3','4','2','1','9'], [], true), false);
});

test('restore only valid consecutive completed steps; tolerate unavailable/corrupt storage', () => {
  for (const raw of [null, 'bad', '{}', 'null', '{"completed":"all"}']) assert.deepEqual(parseProgress(raw), { completed: [], reviewPassed: false });
  assert.deepEqual(parseProgress('{"completed":[0,0,2,9],"reviewPassed":true}'), { completed: [0], reviewPassed: false });
  assert.deepEqual(parseProgress('{"completed":[0,1,2,3,4,5],"reviewPassed":true}'), { completed: [0,1,2,3,4,5], reviewPassed: true });
});
