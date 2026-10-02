import test from 'node:test';
import assert from 'node:assert/strict';
import { LEARNING_NODES, EXAMPLE_LEARNING_GOALS as LEARNING_GOALS, conceptNodes, rankGoals as rankRealGoals, startingPath, startLearning, currentQuestion,
  submitLearning, continueLearning, finishReading, supportNode } from '../src/routes/dev/problemLearningModel.ts';

const diagnostic = { 'product-rule': 'passed', factorial: 'failed', permutation: 'pruned', combination: 'pruned', 'math-probability': 'pruned', 'frequency-table': 'pruned' };
const counting = LEARNING_GOALS[0];
const rankGoals = (diagnostic, excluded) => rankRealGoals(diagnostic, excluded, LEARNING_GOALS);
function correct(state) { return submitLearning(state, currentQuestion(state).answer, 5000); }

test('세 목표는 BN→AN→AN→개념 경로를 포함하고 누락·순환·겹침이 없다', () => {
  for (const goal of LEARNING_GOALS) {
    const positions = Object.values(goal.positions).map(position => position.join(':'));
    assert.equal(new Set(positions).size, positions.length);
    assert.equal(LEARNING_NODES[goal.rootId].kind, 'BN');
    const seen = new Set();
    function visit(id, parents = []) {
      assert.ok(!parents.includes(id), '순환 없음');
      assert.ok(goal.positions[id]);
      const node = LEARNING_NODES[id];
      assert.ok(node && node.questions.length > 0);
      seen.add(id);
      for (const question of node.questions) {
        assert.equal(question.choices.length, 4);
        assert.equal(new Set(question.choices).size, 4);
        assert.match(question.answer, /^[ABCD]$/);
        assert.ok(question.prompt && question.explanation);
      }
      if (node.kind === 'concept') assert.ok(node.note && node.conceptId && !node.requires.length);
      for (const child of node.requires) {
        assert.ok(goal.positions[child][0] < goal.positions[id][0], '연결은 기초에서 목표 방향');
        visit(child, [...parents, id]);
      }
    }
    visit(goal.rootId);
    assert.deepEqual([...seen].sort(), Object.keys(goal.positions).sort());
  }
});

test('추천은 랜덤이 아니라 진단된 기초와 미확인 수에 따라 달라진다', () => {
  assert.equal(rankGoals(diagnostic)[0].goal.id, 'counting');
  const statistics = { 'frequency-table': 'passed', 'math-probability': 'passed' };
  assert.equal(rankGoals(statistics)[0].goal.id, 'statistics');
  const probability = { combination: 'passed', 'product-rule': 'passed', 'math-probability': 'passed' };
  assert.equal(rankGoals(probability)[0].goal.id, 'probability');
  assert.deepEqual(rankGoals(statistics), rankGoals(statistics));
  assert.equal(rankGoals(statistics, ['statistics'])[0].goal.id, 'probability');
  const oneKnownGap = { factorial: 'failed', permutation: 'pruned', 'product-rule': 'passed', combination: 'passed', 'math-probability': 'passed', 'frequency-table': 'passed' };
  assert.equal(rankGoals(oneKnownGap)[0].goal.id, 'counting', '확인된 작은 약점을 보완할 경로가 다른 단원의 완전 준비 경로보다 먼저');
});

test('틀린 팩토리얼은 개념 강제 학습이 아닌 바로 위 문제에서 시작한다', () => {
  assert.deepEqual(startingPath(counting, diagnostic), ['adjacent', 'block-order', 'factorial-practice']);
  const state = startLearning(counting, diagnostic);
  assert.equal(state.currentId, 'factorial-practice');
  assert.equal(state.reading, false);
  assert.deepEqual(state.parents, ['adjacent', 'block-order']);
});

test('prune은 미확인으로 남기고 해당 하위 문제를 먼저 확인한다', () => {
  const unknown = { factorial: 'passed', permutation: 'pruned', 'product-rule': 'passed' };
  assert.deepEqual(startingPath(counting, unknown), ['adjacent', 'block-order', 'block-count']);
  assert.equal(startLearning(counting, unknown).results['c-block'], undefined);
});

test('모든 기초가 확인됐거나 바로 도전을 선택하면 BN에서 시작한다', () => {
  const known = Object.fromEntries(conceptNodes(counting).map(node => [node.conceptId, 'passed']));
  assert.deepEqual(startingPath(counting, known), ['adjacent']);
  assert.equal(startLearning(counting, diagnostic, true).currentId, 'adjacent');
});

test('모르면 개념으로 내려가고 확인 문제를 맞혀야 부모 문제로 복귀한다', () => {
  const initial = startLearning(counting, diagnostic, false, 0);
  const wrong = submitLearning(initial, null, 1000);
  assert.equal(wrong.feedback, 'unknown');
  const reading = continueLearning(wrong, diagnostic, 1000);
  assert.equal(reading.currentId, 'c-factorial');
  assert.equal(reading.reading, true);
  assert.equal(submitLearning(reading, 'B'), reading, '설명만 읽고 자동 통과 불가');
  const check = finishReading(reading, 2000);
  const passed = continueLearning(correct(check), diagnostic, 5000);
  assert.equal(passed.currentId, 'factorial-practice');
  assert.equal(passed.results['c-factorial'], 'passed');
  assert.equal(passed.results['factorial-practice'], 'failed');
  assert.equal(passed.complete, false);
  assert.notEqual(currentQuestion(passed).prompt, currentQuestion(initial).prompt);
});

test('하위 문제 정답은 상위 BN을 자동 통과시키지 않는다', () => {
  let state = startLearning(counting, diagnostic);
  state = continueLearning(correct(state), diagnostic);
  assert.equal(state.currentId, 'block-order');
  assert.equal(state.results.adjacent, undefined);
  state = continueLearning(correct(state), diagnostic);
  assert.equal(state.currentId, 'adjacent');
  assert.equal(state.complete, false);
  state = continueLearning(correct(state), diagnostic);
  assert.equal(state.complete, true);
  assert.equal(state.results.adjacent, 'passed');
});

test('부모에서 계속 막히면 아직 풀지 않은 다른 가지로 내려간다', () => {
  let state = startLearning(counting, diagnostic, true);
  state = continueLearning(submitLearning(state, null), diagnostic);
  assert.equal(state.currentId, 'block-order');
  state = continueLearning(correct(state), diagnostic);
  state = submitLearning(state, null);
  assert.equal(supportNode(state, diagnostic), 'inside-order');
  state = continueLearning(state, diagnostic);
  assert.equal(state.currentId, 'inside-order');
});

test('중복 제출은 무시하고 진단 기록을 변경하지 않는다', () => {
  const original = JSON.stringify(diagnostic);
  const state = startLearning(counting, diagnostic, false, 0);
  const answered = submitLearning(state, null, 2500);
  assert.equal(answered.history[0].seconds, 2.5);
  assert.equal(submitLearning(answered, 'C'), answered);
  continueLearning(answered, diagnostic);
  assert.equal(JSON.stringify(diagnostic), original);
  assert.equal(continueLearning(state, diagnostic), state);
});

test('모든 경로에서 한 번씩 막혀도 개념까지 학습하고 목표를 해결한다', () => {
  for (const goal of LEARNING_GOALS) {
    let state = startLearning(goal, {}, true);
    const failedOnce = new Set();
    let steps = 0;
    while (!state.complete) {
      assert.ok(++steps < 120);
      if (state.reading) state = finishReading(state);
      else if (state.feedback) state = continueLearning(state, {});
      else {
        const isFirst = !failedOnce.has(state.currentId);
        failedOnce.add(state.currentId);
        state = isFirst ? submitLearning(state, null) : correct(state);
      }
    }
    assert.equal(state.results[goal.rootId], 'passed');
    assert.ok(state.history.some(record => LEARNING_NODES[record.nodeId].kind === 'concept'));
  }
});
