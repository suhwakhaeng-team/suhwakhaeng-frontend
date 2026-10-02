import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as model from '../src/routes/dev/ut1Model.ts';
import * as recovery from '../src/routes/dev/ut1RecoveryModel.ts';
import { UT1ApiError, UT1Sync } from '../src/routes/dev/ut1ServerApi.ts';

function memoryStorage(values = {}) {
  const entries = new Map(Object.entries(values));
  return { entries, getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) };
}
const cache = () => {
  const session = { ...model.createSession('이전 참가자'), id: 'old-participant' };
  return { credential: { id: session.id, token: 'a'.repeat(64), revision: 1 }, session, pending: false };
};

test('삭제 판정은 서버 410만 사용하고 네트워크·권한·충돌 오류와 구별한다', () => {
  assert.equal(recovery.isDeletedParticipant(new UT1ApiError('삭제됨', 410)), true);
  for (const status of [0, 400, 401, 403, 404, 409, 500])
    assert.equal(recovery.isDeletedParticipant(new UT1ApiError('다른 오류', status)), false);
  assert.equal(recovery.isDeletedParticipant(new Error('관리자가 삭제한 참가자 기록입니다.')), false);
});
test('이전 연결과 생성 재시도 키는 백업한 뒤 분리하고 계정·로컬 시안은 보존한다', () => {
  const raw = JSON.stringify(cache()), creating = JSON.stringify({ nickname: '이전 참가자', token: 'a'.repeat(64) });
  const storage = memoryStorage({ [recovery.UT_SERVER_CACHE_KEY]: raw, [recovery.UT_CREATE_KEY]: creating,
    'account-token': 'keep', [model.UT_STORAGE_KEY]: 'local-preview' });
  recovery.disconnectDeletedParticipant(storage, 42);
  assert.equal(storage.getItem(recovery.UT_SERVER_CACHE_KEY), null);
  assert.equal(storage.getItem(recovery.UT_CREATE_KEY), null);
  assert.deepEqual(JSON.parse(storage.getItem(`${recovery.UT_SERVER_CACHE_KEY}:disconnected:42`)), { disconnectedAt: 42, cache: raw, creating });
  assert.equal(storage.getItem('account-token'), 'keep'); assert.equal(storage.getItem(model.UT_STORAGE_KEY), 'local-preview');
});
test('백업 저장에 실패하면 기존 연결과 미저장 답안을 제거하지 않는다', () => {
  const raw = JSON.stringify({ ...cache(), pending: true });
  const storage = memoryStorage({ [recovery.UT_SERVER_CACHE_KEY]: raw });
  storage.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.throws(() => recovery.disconnectDeletedParticipant(storage), /QuotaExceededError/);
  assert.equal(storage.getItem(recovery.UT_SERVER_CACHE_KEY), raw);
});

// Execute the real hook with a deterministic hook scheduler and mocked transport/storage.
// No browser, React state-machine copy, production API, or additional dependency is involved.
function hookHarness(t, api, storage) {
  const slots = [], effects = [], cleanups = new Map(); let cursor = 0;
  const same = (a, b) => a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial }; },
    useCallback(fn, deps) {
      const index = cursor++;
      if (!same(slots[index]?.deps, deps)) slots[index] = { deps, fn };
      return slots[index].fn;
    },
    useEffect(fn, deps) {
      const index = cursor++;
      if (!same(slots[index], deps)) {
        slots[index] = deps;
        effects.push(() => { cleanups.get(index)?.(); cleanups.set(index, fn()); });
      }
    },
  };
  const descriptors = ['localStorage', 'window'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    setInterval: () => 1, clearInterval() {}, addEventListener() {}, removeEventListener() {}, location: { reload() {} },
  } });
  t.after(() => {
    for (const cleanup of cleanups.values()) cleanup?.();
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  });
  const source = readFileSync(new URL('../src/routes/dev/useUT1Server.ts', import.meta.url), 'utf8')
    .replaceAll('import.meta.env', '({PROD:false})');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  const dependencies = { react, './ut1Model': model, './ut1RecoveryModel': recovery,
    './ut1ServerApi': { ut1Api: () => api, UT1Sync } };
  new Function('require', 'module', 'exports', code)(name => {
    assert.ok(name in dependencies, name); return dependencies[name];
  }, module, module.exports);
  function render() {
    cursor = 0; const result = module.exports.default(true);
    while (effects.length) effects.shift()();
    return result;
  }
  return { render, async settle() { await new Promise(resolve => setImmediate(resolve)); return render(); } };
}

test('410 복구 실패 → 명시적 새로 시작 → 암호 검사 → 같은 닉네임도 새 키로 신규 참가자 생성', async t => {
  const original = cache(); const raw = JSON.stringify(original); const calls = [];
  const storage = memoryStorage({ [recovery.UT_SERVER_CACHE_KEY]: raw,
    [recovery.UT_CREATE_KEY]: JSON.stringify({ nickname: '이전 참가자', token: original.credential.token }) });
  const api = {
    get: async () => { throw new UT1ApiError('삭제됨', 410); },
    enter: async password => { assert.equal(password, '1234'); calls.push('enter'); },
    create: async (password, nickname, token) => {
      assert.equal(password, '1234'); assert.notEqual(token, original.credential.token); assert.match(token, /^[a-f0-9]{64}$/);
      calls.push('create'); return { session: { ...model.createSession(nickname), id: 'new-participant' }, revision: 1 };
    },
    save: async () => { throw new Error('No pending answer should be flushed for the deleted participant'); },
  };
  const harness = hookHarness(t, api, storage); harness.render(); let hook = await harness.settle();
  assert.equal(hook.deleted, true); assert.equal(hook.blocked, true);
  assert.equal(storage.getItem(recovery.UT_SERVER_CACHE_KEY), raw); // Never auto-clear on 410.
  assert.equal(hook.startNewParticipant(), true); hook = harness.render();
  assert.equal(hook.blocked, false); assert.equal(hook.deleted, false); assert.equal(hook.error, '');
  assert.deepEqual(hook.store, model.emptyStore());
  await hook.enter('1234'); await hook.createParticipant('이전 참가자', '1234'); hook = harness.render();
  assert.deepEqual(calls, ['enter', 'create']); assert.equal(hook.store.activeId, 'new-participant');
  assert.equal(JSON.parse(storage.getItem(recovery.UT_SERVER_CACHE_KEY)).credential.id, 'new-participant');
  assert.equal(storage.getItem(recovery.UT_CREATE_KEY), null);
});
test('네트워크 장애로 불러오지 못하면 신규 연결 초기화를 허용하지 않는다', async t => {
  const raw = JSON.stringify(cache()); const storage = memoryStorage({ [recovery.UT_SERVER_CACHE_KEY]: raw });
  const harness = hookHarness(t, { get: async () => { throw new UT1ApiError('오프라인'); } }, storage);
  harness.render(); const hook = await harness.settle();
  assert.equal(hook.blocked, true); assert.equal(hook.deleted, false); assert.equal(hook.startNewParticipant(), false);
  assert.equal(storage.getItem(recovery.UT_SERVER_CACHE_KEY), raw);
});
test('학습 중 저장 410도 즉시 중단하고 삭제된 참가자에게 재전송하지 않는다', async t => {
  const original = cache(); const storage = memoryStorage({ [recovery.UT_SERVER_CACHE_KEY]: JSON.stringify(original) }); let saves = 0;
  const harness = hookHarness(t, {
    get: async () => ({ session: original.session, revision: 1 }),
    save: async () => { saves++; throw new UT1ApiError('삭제됨', 410); },
  }, storage);
  harness.render(); let hook = await harness.settle();
  hook.setStore(previous => ({ ...previous, sessions: previous.sessions.map(s => ({ ...s, timer: { key: 'pre:product-1', elapsed: 3, startedAt: null } })) }));
  harness.render(); hook = await harness.settle();
  assert.equal(hook.deleted, true); assert.equal(hook.blocked, true); assert.equal(saves, 1);
  harness.render(); await harness.settle(); assert.equal(saves, 1);
  assert.equal(JSON.parse(storage.getItem(recovery.UT_SERVER_CACHE_KEY)).pending, true);
  assert.equal(hook.startNewParticipant(), true); assert.equal(harness.render().blocked, false);
});
