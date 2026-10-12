import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { CONDITIONAL_NODES } from '../src/routes/dev/conditionalProblemBreakdown.ts';
import { ut2Assessment } from '../src/routes/dev/ut2Assessment.ts';

const require = createRequire(import.meta.url);
const cache = new Map();
function load(file) {
  if (file.endsWith('.json')) return JSON.parse(readFileSync(file, 'utf8'));
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const source = ts.transpileModule(readFileSync(file, 'utf8').replaceAll('import.meta.env', '{}'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const localRequire = name => {
    if (name.endsWith('.css')) return {};
    if (!name.startsWith('.')) return require(name);
    const base = resolve(dirname(file), name);
    const target = [base, `${base}.ts`, `${base}.tsx`].find(path => existsSync(path));
    assert(target, name); return load(target);
  };
  new Function('require', 'module', 'exports', source)(localRequire, module, module.exports);
  return module.exports;
}
const pageFile = fileURLToPath(new URL('../src/routes/dev/UT2Page.tsx', import.meta.url));
const { UT2Dashboard, Assessment, Study } = load(pageFile);
const MainLayout = load(fileURLToPath(new URL('../src/layouts/MainLayout.tsx', import.meta.url))).default;
const noop = () => {};
const remote = { busy: false, hasPending: false, act: async () => undefined };
function session(stage = 'learning') {
  const concepts = Object.values(CONDITIONAL_NODES).filter(n => n.kind === 'concept').map(n => n.id);
  return { id: 'qa', participant: 'UI 확인', bankVersion: 1, stage, createdAt: 0,
    pre: { form: 'A', total: 13, responses: stage === 'pre' ? [] : ut2Assessment('A').map(q => ({ questionId: q.id, answer: q.answer, correct: true, seconds: 2 })) },
    post: { form: 'B', total: 13, responses: [] }, weak: [], results: Object.fromEntries(concepts.map(id => [id, 'passed'])),
    completed: [], history: [], attempts: {}, learningNode: 'bn-1', recommended: stage === 'learning' ? 'bn-1' : null,
    question: { id: 'events-1', nodeId: 'c-events', group: 'foundation', prompt: '한 장을 뽑는다. 확률은?' }, feedback: null };
}
function dashboard(s) {
  return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(MainLayout, { showTagCatalog: false, activePath: '/main/home', onNavigate: noop },
    createElement(UT2Dashboard, { session: s, selectedGoal: 'conditional-1', onSelectGoal: noop, notice: '', blocked: false, onOpen: noop, onMap: noop, onTest: noop, onResults: noop, onStartNew: noop }))));
}

test('UT2 uses the real web layout, dashboard and question card, not the separate prototype shell', () => {
  const src = readFileSync(pageFile, 'utf8');
  for (const component of ['MainLayout', 'HomeDashboard', 'CurriculumListSection', 'ProblemQuestionCard']) assert(src.includes(`<${component}`));
  assert(src.includes('UT1PreviewPage.css'));
  assert(!src.includes('ConditionalProblemMapPage.css'));
  assert(!src.includes('cpm-page') && !src.includes('cpm-nav'));
  const entry = readFileSync(new URL('../src/routes/dev/UTEntryPage.tsx', import.meta.url), 'utf8');
  assert(entry.includes('ut-entry-brand') && entry.includes('UT1PreviewPage.css'));
});
test('pre-test home uses the existing navigation, progress and map; concepts are not prematurely marked passed', () => {
  const html = dashboard(session('pre'));
  for (const label of ['AI 개념정리', '마이페이지', '오늘도 학습해볼까요?', '학습 전 레벨테스트', '테스트 시작', '문제 지도', '기초 확인 문제', '테스트 후 열려요']) assert(html.includes(label), label);
  assert(!html.includes('is-confirmed'));
  assert(!html.includes('ltm-node is-passed'));
  assert(!html.includes('사전 테스트 0/2 정답'));
});
test('wrong-concept diagnosis is shown in the existing recommendation and review cards', () => {
  const s = session(); s.weak = ['c-conditional']; s.results['c-conditional'] = 'failed'; s.recommended = 'c-conditional';
  s.pre.responses[6].correct = false;
  const html = dashboard(s);
  for (const label of ['오늘의 추천', '목표 문제를 위한 기초 학습', '기초부터 학습', '조건부확률', '기초 확인 필요', '사전 테스트 1/2 정답']) assert(html.includes(label), label);
  assert(html.includes('home-dashboard-columns'));
  assert(!html.includes('학습 후 테스트 시작'));
  assert(!html.includes('katex-error'));
});
test('home offers post-test only when all three goals and required concepts are complete', () => {
  const s = session(); s.completed = ['bn-1', 'bn-2', 'bn-3']; s.recommended = null;
  assert(dashboard(s).includes('학습 후 테스트 시작'));
  s.completed = ['bn-1', 'bn-2']; s.recommended = 'bn-3';
  assert(!dashboard(s).includes('학습 후 테스트 시작'));
  const completed = session('done');
  assert(dashboard(completed).includes('결과 보기') && dashboard(completed).includes('새 참가자로 시작'));
});
test('participant change is available during every UT2 phase, not only after completion', () => {
  for (const stage of ['pre', 'learning', 'post', 'done']) assert(dashboard(session(stage)).includes('새 참가자로 시작'), stage);
  const src = readFileSync(pageFile, 'utf8');
  assert(src.includes('if (!remote.startNew()) return;'));
  assert(src.includes('setRegistration(true); setEntered(false);'));
  assert(src.includes('이전 학습 이어하기'));
});
test('assessment matches the live question card and progress UI without exposing answer or grading', () => {
  const html = renderToStaticMarkup(createElement(Assessment, { session: session('pre'), remote, onHome: noop, onAdvance: noop }));
  for (const label of ['잠시 나가기', '테스트 진행도', '표본공간과 사건', 'plm-number-answer', '모르겠습니다', '분수 또는 소수']) assert(html.includes(label), label);
  assert(html.includes('max="13"'));
  assert(!html.includes('정답입니다') && !html.includes('3/10'));
});
test('study keeps UT-style feedback, map navigation and child-first learning without showing the full BN solution', () => {
  const s = session(); s.feedback = { nodeId:'bn-1', nextNode:'p1-complement', prompt:'기출 문제 본문', explanation:'', unknown:true };
  const html = renderToStaticMarkup(createElement(Study, { session:s, remote, onHome:noop, onMap:noop, onPass:noop }));
  assert(html.includes('문제 지도 보기') && html.includes('ut-feedback'));
  assert(html.includes(CONDITIONAL_NODES['p1-complement'].label));
  assert(html.includes('필요한 하위 학습으로 이어가기'));
  assert(!html.includes(CONDITIONAL_NODES['bn-1'].questions[0].explanation));
});
