import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { learningGraphExamples } from '../../data/learningGraphExamples';
import type { LearningGraphData } from '../../types/learningGraph';
import { createGraphIndex } from '../../services/learningGraph';
import { statusOf } from '../../services/learningGraph';
import { adaptTopology } from '../../services/topologyGraphAdapter';
import { CONCEPT_PAGE_SIZE } from '../../services/learningGraphLayout';
import KnowledgeGraph, { type FocusRequest } from '../../components/knowledgeGraph/KnowledgeGraph';
import ConceptDetailPanel from '../../components/knowledgeGraph/ConceptDetailPanel';
import GraphIcon from '../../components/knowledgeGraph/GraphIcon';
import { useConceptProgress } from '../../components/knowledgeGraph/useConceptProgress';
import './KnowledgeGraphPage.css';

export default function KnowledgeGraphPage({ preview = false, embedded = false }: { preview?: boolean; embedded?: boolean }) {
  const { user } = useAuth();
  const [dataset, setDataset] = useState(learningGraphExamples[0]);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (preview || !user) return;
    let active = true;
    void readLiveGraph(user.uid).then(result => {
      if (!active) return;
      setDataset(result.data);
      if (result.warnings.length) setNotice(`연결할 수 없는 관계 ${result.warnings.length}개는 제외했어요.`);
    }).catch(error => {
      if (active) setNotice(error instanceof Error ? error.message : '커리큘럼을 불러오지 못했습니다.');
    });
    return () => { active = false; };
  }, [preview, user]);
  const account = preview ? 'local-preview' : user?.uid ?? 'guest-preview';
  return <div className={`kg-page ${embedded ? 'kg-page-embedded' : ''}`}>
    {!embedded && <header className="kg-page-heading">
      <div className="kg-heading-row">{!preview && <Link to="/main/home">← 홈</Link>}<h1>개념 지도</h1></div>
    </header>}
    <GraphWorkspace
      key={`${account}:${dataset.id}`}
      data={dataset}
      userId={account}
      practiceUid={preview ? null : user?.uid ?? null}
      datasetControl={<div className="kg-subject-picker">
        {preview ? <select aria-label="학습 주제" value={dataset.id} onChange={event => {
          const next = learningGraphExamples.find(item => item.id === event.target.value);
          if (next) { setDataset(next); setNotice(''); }
        }}>{learningGraphExamples.map(item => <option key={item.id} value={item.id}>{item.subject.name} · 예제</option>)}</select>
          : <strong>{dataset.subject.name}</strong>}
      </div>}
      notice={notice}
    />
  </div>;
}

async function readLiveGraph(uid: string) {
  const { fetchTopology } = await import('../../lib/curriculumTopologyClient');
  const result = adaptTopology(await fetchTopology(uid));
  createGraphIndex(result.data);
  if (!result.data.concepts.length) throw new Error('아직 등록된 커리큘럼 개념이 없습니다.');
  return result;
}

function GraphWorkspace({ data, userId, practiceUid, datasetControl, notice }: { data: LearningGraphData; userId: string; practiceUid: string | null; datasetControl: React.ReactNode; notice: string }) {
  const index = useMemo(() => createGraphIndex(data), [data]);
  const { progress, error } = useConceptProgress(data, userId);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [focus, setFocus] = useState<FocusRequest>({ kind: 'all', id: '', tick: 0 });
  const recommendation = useMemo(() => {
    const unresolved = data.concepts.filter(concept => statusOf(progress, concept.id) !== 'known');
    const ready = unresolved.filter(concept => concept.prerequisites.every(id => statusOf(progress, id) === 'known'));
    const priority = (concept: typeof data.concepts[number]) => concept.metadata?.assessmentStatus === 'WEAK' ? 0 : concept.metadata?.assessmentStatus === 'IN_PROGRESS' ? 1 : 2;
    return [...(ready.length ? ready : unresolved)].sort((a, b) => priority(a) - priority(b))[0] ?? null;
  }, [data, progress]);
  const results = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    if (!search) return [];
    return [
      ...data.units.map(unit => ({ id: unit.id, name: unit.name, kind: 'unit' as const, context: '단원' })),
      ...data.concepts.map(concept => ({ id: concept.id, name: concept.name, kind: 'concept' as const, context: index.units.get(concept.unitId)!.name })),
    ].filter(item => item.name.toLocaleLowerCase().includes(search));
  }, [data, query, index]);
  const navigateConcept = (id: string) => {
    const concept = index.concepts.get(id);
    if (!concept) return;
    setSelected(id); setExpanded(concept.unitId);
    setPage(Math.floor(index.unitConcepts.get(concept.unitId)!.findIndex(item => item.id === id) / CONCEPT_PAGE_SIZE));
    setFocus(previous => ({ kind: 'concept', id, tick: previous.tick + 1 }));
  };
  const expandUnit = (id: string, force = false) => {
    const collapse = !force && expanded === id;
    setExpanded(collapse ? null : id); setSelected(null); setPage(0);
    setFocus(previous => ({ kind: collapse ? 'all' : 'unit', id, tick: previous.tick + 1 }));
  };
  const selectSearch = (item: typeof results[number]) => {
    setQuery('');
    if (item.kind === 'unit') expandUnit(item.id, true); else navigateConcept(item.id);
  };

  return <>
    <div className="kg-toolbar">
      {datasetControl}
      <form className="kg-search" role="search" onSubmit={event => { event.preventDefault(); if (results[0]) selectSearch(results[0]); }}>
        <GraphIcon name="search" size={17} /><input aria-label="단원 또는 개념 검색" placeholder="개념 검색" value={query} onChange={event => setQuery(event.target.value)} />
        {query && <button type="button" className="kg-icon-button" aria-label="검색 지우기" onClick={() => setQuery('')}><GraphIcon name="close" size={14} /></button>}
        {query.trim() && <div className="kg-search-results">{results.slice(0, 10).map(result => <button type="button" key={`${result.kind}:${result.id}`} onClick={() => selectSearch(result)}><span><strong>{result.name}</strong><small>{result.context}</small></span><GraphIcon name="arrow" size={15} /></button>)}{!results.length && <p>검색 결과가 없어요.</p>}</div>}
      </form>
      <div className="kg-state-key" aria-label="학습 상태"><span className="mastered"><i />통과</span><span className="in-progress"><i />진행</span><span className="weak"><i />약점</span><span className="undiagnosed"><i />미진단</span></div>
    </div>
    {(notice || error) && <div className="kg-notice" role="alert">{error || notice}</div>}
    <div className={`kg-workspace ${selected ? 'has-detail' : ''}`}>
      <main className="kg-stage">
        <KnowledgeGraph index={index} progress={progress} expanded={expanded} selected={selected} page={page} filter="all" gapPath={null} focus={focus} onExpand={id => expandUnit(id)} onSelect={navigateConcept} onPage={value => { setPage(value); setSelected(null); }} />
        {!selected && recommendation && <button className="kg-route-card" onClick={() => navigateConcept(recommendation.id)}><span>지금 할 것</span><strong>{recommendation.name}</strong><GraphIcon name="arrow" size={16} /></button>}
        {!expanded && <div className="kg-hint">단원을 눌러 개념을 펼쳐보세요</div>}
      </main>
      {selected && <ConceptDetailPanel key={selected} index={index} selected={selected} progress={progress} practiceUid={practiceUid} onClose={() => setSelected(null)} />}
    </div>
    <span className="kg-sr-only" role="status" aria-live="polite">{error}</span>
  </>;
}
