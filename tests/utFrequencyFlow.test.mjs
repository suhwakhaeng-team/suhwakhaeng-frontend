import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyUtFrequencyRecommendation,
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
