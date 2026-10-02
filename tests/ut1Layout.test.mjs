import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Compile the real TSX presentation components for Node, without a browser or new dependency.
const require = createRequire(import.meta.url);
const modules = new Map();
function load(file) {
  if (modules.has(file)) return modules.get(file).exports;
  const module = { exports: {} };
  modules.set(file, module);
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  const localRequire = name => {
    if (!name.startsWith('.')) return require(name);
    const base = resolve(dirname(file), name);
    const target = [base, `${base}.ts`, `${base}.tsx`].find(path => existsSync(path));
    assert.ok(target, `Unresolved presentation import: ${name}`);
    return load(target);
  };
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  return module.exports;
}
const HomeDashboard = load(fileURLToPath(new URL('../src/components/home/HomeDashboard.tsx', import.meta.url))).default;
const ConnectionNotice = load(fileURLToPath(new URL('../src/routes/dev/UT1ConnectionNotice.tsx', import.meta.url))).default;
const props = { nickname: '레이아웃 확인', recommendation: null, feedback: null, maps: null,
  reviewItems: [], progressPercent: 0, progressLabel: '시작', todaySolvedCount: 0, streakDays: 0,
  onReviewSeeAll() {}, onReviewItemClick() {},
};

test('UT 안내와 참가자 전환은 음수 여백 홈 밖이 아니라 홈 내부에 렌더된다', () => {
  const html = renderToStaticMarkup(createElement(HomeDashboard, { ...props,
    notice: createElement('p', { role: 'status' }, '사전 테스트 완료'),
    footer: createElement('footer', null, '새 참가자로 시작'),
  }));
  assert.ok(html.startsWith('<div class="home-dashboard"'));
  assert.ok(html.indexOf('role="status"') < html.indexOf('home-dashboard-columns'));
  assert.ok(html.endsWith('<footer>새 참가자로 시작</footer></div>'));
});
test('일반 홈은 추가 안내와 참가자 하단 없이 기존 내용을 유지한다', () => {
  const html = renderToStaticMarkup(createElement(HomeDashboard, props));
  assert.ok(html.includes('home-dashboard-columns'));
  assert.ok(!html.includes('role="status"'));
  assert.ok(!html.includes('<footer'));
});

test('삭제된 참가자 안내에는 비활성 폼 밖에서 쓸 수 있는 신규 시작 버튼을 렌더한다', () => {
  const html = renderToStaticMarkup(createElement(ConnectionNotice, {
    message: '이전 참가자의 기록이 삭제됐어요.', deleted: true, onRetry() {}, onStartNew() {},
  }));
  assert.ok(html.includes('새 참가자로 시작')); assert.ok(html.includes('다시 연결'));
  assert.ok(html.includes('role="alert"')); assert.ok(!html.includes('disabled'));
});

test('삭제가 아닌 저장 장애 안내에는 연결 초기화 버튼을 노출하지 않는다', () => {
  const html = renderToStaticMarkup(createElement(ConnectionNotice, {
    message: '오프라인', deleted: false, onRetry() {}, onStartNew() {},
  }));
  assert.ok(!html.includes('새 참가자로 시작')); assert.ok(html.includes('다시 연결'));
});
