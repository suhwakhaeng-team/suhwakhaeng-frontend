import test from 'node:test';
import assert from 'node:assert/strict';
import { anProblemsForConcept, previewBnConnection, wrongBnAttempts } from '../src/lib/bnConnectionMap.ts';

const answer = (problemId, diagnosticRole, correct, concepts = []) => ({
  problemId, diagnosticRole, correct, concepts, topic: `문항 ${problemId}`, userAnswer: correct ? 'A' : '모르겠습니다',
});

test('틀린 BN을 각각 중심으로 삼고 바로 뒤의 AN만 연결한다', () => {
  const attempts = wrongBnAttempts([
    answer(1, 'main', true),
    answer(2, 'main', false, ['도수분포표', '최빈값']),
    answer(20, 'drilldown', true, ['최빈값']),
    answer(3, 'main', false, ['산점도']),
    answer(4, 'main', true),
  ]);
  assert.deepEqual(attempts.map(item => [item.bn.problemId, item.drilledAn?.problemId ?? null]), [[2, 20], [3, null]]);
});

test('시안에서는 한 BN의 개념별 AN만 만들고 중복 태그를 제거한다', () => {
  const attempt = { bn: answer(2, 'main', false, [' 도수분포표 ', '최빈값', '도수분포표']), drilledAn: answer(20, 'drilldown', true) };
  const connection = previewBnConnection(attempt);
  assert.deepEqual(connection.concepts, ['도수분포표', '최빈값']);
  assert.equal(connection.anProblems.length, 2);
  assert.equal(connection.anProblems[0].id, 20);
  assert.deepEqual(anProblemsForConcept(connection, '최빈값').map(problem => problem.concepts), [['최빈값']]);
  assert.deepEqual(anProblemsForConcept(connection, '산점도'), []);
});
