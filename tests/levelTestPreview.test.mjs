import test from 'node:test';
import assert from 'node:assert/strict';
import { NODES, EDGES, DOMAINS, CONCEPT_TEST_ORDER, descendantDepths, nextAvailableConcept } from '../src/routes/dev/levelTestPreviewModel.ts';
import { unitMapLayout, unitMapEdgeStatus } from '../src/routes/dev/levelTestUnitMapLayout.ts';
import { LEVEL_TEST_QUESTIONS } from '../src/routes/dev/levelTestQuestionBank.ts';
import { emptyPreviewSession, parsePreviewSession, resolvePreviewAnswer, continuePreviewTest, submitUnitAnswer, continueAfterUnitReview, resumeUnitFlow, unitReviewMapStatuses } from '../src/routes/dev/levelTestPreviewState.ts';

const now = 100_000;

test('네 단원은 같은 지도 격자를 사용하되 진단 순서와 전체 지도 좌표를 변경하지 않는다', () => {
  const original = JSON.stringify(NODES);
  const layouts = DOMAINS.map(domain => unitMapLayout(domain.name));
  assert.equal(new Set(layouts.map(layout => layout.width)).size, 1);
  for (const layout of layouts) {
    assert.ok(layout.nodes.length > 0);
    assert.equal(layout.nodeById.size, layout.nodes.length);
    for (const node of layout.nodes) {
      assert.ok(Number.isFinite(node.y));
      assert.equal((node.y - 48) % 48, 0);
      assert.ok(node.y + 58 < layout.height);
    }
    const positions = layout.nodes.map(node => `${node.stage}:${node.y}`);
    assert.equal(new Set(positions).size, positions.length, '노드가 겹치지 않는다');
  }
  assert.equal(JSON.stringify(NODES), original);
});

test('결과 지도는 선택한 단원만 담고 개념·연결 관계는 유지한다', () => {
  for (const domain of DOMAINS) {
    const review = unitMapLayout(domain.name);
    const result = unitMapLayout(domain.name, 'result');
    assert.deepEqual(result.nodes.map(node => node.id), review.nodes.map(node => node.id));
    assert.ok(result.nodes.every(node => node.domain === domain.name));
    assert.ok(result.height <= review.height);
    assert.equal(new Set(result.nodes.map(node => `${node.stage}:${node.y}`)).size, result.nodes.length);
    for (const node of result.nodes) assert.ok(node.y + 66 < result.height);
    const ids = new Set(result.nodes.map(node => node.id));
    for (const [from, to] of EDGES.filter(([from, to]) => ids.has(from) && ids.has(to))) {
      assert.ok(result.nodeById.has(from) && result.nodeById.has(to));
    }
  }
});

test('모든 단원에서 미확인·통과·prune 연결선 상태를 같은 기준으로 판정한다', () => {
  for (const [from, to] of EDGES) {
    assert.equal(unitMapEdgeStatus({}, from, to), 'idle');
    assert.equal(unitMapEdgeStatus({ [from]: 'passed' }, from, to), 'idle');
    assert.equal(unitMapEdgeStatus({ [from]: 'passed', [to]: 'passed' }, from, to), 'passed');
    for (const id of [from, to]) for (const status of ['failed', 'pruned']) {
      assert.equal(unitMapEdgeStatus({ [id]: status }, from, to), 'pruned');
    }
  }
});

function answer(state, isCorrect) {
  return resolvePreviewAnswer(state, { type: 'demo', isCorrect }, now + 5000);
}
function finish(decide) {
  let state = emptyPreviewSession(now);
  const seen = [];
  while (!state.isComplete) {
    assert.ok(seen.length < NODES.length + 1, '반복되거나 끝나지 않는 경로');
    seen.push(state.currentId);
    assert.ok(EDGES.filter(([, to]) => to === state.currentId).every(([from]) => state.statuses[from] === 'passed'), '선수개념을 모두 통과한 문항만 검사');
    state = answer(state, decide(state.currentId));
    assert.equal(parsePreviewSession(JSON.stringify(state), now + 5000).currentId, state.currentId);
    state = continuePreviewTest(state, now + 5000);
    assert.deepEqual(parsePreviewSession(JSON.stringify(state), now + 5000).statuses, state.statuses);
  }
  assert.equal(Object.keys(state.statuses).length, NODES.length, '미처리 경로 없이 완료');
  return { state, seen };
}

test('49개 개념, 진단 순서, 문제와 선지는 누락이나 중복 없이 연결된다', () => {
  assert.equal(NODES.length, 49);
  const ids = NODES.map(node => node.id).sort();
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual([...CONCEPT_TEST_ORDER].sort(), ids);
  assert.deepEqual(Object.keys(LEVEL_TEST_QUESTIONS).sort(), ids);
  for (const id of ids) {
    const question = LEVEL_TEST_QUESTIONS[id];
    assert.equal(question.choices.length, 4);
    assert.equal(new Set(question.choices).size, 4);
    assert.match(question.answer, /^[ABCD]$/);
    assert.ok(question.prompt.trim() && question.explanation.trim());
    assert.ok(!descendantDepths([id]).has(id), `${id}의 순환 관계`);
  }
  for (const [from, to] of EDGES) assert.ok(ids.includes(from) && ids.includes(to));
});

test('합의 법칙 → 곱의 법칙으로 시작한다', () => {
  const state = continuePreviewTest(answer(emptyPreviewSession(now), true), now + 5000);
  assert.equal(state.currentId, 'product-rule');
});

test('경우의 수와 순열·조합을 마친 뒤 확률로 이동하고 전체 정답 경로가 완료된다', () => {
  const { state, seen } = finish(() => true);
  assert.deepEqual(seen, CONCEPT_TEST_ORDER);
  assert.ok(Object.values(state.statuses).every(status => status === 'passed'));
  assert.equal(state.history.length, 49);
});

test('기초에서 오답이면 후속 가지만 접고 무관한 기초로 이동한다', () => {
  const state = answer(emptyPreviewSession(now), false);
  assert.equal(state.statuses['sum-rule'], 'failed');
  assert.equal(state.statuses['product-rule'], 'pruned');
  assert.equal(state.feedback.prunedCount, 11);
  assert.equal(state.feedback.nextId, 'sample-space');
  assert.equal(state.statuses['random-variable'], undefined);
  assert.equal(state.statuses.population, undefined);
});

test('전부 모르면 다섯 독립 시작점을 확인한 뒤 끝난다', () => {
  const { seen } = finish(() => false);
  assert.deepEqual(seen, ['sum-rule', 'sample-space', 'random-variable', 'frequency-table', 'population']);
});

test('여사건과 배반사건을 둘 다 통과해야 덧셈 정리로 진입한다', () => {
  const statuses = Object.fromEntries(CONCEPT_TEST_ORDER.slice(0, 12).map(id => [id, 'passed']));
  Object.assign(statuses, { 'sample-space': 'passed', 'math-probability': 'passed', complement: 'passed' });
  assert.equal(nextAvailableConcept(statuses), 'disjoint');
  statuses.disjoint = 'passed';
  assert.equal(nextAvailableConcept(statuses), 'addition');
});

test('배반사건에서 막혀도 확률의 곱셈 정리 독립 가지는 이어간다', () => {
  let state = emptyPreviewSession(now);
  while (state.currentId !== 'disjoint') state = continuePreviewTest(answer(state, true), now + 5000);
  state = answer(state, false);
  assert.equal(state.statuses.addition, 'pruned');
  assert.equal(state.feedback.nextId, 'multiplication');
});

test('이미 접힌 공통 후속 개념을 생략 수에 중복 계산하지 않는다', () => {
  let state = emptyPreviewSession(now);
  while (state.currentId !== 'discrete') state = continuePreviewTest(answer(state, true), now + 5000);
  state = continuePreviewTest(answer(state, false), now + 5000);
  assert.equal(state.currentId, 'continuous');
  state = answer(state, false);
  assert.equal(state.feedback.prunedCount, 1); // PDF만 새로 생략, 정규분포 이후는 이미 생략.
});

test('모르겠습니다와 실제 선택 오답, 시연을 별도 기록한다', () => {
  const initial = emptyPreviewSession(now);
  const unknown = resolvePreviewAnswer(initial, { type: 'unknown' }, now + 5000);
  assert.equal(unknown.history[0].skipped, true);
  assert.equal(unknown.selectedAnswer, null);
  assert.equal(unknown.history[0].durationSeconds, 5);
  const wrong = resolvePreviewAnswer(initial, { type: 'answer', answer: 'B' }, now + 5000);
  assert.equal(wrong.history[0].skipped, false);
  assert.equal(wrong.selectedAnswer, 'B');
  const demo = answer(initial, false);
  assert.equal(demo.history[0].demo, true);
  assert.equal(demo.history[0].skipped, false);
});

test('제출 이후 다시 제출해도 응답과 노드를 중복 처리하지 않는다', () => {
  const state = answer(emptyPreviewSession(now), true);
  assert.equal(answer(state, false), state);
  const initial = emptyPreviewSession(now);
  assert.equal(continuePreviewTest(initial), initial);
});

test('저장된 상태를 복원하고 손상된 저장값은 안전하게 초기화한다', () => {
  const state = answer(emptyPreviewSession(now), true);
  assert.deepEqual(parsePreviewSession(JSON.stringify(state), now + 5000), state);
  for (const raw of ['broken', 'null', '{}', JSON.stringify({ ...state, currentId: 'not-a-node' }), JSON.stringify({ ...state, feedback: { ...state.feedback, nextId: 'confidence' } })]) {
    assert.deepEqual(parsePreviewSession(raw, now), emptyPreviewSession(now));
  }
  const legacy = { ...state };
  delete legacy.history;
  delete legacy.questionStartedAt;
  assert.deepEqual(parsePreviewSession(JSON.stringify(legacy), now).statuses, state.statuses);
});

test('여러 정오답 조합에서도 유효한 선수개념만 검사하고 끝난다', () => {
  for (let seed = 1; seed <= 80; seed++) {
    let number = seed;
    finish(() => {
      number = (number * 1664525 + 1013904223) >>> 0;
      return number % 3 !== 0;
    });
  }
});

function unitAnswer(state, isCorrect) {
  return submitUnitAnswer(state, { type: 'demo', isCorrect }, now + 5000);
}

test('단원 안에서는 결과를 숨기고 바로 다음 문제로 이어간다', () => {
  const state = unitAnswer(emptyPreviewSession(now), true);
  assert.equal(state.currentId, 'product-rule');
  assert.equal(state.feedback, null);
  assert.equal(state.unitReview, null);
  assert.equal(state.statuses['sum-rule'], 'passed');
  assert.deepEqual(unitReviewMapStatuses(state, 'done'), {});
  assert.deepEqual(parsePreviewSession(JSON.stringify(state), now + 5000), state);
});

test('단원 종료 때 통과와 prune을 모아서 보여주고 확인 후에만 다음 단원을 연다', () => {
  let state = unitAnswer(emptyPreviewSession(now), true);
  state = unitAnswer(state, false);
  assert.equal(state.currentId, 'product-rule');
  assert.equal(state.unitReview.nextId, 'sample-space');
  assert.deepEqual(state.unitReview.passedIds, ['sum-rule']);
  assert.deepEqual(state.unitReview.failedIds, ['product-rule']);
  assert.equal(state.unitReview.prunedIds.length, 10);
  assert.deepEqual(unitReviewMapStatuses(state, 'waiting'), {});
  assert.deepEqual(unitReviewMapStatuses(state, 'pass'), { 'sum-rule': 'passed' });
  assert.deepEqual(unitReviewMapStatuses(state, 'prune'), state.statuses);
  assert.equal(unitAnswer(state, true), state);
  assert.deepEqual(parsePreviewSession(JSON.stringify(state), now + 5000), state);
  const next = continueAfterUnitReview(state, now + 5000);
  assert.equal(next.currentId, 'sample-space');
  assert.equal(next.unitReview, null);
  assert.deepEqual(next.unitStartStatuses, state.statuses);
  assert.equal(continueAfterUnitReview(next), next);
});

test('전부 정답이면 네 단원 각각 결과 재생을 거쳐야 최종 완료된다', () => {
  let state = emptyPreviewSession(now);
  const reviews = [];
  while (!state.isComplete) {
    assert.ok(state.history.length <= 49);
    if (state.unitReview) {
      reviews.push(state.unitReview);
      assert.deepEqual(parsePreviewSession(JSON.stringify(state), now + 5000), JSON.parse(JSON.stringify(state)));
      state = continueAfterUnitReview(state, now + 5000);
    } else state = unitAnswer(state, true);
  }
  assert.equal(reviews.length, 4);
  assert.equal(reviews[0].passedIds.length, 12);
  assert.equal(reviews.at(-1).nextId, undefined);
  assert.equal(state.history.length, 49);
  assert.deepEqual(state.history.map(record => record.conceptId), CONCEPT_TEST_ORDER);
  assert.deepEqual(unitReviewMapStatuses(state, 'done'), state.statuses);
});

test('같은 단원의 독립 가지는 오답 뒤에도 계속 풀고 마지막 가지 뒤에 결과를 보여준다', () => {
  let state = emptyPreviewSession(now);
  for (let i = 0; i < 3; i++) {
    state = unitAnswer(state, false);
    assert.ok(state.unitReview);
    state = continueAfterUnitReview(state, now + 5000);
  }
  assert.equal(state.currentId, 'frequency-table');
  state = unitAnswer(state, false);
  assert.equal(state.currentId, 'population');
  assert.equal(state.unitReview, null);
  state = unitAnswer(state, false);
  assert.deepEqual(state.unitReview.failedIds, ['frequency-table', 'population']);
  assert.equal(state.isComplete, false);
  assert.equal(continueAfterUnitReview(state).isComplete, true);
});

test('이전 문항별 피드백 저장본을 단원 흐름으로 옮기되 진단 기록은 보존한다', () => {
  const old = answer(emptyPreviewSession(now), true);
  delete old.unitStartStatuses;
  delete old.unitReview;
  const migrated = resumeUnitFlow(parsePreviewSession(JSON.stringify(old), now + 5000), now + 5000);
  assert.equal(migrated.currentId, 'product-rule');
  assert.equal(migrated.feedback, null);
  assert.deepEqual(migrated.history, old.history);
  const review = unitAnswer(emptyPreviewSession(now), false);
  const invalid = { ...review, unitReview: { ...review.unitReview, passedIds: ['sum-rule'] } };
  assert.deepEqual(parsePreviewSession(JSON.stringify(invalid), now), emptyPreviewSession(now));
});

test('다양한 응답과 새로고침에서도 단원 결과는 정확히 네 번만 열리고 모든 경로가 처리된다', () => {
  for (let seed = 1; seed <= 80; seed++) {
    let state = emptyPreviewSession(now);
    let number = seed;
    let reviews = 0;
    let steps = 0;
    while (!state.isComplete) {
      assert.ok(++steps <= 53);
      if (state.unitReview) {
        reviews++;
        assert.deepEqual(unitReviewMapStatuses(state, 'waiting'), state.unitStartStatuses);
        state = continueAfterUnitReview(state, now + 5000);
      } else {
        number = (number * 1664525 + 1013904223) >>> 0;
        state = unitAnswer(state, number % 3 !== 0);
      }
      const restored = resumeUnitFlow(parsePreviewSession(JSON.stringify(state), now + 5000), now + 5000);
      assert.deepEqual(restored, JSON.parse(JSON.stringify(state)));
      state = restored;
    }
    assert.equal(reviews, 4);
    assert.equal(Object.keys(state.statuses).length, 49);
  }
});
