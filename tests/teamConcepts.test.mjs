import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

const root=fileURLToPath(new URL('..',import.meta.url));
const data=JSON.parse(readFileSync(resolve(root,'src/data/teamConcepts.json'),'utf8'));
const require=createRequire(import.meta.url);
function loader(dev) {
  const cache=new Map();
  function load(file) {
    if(file.endsWith('.json')) return JSON.parse(readFileSync(file,'utf8'));
    if(cache.has(file)) return cache.get(file).exports;
    const module={exports:{}};cache.set(file,module);
    const src=ts.transpileModule(readFileSync(file,'utf8').replaceAll('import.meta.env',`({DEV:${dev}})`),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
    new Function('require','module','exports',src)(name=>{
      if(name.endsWith('.css'))return {};
      if(!name.startsWith('.'))return require(name);
      const base=resolve(dirname(file),name);const target=[base,base+'.ts',base+'.tsx'].find(existsSync);assert(target,name);return load(target);
    },module,module.exports);
    return module.exports;
  }
  return load;
}
test('every source section and all 23 images are preserved with identity and hashes',()=>{
  assert.equal(data.sections.length,95);assert.equal(new Set(data.sections.map(s=>s.id)).size,95);
  assert.equal(data.assets.length,23);assert.match(data.sourceSha256,/^[a-f0-9]{64}$/);
  assert.deepEqual(data.sections.filter(s=>!s.parents.length).map(s=>s.title),['경우의 수','확률','통계']);
  for(const asset of data.assets){assert.match(asset.src,/^\/team-concepts\/diagram-\d+\.png$/);const bytes=readFileSync(resolve(root,'public'+asset.src));assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);}
  assert(data.sections.some(s=>s.title==='누락' && !s.blocks.length));
});
test('existing 61 tags have explicit coverage and unmapped tags are not fabricated',()=>{
  assert.equal(data.tagMappings.length,61);assert.equal(data.tagMappings.filter(m=>m.sectionIds.length).length,54);
  const ids=new Set(data.sections.map(s=>s.id));for(const mapping of data.tagMappings)for(const id of mapping.sectionIds)assert(ids.has(id));
  assert.equal(data.tagMappings.find(m=>m.name==='표본비율').sectionIds.length,0);
  const model=loader(true)(resolve(root,'src/data/teamConcepts.ts'));
  assert(model.teamSectionsForConcept('확률의 덧셈정리').length);
  assert(model.teamSectionsForConcept('같은 것을 포함하는 순열').length);
  assert(model.searchTeamSections('072번').length);
});
test('four truncated conditional formulas are restored with explicit repair provenance',()=>{
  assert.equal(data.repairs.length,4);
  const conditional=data.sections.find(s=>s.title==='조건부확률');const table=conditional.blocks.find(b=>b.kind==='table');
  assert(table.rows.some(row=>row[1].includes('P(A|B)')));assert(table.rows.some(row=>row[1].includes('P(B|Aᶜ)')));
  for(const row of table.rows.slice(1)){assert(!['P(A','P(B','P(안경','P(서울'].includes(row[1]));assert.equal([...row[1]].filter(c=>c==='(').length,[...row[1]].filter(c=>c===')').length);}
});
test('frontend catalog and all local AI reference files match; no database import is needed',()=>{
  const backend=resolve(root,'../suhwakhaeng-backend/src/main/resources/team-concepts');
  assert.deepEqual(JSON.parse(readFileSync(resolve(backend,'catalog.json'),'utf8')),data);
  assert.equal(readdirSync(backend).filter(f=>f.endsWith('.md')).length,95);
  for(const section of data.sections)assert(readFileSync(resolve(backend,section.id+'.md'),'utf8').startsWith('# '+section.title));
});
test('published notes gain team explanations while preserving existing authored lessons',()=>{
  const local=loader(true)(resolve(root,'src/data/conceptNotes.ts')).conceptNotesByName;
  const production=loader(false)(resolve(root,'src/data/conceptNotes.ts')).conceptNotesByName;
  assert(local['조건부확률'].teamSections.length);assert(local['평균'].steps.length);assert(local['평균'].teamSections.length);
  assert(local['산점도']);assert(production['조건부확률'].teamSections.length);
  assert(production['평균'].steps.length);assert(production['평균'].example.solution.length);
  assert.deepEqual(production,local);assert(!production['표본비율']);
});
test('all imported sections render escaped text, valid image sources and restored tables',()=>{
  const Content=loader(true)(resolve(root,'src/components/knowledgeGraph/TeamConceptContent.tsx')).default;
  const html=renderToStaticMarkup(createElement(Content,{sections:data.sections,collapsible:false}));
  assert(!html.includes('<script'));assert(html.includes('P(A|B)'));assert(html.includes('정답: 168'));assert(html.includes('신뢰구간'));
  for(const section of data.sections)assert(html.includes(section.title.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')));
  const malicious=renderToStaticMarkup(createElement(Content,{sections:[{id:'escape',title:'안전',parents:[],blocks:[{kind:'paragraph',text:'<script>alert(1)</script>'}]}]}));
  assert(malicious.includes('&lt;script&gt;'));assert(!malicious.includes('<script>'));
});
test('library has production navigation and reports source coverage',()=>{
  const Library=loader(true)(resolve(root,'src/routes/dev/TeamConceptLibraryPage.tsx')).default;
  const html=renderToStaticMarkup(createElement(MemoryRouter,{initialEntries:['/dev/team-concepts?concept=조건부확률']},createElement(Library)));
  assert(html.includes('분모가 바뀐다'));assert(html.includes('95'));assert(html.includes('54'));assert(html.includes('23'));
  assert(html.includes('/dev/tag-map'));assert(html.includes('풀이 단계와 개념 연결 검토'));
  const Published=loader(false)(resolve(root,'src/routes/dev/TeamConceptLibraryPage.tsx')).default;
  const live=renderToStaticMarkup(createElement(MemoryRouter,{},createElement(Published)));
  assert(live.includes('/main/knowledge-graph'));assert(live.includes('/ut'));assert(!live.includes('/dev/'));
});
test('worked example initially hides solution and reveals no answer in its question',()=>{
  const Example=loader(true)(resolve(root,'src/components/knowledgeGraph/TeamWorkedExample.tsx')).default;
  for(const section of data.sections.filter(s=>/^\d{3}번/.test(s.title))){
    const html=renderToStaticMarkup(createElement(Example,{section}));
    assert(html.includes('풀이 1단계 보기'),section.title);assert(!html.includes('정답:'),section.title);
  }
  const model=loader(true)(resolve(root,'src/data/teamConcepts.ts'));
  const example=data.sections.find(s=>s.title.startsWith('072번'));
  const parts=model.teamWorkedExampleParts(example);
  assert(parts.steps.length>1);
  assert(!model.teamSectionText(parts.steps[0]).includes('정답:'));
  assert(model.teamSectionText(parts.steps.at(-1)).includes('정답: 168'));
  assert.deepEqual(parts.steps.flatMap(s=>s.blocks).filter(b=>b.kind==='list'&&b.ordered).map(b=>b.start),example.blocks.filter(b=>b.kind==='list'&&b.ordered).map(b=>b.start));
});
