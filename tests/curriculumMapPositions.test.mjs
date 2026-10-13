import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptTopology } from '../src/services/topologyGraphAdapter.ts';
import { createGraphIndex, getDisplayUnitEdges, getRelatedConcepts, getRelatedUnits, reduceDisplayEdges } from '../src/services/learningGraph.ts';
import { layoutUnits, layoutAllConcepts, layoutFocusedGraph, layoutContextUnits } from '../src/services/learningGraphLayout.ts';
import { LIVE_CONCEPT_CATALOG, LIVE_PREREQUISITES } from './fixtures/liveConceptCatalog.mjs';

const names = new Map(LIVE_CONCEPT_CATALOG);
const ids = new Map(LIVE_CONCEPT_CATALOG.map(([id, name]) => [name, String(id)]));
const relations = LIVE_PREREQUISITES.map(([source, target]) => [String(source), String(target)]);
const makeIndex = (catalog = LIVE_CONCEPT_CATALOG) => createGraphIndex(adaptTopology({
  nodes: catalog.map(([id, tagName]) => ({ id: String(id), tagName, categoryPath: '확률과 통계', status: 'UNDIAGNOSED' })),
  edges: relations.filter(([source, target]) => catalog.some(([id]) => String(id) === source) && catalog.some(([id]) => String(id) === target))
    .map(([source, target]) => ({ sourceTagId: source, targetTagId: target, source: names.get(Number(source)), target: names.get(Number(target)) })),
}).data);

// Snapshot of the original 36-concept map before the 52-concept expansion.
// Seven branches intentionally move for restored prerequisites and parallel joins.
const original = [
  ['평균', 70, -4], ['최빈값', 70, 100], ['도수분포표', -70, 204], ['도수분포다각형', 70, 204], ['히스토그램', 70, 308],
  ['곱의 법칙', -70, 60], ['합의 법칙', -70, 164], ['팩토리얼', 70, 112],
  ['순열', -140, 112], ['조합', 0, 112], ['중복조합', 140, 60], ['이항정리', 140, 164],
  ['표본공간과 사건', -70, 164], ['수학적 확률', 70, 164],
  ['확률의 곱셈정리', -140, 112], ['사건의 독립', 0, 112], ['독립시행의 확률', 140, 112],
  ['이항분포', 70, 8], ['기댓값', 70, 112],
  ['연속확률변수', -280, 112], ['확률밀도함수', -140, 112], ['정규분포', 0, 112], ['표준정규분포', 140, 60],
  ['모집단', -280, 112], ['표본조사', -140, 112], ['임의추출', 0, 112], ['표본평균', 140, 60], ['표본비율', 140, 164], ['신뢰구간', 280, 112],
];

test('original eight-unit display order survives actual prerequisite relationships', () => {
  const index = makeIndex();
  const units = layoutUnits(index);
  assert.deepEqual(index.data.units.map(unit => unit.name), ['자료의 정리', '경우의 수', '순열과 조합', '확률의 기초', '조건부확률', '확률분포', '정규분포', '통계적 추정']);
  for (const [order, unit] of index.data.units.entries()) assert.deepEqual(units.get(unit.id), { x: order * 225, y: 0 });
  assert(!index.unitEdges.some(edge => edge.source === 'course:data-basics' && edge.target === 'course:counting'));
  assert(index.unitEdges.some(edge => edge.source === 'course:distribution' && edge.target === 'course:data-basics'));
  assert.equal(relations.length, 69);
  assert.equal(index.data.concepts.reduce((count, concept) => count + concept.prerequisites.length, 0), relations.length);
});

test('unit overview has one continuous flow without changing prerequisites or learning traversal', () => {
  const index = makeIndex();
  const before = structuredClone(index.data.concepts);
  const actualEdges = structuredClone(index.unitEdges);
  const display = getDisplayUnitEdges(index);
  assert.equal(display.length, 7);
  assert.deepEqual(display, index.data.units.slice(1).map((unit, position) => ({ source: index.data.units[position].id, target: unit.id })));
  assert(display.some(edge => edge.source === 'course:data-basics' && edge.target === 'course:counting'));
  assert(!index.unitEdges.some(edge => edge.source === 'course:data-basics' && edge.target === 'course:counting'));
  assert(!getRelatedUnits(index, 'course:counting', 'ancestors').has('course:data-basics'));
  assert(index.concepts.get(ids.get('분산')).prerequisites.includes(ids.get('기댓값')));
  assert.deepEqual(index.data.concepts, before);
  assert.deepEqual(index.unitEdges, actualEdges);
});

test('graphs without a study sequence retain their actual unit prerequisite display', () => {
  const data = {
    id: 'custom', subject: { id: 's', name: 'Custom' }, concepts: [],
    units: [
      { id: 'a', subjectId: 's', name: 'A', prerequisites: [] },
      { id: 'b', subjectId: 's', name: 'B', prerequisites: ['a'] },
      { id: 'c', subjectId: 's', name: 'C', prerequisites: ['a', 'b'] },
    ],
  };
  const index = createGraphIndex(data);
  assert.deepEqual(getDisplayUnitEdges(index), [{ source: 'a', target: 'b' }, { source: 'b', target: 'c' }]);
  assert.equal(index.unitEdges.length, 3);
});

test('29 original concepts retain their anchors while reviewed branches gain prerequisite steps', () => {
  const index = makeIndex();
  const units = layoutUnits(index);
  const points = layoutAllConcepts(index, units);
  for (const [name, x, y] of original) {
    const concept = index.concepts.get(ids.get(name));
    const unit = units.get(concept.unitId);
    assert.deepEqual(points.get(concept.id), { x: unit.x + x, y: unit.y + y }, name);
  }
  assert(points.get(ids.get('산점도')).x > points.get(ids.get('표준편차')).x);
  assert(points.get(ids.get('확률의 덧셈 정리')).x > points.get(ids.get('여사건')).x);
});

test('adding concepts, changing input order or hiding shortcut lines never reshuffles anchors', () => {
  const originalNames = new Set([...original.map(([name]) => name), '산점도', '확률의 덧셈 정리', '배반사건', '이산확률변수', '이산확률분포', '표준화', '이항분포의 정규근사']);
  const baseline = makeIndex(LIVE_CONCEPT_CATALOG.filter(([, name]) => originalNames.has(name)));
  const expanded = makeIndex([...LIVE_CONCEPT_CATALOG].reverse());
  const oldPoints = layoutAllConcepts(baseline, layoutUnits(baseline));
  const newPoints = layoutAllConcepts(expanded, layoutUnits(expanded));
  for (const [id, point] of oldPoints) assert.deepEqual(newPoints.get(id), point);
  const before = structuredClone(expanded.data);
  reduceDisplayEdges(relations.map(([source, target]) => ({ source, target })));
  assert.deepEqual(expanded.data, before);
  assert.deepEqual(layoutAllConcepts(expanded, layoutUnits(expanded)), newPoints);
});

test('mutually exclusive and complementary events join the addition rule from parallel lanes', () => {
  const index = makeIndex();
  const points = layoutAllConcepts(index, layoutUnits(index));
  const exclusive = points.get(ids.get('배반사건'));
  const complement = points.get(ids.get('여사건'));
  const addition = points.get(ids.get('확률의 덧셈 정리'));
  assert.equal(exclusive.x, complement.x);
  assert.equal(addition.y, (exclusive.y + complement.y) / 2);
  assert(addition.x > exclusive.x);
  const edges = reduceDisplayEdges(relations.filter(([a, b]) => index.concepts.get(a).unitId === 'course:probability' && index.concepts.get(b).unitId === 'course:probability').map(([source, target]) => ({ source, target })));
  for (const [source, target] of [['배반사건', '확률의 덧셈 정리'], ['여사건', '확률의 덧셈 정리'], ['표본공간과 사건', '배반사건']]) {
    assert(edges.some(edge => edge.source === ids.get(source) && edge.target === ids.get(target)));
  }
});

test('reviewed learning steps are visible, advance right and survive prerequisite selection', () => {
  const index = makeIndex();
  const points = layoutAllConcepts(index, layoutUnits(index));
  for (const chain of [
    ['순열', '중복순열', '함수의 개수'],
    ['이산확률변수', '이산확률분포', '기댓값'],
    ['이산확률분포', '이항분포'],
    ['정규분포', '표준정규분포', '표준화', '이항분포의 정규근사'],
  ]) {
    const unitId = index.concepts.get(ids.get(chain[0])).unitId;
    const edges = reduceDisplayEdges(relations.filter(([a, b]) => index.concepts.get(a).unitId === unitId && index.concepts.get(b).unitId === unitId).map(([source, target]) => ({ source, target })));
    for (let i = 1; i < chain.length; i++) {
      const source = ids.get(chain[i - 1]);
      const target = ids.get(chain[i]);
      assert(edges.some(edge => edge.source === source && edge.target === target), chain.join(' → '));
      assert(points.get(source).x < points.get(target).x);
      assert(getRelatedConcepts(index, target, 'ancestors').has(source));
    }
  }
});

test('all 52 nodes have separated anchors and detail maps stay below the overview', () => {
  const index = makeIndex();
  const units = layoutUnits(index);
  const points = layoutAllConcepts(index, units);
  assert.equal(points.size, 52);
  assert(index.data.concepts.every(concept => concept.mapPosition));
  for (const unit of index.data.units) {
    const details = new Map(index.unitConcepts.get(unit.id).map(concept => [concept.id, points.get(concept.id)]));
    const positions = [...details.values()];
    for (let i = 0; i < positions.length; i++) for (let j = i + 1; j < positions.length; j++) {
      assert(Math.abs(positions[i].x - positions[j].x) >= 140 || Math.abs(positions[i].y - positions[j].y) >= 104);
    }
    const context = layoutContextUnits(units, details);
    assert(Math.min(...positions.map(point => point.y)) - Math.max(...[...context.values()].map(point => point.y)) >= 130);
  }
});

test('selecting a concept keeps its unit shape while adding every real prerequisite', () => {
  const index = makeIndex();
  const units = layoutUnits(index);
  const all = layoutAllConcepts(index, units);
  for (const concept of index.data.concepts) {
    const included = new Set([concept.id, ...getRelatedConcepts(index, concept.id, 'ancestors')]);
    const focused = layoutFocusedGraph(index, included);
    assert.equal(focused.points.size, included.size);
    for (const id of included) if (index.concepts.get(id).unitId === concept.unitId) assert.deepEqual(focused.points.get(id), all.get(id));
    assert.equal(new Set([...focused.points.values()].map(point => `${point.x}:${point.y}`)).size, included.size);
    const positions = [...focused.points.values()];
    for (let i = 0; i < positions.length; i++) for (let j = i + 1; j < positions.length; j++) {
      assert(Math.abs(positions[i].x - positions[j].x) >= 140 || Math.abs(positions[i].y - positions[j].y) >= 104);
    }
    const context = layoutContextUnits(units, focused.points);
    assert(Math.min(...[...focused.points.values()].map(point => point.y)) - Math.max(...[...context.values()].map(point => point.y)) >= 130);
  }
});
