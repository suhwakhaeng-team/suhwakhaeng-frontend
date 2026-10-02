import test from 'node:test';
import assert from 'node:assert/strict';
import snapshot from '../src/routes/dev/problemLearningBankSnapshot.json' with { type: 'json' };
import { LEARNING_NODES, LEARNING_GOALS, conceptNodes, rankGoals, startLearning, currentQuestion,
  submitLearning, continueLearning, finishReading } from '../src/routes/dev/problemLearningModel.ts';

const ids = [678, 705, 708, 709, 711, 735, 738, 745, 757, 769];
test('검수본의 실제 BN 10개만 목표 후보이며 원문·선지·정답·태그를 유지한다', () => {
  assert.deepEqual(LEARNING_GOALS.map(g => g.questionId).sort((a,b) => a-b), ids);
  for (const row of snapshot.questions) {
    const node = LEARNING_NODES[`bank-${row.questionId}`];
    if (!node) { assert.notEqual(row.nodeLevel, 'BN'); continue; }
    assert.equal(node.source, 'bank');
    assert.equal(node.kind, row.nodeLevel);
    assert.equal(node.questionId, row.questionId);
    assert.deepEqual(node.bankTags, row.tags.map(tag => tag.tag_name));
    const question = node.questions[0];
    assert.equal(question.prompt, row.content);
    assert.equal(question.explanation, row.explanation);
    assert.equal(question.answer, row.answer);
    assert.equal(question.answerType, row.answerType);
    if (row.answerType === 'MULTIPLE_CHOICE') assert.deepEqual(question.choices, row.choices);
    else assert.equal(question.choices, undefined);
  }
});

test('10개 DAG에 누락·순환·노드 겹침이 없고 보충 문제는 실제 AN과 구별된다', () => {
  for (const goal of LEARNING_GOALS) {
    const seen = new Set();
    const positions = Object.values(goal.positions).map(p => p.join(':'));
    assert.equal(new Set(positions).size, positions.length);
    function visit(id, ancestors = []) {
      assert.ok(!ancestors.includes(id));
      const node = LEARNING_NODES[id];
      assert.ok(node && goal.positions[id]);
      seen.add(id);
      assert.ok(['bank', 'scaffold', 'concept-check'].includes(node.source));
      if (node.source !== 'bank') assert.equal(node.questionId, undefined);
      for (const question of node.questions) {
        assert.ok(question.prompt && question.explanation && question.answer);
        if (question.answerType === 'NUMBER') assert.ok(Number.isFinite(Number(question.answer)));
        else { assert.equal(question.choices.length, 4); assert.match(question.answer, /^[ABCD]$/); }
      }
      for (const child of node.requires) {
        assert.ok(goal.positions[child][0] < goal.positions[id][0]);
        assert.ok(goal.positions[child][1] >= 0);
        visit(child, [...ancestors, id]);
      }
    }
    visit(goal.rootId);
    assert.deepEqual([...seen].sort(), Object.keys(goal.positions).sort());
  }
});

test('진단에 맞춰 추천 순위가 바뀌고 완료 BN은 제외된다', () => {
  const normalGoal = LEARNING_GOALS.find(g => g.questionId === 709);
  const diagnostic = Object.fromEntries(conceptNodes(normalGoal).map(node => [node.conceptId, 'passed']));
  assert.equal(rankGoals(diagnostic)[0].goal.id, normalGoal.id);
  assert.notEqual(rankGoals({})[0].goal.id, normalGoal.id);
  assert.deepEqual(rankGoals(diagnostic), rankGoals(diagnostic));
  assert.equal(rankGoals({}, LEARNING_GOALS.map(g => g.id)).length, 0);
  assert.equal(rankGoals(diagnostic, [normalGoal.id]).length, 9);
  const goal705 = LEARNING_GOALS.find(g => g.questionId === 705);
  assert.ok(!conceptNodes(goal705).some(n => n.conceptId === 'median'), '원본 태그를 무조건 필수 선수개념으로 간주하지 않음');
});

test('실제 숫자형 AN은 숫자로 채점하며 빈 값·잘못된 숫자는 통과하지 않는다', () => {
  for (const id of [670, 687, 694, 716, 737, 713]) {
    const goal = LEARNING_GOALS.find(g => g.positions[`bank-${id}`]);
    const state = { ...startLearning(goal, {}, true, 0), currentId: `bank-${id}` };
    const q = currentQuestion(state);
    assert.equal(q.answerType, 'NUMBER');
    assert.equal(submitLearning(state, ` ${Number(q.answer).toFixed(2)} `).feedback, 'correct');
    for (const bad of ['', ' ', 'NaN', 'Infinity', 'A', String(Number(q.answer) + 1)]) {
      assert.equal(submitLearning(state, bad).feedback, 'wrong');
    }
  }
  assert.match(LEARNING_NODES['bank-687'].questions[0].reference, /0.1915/);
});

test('실제 10개 BN에서 오답→AN→개념→상위 재도전→BN 완료가 끝까지 동작한다', () => {
  const diagnostic = {};
  for (const goal of LEARNING_GOALS) {
    let state = startLearning(goal, diagnostic, true);
    const failedOnce = new Set();
    let steps = 0;
    while (!state.complete) {
      assert.ok(++steps < 250, goal.id);
      if (state.reading) state = finishReading(state);
      else if (state.feedback) state = continueLearning(state, diagnostic);
      else {
        const first = !failedOnce.has(state.currentId);
        failedOnce.add(state.currentId);
        state = submitLearning(state, first ? null : currentQuestion(state).answer);
      }
    }
    assert.equal(state.results[goal.rootId], 'passed');
    assert.ok(state.history.some(r => LEARNING_NODES[r.nodeId].kind === 'concept'));
    assert.ok(state.history.some(r => LEARNING_NODES[r.nodeId].kind === 'AN'));
    assert.equal(state.history.at(-1).nodeId, goal.rootId);
  }
  assert.deepEqual(diagnostic, {});
});

test('BN 정답의 수학적 결과를 별도 계산으로 검산한다', () => {
  const close = (a,b) => assert.ok(Math.abs(a-b) < 1e-9, `${a} != ${b}`);
  close(8 / Math.sqrt(4), 4); // 678
  const values = [4,4,4,6,7];
  close(values.reduce((s,x) => s + (x-5)**2, 0) / 5, 1.6); // 705
  const ex = [1,2,3,4].reduce((s,x) => s + x*x/10, 0);
  const ex2 = [1,2,3,4].reduce((s,x) => s + x*x*x/10, 0);
  close(5*Math.sqrt(ex2-ex**2), 5); // 708
  close(.3413+.4332, .7745); // 709
  close((35-4-1)/35, 6/7); // 711
  let count = 0;
  for (let n=10000; n<50000; n++) {
    const digits = String(n);
    if ([...digits].every(d => d <= '4') && [...digits].filter(d => d === '1').length >= 2) count++;
  }
  assert.equal(count, 708); // 735
  close(24*24/5040, 4/35); // 738
  let functions=0;
  for (let a=2; a<=5; a++) for (let b=a; b<=5; b++) functions++;
  assert.equal(functions, 10); // 745
  const constant = 15*4;
  assert.equal(constant, 60);
  close(5/12-1/constant, 2/5); // 757
  close((1/3)*(1/10) / ((1/3)*(1/10)+(2/3)*(1/2)), 1/11); // 769
  const answers = {678:'A',705:'D',708:'C',709:'D',711:'B',735:'A',738:'B',745:'D',757:'A',769:'D'};
  for (const [id, answer] of Object.entries(answers)) assert.equal(LEARNING_NODES[`bank-${id}`].questions[0].answer, answer);
});

test('계속 막히면 모든 미해결 형제 가지를 확인하며 공유 노드도 순환하지 않는다', () => {
  for (const goal of LEARNING_GOALS) {
    let state = startLearning(goal, {}, true);
    let steps = 0;
    while (!state.complete) {
      assert.ok(++steps < 500, goal.id);
      if (state.reading) state = finishReading(state);
      else if (state.feedback) state = continueLearning(state, {});
      else {
        const hasUnresolved = LEARNING_NODES[state.currentId].requires.some(id => state.results[id] !== 'passed');
        state = submitLearning(state, hasUnresolved ? null : currentQuestion(state).answer);
      }
    }
    assert.deepEqual(Object.keys(state.results).sort(), Object.keys(goal.positions).sort());
    assert.ok(Object.values(state.results).every(result => result === 'passed'));
  }
});
