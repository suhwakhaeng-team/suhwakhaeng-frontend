import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ut1Api, UT1ApiError, UT1Sync } from '../src/routes/dev/ut1ServerApi.ts';
import { createSession, testForm, UT_NODES } from '../src/routes/dev/ut1Model.ts';

test('백엔드 검사·변형 문제은행은 프론트와 정확히 같다', () => {
  const bank = JSON.parse(readFileSync(new URL('../../suhwakhaeng-backend/src/main/resources/ut1/question-bank-v1.json', import.meta.url), 'utf8'));
  for (const form of ['A', 'B']) assert.deepEqual(bank.forms[form], testForm(form));
  assert.deepEqual(Object.keys(bank.nodes), Object.keys(UT_NODES));
  for (const [id, node] of Object.entries(UT_NODES)) for (let v = 0; v < 100; v++) {
    const index = id.startsWith('bn-') ? (v === 0 ? 0 : 1 + (v - 1) % 7) : v % 6;
    assert.deepEqual(bank.nodes[id].questions[index], node.make(v));
  }
});
test('UT API는 기존 계정 JWT 대신 참가자 키를 쓰고 서버 오류를 숨기지 않는다', async () => {
  const calls = [];
  const api = ut1Api('/api/v1/', async (url, options) => { calls.push({ url, options }); return new Response(JSON.stringify({ session: {}, revision: 3 }), { status: 200 }); });
  await api.save({ id: 'test', token: 'secret', revision: 2 }, createSession('QA'));
  assert.equal(calls[0].url, '/api/v1/ut1/sessions/test');
  assert.equal(calls[0].options.headers['X-UT-Token'], 'secret');
  assert.equal(calls[0].options.headers.Authorization, undefined);
  assert.equal(JSON.parse(calls[0].options.body).revision, 2);
  await assert.rejects(ut1Api('/api/v1', async () => new Response('{"error":"충돌"}', { status: 409 })).enter('1234'), error => error.status === 409 && error.message === '충돌');
});
const cache = () => ({ credential: { id: 'ut-test', token: 'a'.repeat(64), revision: 1 }, session: { ...createSession('QA'), id: 'ut-test' }, pending: true });
test('연속 저장은 직렬화하고 최신 변경을 빠뜨리지 않는다', async () => {
  const c = cache(), calls = [], updates = []; let release;
  const first = new Promise(resolve => { release = resolve; });
  const sync = new UT1Sync({ save: async (credential, session) => { calls.push({ revision: credential.revision, session }); if (calls.length === 1) await first; return { session, revision: credential.revision + 1 }; } }, c, (...args) => updates.push(args));
  sync.enqueue(c.session); sync.enqueue({ ...c.session, timer: { key: 'pre:product-1', elapsed: 4, startedAt: null } });
  assert.equal(calls.length, 1); release(); await sync.flush();
  assert.deepEqual(calls.map(c => c.revision), [1, 2]); assert.equal(calls[1].session.timer.elapsed, 4);
  assert.equal(sync.cache.pending, false); assert.equal(sync.cache.credential.revision, 3); assert.equal(updates.at(-1)[2], false);
});
test('망 장애 때 답안을 보존하고 수동 재시도로 저장한다', async () => {
  const c = cache(); let failed = true; const failures = [];
  const sync = new UT1Sync({ save: async (_, session) => { if (failed) throw new UT1ApiError('오프라인'); return { session, revision: 2 }; }, get: async () => { throw new Error('offline'); } }, c, (_, error) => failures.push(error));
  sync.enqueue(c.session); await sync.flush(); assert.equal(sync.cache.pending, true); assert.equal(failures.at(-1).message, '오프라인');
  failed = false; await sync.flush(); assert.equal(sync.cache.pending, false);
});
test('응답 유실은 자기 저장본이 정확히 일치할 때만 복구한다', async () => {
  const c = cache();
  const sync = new UT1Sync({ save: async () => { throw new UT1ApiError('응답 유실'); }, get: async () => ({ session: c.session, revision: 2 }) }, c, () => {});
  sync.enqueue(c.session); await sync.flush(); assert.equal(sync.cache.pending, false); assert.equal(sync.cache.credential.revision, 2);
});
test('다른 탭의 다른 변경은 덮어쓰지 않고 충돌로 남긴다', async () => {
  const c = cache(); let failure;
  const sync = new UT1Sync({ save: async () => { throw new UT1ApiError('다른 탭', 409); }, get: async () => ({ session: { ...c.session, participant: '다른 내용' }, revision: 2 }) }, c, (_, error) => { failure = error; });
  sync.enqueue(c.session); await sync.flush(); assert.equal(sync.cache.pending, true); assert.equal(failure.status, 409); assert.equal(sync.cache.credential.revision, 1);
});
test('저장된 동일 스냅샷은 반복 전송하지 않는다', async () => {
  const c = { ...cache(), pending: false }; let calls = 0;
  const sync = new UT1Sync({ save: async () => { calls++; } }, c, () => {});
  sync.enqueue(c.session); await sync.flush(); assert.equal(calls, 0);
});
