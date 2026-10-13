import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('..', import.meta.url));
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  new Function('require', 'module', 'exports', code)(name => {
    if (name.endsWith('/havrutaClient')) return { havrutaClient: {} };
    if (name.endsWith('/aiQuestionClient')) return { aiQuestionClient: {} };
    if (name.endsWith('/tokenStorage')) return { tokenStorage: {} };
    if (!name.startsWith('.')) return require(name);
    const base = resolve(dirname(file), name);
    const target = [base, base + '.ts', base + '.tsx'].find(existsSync);
    assert(target, name); return load(target);
  }, module, module.exports);
  return module.exports;
}
const { ChatPanel } = load(resolve(root, 'src/routes/main/AIConceptPage.tsx'));
const usage = { date:'2026-10-13',limit:3,used:1,remaining:2,resetsAt:'2026-10-14T00:00:00+09:00',maxInputCharacters:2000,maxOutputTokens:600,model:'gpt-6-luna' };
function render(overrides={}) {
  return renderToStaticMarkup(createElement(ChatPanel, {
    headerTitle:'AI 개념 정리',headerSubtitle:null,messages:[],isMessagesLoading:false,isProcessing:false,
    errorMessage:null,onDismissError:()=>{},input:'질문',onInputChange:()=>{},onSend:()=>{},messageEndRef:{current:null},
    suggestedPrompts:['조건부확률이 뭐야?'],onSuggestedPromptClick:()=>{},questionUsage:usage,
    usageError:null,questionBlocked:false,onRetryUsage:()=>{},...overrides,
  }));
}
test('remaining allowance, reset policy and completion cap are visible',()=>{
  const markup=render();
  assert.match(markup,/오늘 AI 질문 2\/3회 남음/);
  assert.match(markup,/한국 시간 자정 초기화/);
  assert.match(markup,/600토큰/);
  assert.match(markup,/maxLength="2000"/i);
  assert(!markup.includes('disabled=""'));
});
test('exhausted allowance disables sending and chips but preserves old messages',()=>{
  const markup=render({questionUsage:{...usage,used:3,remaining:0},questionBlocked:true,messages:[{messageId:1,senderType:'AI',content:'기존 대화 기록',createdAt:null}]});
  assert.match(markup,/기존 대화 기록/);
  assert.match(markup,/오늘 질문을 모두 사용했어요/);
  assert.match(markup,/<input[^>]*disabled=""/);
  assert.match(markup,/<button[^>]*disabled=""[^>]*>전송/);
  assert(!markup.includes('조건부확률이 뭐야?'));
});
test('unknown allowance fails closed and provides retry on lookup error',()=>{
  const markup=render({questionUsage:null,questionBlocked:true,usageError:'사용 횟수 조회 실패'});
  assert.match(markup,/사용 횟수 조회 실패/);
  assert.match(markup,/다시 확인/);
  assert.match(markup,/<input[^>]*disabled=""/);
});
test('rapid clicks are guarded and usage refreshes even after failed attempts',()=>{
  const source=readFileSync(resolve(root,'src/routes/main/AIConceptPage.tsx'),'utf8');
  assert.match(source,/sendingRef\.current \|\| questionBlocked/);
  assert.match(source,/finally\s*\{[\s\S]*await refreshQuestionUsage\(\);[\s\S]*sendingRef\.current = false;/);
  assert.match(source,/addEventListener\('focus', onFocus\)/);
});
