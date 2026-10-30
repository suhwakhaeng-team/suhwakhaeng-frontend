import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import katex from 'katex';
import { reviewLevel, visualSteps } from '../src/routes/dev/ut4ConceptSupport.ts';
import { formulaPreview, UT4_INTERACTIVE_LESSONS, activityCorrect } from '../src/routes/dev/ut4InteractiveLessons.ts';

test('conditional review clicks reveal four levels, others keep the original lesson twice', () => {
  assert.deepEqual([0,1,2,3,4,5,100].map(n=>reviewLevel('c-conditional',n)),[1,1,2,3,4,4,4]);
  assert.deepEqual([1,2,3,4].map(n=>visualSteps('c-conditional',n).length),[0,1,2,3]);
  for(const id of ['c-addition','c-complement']) {
    assert.equal(visualSteps(id,1).length,0); assert.equal(visualSteps(id,2).length,0);
    assert.equal(visualSteps(id,3).length,2); assert.equal(visualSteps(id,99).length,2);
  }
});

test('all supplied diagram references exist and all explanatory formulas render', () => {
  const used=new Set();
  for(const id of ['c-conditional','c-addition','c-complement']) for(const count of [2,3,4]) for(const step of visualSteps(id,count)) {
    for(const image of step.images) {
      assert(image.alt.length>10); used.add(image.file);
      assert(existsSync(new URL('../src/routes/dev/ut4/assets/'+image.file,import.meta.url)),image.file);
    }
    katex.renderToString(step.formula.slice(1,-1),{throwOnError:true,strict:'ignore'});
  }
  assert.equal(used.size,11);
});

test('blank/add/subtract/multiply previews and fraction terms use valid single-backslash TeX', () => {
  for(const operation of [undefined,'+','-','*']) {
    const formula=formulaPreview('c-addition',operation?{operation:[operation]}:{});
    assert(!formula.includes('\\\\'));
    const html=katex.renderToString(formula.slice(1,-1),{throwOnError:true});
    assert(!html.includes('katex-error'));
    if(operation==='*') assert(formula.includes('\\times'));
  }
  for(const id of ['c-conditional','c-complement']) for(const answers of [{},{numerator:['AB'],denominator:['B']},{numerator:['3/10'],denominator:['6/10']}]) {
    katex.renderToString(formulaPreview(id,answers).slice(1,-1),{throwOnError:true});
  }
  assert.equal(UT4_INTERACTIVE_LESSONS['c-addition'][2].title,'덧셈정리를 완성해 보세요');
  for(const activities of Object.values(UT4_INTERACTIVE_LESSONS)) for(const activity of activities) {
    assert(activityCorrect(activity,Object.fromEntries(activity.groups.map(g=>[g.id,g.correct]))));
  }
});
