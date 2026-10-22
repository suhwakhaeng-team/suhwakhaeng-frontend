import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDiagnosticReport, DIAGNOSTIC_REPORT_PREVIEWS } from '../src/lib/diagnosticReport.ts';
import { LIVE_CONCEPT_CATALOG } from './fixtures/liveConceptCatalog.mjs';

const result = (topicMastery = {}, diagnosticAnswers) => ({
  topicMastery, diagnosticAnswers, learningRoute: '', overallAssessment: '',
});
const answer = (problemId, topic, concepts, correct, diagnosticRole = 'main') => ({
  problemId, topic, concepts, correct, diagnosticRole, userAnswer: correct ? 'A' : '모르겠습니다',
});

test('진단 문항 수와 ID·순서가 바뀌어도 실제 답안 개념별로 영역을 구분한다', () => {
  const answers = [
    answer(757, '정규분포', ['정규분포', '확률밀도함수'], false),
    answer(678, '조합', ['곱의 법칙', '조합', '수학적 확률'], true),
    answer(709, '신뢰구간', ['모집단', '신뢰구간'], false),
  ];
  const report = buildDiagnosticReport(result({}, answers));
  assert.deepEqual(report.concepts.map(item => [item.label, item.area, item.status]), [
    ['정규분포', '통계', 'needs-review'],
    ['확률밀도함수', '통계', 'needs-review'],
    ['곱의 법칙', '경우의 수', 'stable'],
    ['조합', '경우의 수', 'stable'],
    ['수학적 확률', '확률', 'stable'],
    ['모집단', '통계', 'needs-review'],
    ['신뢰구간', '통계', 'needs-review'],
  ]);
  assert.deepEqual(report.learningPlans.map(plan => [plan.area, plan.concepts.length]), [['통계', 4]]);
  const reordered = buildDiagnosticReport(result({}, [...answers].reverse()));
  const byLabel = items => Object.fromEntries(items.map(item => [item.label, [item.area, item.status]]));
  assert.deepEqual(byLabel(reordered.concepts), byLabel(report.concepts));
});

test('원답안 없이 canonical 숙련도만 받아도 옛 10개 복합 유형을 만들지 않는다', () => {
  const report = buildDiagnosticReport(result({ '평균': 0.64, '조합': 0.136, '사건의 독립': 0.5, '표준화': -1 }));
  assert.deepEqual(report.concepts.map(item => [item.label, item.area, item.status]), [
    ['평균', '통계', 'stable'],
    ['조합', '경우의 수', 'needs-review'],
    ['사건의 독립', '확률', 'unstable'],
    ['표준화', '통계', 'not-diagnosed'],
  ]);
  assert.deepEqual(report.counts, { stable: 1, unstable: 1, 'needs-review': 1, 'not-diagnosed': 1 });
  assert.equal(report.concepts[3].score, null);
  assert.deepEqual(report.learningPlans.map(plan => plan.area), ['경우의 수', '확률']);
});

test('기초 확인 답안은 바로 앞 본문제에만 연결하며 다음 본문제 정답과 섞지 않는다', () => {
  const report = buildDiagnosticReport(result({}, [
    answer(711, '중복조합', ['중복조합'], false),
    answer(721, '조합', ['조합'], true, 'drilldown'),
    answer(745, '이항정리', ['이항정리'], false),
    answer(757, '정규분포', ['정규분포'], true),
  ]));
  assert.deepEqual(report.concepts.map(item => [item.label, item.status]), [
    ['중복조합', 'unstable'], ['이항정리', 'needs-review'], ['정규분포', 'stable'],
  ]);
});

test('원답안에 없는 지도 개념은 서버의 미진단 상태로 남기며 개념 진단을 대체하지 않는다', () => {
  const report = buildDiagnosticReport(result({
    '조합': 0.64, '신뢰구간': -1, '정규분포': -1,
    '경우의 수 기초': 0.64,
  }, [answer(678, '조합', ['조합'], false)]));
  assert.deepEqual(report.concepts.map(item => [item.label, item.status]), [
    ['조합', 'needs-review'], ['신뢰구간', 'not-diagnosed'], ['정규분포', 'not-diagnosed'],
  ]);
  assert.equal(report.counts['not-diagnosed'], 2);
  assert.deepEqual(report.learningPlans.map(plan => plan.concepts.map(item => item.label)), [['조합']]);
});

test('동의어와 공백·중복 이름은 canonical 개념 하나로 합치고 취약한 진단을 유지한다', () => {
  const report = buildDiagnosticReport(result({}, [
    answer(1, '사건의 독립', [' 독립사건 ', '사건의 독립', ''], true),
    answer(2, '독립시행의 확률', ['독립시행', '독립시행의 확률'], true),
    answer(3, '독립사건', ['사건의 독립'], false),
    answer(4, '중복조합', ['중복조합의 활용', '중복조합'], true),
    answer(5, '이항정리', ['이항계수의 활용', '이항정리'], true),
  ]));
  assert.deepEqual(report.concepts.map(item => [item.label, item.area, item.status]), [
    ['사건의 독립', '확률', 'needs-review'],
    ['독립시행의 확률', '확률', 'stable'],
    ['중복조합', '경우의 수', 'stable'],
    ['이항정리', '경우의 수', 'stable'],
  ]);
});

test('명시적으로 연결 개념이 없는 문항이나 빈 결과에서는 진단 개념을 추측하지 않는다', () => {
  assert.deepEqual(buildDiagnosticReport(result()).concepts, []);
  const empty = buildDiagnosticReport(result({}, [answer(705, '평균', [], true)]));
  assert.deepEqual(empty.concepts, []);
  assert.deepEqual(empty.learningPlans, []);
});

test('알 수 없는 새 개념을 확률 영역으로 임의 분류하지 않는다', () => {
  const report = buildDiagnosticReport(result({ '새 개념': 0.136, '점수 없음': NaN }));
  assert.deepEqual(report.concepts.map(item => [item.area, item.status]), [
    ['미분류', 'needs-review'], ['미분류', 'not-diagnosed'],
  ]);
  assert.deepEqual(report.learningPlans.map(plan => plan.area), ['미분류']);
});

test('이전 복합 유형명 보고서와 개발용 시안도 실제 있는 결과만 표시한다', () => {
  const report = buildDiagnosticReport(result({ '중등 기술 통계 및 산포도 복합형': 0.64 }));
  assert.deepEqual(report.concepts.map(item => [item.label, item.area, item.status]), [['통계량·산포도', '통계', 'stable']]);
  for (const preview of Object.values(DIAGNOSTIC_REPORT_PREVIEWS)) {
    const previewReport = buildDiagnosticReport(preview);
    assert.ok(previewReport.concepts.length > 0);
    assert.ok(previewReport.concepts.every(item => item.area !== '미분류'));
  }
});

test('통합된 52개 카탈로그의 통계·확률·경우의 수 개념은 미분류로 빠지지 않는다', () => {
  const report = buildDiagnosticReport(result(Object.fromEntries(LIVE_CONCEPT_CATALOG.map(([, name]) => [name, -1]))));
  assert.equal(report.concepts.length, 52);
  assert.equal(report.counts['not-diagnosed'], 52);
  assert.equal(report.concepts.filter(item => item.area === '경우의 수').length, 11);
  assert.equal(report.concepts.filter(item => item.area === '확률').length, 9);
  assert.equal(report.concepts.filter(item => item.area === '통계').length, 32);
  assert.deepEqual(report.learningPlans, []);
});

test('확률질량함수는 이산확률분포로 합치되 일반 확률분포를 이산 분포로 추측하지 않는다', () => {
  const report = buildDiagnosticReport(result({}, [
    answer(684, '이산확률분포', ['이산확률분포', '확률질량함수'], true),
    answer(1, '확률분포', ['확률분포'], false),
  ]));
  assert.deepEqual(report.concepts.map(item => [item.label, item.area, item.status]), [
    ['이산확률분포', '통계', 'stable'], ['확률분포', '통계', 'needs-review'],
  ]);
});
