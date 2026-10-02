import test from 'node:test';
import assert from 'node:assert/strict';
import { archiveLearning, beginPost, beginUTLearning, choose, createSession, decodeStore, distribute, emptyStore, FOUNDATION_ROOTS,
  gain, GOAL_SUPPORT_IDS, goalQuestion, isNumericAnswer, learningDiagnostic, learningQuestion, makeGoal, nextUTLearning, pauseTimer, prepareUTSession, recommendedUTNode, resumeTest, runSummary,
  SKILLS, startUTLearning, submitTest, submitUTLearning, testForm, UT_GOALS, UT_NODES } from '../src/routes/dev/ut1Model.ts';

function solveRun(session, answers = null) {
  for (let i = 0; i < 10; i++) {
    session = resumeTest(session, 1000 + i * 4000);
    const run = session[session.stage]; const question = run.questions[run.responses.length];
    session = submitTest(session, answers ? answers[i] : question.answer, 3000 + i * 4000, question.id);
  }
  return session;
}
function brute(total, minima) {
  let result = 0;
  function visit(remaining, i) {
    if (i === minima.length - 1) { if (remaining >= minima[i]) result++; return; }
    for (let n = minima[i]; n <= remaining; n++) visit(remaining - n, i + 1);
  }
  visit(total, 0); return result;
}

test('A/B 모두 기초 5개·목표 응용 5개이며 대응 문항 구조는 같고 숫자는 다르다', () => {
  const a = testForm('A'); const b = testForm('B');
  assert.equal(a.length, 10); assert.equal(b.length, 10);
  for (const skill of SKILLS) assert.equal(a.filter(item => item.group === 'foundation' && item.skill === skill).length, 1);
  assert.deepEqual(a.slice(5).map(item => item.goalId), UT_GOALS.map(goal => goal.id));
  for (let i = 0; i < 10; i++) {
    assert.equal(a[i].id, b[i].id); assert.equal(a[i].skill, b[i].skill);
    assert.equal(a[i].answerType, 'NUMBER'); assert.equal(a[i].choices, undefined);
    assert.notDeepEqual(a[i].params, b[i].params); assert.notEqual(a[i].prompt, b[i].prompt);
    assert.ok(Number.isSafeInteger(Number(a[i].answer))); assert.ok(Number.isSafeInteger(Number(b[i].answer)));
  }
  assert.deepEqual(a.map(item => Number(item.answer)), [12, 120, 60, 35, 35, 66, 45, 220, 55, 28]);
  assert.deepEqual(b.map(item => Number(item.answer)), [15, 720, 120, 56, 56, 78, 55, 286, 66, 36]);
  for (const questions of [a, b]) for (const question of questions.slice(5)) {
    const [total, boxes, ...minima] = question.params;
    assert.equal(boxes, minima.length);
    assert.equal(Number(question.answer), brute(total, minima));
  }
});
test('참가자별 A→B와 B→A를 교대하며 학습 전후 답안은 별개다', () => {
  const a = createSession('UT-01', 0, 10); const b = createSession('UT-02', 1, 10);
  assert.equal(a.pre.form, 'A'); assert.equal(a.post.form, 'B');
  assert.equal(b.pre.form, 'B'); assert.equal(b.post.form, 'A'); assert.notEqual(a.id, b.id);
  a.pre.responses.push({}); assert.equal(a.post.responses.length, 0); assert.equal(b.pre.responses.length, 0);
});

test('응용을 전부 틀려도 맞힌 기초는 다시 배우지 않으며 성적은 구분한다', () => {
  const fresh = createSession('기초 확인');
  const session = solveRun(fresh, fresh.pre.questions.map(q => q.group === 'foundation' ? q.answer : null));
  assert.equal(runSummary(session.pre).accuracy, 50);
  assert.equal(runSummary(session.pre, undefined, 'foundation').accuracy, 100);
  assert.equal(runSummary(session.pre, undefined, 'application').accuracy, 0);
  assert.equal(runSummary(session.post, undefined, 'application').accuracy, null);
  for (const skill of SKILLS) assert.equal(learningDiagnostic(session)[`c-${skill}`], 'passed');
  assert.equal(beginUTLearning(session, 'bn-1').learning.currentId, 'bn-1');
  const post = solveRun(beginPost({ ...session, completed: UT_GOALS.map(q => q.id) }));
  assert.equal(gain(post, undefined, 'foundation'), 0);
  assert.equal(gain(post, undefined, 'application'), 100);
  assert.equal(gain(post), 50);
});

test('버전 없는 기존 참가자의 A/B 검사·답안·기초 판정을 그대로 복원한다', () => {
  const legacy = createSession('기존 검사'); delete legacy.testVersion;
  for (const phase of ['pre', 'post']) legacy[phase].questions = testForm(legacy[phase].form, 1);
  assert.deepEqual(legacy.pre.questions.map(q => Number(q.answer)), [12, 18, 24, 24, 20, 60, 15, 35, 15, 15]);
  let pending = resumeTest(legacy, 1000); pending = submitTest(pending, '12', 3000, 'product-1');
  const restored = decodeStore(JSON.stringify({ version: 1, activeId: pending.id, sessions: [pending] })).sessions[0];
  assert.deepEqual(restored, pending);
  const finished = solveRun(legacy, ['12', '18', '24', null, '20', '60', null, null, null, null]);
  assert.equal(learningDiagnostic(finished)['c-product'], 'passed');
  assert.equal(learningDiagnostic(finished)['c-factorial'], 'failed');
  assert.equal(recommendedUTNode(finished, 'bn-1'), 'c-factorial');
  assert.equal(runSummary(finished.pre, 'product').total, 2);
  assert.equal(runSummary(finished.pre, undefined, 'application').accuracy, null);
  const store = { version: 1, activeId: finished.id, sessions: [finished] };
  assert.deepEqual(decodeStore(JSON.stringify(store)).sessions[0], finished);
  const tampered = structuredClone(store); tampered.sessions[0].testVersion = 2;
  assert.deepEqual(decodeStore(JSON.stringify(tampered)), emptyStore());
});
test('잘못된 숫자 입력·중복 제출을 차단하고 최초 응답과 시간을 남긴다', () => {
  let session = createSession('timing', 0, 10);
  assert.equal(submitTest(session, '12', 2000), session, '화면이 열리지 않았으면 제출하지 않음');
  session = resumeTest(session, 1000);
  for (const invalid of ['', ' ', 'A', 'NaN', 'Infinity', '-1', '3.5', '12가지', '1,2', '1,,200']) assert.equal(submitTest(session, invalid, 2000), session);
  assert.ok(isNumericAnswer('1,200')); assert.ok(isNumericAnswer('12.00'));
  session = submitTest(session, '12', 3000, 'product-1');
  assert.equal(session.pre.responses[0].seconds, 2); assert.ok(session.pre.responses[0].correct);
  const resumed = resumeTest(session, 4000);
  assert.equal(submitTest(resumed, '12', 5000, 'product-1'), resumed, '이미 제출된 문제의 이중 클릭 차단');
  assert.equal(resumed.pre.responses.length, 1);
});
test('홈·숨긴 탭의 시간은 빼고 돌아오면 같은 문항 시간을 이어 센다', () => {
  let session = resumeTest(createSession('pause'), 1000);
  session = pauseTimer(session, 3500);
  assert.equal(session.timer.elapsed, 2.5);
  session = resumeTest(session, 100000);
  session = submitTest(session, null, 101000, 'product-1');
  assert.equal(session.pre.responses[0].seconds, 3.5); assert.equal(session.pre.responses[0].answer, null);
});
test('UT는 사전 고정 10문항을 다 풀고 학습에 들어가며 5개 완료 전 사후는 잠긴다', () => {
  let session = solveRun(createSession('unknown'), Array(10).fill(null));
  assert.equal(session.stage, 'learning'); assert.equal(session.pre.responses.length, 10);
  assert.equal(runSummary(session.pre).unknown, 10); assert.equal(runSummary(session.pre).accuracy, 0);
  assert.equal(beginPost(session), session);
  session.completed = UT_GOALS.slice(0, 4).map(goal => goal.id); assert.equal(beginPost(session), session);
  session.completed = UT_GOALS.map(goal => goal.id); assert.equal(beginPost(session).stage, 'post');
});
test('전후 완료자만 정확도·%p 변화가 있고 0점 기준도 안전하다', () => {
  let session = solveRun(createSession('gain'), Array(10).fill(null));
  assert.equal(gain(session), null); assert.equal(runSummary(session.post).accuracy, null);
  session = beginPost({ ...session, completed: UT_GOALS.map(goal => goal.id) });
  session = solveRun(session);
  assert.equal(session.stage, 'done'); assert.equal(gain(session), 100);
  assert.equal(gain(session, 'combination'), 100); assert.equal(runSummary(session.post).average, 2);
});
test('문서 5개 첫 답안과 숫자 변형을 독립적인 정수 배분 열거로 검증한다', () => {
  assert.deepEqual(UT_GOALS.map((_, i) => goalQuestion(i).answer), ['45', '28', '120', '36', '6']);
  const minima = [[0, 0, 0], [2, 3, 1], [0, 0, 0, 0], [1, 1, 1], [1, 2, 0]];
  const totals = [8, 12, 7, 10, 5];
  for (let i = 0; i < 5; i++) for (let v = 0; v < 25; v++) {
    const shift = v === 0 ? 0 : 1 + (v - 1) % 7;
    assert.equal(Number(goalQuestion(i, v).answer), brute(totals[i] + shift, minima[i]));
    if (v > 0) assert.notEqual(goalQuestion(i, v).prompt, goalQuestion(i, v - 1).prompt);
  }
  assert.equal(choose(10, 3), 120); assert.equal(distribute(2, 3, [1, 1, 1]), 0);
});
test('모든 목표·기초 문제는 비순환이며 지도 좌표 누락/겹침이 없다', () => {
  for (const root of [...UT_GOALS.map(goal => goal.rootId), ...Object.values(FOUNDATION_ROOTS)]) {
    const goal = makeGoal(root); const visited = new Set();
    function visit(id, ancestors = []) {
      assert.ok(!ancestors.includes(id)); assert.ok(goal.positions[id]);
      visited.add(id);
      const node = UT_NODES[id];
      assert.ok(node.make(0).answer && node.make(0).prompt);
      for (const child of node.requires) { assert.ok(goal.positions[child][0] < goal.positions[id][0]); visit(child, [...ancestors, id]); }
    }
    visit(root); assert.equal(Object.keys(goal.positions).length, visited.size);
    assert.equal(new Set(Object.values(goal.positions).map(value => value.join(':'))).size, visited.size);
  }
  assert.ok(!Object.keys(makeGoal('bn-1').positions).includes('a-permutation'), '순열을 무조건 중복조합의 직접 선수조건으로 강제하지 않음');
  for (const goal of UT_GOALS) {
    assert.ok(!Object.keys(goal.positions).some(id => Object.values(FOUNDATION_ROOTS).includes(id)), '완료한 공통 기초 AN을 목표별 지도에서 반복하지 않음');
    const legacyMap = makeGoal(goal.rootId, false, ['a-model', 'a-minimum', 'a-permutation']);
    assert.ok(legacyMap.positions['a-model']);
    assert.equal(new Set(Object.values(legacyMap.positions).map(value => value.join(':'))).size, Object.keys(legacyMap.positions).length);
  }
});
test('AN을 틀리면 개념을 읽고 변형 답안을 직접 제출한 뒤 상위 문제로 복귀한다', () => {
  let state = startUTLearning('a-repetition', 1000);
  state = submitUTLearning(state, null, 3000);
  state = nextUTLearning(state, {}, 3500);
  assert.equal(state.currentId, 'c-repetition'); assert.ok(state.reading);
  assert.equal(submitUTLearning(state, '10', 4000), state, '읽는 동안 제출하지 않음');
  state = { ...state, reading: false, startedAt: 4500 };
  const oldPrompt = learningQuestion(state).prompt;
  state = nextUTLearning(submitUTLearning(state, '0', 5000));
  assert.ok(state.reading); assert.notEqual(learningQuestion(state).prompt, oldPrompt);
  state = { ...state, reading: false };
  state = nextUTLearning(submitUTLearning(state, learningQuestion(state).answer));
  assert.equal(state.currentId, 'a-repetition'); assert.equal(state.results['a-repetition'], 'failed');
  assert.equal(state.attempts['a-repetition'], 1); assert.equal(state.feedback, null);
  state = nextUTLearning(submitUTLearning(state, learningQuestion(state).answer)); assert.ok(state.complete);
});
test('5개 목표에서 전체 하위 경로를 탐색하고 직접 풀어 사후 테스트까지 연결된다', () => {
  let session = solveRun(createSession('all-paths'));
  for (const goal of UT_GOALS) {
    let state = startUTLearning(goal.rootId);
    for (let turn = 0; !state.complete && turn < 200; turn++) {
      if (state.reading) state = { ...state, reading: false, startedAt: 1000 };
      const children = UT_NODES[state.currentId].requires;
      const unresolved = children.some(id => state.results[id] !== 'passed' && session.evidence[id] !== 'passed');
      const answer = unresolved ? null : learningQuestion(state).answer;
      state = nextUTLearning(submitUTLearning(state, answer), session.evidence);
    }
    assert.ok(state.complete, goal.id);
    assert.ok(state.history.some(record => record.nodeId === goal.rootId && record.correct));
    session = archiveLearning({ ...session, learning: state });
  }
  assert.equal(session.completed.length, 5); assert.ok(session.history.length > 30);
  assert.equal(beginPost(session).stage, 'post');
  const store = { version: 1, activeId: session.id, sessions: [session] };
  assert.equal(decodeStore(JSON.stringify(store)).sessions.length, 1, '전체 학습 기록 복원');
});

test('BN마다 전용 AN 세 개를 가지며 다른 목표의 AN 정답으로 자동 통과되지 않는다', () => {
  assert.equal(new Set(GOAL_SUPPORT_IDS.flat()).size, 15);
  const prompts = GOAL_SUPPORT_IDS.flat().map(id => UT_NODES[id].make(0).prompt);
  assert.equal(new Set(prompts).size, 15);
  for (const [i, ids] of GOAL_SUPPORT_IDS.entries()) {
    assert.deepEqual(UT_NODES[`bn-${i + 1}`].requires, ids);
    for (const id of ids) {
      assert.equal(UT_NODES[id].kind, 'AN');
      assert.ok(Object.keys(makeGoal(`bn-${i + 1}`).positions).includes(id));
      for (let variant = 0; variant < 18; variant++) {
        const question = UT_NODES[id].make(variant);
        assert.equal(question.answerType, 'NUMBER');
        assert.ok(Number.isSafeInteger(Number(question.answer)));
        assert.notEqual(question.prompt, UT_NODES[id].make(variant + 1).prompt);
        assert.notEqual(question.answer, UT_NODES[id].make(variant + 1).answer);
      }
    }
    const otherEvidence = Object.fromEntries(GOAL_SUPPORT_IDS.flat().filter(id => !ids.includes(id)).map(id => [id, 'passed']));
    const failed = submitUTLearning(startUTLearning(`bn-${i + 1}`), null);
    assert.equal(nextUTLearning(failed, otherEvidence).currentId, ids[0]);
  }
});

test('다섯 목표 지도는 개념·AN·BN 세 열과 균등한 AN 행을 사용한다', () => {
  for (const [index, goal] of UT_GOALS.entries()) {
    assert.deepEqual([...new Set(Object.values(goal.positions).map(([column]) => column))].sort(), [0, 1, 2]);
    const supports = GOAL_SUPPORT_IDS[index].map(id => goal.positions[id]);
    assert.deepEqual(supports, [[1, 0], [1, 1.4], [1, 2.8]]);
    assert.deepEqual(goal.positions[goal.rootId], [2, 1.4], 'BN은 세 AN의 중앙 높이');
    const concepts = Object.keys(goal.positions).filter(id => UT_NODES[id].kind === 'concept').map(id => goal.positions[id]);
    assert.ok(concepts.every(([column]) => column === 0));
    const center = concepts.reduce((sum, [, row]) => sum + row, 0) / concepts.length;
    assert.ok(Math.abs(center - 1.4) < .000001, '개념 묶음도 AN 묶음과 같은 중심선');
    for (const id of Object.keys(goal.positions)) for (const child of UT_NODES[id].requires) {
      assert.equal(goal.positions[id][0] - goal.positions[child][0], 1, '모든 연결선은 인접한 열끼리 연결');
    }
  }
});

test('미완료 기초·기존 진행을 추가한 지도에도 빈 열이 없고 기록이나 연결을 바꾸지 않는다', () => {
  const prerequisites = Object.fromEntries(Object.entries(UT_NODES).map(([id, node]) => [id, [...node.requires]]));
  for (const goal of UT_GOALS) for (const extra of [[], ['a-model', 'a-minimum'], ['a-permutation'], ['c-product'], Object.values(FOUNDATION_ROOTS)]) {
    const map = makeGoal(goal.rootId, false, extra);
    const columns = [...new Set(Object.values(map.positions).map(([column]) => column))].sort((a, b) => a - b);
    assert.deepEqual(columns, columns.map((_, index) => index));
    for (const id of Object.keys(map.positions)) for (const child of UT_NODES[id].requires) assert.ok(map.positions[child][0] < map.positions[id][0]);
    assert.equal(new Set(Object.values(map.positions).map(value => value.join(':'))).size, Object.keys(map.positions).length);
  }
  assert.deepEqual(Object.fromEntries(Object.entries(UT_NODES).map(([id, node]) => [id, node.requires])), prerequisites);
});

test('전용 AN의 조건 해석·조합·정수해를 별도 열거로 검산한다', () => {
  const pairCount = n => { let count = 0; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) count++; return count; };
  for (let variant = 0; variant < 18; variant++) {
    const s = variant % 6;
    const expected = [
      brute(4 + s, [0, 0]), 7 + s, pairCount(6 + s),
      6 + s, 4 + 2 * s, brute(3 + s, [0, 0, 0]),
      3 + s, s, brute(3 + s, [0, 0, 0, 0]),
      3 + s, 5 + 2 * s, brute(4 + s, [0, 0, 0]),
      3 + s, 1 + s, brute(3 + s, [0, 0, 0]),
    ];
    assert.deepEqual(GOAL_SUPPORT_IDS.flat().map(id => Number(UT_NODES[id].make(variant).answer)), expected);
  }
});

test('목표 전용 AN은 통과한 개념을 반복하지 않고 해설 후 숫자를 바꿔 재도전한다', () => {
  const mastered = Object.fromEntries(Object.keys(UT_NODES).filter(id => id.startsWith('c-') || Object.values(FOUNDATION_ROOTS).includes(id)).map(id => [id, 'passed']));
  for (const ids of GOAL_SUPPORT_IDS) for (const id of ids) {
    const initial = startUTLearning(id, 1000);
    const failed = submitUTLearning(initial, null, 2000);
    const retry = nextUTLearning(failed, mastered, 3000);
    assert.equal(retry.currentId, id);
    assert.equal(retry.reading, false);
    assert.equal(retry.attempts[id], 1);
    assert.equal(retry.history.length, 1);
    assert.notEqual(learningQuestion(initial).prompt, learningQuestion(retry).prompt);
    assert.ok(nextUTLearning(submitUTLearning(retry, learningQuestion(retry).answer), mastered).complete);
  }
  const unknown = nextUTLearning(submitUTLearning(startUTLearning('a-g2-reserve'), null));
  assert.equal(unknown.currentId, 'c-minimum');
  assert.equal(unknown.reading, true, '미학습 개념이 필요할 때는 기존 활동으로 내려감');
  const failedConcept = { ...submitUTLearning(startUTLearning('a-g2-reserve'), null), results: { 'c-minimum': 'failed', 'a-g2-reserve': 'failed' } };
  assert.equal(nextUTLearning(failedConcept, mastered).currentId, 'c-minimum', '이번 학습에서 다시 틀린 개념은 오래된 통과 기록보다 우선함');
});

test('공통 개념 이력과 새 목표별 AN 이력을 함께 복원하고 전후 테스트는 보존한다', () => {
  let session = solveRun(createSession('AN 기록 호환'));
  for (const root of ['a-model', 'a-minimum', 'a-repetition', 'a-g2-reserve', 'a-g3-empty', 'a-g5-count']) {
    let learning = startUTLearning(root, 1000);
    learning = nextUTLearning(submitUTLearning(learning, learningQuestion(learning).answer, 2000));
    session = archiveLearning({ ...session, learning });
  }
  const store = { version: 1, activeId: session.id, sessions: [session] };
  const restored = decodeStore(JSON.stringify(store)).sessions[0];
  assert.ok(restored);
  assert.deepEqual(restored.history, session.history);
  assert.deepEqual(restored.evidence, session.evidence);
  assert.deepEqual(restored.pre, session.pre);
  assert.deepEqual(restored.post, session.post);
});
test('로컬 저장 복원은 기록·변형을 보존하고 오프페이지 시간은 더하지 않는다', () => {
  let session = resumeTest(createSession('resume'), 1000);
  session = pauseTimer(session, 2000);
  const store = { version: 1, activeId: session.id, sessions: [session] };
  const restored = decodeStore(JSON.stringify(store)); assert.equal(restored.sessions.length, 1);
  assert.equal(restored.sessions[0].timer.elapsed, 1); assert.equal(restored.sessions[0].timer.startedAt, null);
  assert.deepEqual(restored.sessions[0].pre.questions, session.pre.questions);
  for (const raw of ['{', '{}', JSON.stringify({ ...store, version: 2 }), JSON.stringify({ ...store, activeId: 'missing' })]) assert.deepEqual(decodeStore(raw), emptyStore());
  const corrupted = structuredClone(store); corrupted.sessions[0].pre.questions[0].answer = '999';
  assert.deepEqual(decodeStore(JSON.stringify(corrupted)), emptyStore());
});

test('사전 전부 모름이면 곱의 법칙 설명부터 다섯 기초를 순서대로 확인한 뒤 BN을 직접 푼다', () => {
  let session = solveRun(createSession('모름'), Array(10).fill(null));
  assert.equal(recommendedUTNode(session, 'bn-1'), 'c-product');
  session = beginUTLearning(session, 'bn-1', 1000);
  let state = session.learning;
  assert.equal(state.currentId, 'c-product'); assert.equal(state.reading, true);
  const visited = [];
  while (!state.complete && visited.length < 30) {
    visited.push(state.currentId);
    if (state.reading) state = { ...state, reading: false };
    state = nextUTLearning(submitUTLearning(state, learningQuestion(state).answer), learningDiagnostic(session));
  }
  assert.deepEqual(visited, ['c-product', 'a-product', 'c-factorial', 'a-factorial', 'c-permutation', 'a-permutation', 'c-combination', 'a-combination', 'c-repetition', 'a-repetition', 'bn-1']);
  assert.ok(state.complete); assert.equal(state.history.at(-1).nodeId, 'bn-1');
  assert.ok(state.history.at(-1).correct);
  session = archiveLearning({ ...session, learning: state });
  assert.equal(recommendedUTNode(session, 'bn-2'), 'bn-2', '학습에서 확인한 기초를 다음 목표에서 반복하지 않음');
  assert.equal(session.pre.responses.filter(item => item.answer === null).length, 10);
});

test('기초 정답은 건너뛰되 기초 오답·모름은 설명과 확인 문제로 보충한다', () => {
  const session = solveRun(createSession('혼합'), ['12', null, '60', '0', null, null, null, null, null, null]);
  const diagnostic = learningDiagnostic(session);
  assert.equal(diagnostic['c-product'], 'passed'); assert.equal(diagnostic['c-factorial'], 'failed');
  assert.equal(diagnostic['c-permutation'], 'passed'); assert.equal(diagnostic['c-combination'], 'failed');
  const state = beginUTLearning(session, 'bn-1').learning;
  assert.equal(state.currentId, 'c-factorial'); assert.ok(state.reading);
  assert.deepEqual(state.preparation, ['a-factorial', 'c-combination', 'a-combination', 'c-repetition', 'a-repetition', 'bn-1']);
  const known = solveRun(createSession('전부 정답'));
  assert.equal(beginUTLearning(known, 'bn-1').learning.currentId, 'bn-1');
  assert.equal(beginUTLearning(known, 'bn-1').learning.reading, false);
  assert.equal(beginUTLearning(createSession('사전 미완료'), 'bn-1').learning, null);
});

test('기초 확인 문제 오답은 설명 재학습과 숫자 변형을 거친 뒤에만 다음 기초로 넘어간다', () => {
  const session = solveRun(createSession('기초 재도전'), Array(10).fill(null));
  let state = beginUTLearning(session, 'bn-1').learning;
  state = nextUTLearning(submitUTLearning({ ...state, reading: false }, learningQuestion(state).answer));
  assert.equal(state.currentId, 'a-product');
  assert.equal(state.attempts['a-product'], 1, '개념 확인과 AN은 같은 숫자를 그대로 반복하지 않음');
  state = nextUTLearning(submitUTLearning(state, null), learningDiagnostic(session));
  assert.equal(state.currentId, 'c-product'); assert.ok(state.reading);
  state = nextUTLearning(submitUTLearning({ ...state, reading: false }, learningQuestion(state).answer));
  assert.equal(state.currentId, 'a-product'); assert.equal(state.attempts['a-product'], 2);
  state = nextUTLearning(submitUTLearning(state, learningQuestion(state).answer));
  assert.equal(state.currentId, 'c-factorial'); assert.ok(state.reading);
});

test('이전 BN-first 진행 기록은 최초 부족 기초로 옮기되 사전 답안·오답 경로를 보존한다', () => {
  let session = solveRun(createSession('기존 참가자'), Array(10).fill(null));
  let state = startUTLearning('bn-1', 1000);
  state = nextUTLearning(submitUTLearning(state, null));
  state = nextUTLearning(submitUTLearning(state, null));
  assert.equal(state.currentId, 'c-repetition');
  session = { ...session, learning: state };
  const migrated = prepareUTSession(session, 3000);
  assert.equal(migrated.learning.currentId, 'c-product'); assert.ok(migrated.learning.reading);
  assert.deepEqual(migrated.pre, session.pre); assert.deepEqual(migrated.learning.history, state.history);
  assert.deepEqual(migrated.learning.results, state.results); assert.equal(migrated.learning.goalId, 'bn-1');
  assert.equal(prepareUTSession(migrated), migrated, '기초 흐름으로 전환은 한 번만');
  const raw = JSON.stringify({ version: 1, activeId: session.id, sessions: [session] });
  const restored = decodeStore(raw).sessions[0];
  assert.equal(restored.learning.currentId, 'c-product'); assert.deepEqual(restored.learning.history, state.history);
  assert.deepEqual(restored.pre, session.pre);
  const map = makeGoal('bn-1', true);
  for (const skill of SKILLS) assert.ok(map.positions[`c-${skill}`]);
});

test('새 기초 진행의 저장 복원은 큐·위치·시간 기록을 보존하고 잘못된 큐는 거부한다', () => {
  let session = beginUTLearning(solveRun(createSession('새 진행'), Array(10).fill(null)), 'bn-1');
  session = { ...session, learning: nextUTLearning(submitUTLearning({ ...session.learning, reading: false }, learningQuestion(session.learning).answer)) };
  const store = { version: 1, activeId: session.id, sessions: [session] };
  assert.deepEqual(decodeStore(JSON.stringify(store)).sessions[0].learning, session.learning);
  const corrupt = structuredClone(store); corrupt.sessions[0].learning.preparation = ['not-a-node'];
  assert.deepEqual(decodeStore(JSON.stringify(corrupt)), emptyStore());
});

test('정답 지도 확인 중에는 통과 노드와 답안을 유지하고 다음 학습을 자동 진행하지 않는다', () => {
  let session = beginUTLearning(solveRun(createSession('지도 대기'), Array(10).fill(null)), 'bn-1');
  const current = { ...session.learning, reading: false, startedAt: 1000 };
  const passed = submitUTLearning(current, learningQuestion(current).answer, 3000);
  assert.equal(passed.currentId, 'c-product'); assert.equal(passed.feedback, 'correct');
  assert.equal(passed.results['c-product'], 'passed'); assert.equal(passed.history.length, 1);
  assert.equal(passed.history[0].seconds, 2); assert.equal(passed.complete, false);
  assert.equal(submitUTLearning(passed, learningQuestion(passed).answer, 10000), passed, '지도 중 답안 중복 저장 차단');
  session = { ...session, learning: passed };
  const restored = decodeStore(JSON.stringify({ version: 1, activeId: session.id, sessions: [session] })).sessions[0];
  assert.deepEqual(restored.learning, passed, '새로고침해도 지도 확인 대기 상태 유지');
  const next = nextUTLearning(restored.learning, learningDiagnostic(restored), 12000);
  assert.equal(next.currentId, 'a-product'); assert.equal(next.feedback, null);
  assert.equal(next.history.length, 1); assert.equal(next.startedAt, 12000);
});

test('마지막 BN 정답은 지도 확인 후에만 목표 완료로 기록하며 중복 완료하지 않는다', () => {
  let session = beginUTLearning(solveRun(createSession('BN 지도 확인')), 'bn-1', 1000);
  session = { ...session, learning: submitUTLearning(session.learning, learningQuestion(session.learning).answer, 3000) };
  assert.deepEqual(session.completed, []); assert.equal(session.learning.feedback, 'correct');
  session = archiveLearning({ ...session, learning: nextUTLearning(session.learning, learningDiagnostic(session), 6000) });
  assert.deepEqual(session.completed, ['bn-1']); assert.equal(session.learning, null);
  assert.equal(session.history.length, 1); assert.equal(archiveLearning(session), session);
});
