import test from 'node:test';
import assert from 'node:assert/strict';
import { moveCard } from '../src/routes/dev/cardOrder.ts';

test('moves one observation to either end without mutating source', () => {
  const order = [0, 1, 2, 3];
  assert.deepEqual(moveCard(order, 0, 3), [1, 2, 3, 0]);
  assert.deepEqual(moveCard(order, 3, 0), [3, 0, 1, 2]);
  assert.deepEqual(order, [0, 1, 2, 3]);
});
test('invalid moves, boundaries and cancellation leave order unchanged', () => {
  const order = [0, 1, 2];
  for (const [from, to] of [[0, 0], [-1, 2], [0, -1], [0, 3], [3, 0], [0.5, 1], [0, NaN]]) assert.equal(moveCard(order, from, to), order);
  const empty = [];
  assert.equal(moveCard(empty, 0, 0), empty);
});
test('every move preserves all observations, including duplicate values', () => {
  const data = [23, 12, 23, 20, 30];
  for (let from = 0; from < data.length; from++) {
    for (let to = 0; to < data.length; to++) {
      const moved = moveCard(data.map((_, id) => id), from, to);
      assert.equal(new Set(moved).size, data.length);
      assert.deepEqual([...moved].sort(), [0, 1, 2, 3, 4]);
      assert.equal(moved.filter(id => data[id] === 23).length, 2);
    }
  }
});
