import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const previous=JSON.parse(readFileSync(new URL('./fixtures/ut5/question-bank-v4.json',import.meta.url),'utf8'));
const bank=JSON.parse(readFileSync(new URL('./fixtures/ut5/question-bank-v5.json',import.meta.url),'utf8'));
const words=s=>s.match(/[가-힣A-Za-z]+/g);
const value=s=>{const fraction=s.match(/dfrac\{(\d+)\}\{(\d+)\}/);return fraction?Number(fraction[1])/Number(fraction[2]):Number(s);};
test('only post-test numbers change; pretest and all learning content stay intact',()=>{
 assert.deepEqual(bank.forms.A,previous.forms.A);assert.deepEqual(bank.nodes,previous.nodes);
 for(let i=0;i<5;i++){const a=bank.forms.A[i],b=bank.forms.B[i];assert.notEqual(a.prompt,b.prompt);assert.deepEqual(words(a.prompt),words(b.prompt));assert.deepEqual(a.nodes,b.nodes);assert.equal(b.choices.length,5);assert.notEqual(a.id,b.id);assert.equal(new Set(b.choices.map(value)).size,5);}
});
test('all five post-test answer keys match independent calculations',()=>{
 const sigma=3.92*Math.sqrt(25)/1.96;
 const answers=[1-(4/8)*(3/7),6/12,1-(1/2)**4-4*(1/2)**4,0.5+0.3413,Math.ceil((2*2.58*sigma/8)**2)];
 bank.forms.B.forEach((q,i)=>assert(Math.abs(value(q.choices[Number(q.answer)-1])-answers[i])<1e-8));
 // A sample-mean SD=6, B SD=1.5*6/sqrt(9)=3; B threshold is one SD below its mean.
 assert.equal((227-230)/(1.5*6/Math.sqrt(9)),-1);
});
