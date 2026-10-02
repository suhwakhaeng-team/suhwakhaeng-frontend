import test from 'node:test';
import assert from 'node:assert/strict';
import {
  qMapConnectionsFor,
  qMapPreviewConnections,
  qMapPreviewProblems,
  qMapProblemById,
  qMapTodayProblems,
} from '../src/lib/qMapPreview.ts';

test('오늘의 5문제는 순서대로 표시되며 AN 심화와 BN 결합을 모두 포함한다', () => {
  const today = qMapTodayProblems();
  assert.deepEqual(today.map(problem => problem.todayOrder), [1, 2, 3, 4, 5]);
  assert.ok(today.some(problem => problem.level === 'AN' && problem.difficulty >= 4));
  assert.ok(today.some(problem => problem.level === 'BN' && problem.tags.length > 1));
});

test('모든 연결은 실제 문제 사이의 공유 개념을 근거로 한다', () => {
  assert.equal(new Set(qMapPreviewProblems.map(problem => problem.id)).size, qMapPreviewProblems.length);
  for (const connection of qMapPreviewConnections) {
    const from = qMapProblemById(connection.from);
    const to = qMapProblemById(connection.to);
    assert.ok(from && to, `존재하지 않는 문제 연결: ${connection.from} → ${connection.to}`);
    assert.ok(connection.sharedTags.length > 0);
    assert.ok(connection.sharedTags.every(tag => from.tags.includes(tag) && to.tags.includes(tag)));
    assert.ok(qMapConnectionsFor(from.id).includes(connection));
    assert.ok(qMapConnectionsFor(to.id).includes(connection));
  }
});
