import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import katex from 'katex';
import { UT5Timer } from '../src/routes/dev/ut5Timer.ts';

function fixture() {
  const saved = new Map(); let at = 10000;
  const storage = {getItem: k=>saved.get(k) ?? null,setItem: (k,v)=>saved.set(k,v)};
  return {storage, now:()=>at, advance:ms=>{at+=ms;}};
}
test('active seconds exclude breaks, survive refresh, and freeze on submission',()=>{
  const f=fixture(); let t=new UT5Timer(f.storage,'a',f.now);
  t.resume(); f.advance(2400); t.tick(); t.pause(); f.advance(30000);
  t=new UT5Timer(f.storage,'a',f.now); t.resume(); f.advance(1600);
  const result=t.finish();
  assert.equal(result.seconds,4); assert.equal(result.elapsedSeconds,34); assert.equal(result.interruptions,1);
  f.advance(5000); t.resume(); t.tick(); assert.equal(t.metrics().seconds,4);
});
test('abrupt shutdown records an interruption without inventing active time while closed',()=>{
  const f=fixture(); let t=new UT5Timer(f.storage,'a',f.now); t.resume(); f.advance(1000); t.tick(); f.advance(60000);
  t=new UT5Timer(f.storage,'a',f.now); assert.equal(t.metrics().seconds,1); assert.equal(t.metrics().interruptions,1);
});
test('storage failure stops timing rather than silently submitting zero',()=>{
  assert.throws(()=>new UT5Timer({getItem:()=>null,setItem:()=>{throw Error('full');}},'a'));
});
test('five source items, choices, answers, concepts and all formulas are valid',()=>{
  const bank=JSON.parse(readFileSync(new URL('./fixtures/ut5/question-bank-v1.json',import.meta.url),'utf8'));
  assert.deepEqual(bank.forms.A,bank.forms.B);
  assert.deepEqual(bank.forms.A.map(q=>q.answer),['5','2','4','5','2']);
  assert.equal(Object.keys(bank.nodes).length,5);
  for(const q of bank.forms.A){assert.equal(q.choices.length,5);assert(q.nodes.length>1);assert(bank.nodes[q.nodeId]);}
  function walk(v){if(typeof v==='string') for(const match of v.matchAll(/\$([^$]+)\$/g)) katex.renderToString(match[1],{throwOnError:true}); else if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object') Object.values(v).forEach(walk);}
  walk(bank);
});
