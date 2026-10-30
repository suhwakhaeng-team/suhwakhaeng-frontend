import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import katex from 'katex';
import { UT4_BANK, UT4_NODES, UT4_GOALS, ut4Assessment, parseProbabilityAnswer } from '../src/routes/dev/ut4Model.ts';
import { ut4Api, ut4Score, validUT4Reply, UT4_CACHE_KEY, UT4_PENDING_KEY } from '../src/routes/dev/ut4ServerApi.ts';
import { analyze, probability } from './helpers/probabilityModel.mjs';

test('UT4 has matching server bank, three concepts, five AN nodes and one goal without cycles or shortcuts', () => {
  const server=JSON.parse(readFileSync(new URL('../../suhwakhaeng-backend/src/main/resources/ut4/question-bank-v1.json',import.meta.url),'utf8'));
  assert.deepEqual(server,UT4_BANK);
  assert.equal(Object.values(UT4_NODES).filter(n=>n.kind==='concept').length,3);
  assert.equal(Object.values(UT4_NODES).filter(n=>n.kind==='AN').length,5);
  assert.equal(UT4_GOALS.length,1);
  const goal=UT4_GOALS[0],seen=new Set();
  function visit(id,chain=[]) {
    assert(!chain.includes(id),id);seen.add(id);
    for(const child of UT4_NODES[id].requires) {
      assert(goal.positions[child][0]<goal.positions[id][0],child);
      visit(child,[...chain,id]);
    }
  }
  visit(goal.rootId);assert.equal(seen.size,9);
  const ancestors=id=>new Set(UT4_NODES[id].requires.flatMap(child=>[child,...ancestors(child)]));
  for(const node of Object.values(UT4_NODES)) for(const child of node.requires) assert(!node.requires.filter(c=>c!==child).some(c=>ancestors(c).has(child)),`redundant ${child} -> ${node.id}`);
  assert.equal(new Set(Object.values(goal.positions).map(p=>p.join(':'))).size,9);
  assert(UT4_NODES['c-complement'].note.includes('드모르간'));
});

test('each assessment retains three foundations and one application, plus the two specified medium questions',()=>{
  const learning=Object.values(UT4_NODES).flatMap(n=>n.questions.map(q=>q.prompt));
  for(const form of ['A','B']) {
    const qs=ut4Assessment(form);assert.equal(qs.length,6);
    assert.equal(qs.filter(q=>q.group==='foundation').length,3);
    assert.equal(qs.filter(q=>q.group==='application').length,1);
    assert.equal(qs.filter(q=>q.group==='extension').length,2);
    for(const q of qs)assert(!learning.includes(q.prompt));
  }
  ut4Assessment('A').slice(0,4).forEach((q,i)=>{
    assert.notEqual(q.prompt,ut4Assessment('B')[i].prompt);
    assert.notEqual(q.answer,ut4Assessment('B')[i].answer);
  });
  assert.deepEqual(ut4Assessment('A').slice(4),ut4Assessment('B').slice(4));
  assert.deepEqual(ut4Assessment('A').slice(4).map(q=>q.answer),['1/4','7/10']);
});

test('every assessment, scaffold and retry admits a probability model and its unique answer matches the actual prompt',()=>{
  const questions=[...ut4Assessment('A'),...ut4Assessment('B'),...Object.values(UT4_NODES).flatMap(n=>n.questions)];
  assert.equal(questions.length,30);
  for(const q of questions) {
    const model=analyze(q.prompt);assert(model,q.prompt);
    const expected=parseProbabilityAnswer(q.answer);assert(expected!==null,q.prompt);
    if(q.prompt.includes('=kx')) {
      const matches=[...q.prompt.matchAll(/P\([^)]*\\mid[^)]*\)=\\frac(?:\{(\d+)\}|(\d))(?:\{(\d+)\}|(\d))/g)];
      assert.equal(matches.length,2);
      const sum=matches.reduce((s,m)=>s+Number(m[3]||m[4])/Number(m[1]||m[2]),0);
      assert(Math.abs(sum-expected)<1e-9,q.prompt);
    } else {
      const target=[...q.prompt.matchAll(/P\(([^)]+)\)/g)].at(-1)[1];
      for(const vertex of model.solutions) {
        // Interior samples keep all conditioning events strictly positive.
        const x=vertex.map((v,i)=>(v+model.average[i])/2);
        const answer=probability(target,x);assert(answer!==null,q.prompt);
        assert(Math.abs(answer-expected)<1e-9,`${q.prompt}: ${answer} != ${expected}`);
      }
    }
    for(const content of [q.prompt,q.explanation||''])for(const m of content.matchAll(/\$([^$]+)\$/g))katex.renderToString(m[1],{throwOnError:true});
  }
  assert.equal(ut4Assessment('A')[3].answer,'5/8');
  assert.equal(ut4Assessment('B')[3].answer,'3/5');
});

test('UT4 endpoint/token/cache are isolated and scores use 6/3/1/2 with unfinished results hidden',async()=>{
  const requests=[];const api=ut4Api('/api/v1',async(url,init)=>{requests.push({url,init});return new Response('{}');});
  const c={id:'ut4',token:'a'.repeat(64)};
  await api.enter('banana');await api.get(c);await api.survey(c,{name:'QA'});
  assert(requests.every(r=>r.url.startsWith('/api/v1/ut4/')));
  assert.equal(requests[1].init.headers['X-UT-Token'],c.token);
  assert(UT4_CACHE_KEY.includes(':ut4:')&&UT4_PENDING_KEY.includes(':ut4:'));
  const run={form:'A',total:6,responses:[]};assert.equal(ut4Score(run).accuracy,null);
  run.responses=Array.from({length:6},(_,i)=>({correct:i<3,seconds:2,answer:i<3?'1/2':null}));
  assert.equal(ut4Score(run).accuracy,50);assert.equal(ut4Score(run,'foundation').accuracy,100);assert.equal(ut4Score(run,'application').accuracy,0);
  assert.equal(validUT4Reply({revision:0,session:{bankVersion:2}}),false);
  const routes=readFileSync(new URL('../src/routes/index.tsx',import.meta.url),'utf8');assert(routes.includes("path: '/ut4'"));
  const entry=readFileSync(new URL('../src/routes/dev/UTEntryPage.tsx',import.meta.url),'utf8');assert(entry.includes("password === 'banana'")&&entry.includes('ut4Api'));
});
