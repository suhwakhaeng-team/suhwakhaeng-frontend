import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import katex from 'katex';
import { UT3_BANK, UT3_NODES, UT3_GOALS, ut3Assessment, parseProbabilityAnswer } from '../src/routes/dev/ut3Model.ts';
import { ut3Api, ut3Score, validUT3Reply, UT3_CACHE_KEY, UT3_PENDING_KEY } from '../src/routes/dev/ut3ServerApi.ts';
import { analyze, probability } from './helpers/probabilityModel.mjs';

test('UT3 has matching server bank, three concepts, five AN nodes and one goal without cycles or shortcuts', () => {
  const server=JSON.parse(readFileSync(new URL('../../suhwakhaeng-backend/src/main/resources/ut3/question-bank-v1.json',import.meta.url),'utf8'));
  assert.deepEqual(server,UT3_BANK);
  assert.equal(Object.values(UT3_NODES).filter(n=>n.kind==='concept').length,3);
  assert.equal(Object.values(UT3_NODES).filter(n=>n.kind==='AN').length,5);
  assert.equal(UT3_GOALS.length,1);
  const goal=UT3_GOALS[0],seen=new Set();
  function visit(id,chain=[]) {
    assert(!chain.includes(id),id);seen.add(id);
    for(const child of UT3_NODES[id].requires) {
      assert(goal.positions[child][0]<goal.positions[id][0],child);
      visit(child,[...chain,id]);
    }
  }
  visit(goal.rootId);assert.equal(seen.size,9);
  const ancestors=id=>new Set(UT3_NODES[id].requires.flatMap(child=>[child,...ancestors(child)]));
  for(const node of Object.values(UT3_NODES)) for(const child of node.requires) assert(!node.requires.filter(c=>c!==child).some(c=>ancestors(c).has(child)),`redundant ${child} -> ${node.id}`);
  assert.equal(new Set(Object.values(goal.positions).map(p=>p.join(':'))).size,9);
  assert(UT3_NODES['c-complement'].note.includes('드모르간'));
});

test('both assessments have exactly 3 independent foundations and 1 application with changed numbers and answers',()=>{
  const learning=Object.values(UT3_NODES).flatMap(n=>n.questions.map(q=>q.prompt));
  for(const form of ['A','B']) {
    const qs=ut3Assessment(form);assert.equal(qs.length,4);
    assert.equal(qs.filter(q=>q.group==='foundation').length,3);
    assert.equal(qs.filter(q=>q.group==='application').length,1);
    for(const q of qs)assert(!learning.includes(q.prompt));
  }
  ut3Assessment('A').forEach((q,i)=>{
    assert.notEqual(q.prompt,ut3Assessment('B')[i].prompt);
    assert.notEqual(q.answer,ut3Assessment('B')[i].answer);
  });
});

test('every assessment, scaffold and retry admits a probability model and its unique answer matches the actual prompt',()=>{
  const questions=[...ut3Assessment('A'),...ut3Assessment('B'),...Object.values(UT3_NODES).flatMap(n=>n.questions)];
  assert.equal(questions.length,26);
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
  assert.equal(ut3Assessment('A')[3].answer,'5/8');
  assert.equal(ut3Assessment('B')[3].answer,'3/5');
});

test('UT3 endpoint/token/cache are isolated and scores use 4/3/1 with unfinished results hidden',async()=>{
  const requests=[];const api=ut3Api('/api/v1',async(url,init)=>{requests.push({url,init});return new Response('{}');});
  const c={id:'ut3',token:'a'.repeat(64)};
  await api.enter('math');await api.get(c);await api.survey(c,{name:'QA'});
  assert(requests.every(r=>r.url.startsWith('/api/v1/ut3/')));
  assert.equal(requests[1].init.headers['X-UT-Token'],c.token);
  assert(UT3_CACHE_KEY.includes(':ut3:')&&UT3_PENDING_KEY.includes(':ut3:'));
  const run={form:'A',total:4,responses:[]};assert.equal(ut3Score(run).accuracy,null);
  run.responses=Array.from({length:4},(_,i)=>({correct:i<3,seconds:2,answer:i<3?'1/2':null}));
  assert.equal(ut3Score(run).accuracy,75);assert.equal(ut3Score(run,'foundation').accuracy,100);assert.equal(ut3Score(run,'application').accuracy,0);
  assert.equal(validUT3Reply({revision:0,session:{bankVersion:2}}),false);
  const routes=readFileSync(new URL('../src/routes/index.tsx',import.meta.url),'utf8');assert(routes.includes("path: '/ut3'"));
  const entry=readFileSync(new URL('../src/routes/dev/UTEntryPage.tsx',import.meta.url),'utf8');assert(entry.includes("password === 'math'")&&entry.includes('ut3Api'));
});
