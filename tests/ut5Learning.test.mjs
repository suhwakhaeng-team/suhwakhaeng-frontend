import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import katex from 'katex';
import {UT5_INTERACTIVE_LESSONS,activityCorrect} from '../src/routes/dev/ut5InteractiveLessons.ts';
const bank=JSON.parse(readFileSync(new URL('./fixtures/ut5/question-bank-v4.json',import.meta.url),'utf8'));
test('each concept has three gated activities, wrong and empty selections never pass',()=>{
 for(const [id,steps] of Object.entries(UT5_INTERACTIVE_LESSONS)){
  assert.equal(steps.length,3,id);
  for(const a of steps){assert.equal(activityCorrect(a,{}),false);const answers=Object.fromEntries(a.groups.map(g=>[g.id,g.correct]));assert(activityCorrect(a,answers));for(const g of a.groups){const wrong=g.options.find(o=>!g.correct.includes(o.id));if(wrong) assert.equal(activityCorrect(a,{...answers,[g.id]:[wrong.id]}),false);}}
 }
});
test('five learning maps each connect concepts through two checks to a goal, with no cycles',()=>{
 assert.equal(Object.keys(bank.nodes).length,21);
 for(let i=1;i<=5;i++) {const seen=new Set();function visit(id){assert(!seen.has(id));seen.add(id);for(const c of bank.nodes[id].requires)visit(c);}visit(`goal-${i}`);assert.equal(seen.size,[1,3,5].includes(i)?5:4);assert.equal(bank.nodes[`goal-${i}`].kind,'BN');}
});
test('all new lesson and graph formulas render',()=>{
 function walk(v){if(typeof v==='string'){for(const m of v.matchAll(/\$([^$]+)\$/g))katex.renderToString(m[1],{throwOnError:true});}else if(v&&typeof v==='object')Object.values(v).forEach(walk);}
 walk(bank);walk(UT5_INTERACTIVE_LESSONS);
});

test('wrong-answer hints never reuse worked solutions or contain calculation results',()=>{
 for(const steps of Object.values(UT5_INTERACTIVE_LESSONS))for(const a of steps){
  assert.notEqual(a.hint,a.explanation);assert(a.hint.length<180);
  assert(!/[$=]/.test(a.hint),a.hint);
 }
});
