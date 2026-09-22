import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyUtFrequencyRecommendation,
  applyUtFrequencyMasteryToOverview,
  applyUtFrequencyMasteryToTopology,
  isUtFrequencyConcept,
  UT_FREQUENCY_LEARNING_ROUTE,
} from '../src/lib/utFrequencyFlow.ts';

const recommendation = (id, topicName) => ({
  id,
  topicName,
  categoryPath: '기존 추천',
  problemCount: 3,
  reasoning: '',
});

test('UT recommendation prepends frequency table without deleting server recommendations', () => {
  const serverItems = [recommendation('a', '조합'), recommendation('b', '확률')];
  const result = applyUtFrequencyRecommendation(serverItems, 'a');

  assert.equal(result.items[0].topicName, '도수분포표');
  assert.equal(result.activeId, 'ut-frequency-table');
  assert.deepEqual(result.items.slice(1), serverItems);
  assert.equal(serverItems.length, 2);
});

test('existing frequency recommendation moves to the front without duplication', () => {
  const frequency = recommendation('frequency-id', '도수분포표');
  const result = applyUtFrequencyRecommendation(
    [recommendation('a', '조합'), frequency, recommendation('b', '확률')],
    'a',
  );

  assert.equal(result.items[0], frequency);
  assert.equal(result.activeId, 'frequency-id');
  assert.equal(result.items.filter((item) => isUtFrequencyConcept(item.topicName)).length, 1);
});

test('home and concept map share the authenticated frequency learning route', () => {
  assert.equal(isUtFrequencyConcept(' 도수분포표 '), true);
  assert.equal(isUtFrequencyConcept('도수분포'), false);
  assert.equal(UT_FREQUENCY_LEARNING_ROUTE, '/main/learning/frequency-table');
});

test('passing frequency learning advances UT recommendations to mode and scatter plot', () => {
  const serverItems = [
    recommendation('frequency-id', '도수분포표'),
    recommendation('mode-id', '최빈값'),
    recommendation('server-id', '확률'),
  ];
  const result = applyUtFrequencyRecommendation(serverItems, 'frequency-id', true);

  assert.deepEqual(result.items.slice(0, 2).map(item => item.topicName), ['최빈값', '산점도']);
  assert.equal(result.activeId, 'mode-id');
  assert.equal(result.items.some(item => item.topicName === '도수분포표'), false);
  assert.equal(result.items.some(item => item.id === 'server-id'), true);
});

test('passing frequency learning marks its overview and topology nodes as mastered', () => {
  const overview = applyUtFrequencyMasteryToOverview([
    { id: '1', tagName: '도수분포표', categoryPath: '자료의 정리', status: 'UNDIAGNOSED', colorDepth: null },
    { id: '2', tagName: '산점도', categoryPath: '자료의 정리', status: 'UNDIAGNOSED', colorDepth: null },
  ], true);
  const topology = applyUtFrequencyMasteryToTopology({ nodes: overview.map(item => ({ ...item, grade: 1 })), edges: [] }, true);

  assert.deepEqual(overview[0], { id: '1', tagName: '도수분포표', categoryPath: '자료의 정리', status: 'MASTERED', colorDepth: 100 });
  assert.equal(overview[1].status, 'UNDIAGNOSED');
  assert.equal(topology.nodes[0].status, 'MASTERED');
  assert.equal(topology.nodes[0].colorDepth, 100);
  assert.equal(topology.nodes[1].status, 'UNDIAGNOSED');
});
