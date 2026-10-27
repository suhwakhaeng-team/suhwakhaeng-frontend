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
import { UT3_NODES, ut3Assessment } from '../src/routes/dev/ut3Model.ts';
import { activityCorrect, UT3_INTERACTIVE_LESSONS } from '../src/routes/dev/ut3InteractiveLessons.ts';

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

const pageFile = fileURLToPath(new URL('../src/routes/dev/UT3Page.tsx', import.meta.url));
const {UT3Dashboard,Assessment,Study,SurveyInvitation}=load(pageFile);
const noop=()=>{};
const remote={busy:false,hasPending:false,act:async()=>undefined};
function session(stage='learning'){
 return {id:'ut3-qa',participant:'UT3 UI',bankVersion:1,stage,createdAt:0,
  pre:{form:'A',total:4,responses:stage==='pre'?[]:ut3Assessment('A').map(q=>({questionId:q.id,answer:q.answer,correct:true,seconds:2}))},
  post:{form:'B',total:4,responses:[]},weak:[],results:{'c-conditional':'passed','c-addition':'passed','c-complement':'passed'},
  completed:[],history:[],attempts:{},learningNode:stage==='learning'?'bn-conditional':null,recommended:stage==='learning'?'bn-conditional':null,
  question:ut3Assessment('A')[0],feedback:null};
}
function dashboard(s){return renderToStaticMarkup(createElement(UT3Dashboard,{session:s,selectedGoal:'conditional-inference',onSelectGoal:noop,notice:'',blocked:false,onOpen:noop,onMap:noop,onTest:noop,onResults:noop,onStartNew:noop}));}
test('UT3 uses UT2 layout components, one goal and a 4-learning-4 progress display',()=>{
 const src=readFileSync(pageFile,'utf8');
 for(const c of ['MainLayout','HomeDashboard','ProblemQuestionCard','UT2SurveyForm'])assert(src.includes('<'+c),c);
 const html=dashboard(session('pre'));
 for(const t of ['학습 전 레벨테스트','기초 3문항','기출형 1문항','문제 지도','0/4','0/1','두 조건부확률로 여사건 추론'])assert(html.includes(t),t);
 assert(!html.includes('/13')&&!html.includes('/3 해결')&&!html.includes('is-confirmed'));
});
test('only the single learned goal unlocks post-test and each basic diagnosis uses one response',()=>{
 const s=session();assert(!dashboard(s).includes('학습 후 테스트 시작'));
 s.completed=['bn-conditional'];s.recommended=null;
 assert(dashboard(s).includes('학습 후 테스트 시작'));
 const html=dashboard(session());assert(html.includes('사전 테스트 1/1 정답'));
 const done=session('done');done.surveySubmitted=true;
 assert(dashboard(done).includes('결과 보기'));
 for(const stage of ['pre','learning','post','done'])assert(dashboard(session(stage)).includes('새 참가자로 시작'));
});
test('assessment shows four questions and never reveals the answer or correctness',()=>{
 const html=renderToStaticMarkup(createElement(Assessment,{session:session('pre'),remote,onHome:noop,onAdvance:noop}));
 assert(html.includes('max="4"')&&html.includes('모르겠습니다'));
 assert(!html.includes('정답입니다')&&!html.includes('1/3'));
});
test('goal feedback routes to prerequisites and concept explanation covers De Morgan',()=>{
 const s=session();s.learningNode='bn-conditional';s.feedback={nodeId:'bn-conditional',nextNode:'c-conditional',prompt:'목표 기출형',explanation:'',unknown:true};
 let html=renderToStaticMarkup(createElement(Study,{session:s,remote,onHome:noop,onMap:noop,onPass:noop}));
 assert(html.includes('필요한 하위 학습으로 이어가기')&&html.includes('이 개념부터 다시 확인해요'));
 for(const label of ['조건부확률 설명 보기','확률의 덧셈정리 설명 보기','여사건과 드모르간 설명 보기'])assert(html.includes(label),label);
 s.learningNode='c-complement';s.feedback=null;
 html=renderToStaticMarkup(createElement(Study,{session:s,remote,onHome:noop,onMap:noop,onPass:noop}));
 assert(html.includes('드모르간')&&html.includes('참여형 학습 단계')&&html.includes('B가 아닌 영역을 직접 골라 보세요')&&!html.includes('katex-error'));
});

test('skipping a concept requires its saved lesson completion, never just a correct pretest',()=>{
 const s=session();s.learningNode='c-conditional';
 const render=()=>renderToStaticMarkup(createElement(Study,{session:s,remote,onHome:noop,onMap:noop,onPass:noop}));
 assert(!render().includes('넘어가기'));
 s.learnedConcepts=['c-addition'];assert(!render().includes('넘어가기'));
 s.learnedConcepts=['c-conditional'];assert(render().includes('넘어가기'));
});

test('interactive activities require exact event regions and completed fraction construction',()=>{
 for(const steps of Object.values(UT3_INTERACTIVE_LESSONS))for(const step of steps){
  assert(!activityCorrect(step,{}));
  const answers=Object.fromEntries(step.groups.map(group=>[group.id,group.correct]));
  assert(activityCorrect(step,answers));
  for(const group of step.groups){
   const wrong=group.options.find(option=>!group.correct.includes(option.id));
   if(wrong)assert(!activityCorrect(step,{...answers,[group.id]:[...group.correct,wrong.id]}));
  }
 }
 assert.deepEqual(UT3_INTERACTIVE_LESSONS['c-complement'][0].groups[0].correct,['a-only','neither']);
 assert.deepEqual(UT3_INTERACTIVE_LESSONS['c-complement'][1].groups[0].correct,['neither']);
});

test('every learning error includes teaching and examples even when the basic concepts passed the pretest',()=>{
 for(const node of Object.values(UT3_NODES)){
  const s=session();s.learningNode=node.id;s.feedback={nodeId:node.id,nextNode:node.requires[0]||node.id,prompt:node.questions[0].prompt,explanation:'',unknown:false};
  const html=renderToStaticMarkup(createElement(Study,{session:s,remote,onHome:noop,onMap:noop,onPass:noop}));
  for(const text of ['이 개념부터 다시 확인해요','설명 보기','ut3-help-example'])assert(html.includes(text),node.id+': '+text);
  assert(!html.includes('katex-error'),node.id);
 }
 const s=session();
 const html=renderToStaticMarkup(createElement(Study,{session:s,remote,onHome:noop,onMap:noop,onPass:noop}));
 assert(html.includes('조건부확률 설명 보기')&&html.includes('여사건과 드모르간 설명 보기'));
});
test('survey is available after completion and the math password routes to UT3 from every entry',()=>{
 assert.equal(renderToStaticMarkup(createElement(SurveyInvitation,{session:session('post'),onSurvey:noop})), '');
 const html=renderToStaticMarkup(createElement(SurveyInvitation,{session:session('done'),onSurvey:noop}));assert(html.includes('빽다방')&&html.includes('피드백 설문 작성하기'));
 for(const file of ['UTEntryPage.tsx','UT1PreviewPage.tsx','UT2Page.tsx']){
  const src=readFileSync(new URL('../src/routes/dev/'+file,import.meta.url),'utf8');assert(src.includes("password === 'math'")&&src.includes("'/ut3'"),file);
 }
});
