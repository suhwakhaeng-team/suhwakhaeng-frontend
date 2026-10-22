import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ut2Assessment } from '../src/routes/dev/ut2Assessment.ts';
import { CONDITIONAL_NODES } from '../src/routes/dev/conditionalProblemBreakdown.ts';

// A real probability model has four nonnegative cells: AB, ABc, AcB, AcBc.
const cells = [[true,true], [true,false], [false,true], [false,false]];
function region(event) {
  event = event.replaceAll(' ', '');
  const literal = (value, a, b) => value === 'A' ? a : value === 'A^c' ? !a : value === 'B' ? b : value === 'B^c' ? !b : undefined;
  return cells.map(([a,b]) => {
    if (event.includes('\\cap')) return Number(event.split('\\cap').every(x => literal(x,a,b)));
    if (event.includes('\\cup')) return Number(event.split('\\cup').some(x => literal(x,a,b)));
    const value = literal(event,a,b); assert.notEqual(value, undefined, event); return Number(value);
  });
}
const dot = (a,b) => b.reduce((sum,x,i) => sum+x*a[i],0);
function solve(rows) {
  const a = rows.map(r => [...r]); let col = 0;
  for (; col < 4; col++) {
    const pivot = a.findIndex((r,i) => i >= col && Math.abs(r[col]) > 1e-10);
    if (pivot < 0) return null;
    [a[col], a[pivot]] = [a[pivot], a[col]];
    const divisor = a[col][col]; a[col] = a[col].map(x => x/divisor);
    for (let i=0;i<4;i++) if (i !== col) { const factor=a[i][col]; a[i]=a[i].map((x,j)=>x-factor*a[col][j]); }
  }
  return a.map(r=>r[4]);
}
function feasible(prompt) {
  const equations = [[1,1,1,1,1]], denominators = [];
  const fraction = /P\(([^)]+)\)=\\frac(?:\{(\d+)\}|(\d))(?:\{(\d+)\}|(\d))/g;
  for (const m of prompt.matchAll(fraction)) {
    const value = Number(m[2] || m[3])/Number(m[4] || m[5]);
    if (m[1].includes('\\mid')) {
      const [event,condition] = m[1].split('\\mid'), base=region(condition);
      const numerator=region(event).map((x,i)=>x*base[i]);
      equations.push([...numerator.map((x,i)=>x-value*base[i]),0]); denominators.push(base);
    } else equations.push([...region(m[1]),value]);
  }
  for (const m of prompt.matchAll(/P\(([^)]+)\)=(\d+)P\(([^)]+)\)/g)) {
    const [left,base] = m[1].split('\\mid'), [right,otherBase]=m[3].split('\\mid');
    assert.equal(base,otherBase);
    const condition=base ? region(base) : [1,1,1,1];
    equations.push([...region(left).map((x,i)=>(x-Number(m[2])*region(right)[i])*condition[i]),0]);
    if (base) denominators.push(condition);
  }
  const candidates=[...equations,...cells.map((_,i)=>[...cells.map((_,j)=>Number(i===j)),0])];
  const solutions=[];
  for(let a=0;a<candidates.length;a++) for(let b=a+1;b<candidates.length;b++) for(let c=b+1;c<candidates.length;c++) for(let d=c+1;d<candidates.length;d++) {
    const x=solve([candidates[a],candidates[b],candidates[c],candidates[d]]);
    if (x && x.every(v=>v>=-1e-9) && equations.every(r=>Math.abs(dot(r,x)-r[4])<1e-9)) solutions.push(x);
  }
  // Averaging feasible vertices also covers positive conditional denominators in the interior.
  if (!solutions.length) return false;
  const average=cells.map((_,i)=>solutions.reduce((sum,x)=>sum+x[i],0)/solutions.length);
  return denominators.every(base=>dot(base,average)>1e-9);
}

test('every formula-based UT2 assessment and learning/retry question admits a nonnegative joint probability table',()=>{
  const questions=[...ut2Assessment('A'),...ut2Assessment('B'),...Object.values(CONDITIONAL_NODES).flatMap(n=>n.questions)];
  let checked=0;
  for(const q of questions) if(q.prompt.includes('P(')) { assert(feasible(q.prompt),q.prompt); checked++; }
  assert.equal(checked,54);
});
test('feasibility check detects the original contradictory A/B item even though the computed answer was in range',()=>{
  const legacy=JSON.parse(readFileSync(new URL('../../suhwakhaeng-backend/src/main/resources/ut2/question-bank-v1.json',import.meta.url),'utf8'));
  for(const form of ['A','B']) assert.equal(feasible(legacy.forms[form][12].prompt.replaceAll('\\\\','\\')),false);
});
