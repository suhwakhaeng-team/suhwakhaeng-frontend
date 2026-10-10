import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import katex from 'katex';
import { UT2_BANK, ut2Assessment } from '../src/routes/dev/ut2Assessment.ts';
import { ut2Api, UT2ApiError, ut2Score, validUT2Reply, UT2_CACHE_KEY, UT2_CREATE_KEY, UT2_PENDING_KEY } from '../src/routes/dev/ut2ServerApi.ts';
import { CONDITIONAL_NODES, parseProbabilityAnswer } from '../src/routes/dev/conditionalProblemBreakdown.ts';

test('UT2 backend bank exactly matches the authored model; both forms have 10 concept and 3 application questions', () => {
  const server = JSON.parse(readFileSync(new URL('../../suhwakhaeng-backend/src/main/resources/ut2/question-bank-v1.json', import.meta.url), 'utf8'));
  assert.deepEqual(server, UT2_BANK);
  for (const form of ['A', 'B']) {
    const questions = ut2Assessment(form);
    assert.equal(questions.length, 13);
    assert.equal(new Set(questions.map(q => q.id)).size, 13);
    assert.equal(questions.filter(q => q.group === 'foundation').length, 10);
    assert.equal(questions.filter(q => q.group === 'application').length, 3);
    for (const id of Object.keys(CONDITIONAL_NODES).filter(id => id.startsWith('c-'))) assert.equal(questions.filter(q => q.nodeId === id).length, 2);
    for (const q of questions) {
      assert(parseProbabilityAnswer(q.answer) !== null);
      assert(parseProbabilityAnswer(q.answer) >= 0 && parseProbabilityAnswer(q.answer) <= 1);
      assert(!Object.values(CONDITIONAL_NODES).flatMap(n => n.questions.map(q => q.prompt)).includes(q.prompt), q.id);
      for (const match of q.prompt.matchAll(/\$([^$]+)\$/g)) katex.renderToString(match[1], { throwOnError: true });
    }
  }
  for (let i = 0; i < 13; i++) assert.notEqual(ut2Assessment('A')[i].prompt, ut2Assessment('B')[i].prompt);
});
test('all assessment answers have independent numerical checks, including conditional direction and complements', () => {
  const expected = {
    A: [3/10, (7+6-2)/16, 1-3/8, 7/10-1/5, 3/5+2/5-4/5, 11/12-7/12, 4/8, (1/4)/(1-3/8), (3/5)*(5/12), (3/20)/(3/10), (4/5-2/5)/(1-2/5), (1+4)/14, 1-(3/4)*(1/5)/(1-2/5)],
    B: [4/12, (9+8-3)/20, 1-7/12, 5/6-1/3, 2/3+1/2-5/6, 8/9-5/9, 5/10, (3/10)/(1-1/4), (5/8)*(2/5), (3/14)/(3/7), (7/12-1/3)/(1-1/3), (1+5)/12, 1-(2/3)*(3/10)/(1-1/5)],
  };
  for (const form of ['A','B']) ut2Assessment(form).forEach((q,i) => assert(Math.abs(parseProbabilityAnswer(q.answer)-expected[form][i]) < 1e-10, q.id));
});
test('UT2 API uses campaign-specific endpoints and participant tokens, no account JWT or client score', async () => {
  const requests = [];
  const api = ut2Api('/api/v1/', async (url, init) => { requests.push({ url, init }); return new Response(JSON.stringify({ ok: true }), { status: 200 }); });
  await api.enter('abcd'); await api.create('abcd', 'QA', 'a'.repeat(64));
  await api.get({ id:'participant', token:'a'.repeat(64) });
  const action = { type:'answer', actionId:'uuid', revision:1, questionId:'events-1', answer:'1/3', seconds:5 };
  await api.act({ id:'participant', token:'a'.repeat(64) }, action);
  assert(requests.every(r => r.url.startsWith('/api/v1/ut2/')));
  assert.equal(requests[2].init.headers['X-UT-Token'], 'a'.repeat(64));
  assert(requests.every(r => !('Authorization' in r.init.headers)));
  assert.deepEqual(JSON.parse(requests[3].init.body), action);
  assert([UT2_CACHE_KEY, UT2_CREATE_KEY, UT2_PENDING_KEY].every(key => key.includes(':ut2:') && !key.includes(':ut1:')));
});
test('server connection errors and concurrency conflicts remain visible', async () => {
  const offline = ut2Api('/api/v1', async () => { throw new Error('offline'); });
  await assert.rejects(offline.enter('abcd'), e => e instanceof UT2ApiError && e.status === 0);
  const conflict = ut2Api('/api/v1', async () => new Response(JSON.stringify({ error:'다른 탭' }), { status:409 }));
  await assert.rejects(conflict.get({ id:'id',token:'token' }), e => e.status === 409 && e.message === '다른 탭');
});
test('unfinished and blinded results are not reported as zero; foundation and application remain separate', () => {
  const run = { form:'A',total:13,responses:[] };
  assert.equal(ut2Score(run).accuracy, null);
  run.responses = Array.from({ length:13 }, (_,i) => ({ answer:i<10 ? '1/2' : null, correct:i<10, seconds:2 }));
  assert.equal(ut2Score(run,'foundation').accuracy, 100);
  assert.equal(ut2Score(run,'application').accuracy, 0);
  assert.equal(ut2Score(run).average, 2); assert.equal(ut2Score(run).unknown, 3);
  run.responses.forEach(r => delete r.correct);
  assert.equal(ut2Score(run).accuracy, null);
  assert.equal(validUT2Reply({ session:{bankVersion:2}, revision:0 }), false);
});
test('real UT entry and UT2 route are production routes; login reaches shared password gate', () => {
  const routes = readFileSync(new URL('../src/routes/index.tsx',import.meta.url),'utf8');
  assert(routes.indexOf("path: '/ut2'") < routes.indexOf('import.meta.env.DEV ?'));
  assert(routes.includes("path: '/ut'"));
  assert(readFileSync(new URL('../src/routes/onboarding/LoginPage.tsx',import.meta.url),'utf8').includes("navigate('/ut')"));
  assert(readFileSync(new URL('../src/routes/dev/UTEntryPage.tsx',import.meta.url),'utf8').includes("password === 'abcd'"));
});
