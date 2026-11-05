import test from 'node:test';
import assert from 'node:assert/strict';
import {ut5Score} from '../src/routes/dev/ut5ServerApi.ts';
const response=(answer,seconds,correct=false)=>({answer,seconds,correct,answeredAt:0});
const run=responses=>({form:'A',total:5,responses});
test('unknown responses do not contribute time or denominator to average; wrong answers still do',()=>{
 const score=ut5Score(run([response('1',20,true),response('2',40),response(null,1000),response(null,700),response(null,900)]));
 assert.equal(score.average,30);assert.equal(score.unknown,3);assert.equal(score.accuracy,20);
});
test('all unknown or empty responses have no average, not zero',()=>{
 assert.equal(ut5Score(run([response(null,30),response(null,60)])).average,null);
 assert.equal(ut5Score(run([])).average,null);
});
test('a submitted numeric zero and zero seconds still count',()=>{
 assert.equal(ut5Score(run([response('0',0),response('1',20)])).average,10);
});
