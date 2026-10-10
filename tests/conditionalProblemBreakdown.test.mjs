import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import { CONDITIONAL_GOALS, CONDITIONAL_NODES, breakdownQuestion, parseProbabilityAnswer, correctProbabilityAnswer, unresolvedSupport } from '../src/routes/dev/conditionalProblemBreakdown.ts';

test('all three supplied problems have separate, complete BN/AN/concept DAGs with no decorative shortcuts', () => {
  assert.equal(CONDITIONAL_GOALS.length, 3);
  const allSeen = new Set();
  for (const goal of CONDITIONAL_GOALS) {
    const seen = new Set();
    const visit = (id, chain = []) => {
      assert(!chain.includes(id), `cycle: ${id}`);
      const node = CONDITIONAL_NODES[id];
      assert(node && goal.positions[id]);
      seen.add(id); allSeen.add(id);
      for (const child of node.requires) {
        assert(goal.positions[child][0] < goal.positions[id][0], `${child} must precede ${id}`);
        visit(child, [...chain, id]);
      }
    };
    visit(goal.rootId);
    assert.equal(CONDITIONAL_NODES[goal.rootId].kind, 'BN');
    assert.deepEqual([...seen].sort(), Object.keys(goal.positions).sort());
    assert.equal(new Set(Object.values(goal.positions).map(point => point.join(':'))).size, seen.size);
    assert([...seen].some(id => CONDITIONAL_NODES[id].kind === 'AN'));
    assert(seen.has('c-complement') && seen.has('c-addition') && seen.has('c-conditional'));
    const ancestors = id => new Set(CONDITIONAL_NODES[id].requires.flatMap(child => [child, ...ancestors(child)]));
    for (const id of seen) for (const child of CONDITIONAL_NODES[id].requires) {
      assert(!CONDITIONAL_NODES[id].requires.filter(other => other !== child).some(other => ancestors(other).has(child)), `redundant shortcut: ${child} -> ${id}`);
    }
  }
  assert.deepEqual([...allSeen].sort(), Object.keys(CONDITIONAL_NODES).sort());
  const tags = Object.values(CONDITIONAL_NODES).filter(node => node.kind === 'concept').map(node => node.conceptId).sort();
  assert.deepEqual(tags, ['108', '13', '16', '17', '18']);
  assert(!Object.values(CONDITIONAL_NODES).some(node => /독립|시행/.test(node.label)));
});

test('original and changed-number target answers are independently calculated', () => {
  const expected = [
    [(5/8-1/4)/(1-1/4), (7/10-1/5)/(1-1/5)],
    [(1+2)*1/8, (1+3)*1/10],
    [((1-2/3)-(1/2)*(1/6))/(1-2/3), ((1-1/2)-(3/5)*(1/3))/(1-1/2)],
  ];
  for (let i = 0; i < 3; i++) for (let variant = 0; variant < 2; variant++) {
    const question = breakdownQuestion(CONDITIONAL_GOALS[i].rootId, variant);
    assert(Math.abs(parseProbabilityAnswer(question.answer) - expected[i][variant]) < 1e-12);
    assert.equal(question.answerType, 'NUMBER');
    assert.notEqual(breakdownQuestion(CONDITIONAL_GOALS[i].rootId, 0).prompt, breakdownQuestion(CONDITIONAL_GOALS[i].rootId, 1).prompt);
  }
});

test('every mini-problem answer matches its numerical operation and renders valid formulas', () => {
  const expected = {
    'c-events': [3/6,2/6], 'c-complement': [1-2/5,1-1/4], 'c-addition': [1/2+1/3-1/6,2/5+3/10-1/10],
    'c-conditional': [(1/4)/(1/2),(1/4)/(3/4)], 'c-multiplication': [(1/2)*(1/3),(3/4)*(2/5)],
    'p1-complement': [1-1/4,1-2/5], 'p1-outside': [5/8-1/4,3/4-1/2], 'p1-ratio': [(3/8)/(3/4),(1/4)/(3/4)],
    'p2-ratio': [2,3], 'p2-intersection': [2/8,3/10], 'p2-partition': [1/8+1/4,1/10+3/10],
    'p3-base': [1-2/3,1-3/5], 'p3-joint': [(1/2)*(1/6),(2/3)*(1/4)], 'p3-difference': [1/3-1/12,1/2-1/5], 'p3-ratio': [(1/4)/(1/3),(3/10)/(1/2)],
  };
  for (const node of Object.values(CONDITIONAL_NODES)) {
    assert.equal(node.questions.length, 2);
    assert(node.kind !== 'concept' || node.note);
    const contents = [node.note ?? ''];
    for (let i = 0; i < node.questions.length; i++) {
      const question = node.questions[i];
      assert(question.prompt && question.explanation);
      assert(parseProbabilityAnswer(question.answer) !== null);
      if (expected[node.id]) assert(Math.abs(parseProbabilityAnswer(question.answer) - expected[node.id][i]) < 1e-12, node.id);
      contents.push(question.prompt, question.explanation);
    }
    for (const content of contents) for (const match of content.matchAll(/\$([^$\n]+)\$/g)) {
      assert.doesNotThrow(() => katex.renderToString(match[1], { throwOnError: true, trust: false }));
    }
  }
});

test('fraction answers support equivalent fractions and decimals without accepting malformed input', () => {
  assert(correctProbabilityAnswer('1/2', '2/4'));
  assert(correctProbabilityAnswer('1/2', '.5'));
  assert(correctProbabilityAnswer('1/3', '0.333333'));
  assert(!correctProbabilityAnswer('1/2', '1/3'));
  assert(!correctProbabilityAnswer('1/3', '0.33'));
  for (const value of ['', ' ', '1/', '1/0', '2/0.5', 'NaN', 'Infinity', '1+1', '-0.5', '1/2/3', '0.5x']) assert.equal(parseProbabilityAnswer(value), null);
});

test('wrong answers descend only to unresolved children; passing children never passes their BN parent', () => {
  const passed = {};
  assert.equal(unresolvedSupport('bn-1', passed), 'p1-ratio');
  assert.equal(unresolvedSupport('p1-ratio', passed), 'p1-complement');
  passed['p1-complement'] = 'passed';
  assert.equal(unresolvedSupport('p1-ratio', passed), 'p1-outside');
  passed['p1-outside'] = 'passed'; passed['c-conditional'] = 'passed';
  assert.equal(unresolvedSupport('p1-ratio', passed), undefined);
  assert.equal(passed['bn-1'], undefined);
  assert.equal(passed['p1-ratio'], undefined);
  assert.notEqual(breakdownQuestion('p1-complement', 0).answer, breakdownQuestion('p1-complement', 1).answer);
  assert.throws(() => breakdownQuestion('missing'), /Unknown problem node/);
});
