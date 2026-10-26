import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as apiModule from '../src/routes/dev/ut3ServerApi.ts';
import * as switchModule from '../src/routes/dev/ut3ParticipantSwitch.ts';

const { UT3_CACHE_KEY, UT3_CREATE_KEY, UT3_PENDING_KEY } = apiModule;
function storage(values = {}) {
  const entries = new Map(Object.entries(values));
  return { entries, getItem: k => entries.get(k) ?? null, setItem: (k,v) => entries.set(k,v), removeItem: k => entries.delete(k) };
}
function reply(stage = 'pre', id = 'old') {
  return { revision: 1, session: { id, participant:'같은 닉네임', bankVersion:1, stage,
    pre:{form:'A',total:4,responses:[]},post:{form:'B',total:4,responses:[]},
    weak:[],history:[],completed:[],results:{},attempts:{} } };
}
const credential = { id:'old', token:'a'.repeat(64) };
function harness(t, api, store) {
  const slots = [], effects = []; let cursor = 0;
  const react = {
    useState(initial) { const i=cursor++; if (!(i in slots)) slots[i]=initial; return [slots[i],v => {slots[i]=typeof v==='function'?v(slots[i]):v;}]; },
    useRef(initial) { const i=cursor++; return slots[i] ??= {current:initial}; },
    useEffect(fn) { const i=cursor++; if (!(i in slots)) {slots[i]=true; effects.push(fn);} },
  };
  const descriptor = Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:store});
  t.after(() => { if (descriptor) Object.defineProperty(globalThis,'localStorage',descriptor); else delete globalThis.localStorage; });
  const source=readFileSync(new URL('../src/routes/dev/useUT3Server.ts',import.meta.url),'utf8').replaceAll('import.meta.env','({PROD:false})');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  const module={exports:{}};
  const deps={react,'./ut3ServerApi':{...apiModule,ut3Api:()=>api},'./ut3ParticipantSwitch':switchModule};
  new Function('require','module','exports',code)(name=>{assert(name in deps,name);return deps[name];},module,module.exports);
  const render=()=>{cursor=0;const hook=module.exports.default();while(effects.length) effects.shift()();return hook;};
  return {render,async settle(){await new Promise(resolve=>setImmediate(resolve));return render();}};
}
test('switch backs up only UT3 connection and creation key, leaving UT1/account/timer records untouched',()=>{
  const store=storage({[UT3_CACHE_KEY]:'old cache',[UT3_CREATE_KEY]:'old create',
    'suhwakhaeng:ut1:server:v1':'UT1','suhwakhaeng:ut2:server:v1':'UT2','account-token':'account','suhwakhaeng:ut3:time:old:pre:q1':'7'});
  switchModule.disconnectUT3Participant(store,'unique');
  assert.deepEqual(JSON.parse(store.getItem(`${UT3_CACHE_KEY}:disconnected:unique`)),{cache:'old cache',creating:'old create'});
  assert.equal(store.getItem(UT3_CACHE_KEY),'old cache');assert.equal(store.getItem(UT3_CREATE_KEY),null);
  assert.equal(store.getItem('suhwakhaeng:ut1:server:v1'),'UT1');assert.equal(store.getItem('suhwakhaeng:ut2:server:v1'),'UT2');assert.equal(store.getItem('account-token'),'account');
  assert.equal(store.getItem('suhwakhaeng:ut3:time:old:pre:q1'),'7');
});
test('pending answer and backup failure never detach the old connection',()=>{
  const store=storage({[UT3_CACHE_KEY]:'old',[UT3_CREATE_KEY]:'create',[UT3_PENDING_KEY]:'pending'});
  assert.throws(()=>switchModule.disconnectUT3Participant(store,'id'),/미저장/);
  assert.equal(store.getItem(UT3_PENDING_KEY),'pending');assert.equal(store.getItem(UT3_CACHE_KEY),'old');
  store.removeItem(UT3_PENDING_KEY);store.setItem=()=>{throw new Error('QuotaExceededError');};
  assert.throws(()=>switchModule.disconnectUT3Participant(store,'id'),/QuotaExceededError/);
  assert.equal(store.getItem(UT3_CACHE_KEY),'old');assert.equal(store.getItem(UT3_CREATE_KEY),'create');
});
for (const stage of ['pre','learning','post','done']) test(`real hook switches during ${stage} and same nickname creates a new participant key`,async t=>{
  const original=reply(stage);const raw=JSON.stringify({credential,reply:original});
  const store=storage({[UT3_CACHE_KEY]:raw,[UT3_CREATE_KEY]:JSON.stringify({nickname:'같은 닉네임',token:credential.token})});
  const api={get:async()=>original,enter:async password=>assert.equal(password,'math'),
    create:async(password,nickname,token)=>{assert.equal(password,'math');assert.equal(nickname,'같은 닉네임');assert.notEqual(token,credential.token);return reply('pre','new');}};
  const h=harness(t,api,store);h.render();let hook=await h.settle();assert.equal(hook.startNew(),true);
  hook=h.render();assert.equal(hook.reply.session.id,'old');assert.equal(hook.hasPending,false);
  const backups=[...store.entries.keys()].filter(k=>k.startsWith(`${UT3_CACHE_KEY}:disconnected:`));assert.equal(backups.length,1);
  assert.equal(JSON.parse(store.getItem(backups[0])).cache,raw);
  await hook.enter('math');await hook.create('같은 닉네임','math');hook=h.render();assert.equal(hook.reply.session.id,'new');
  assert.equal(store.getItem(UT3_CREATE_KEY),null);
});
test('offline restore cannot silently discard records or allow participant switching',async t=>{
  const raw=JSON.stringify({credential,reply:reply()});const store=storage({[UT3_CACHE_KEY]:raw});
  const h=harness(t,{get:async()=>{throw new Error('offline');}},store);h.render();const hook=await h.settle();
  assert.equal(hook.blocked,true);assert.equal(hook.startNew(),false);assert.equal(store.getItem(UT3_CACHE_KEY),raw);
});
test('failed new participant creation preserves the previous participant for continue and reload',async t=>{
  const original=reply('learning');const store=storage({[UT3_CACHE_KEY]:JSON.stringify({credential,reply:original})});
  const h=harness(t,{get:async()=>original,create:async()=>{throw new Error('서버 오류');}},store);h.render();let hook=await h.settle();
  assert.equal(hook.startNew(),true);await hook.create('새 참가자','math');hook=h.render();
  assert.equal(hook.reply.session.id,'old');assert.equal(JSON.parse(store.getItem(UT3_CACHE_KEY)).credential.id,'old');
  assert.match(hook.error,/서버 오류/);assert(store.getItem(UT3_CREATE_KEY));
});
test('a failed write must be retried before changing participant',async t=>{
  const original=reply();const store=storage({[UT3_CACHE_KEY]:JSON.stringify({credential,reply:original})});
  const h=harness(t,{get:async()=>original,act:async()=>{throw new Error('offline');}},store);h.render();let hook=await h.settle();
  await hook.act({type:'answer',questionId:'q1',answer:'1/2',seconds:3});hook=h.render();
  const pending=store.getItem(UT3_PENDING_KEY);assert(pending);assert.equal(hook.startNew(),false);assert.equal(store.getItem(UT3_PENDING_KEY),pending);
  assert.equal(hook.reply.session.id,'old');
});
test('backup storage failure leaves real hook on the current participant with an actionable error',async t=>{
  const original=reply();const store=storage({[UT3_CACHE_KEY]:JSON.stringify({credential,reply:original})});
  const h=harness(t,{get:async()=>original},store);h.render();let hook=await h.settle();
  store.setItem=()=>{throw new Error('저장 공간을 확인해 주세요.');};assert.equal(hook.startNew(),false);hook=h.render();
  assert.equal(hook.reply.session.id,'old');assert.match(hook.error,/저장 공간/);assert(store.getItem(UT3_CACHE_KEY));
});
