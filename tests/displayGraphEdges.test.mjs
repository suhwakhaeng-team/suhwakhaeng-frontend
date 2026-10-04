import test from 'node:test';
import assert from 'node:assert/strict';
import { createGraphIndex, getRelatedConcepts, reduceDisplayEdges } from '../src/services/learningGraph.ts';

const edgesOf = relations => Object.entries(relations).flatMap(([target, sources]) =>
  sources.map(source => ({ source, target })),
);
const reachable = (edges, source) => {
  const result = new Set();
  const queue = [source];
  for (let cursor = 0; cursor < queue.length; cursor++) {
    for (const edge of edges) if (edge.source === queue[cursor] && !result.has(edge.target)) {
      result.add(edge.target); queue.push(edge.target);
    }
  }
  return [...result].sort();
};

test('mean, deviation and variance keep their learning chain without a redundant shortcut', () => {
  const edges = edgesOf({ 평균: [], 편차: ['평균'], 분산: ['평균', '편차'] });
  assert.deepEqual(reduceDisplayEdges(edges), edgesOf({ 평균: [], 편차: ['평균'], 분산: ['편차'] }));
});

test('conditional probability still reaches independent trials through all essential concepts', () => {
  const relations = { 조건부확률: [], 곱셈정리: ['조건부확률'], 사건의독립: ['곱셈정리'], 독립시행: ['조건부확률', '사건의독립'] };
  const reduced = reduceDisplayEdges(edgesOf(relations));
  assert.equal(reduced.length, 3);
  assert.deepEqual(reachable(reduced, '조건부확률'), ['곱셈정리', '독립시행', '사건의독립']);
  assert(!reduced.some(edge => edge.source === '조건부확률' && edge.target === '독립시행'));
});

test('independent prerequisite branches and essential long links stay visible', () => {
  const edges = edgesOf({ a: [], b: ['a'], c: ['a'], d: ['b', 'c'], e: ['a', 'd'] });
  assert.deepEqual(reduceDisplayEdges(edges), edgesOf({ a: [], b: ['a'], c: ['a'], d: ['b', 'c'], e: ['d'] }));
  const essential = edgesOf({ a: [], b: ['a'], c: [], d: ['a', 'c'] });
  assert.deepEqual(reduceDisplayEdges(essential), essential);
});

test('offscreen intermediate concepts cannot replace a visible direct link', () => {
  const edges = edgesOf({ a: [], b: ['a'], c: ['a', 'b'] });
  const shown = new Set(['a', 'c']);
  const visible = edges.filter(edge => shown.has(edge.source) && shown.has(edge.target));
  assert.deepEqual(reduceDisplayEdges(visible), [{ source: 'a', target: 'c' }]);
});

test('display reduction preserves the source graph and learning relationships', () => {
  const data = {
    id: 'test', subject: { id: 's', name: 'test' },
    units: [{ id: 'u', subjectId: 's', name: 'test', prerequisites: [] }],
    concepts: Object.entries({ a: [], b: ['a'], c: ['a', 'b'] })
      .map(([id, prerequisites]) => ({ id, name: id, unitId: 'u', description: '', prerequisites })),
  };
  const index = createGraphIndex(data);
  const before = structuredClone(data);
  const edges = edgesOf(Object.fromEntries(data.concepts.map(concept => [concept.id, concept.prerequisites])));
  for (const edge of edges) Object.freeze(edge);
  Object.freeze(edges);
  reduceDisplayEdges(edges);
  assert.deepEqual(data, before);
  assert.deepEqual(index.concepts.get('c').prerequisites, ['a', 'b']);
  assert.deepEqual([...getRelatedConcepts(index, 'c', 'ancestors')], ['a', 'b']);
});

test('cyclic and duplicate content never loses reachability when links are hidden', () => {
  const edges = edgesOf({ a: [], b: ['a', 'c'], c: ['a', 'b'], d: ['a', 'b', 'c'] });
  edges.push({ ...edges[0] });
  const reduced = reduceDisplayEdges(edges);
  for (const id of ['a', 'b', 'c', 'd']) assert.deepEqual(reachable(reduced, id), reachable(edges, id));
  assert.deepEqual(reduceDisplayEdges(reduced), reduced);
  assert.deepEqual(reduceDisplayEdges([]), []);
});
