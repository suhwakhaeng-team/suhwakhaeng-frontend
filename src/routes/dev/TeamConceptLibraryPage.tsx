import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import TeamConceptContent from '../../components/knowledgeGraph/TeamConceptContent';
import TeamWorkedExample from '../../components/knowledgeGraph/TeamWorkedExample';
import { searchTeamSections, teamConceptCatalog, teamSectionsForConcept } from '../../data/teamConcepts';
import './TeamConceptLibraryPage.css';

export default function TeamConceptLibraryPage() {
  const [params, setParams] = useSearchParams();
  const concept = params.get('concept') || '';
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('전체');
  const mapped = teamSectionsForConcept(concept);
  const sections = concept ? mapped.filter(section => searchTeamSections(query, group).includes(section)) : searchTeamSections(query, group);
  const [selectedId, setSelectedId] = useState('');
  const selected = sections.find(section => section.id === selectedId) || sections.find(section => section.parents.length > 0 && section.blocks.length > 0) || sections[0];
  const usedImages = new Set(teamConceptCatalog.sections.flatMap(section => section.blocks.filter(block => block.kind === 'image').map(block => block.src)));
  const orphanImages = teamConceptCatalog.assets.filter(asset => !usedImages.has(asset.src));
  return <div className="team-library"><nav><strong>수확행</strong><Link to="/main/home">홈</Link><Link to={import.meta.env.DEV ? '/dev/tag-map' : '/main/knowledge-graph'}>개념 지도</Link>{import.meta.env.DEV && <Link to="/dev/ut2/problem-map">기출 문제 지도</Link>}<Link to="/ut">학습 체험</Link></nav>
    <header><h1>개념 설명과 응용 유형</h1><p>원자료 {teamConceptCatalog.sections.length}항목 · 그림 {teamConceptCatalog.assets.length}개 · 기존 태그 {teamConceptCatalog.tagMappings.filter(m => m.sectionIds.length).length}/61개 연결</p><p>팀 제공 학습 자료입니다. 전 문항 수학 검토 완료본은 아니며, 이 페이지의 예제는 UT 채점·기록에 포함되지 않습니다.</p></header>
    <div className="team-library-filters"><label>기존 태그<select aria-label="기존 태그" value={concept} onChange={e => {setParams(e.target.value ? {concept:e.target.value} : {});setSelectedId('');}}><option value="">전체 자료</option>{teamConceptCatalog.tagMappings.map(m => <option key={m.tagId} value={m.name}>{m.name} · {m.sectionIds.length ? `${m.sectionIds.length}개` : '원자료 없음'}</option>)}</select></label>
      <label>단원<select aria-label="단원" value={group} onChange={e => {setGroup(e.target.value);setSelectedId('');}}>{['전체','경우의 수','확률','통계'].map(g => <option key={g}>{g}</option>)}</select></label><label>내용 검색<input aria-label="내용 검색" value={query} onChange={e => {setQuery(e.target.value);setSelectedId('');}} placeholder="예: 조건부확률, 072번" /></label></div>
    <main className="team-library-layout"><aside aria-label="개념 및 유형 목록"><p>{sections.length}항목</p>{sections.map(section => <button key={section.id} aria-pressed={selected?.id === section.id} onClick={() => setSelectedId(section.id)}>{section.title}</button>)}</aside>
      <article>{selected ? <><span className="team-library-category">{selected.parents.join(' › ') || '단원'}</span>{/^\d{3}번/.test(selected.title) ? <TeamWorkedExample key={selected.id} section={selected} /> : <TeamConceptContent sections={[selected]} collapsible={false} />}
        {!selected.blocks.length && <p>원자료에서 본문이 비어 있습니다. 아래 세부 항목을 확인하세요.</p>}
        {sections.filter(s => s.parents.includes(selected.title)).map(s => <button className="team-library-child" key={s.id} onClick={() => setSelectedId(s.id)}>{s.title} →</button>)}
        <details className="team-library-breakdown"><summary>풀이 단계와 개념 연결 검토</summary><p>설명 속 단계별 제목은 하위 학습 후보입니다. 아래 연결은 자료 분류이며, 선수 관계나 학습 통과 판정이 아닙니다.</p><ul>{selected.blocks.filter(b => b.kind === 'heading').map((b,i) => <li key={i}>{b.kind === 'heading' && b.text}</li>)}</ul><p>관련 태그: {teamConceptCatalog.tagMappings.filter(m => m.sectionIds.includes(selected.id)).map(m => m.name).join(' · ') || '개별 태그 미연결 · 전체 자료에 보존'}</p></details>
      </> : <p>조건에 맞는 자료가 없습니다. 원자료에 없는 태그는 기존 노트를 유지합니다.</p>}</article></main>
    <details className="team-library-audit"><summary>반영 내역과 원자료 보완</summary><ul>{teamConceptCatalog.repairs.map((repair,i) => <li key={i}>{repair.reason}: {repair.before} → {repair.after}</li>)}</ul><p>원자료 미제공 태그: {teamConceptCatalog.tagMappings.filter(m => !m.sectionIds.length).map(m => m.name).join(' · ')}</p><p>본문에 연결되지 않은 추가 제공 그림 {orphanImages.length}개도 보존했습니다.</p><div className="team-concept-content">{orphanImages.map(asset => <figure key={asset.src}><img src={asset.src} alt={asset.sourceName.normalize('NFC')} loading="lazy" /></figure>)}</div></details>
  </div>;
}
