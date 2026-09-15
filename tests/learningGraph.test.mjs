import test from 'node:test';
import assert from 'node:assert/strict';
import { createGraphIndex, getRelatedConcepts, getRelatedUnits, getPrerequisiteStages, getMissingPrerequisites, getRootLearningGaps, getUnitProgress, getGapPath } from '../src/services/learningGraph.ts';
import { layoutUnits, layoutConcepts, layoutAllConcepts, layoutFocusedConcepts, layoutFocusedGraph, routedConceptEdge, CONCEPT_PAGE_SIZE } from '../src/services/learningGraphLayout.ts';
import { createLocalProgressRepository } from '../src/repositories/conceptProgress.ts';
import { adaptTopology } from '../src/services/topologyGraphAdapter.ts';
import { learningGraphExamples, probabilityExample, algorithmsExample } from '../src/data/learningGraphExamples.ts';

const graph = (relations) => createGraphIndex({
  id: 'test', subject: { id: 'subject', name: 'Any subject' },
  units: [{ id: 'unit', subjectId: 'subject', name: 'Unit', prerequisites: [] }],
  concepts: Object.entries(relations).map(([id, prerequisites]) => ({ id, name: id, unitId: 'unit', description: '', prerequisites })),
});
const memory = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};

test('both subject datasets have valid ID references and stable unit layout', () => {
  for (const data of learningGraphExamples) {
    const index = createGraphIndex(data);
    assert.equal(index.concepts.size, data.concepts.length);
    assert.deepEqual(layoutUnits(index), layoutUnits(index));
    assert.equal(layoutUnits(index).size, data.units.length);
  }
  const probabilityUnits = layoutUnits(createGraphIndex(probabilityExample));
  assert.equal(new Set([...probabilityUnits.values()].map(point => point.y)).size, 1);
  const grades = new Map(probabilityExample.concepts.map(concept => [concept.id, concept.metadata.grade]));
  assert.equal(grades.get('sum'), '중2');
  assert.equal(grades.get('factorial'), '고1');
  assert.equal(grades.get('normal-approx'), '고2');
});

test('lays out units deterministically and expanded concepts in a stable orbit', () => {
  for (const data of learningGraphExamples) {
    const index = createGraphIndex(data);
    const units = layoutUnits(index);
    assert.deepEqual(units, layoutUnits(index));
    assert.equal(new Set([...units.values()].map(point => `${point.x}:${point.y}`)).size, data.units.length);
  }

  const prerequisites = new Map([
    ['a', []],
    ['b', ['a']],
    ['c', ['a']],
    ['d', ['b', 'c']],
  ]);
  const concepts = layoutConcepts([...prerequisites.keys()], { x: 0, y: 0 }, prerequisites);
  assert.deepEqual(concepts, layoutConcepts([...prerequisites.keys()], { x: 0, y: 0 }, prerequisites));
  assert.equal(new Set([...concepts.values()].map(point => `${point.x}:${point.y}`)).size, prerequisites.size);
  assert(concepts.get('a').x < concepts.get('b').x);
  assert(concepts.get('b').x < concepts.get('d').x);
  assert(concepts.get('c').x < concepts.get('d').x);
});

test('concept positions stay stable when a prerequisite path is revealed', () => {
  const index = createGraphIndex(probabilityExample);
  const units = layoutUnits(index);
  const all = layoutAllConcepts(index, units);
  assert.deepEqual(all, layoutAllConcepts(index, units));
  assert.equal(all.size, probabilityExample.concepts.length);
  assert(all.get('sum').y > units.get('counting').y);
  assert(all.get('sample-space').y > units.get('probability').y);
});

test('focused prerequisite routes are spacious and flow left-to-right', () => {
  const index = createGraphIndex(probabilityExample);
  const ids = new Set(['product', 'factorial', 'permutations', 'combinations', 'binomial-theorem']);
  const points = layoutFocusedConcepts(index, ids);
  const route = [...ids].map(id => points.get(id));
  assert.equal(points.size, ids.size);
  for (let i = 1; i < route.length; i++) assert(route[i].x - route[i - 1].x >= 230);
  assert.equal(new Set(route.map(point => point.y)).size, 1);
});

test('long focused relationships get independent waypoints through every skipped rank', () => {
  const index = createGraphIndex(probabilityExample);
  const ids = new Set(['normal-approx', ...getRelatedConcepts(index, 'normal-approx', 'ancestors')]);
  const layout = layoutFocusedGraph(index, ids);
  const route = layout.routes.get('combinations:binomial');
  assert(route.length > 2);
  for (let i = 1; i < route.length; i++) assert.equal(route[i].x - route[i - 1].x, 230);
  assert.match(routedConceptEdge(route), /^M.* C/);
});

test('separates direct/indirect dependencies and traverses both directions', () => {
  const index = graph({ a: [], b: ['a'], c: ['b'], d: ['a'] });
  assert.deepEqual([...getRelatedConcepts(index, 'c', 'ancestors')], ['b', 'a']);
  assert.deepEqual(new Set(getRelatedConcepts(index, 'a', 'descendants')), new Set(['b', 'c', 'd']));
  assert.deepEqual(getMissingPrerequisites(index, 'c', { b: 'unknown' }).map(m => [m.concept.id, m.direct, m.status]), [['b', true, 'unknown'], ['a', false, 'unset']]);
});

test('unit focus includes every direct and indirect prerequisite unit only', () => {
  const index = createGraphIndex(probabilityExample);
  assert.deepEqual(getRelatedUnits(index, 'conditional', 'ancestors'), new Set(['probability', 'permutation', 'counting']));
  assert(!getRelatedUnits(index, 'conditional', 'ancestors').has('distribution'));
  assert.deepEqual(getRelatedUnits(index, 'permutation', 'ancestors'), new Set(['counting']));
});

test('prerequisite stages flatten a branching graph into foundation-to-target order', () => {
  const index = createGraphIndex(probabilityExample);
  assert.deepEqual(getPrerequisiteStages(index, 'binomial-theorem'), [
    ['product'], ['factorial'], ['permutations'], ['combinations'], ['binomial-theorem'],
  ]);
});

test('root-gap diagnosis stops at known concepts and gives a traceable recommendation', () => {
  const index = createGraphIndex(algorithmsExample);
  const result = getRootLearningGaps(index, 'dijkstra', algorithmsExample.initialProgress);
  assert.deepEqual(result.roots.map(r => r.concept.id), ['heap']);
  assert.deepEqual(result.roots[0].path, ['dijkstra', 'priority-queue', 'heap']);
  assert.equal(result.cycleBlocked.length, 0);
  const complete = { ...algorithmsExample.initialProgress, 'priority-queue': 'known' };
  assert.equal(getRootLearningGaps(index, 'dijkstra', complete).roots.length, 0);
  // Full prerequisites still expose unresolved older concepts, even beyond a known direct node.
  assert(getMissingPrerequisites(index, 'dijkstra', complete).some(m => m.concept.id === 'heap'));
});

test('cycles cannot loop forever and are not mislabeled as a learnable root', () => {
  const index = graph({ a: ['c'], b: ['a'], c: ['b'], target: ['a'] });
  assert.deepEqual(new Set(getRelatedConcepts(index, 'a', 'ancestors')), new Set(['c', 'b']));
  const gaps = getRootLearningGaps(index, 'target', {});
  assert.equal(gaps.roots.length, 0);
  assert.deepEqual(new Set(gaps.cycleBlocked), new Set(['a', 'b', 'c']));
  assert.equal(layoutUnits(index).size, 1);
});

test('self cycles and cycles with an acyclic branch produce explicit warnings', () => {
  const index = graph({ a: ['a', 'b'], b: [], target: ['a'] });
  const result = getRootLearningGaps(index, 'target', {});
  assert.deepEqual(result.roots.map(r => r.concept.id), ['b']);
  assert.deepEqual(result.cycleBlocked, ['a']);
});

test('progress handles empty units and uses all concepts, not filtered nodes', () => {
  const index = graph({ a: [], b: ['a'], c: [] });
  assert.deepEqual(getUnitProgress(index, 'unit', { a: 'known', b: 'unknown' }), { known: 1, total: 3, ratio: 1 / 3 });
  assert.deepEqual(getUnitProgress(index, 'missing', {}), { known: 0, total: 0, ratio: 0 });
});

test('gap mode includes unknown concepts plus their complete prerequisite paths', () => {
  const index = graph({ a: [], b: ['a'], c: ['b'], d: [] });
  assert.deepEqual(new Set(getGapPath(index, { a: 'known', b: 'unset', c: 'unknown', d: 'unset' })), new Set(['a', 'b', 'c']));
});

test('storage survives repository recreation and isolates users and datasets', () => {
  const storage = memory();
  const a = createLocalProgressRepository('user/1', 'course', ['a', 'b'], storage);
  a.setStatus('a', 'known');
  assert.equal(createLocalProgressRepository('user/1', 'course', ['a'], storage).load().a, 'known');
  assert.deepEqual(createLocalProgressRepository('user/2', 'course', ['a'], storage).load(), {});
  assert.deepEqual(createLocalProgressRepository('user/1', 'other', ['a'], storage).load(), {});
  a.setStatus('a', 'unset');
  assert.equal(a.load().a, 'unset');
  assert.throws(() => a.setStatus('not-in-dataset', 'known'));
});

test('corrupt, unavailable and full storage are explicit failures, not successful saves', () => {
  const corrupt = createLocalProgressRepository('u', 'd', ['a'], { getItem: () => '{broken', setItem() {} });
  assert.throws(() => corrupt.load());
  assert.throws(() => corrupt.setStatus('a', 'known'));
  const full = createLocalProgressRepository('u', 'd', ['a'], { getItem: () => null, setItem() { throw new Error('quota exceeded'); } });
  assert.throws(() => full.setStatus('a', 'known'), /quota/);
});

test('storage drops invalid status values and removed concept IDs', () => {
  const repository = createLocalProgressRepository('u', 'd', ['a', 'b'], { getItem: () => JSON.stringify({ version: 1, statuses: { a: 'known', b: 'BAD', c: 'known' } }), setItem() {} });
  assert.deepEqual(repository.load(), { a: 'known' });
});

test('topology adapter connects duplicate names safely by tag ID and exposes grade', () => {
  const dto = (id, tagName, categoryPath, grade = 5) => ({ id, tagName, categoryPath, status: 'MASTERED', colorDepth: 1, grade });
  const result = adaptTopology({ nodes: [dto('1', 'Shared', 'First'), dto('2', 'Shared', 'Second'), dto('3', 'Unique', 'Second'), dto('4', 'Next', 'Third')], edges: [
    { source: 'Shared', target: 'Unique', sourceTagId: '1', targetTagId: '3' },
    { source: 'Unique', target: 'Next', sourceTagId: '3', targetTagId: '4' },
    { source: 'Missing', target: 'Next', sourceTagId: '999', targetTagId: '4' },
  ] });
  assert.equal(result.warnings.length, 1);
  assert.deepEqual(result.data.concepts.find(c => c.id === '3').prerequisites, ['1']);
  assert.deepEqual(result.data.concepts.find(c => c.id === '4').prerequisites, ['3']);
  assert.equal(result.data.initialProgress['4'], 'known');
  assert.equal(result.data.concepts.find(c => c.id === '4').metadata.assessmentStatus, 'MASTERED');
  assert.equal(result.data.concepts.find(c => c.id === '4').metadata.grade, '고2');
  assert.doesNotThrow(() => createGraphIndex(result.data));
});

test('invalid graphs fail with context rather than render incorrect relationships', () => {
  assert.throws(() => graph({ a: ['missing'] }), /missing/);
  const data = { ...algorithmsExample, concepts: [...algorithmsExample.concepts, algorithmsExample.concepts[0]] };
  assert.throws(() => createGraphIndex(data), /중복/);
});

test('5,000 concept chain is traversed without recursion; visible concepts stay bounded', () => {
  const relations = Object.fromEntries(Array.from({ length: 5000 }, (_, i) => [`c${i}`, i ? [`c${i - 1}`] : []]));
  const index = graph(relations);
  assert.equal(getRelatedConcepts(index, 'c4999', 'ancestors').size, 4999);
  const root = getRootLearningGaps(index, 'c4999', {});
  assert.equal(root.roots[0].concept.id, 'c0');
  assert.equal(root.roots[0].path.length, 5000);
  const page = index.data.concepts.slice(0, CONCEPT_PAGE_SIZE);
  assert.equal(layoutConcepts(page.map(c => c.id), { x: 0, y: 0 }).size, CONCEPT_PAGE_SIZE);
});
