import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { learningGraphExamples } from '../../data/learningGraphExamples';
import type { ConceptStatus, LearningGraphData } from '../../types/learningGraph';
import { createGraphIndex, getGapPath, statusOf } from '../../services/learningGraph';
import { adaptTopology } from '../../services/topologyGraphAdapter';
import { CONCEPT_PAGE_SIZE } from '../../services/learningGraphLayout';
import KnowledgeGraph, { type FocusRequest } from '../../components/knowledgeGraph/KnowledgeGraph';
import PrerequisiteGraph from '../../components/knowledgeGraph/PrerequisiteGraph';
import ConceptDetailPanel from '../../components/knowledgeGraph/ConceptDetailPanel';
import GraphIcon from '../../components/knowledgeGraph/GraphIcon';
import { useConceptProgress } from '../../components/knowledgeGraph/useConceptProgress';
import './KnowledgeGraphPage.css';

export default function KnowledgeGraphPage({ preview = false }: { preview?: boolean }) {
  const { user } = useAuth();
  const [dataset, setDataset] = useState(learningGraphExamples[0]);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (preview || !user) return;
    let active = true;
    void readLiveGraph(user.uid).then(result => {
      if (!active) return;
      setDataset(result.data);
      if (result.warnings.length) setNotice(`관계 ${result.warnings.length}개는 이름 중복으로 제외했어요.`);
    }).catch(error => {
      if (active) setNotice(error instanceof Error ? error.message : '커리큘럼을 불러오지 못했습니다.');
    });
    return () => { active = false; };
  }, [preview, user]);
  const account = preview ? 'local-preview' : user?.uid ?? 'guest-preview';
  return <div className="kg-page">
    <header className="kg-page-heading"><div><div className="kg-heading-row">{!preview && <Link to="/main/home">← 홈으로</Link>}<h1>개념 지도</h1></div><p>단원을 펼쳐 개념의 연결과 선수개념을 확인해보세요.</p></div><div className="kg-heading-actions"><span className="kg-local-badge"><span />{dataset.id.startsWith('demo-') ? '예제 데이터' : '내 커리큘럼'}</span>{!preview && <Link to="/main/topology" className="kg-old-map">기존 지도 보기</Link>}</div></header>
    <GraphWorkspace
      key={`${account}:${dataset.id}`}
      data={dataset}
      userId={account}
      datasetControl={<div className="kg-subject-picker">
        <label htmlFor="kg-subject">학습 주제</label>
        {preview ? <select id="kg-subject" value={dataset.id} onChange={event => {
          const next = learningGraphExamples.find(item => item.id === event.target.value);
          if (next) { setDataset(next); setNotice(''); }
        }}>
          {learningGraphExamples.map(item => <option key={item.id} value={item.id}>{item.subject.name} · 예제</option>)}
        </select> : <strong id="kg-subject">{dataset.subject.name}</strong>}
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

function GraphWorkspace({ data, userId, datasetControl, notice }: { data: LearningGraphData; userId: string; datasetControl: React.ReactNode; notice: string }) {
  const index = useMemo(() => createGraphIndex(data), [data]);
  const { progress, error, update } = useConceptProgress(data, userId);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ConceptStatus | 'all'>('all');
  const [gapMode, setGapMode] = useState(false);
  const [focus, setFocus] = useState<FocusRequest>({ kind: 'all', id: '', tick: 0 });
  const [statusMessage, setStatusMessage] = useState('');
  const gapPath = useMemo(() => gapMode ? getGapPath(index, progress) : null, [gapMode, index, progress]);
  const counts = useMemo(() => {
    const counts = { all: data.concepts.length, known: 0, unknown: 0, unset: 0 };
    data.concepts.forEach(c => counts[statusOf(progress, c.id)]++);
    return counts;
  }, [data, progress]);
  const results = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    if (!search) return [];
    return [...data.units.map(u => ({ id: u.id, name: u.name, kind: 'unit' as const, context: '단원' })), ...data.concepts.map(c => ({ id: c.id, name: c.name, kind: 'concept' as const, context: index.units.get(c.unitId)!.name }))].filter(item => item.name.toLocaleLowerCase().includes(search));
  }, [data, query, index]);
  const navigateConcept = (id: string, record = true) => {
    const c = index.concepts.get(id);
    if (!c) return;
    if (record && selected && selected !== id) setHistory(previous => [...previous.slice(-49), selected]);
    setSelected(id); setExpanded(c.unitId);
    setPage(Math.floor(index.unitConcepts.get(c.unitId)!.findIndex(item => item.id === id) / CONCEPT_PAGE_SIZE));
    setFocus(previous => ({ kind: 'concept', id, tick: previous.tick + 1 }));
  };
  const expandUnit = (id: string, force = false) => {
    const collapse = !force && expanded === id;
    setExpanded(collapse ? null : id); setSelected(null); setPage(0); setHistory([]);
    setFocus(previous => ({ kind: collapse ? 'all' : 'unit', id, tick: previous.tick + 1 }));
  };
  const close = () => {
    setSelected(null); setHistory([]);
    setFocus(previous => ({ kind: expanded ? 'unit' : 'all', id: expanded ?? '', tick: previous.tick + 1 }));
  };
  const selectSearch = (item: typeof results[number]) => {
    setFilter('all'); setGapMode(false); setQuery('');
    if (item.kind === 'unit') expandUnit(item.id, true); else navigateConcept(item.id);
  };

  return <>
    <div className="kg-toolbar">{datasetControl}
      <form className="kg-search" role="search" onSubmit={e => { e.preventDefault(); if (results[0]) selectSearch(results[0]); }}><GraphIcon name="search" size={17} /><input aria-label="단원 또는 개념 검색" placeholder="어떤 개념이 궁금한가요?" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setQuery(''); }} />{query ? <button type="button" className="kg-icon-button" aria-label="검색 지우기" onClick={() => setQuery('')}><GraphIcon name="close" size={14} /></button> : <kbd>↵</kbd>}
        {query.trim() && <div className="kg-search-results" aria-label="검색 결과"><small>{results.length}개의 연결을 찾았어요{results.length > 12 ? ' · 상위 12개 표시' : ''}</small>{results.slice(0, 12).map(result => <button type="button" key={`${result.kind}:${result.id}`} onClick={() => selectSearch(result)}><span><strong>{result.name}</strong><small>{result.context}</small></span><GraphIcon name="arrow" size={15} /></button>)}{!results.length && <p>다른 개념 이름으로 검색해보세요.</p>}</div>}
      </form>
      <div className="kg-filters" role="group" aria-label="학습 상태 필터">{(['all', 'known', 'unknown', 'unset'] as const).map(value => <button key={value} className={`${filter === value ? 'is-active' : ''} status-${value}`} aria-pressed={filter === value} onClick={() => { setFilter(value); setGapMode(false); }}>{value !== 'all' && <span className="kg-status-dot" />}{({ all: '전체', known: '앎', unknown: '모름', unset: '미정' })[value]}<small>{counts[value]}</small></button>)}</div>
      <button className={`kg-gap-toggle ${gapMode ? 'is-active' : ''}`} aria-pressed={gapMode} title="모름인 개념과 연결된 모든 선수 경로 강조" onClick={() => { setGapMode(value => !value); setFilter('all'); }}><GraphIcon name="graph" size={16} />빈틈 경로</button>
    </div>
    {(notice || error) && <div className="kg-notice" role="alert">{error || notice}</div>}
    <div className={`kg-workspace ${selected ? 'has-detail' : ''}`}>
      <main className="kg-stage">
        {!selected && <div className="kg-intro"><h2>{data.subject.name}</h2><p>{data.units.length}개 단원 · {data.concepts.length}개 개념</p></div>}
        <KnowledgeGraph index={index} progress={progress} expanded={expanded} selected={selected} page={page} filter={filter} gapPath={gapPath} focus={focus} onExpand={id => expandUnit(id)} onSelect={navigateConcept} onPage={value => { setPage(value); setSelected(null); setHistory([]); }} />
        {selected && <PrerequisiteGraph key={selected} index={index} selected={selected} progress={progress} onSelect={navigateConcept} canBack={history.length > 0} onBack={() => { const previous = history.at(-1); if (previous) { setHistory(h => h.slice(0, -1)); navigateConcept(previous, false); } }} />}
        {gapMode && counts.unknown === 0 && <div className="kg-empty-filter">아직 ‘모름’으로 표시한 개념이 없어요.</div>}
        <div className="kg-legend"><span className="status-known"><i />앎</span><span className="status-unknown"><i />모름</span><span className="status-unset"><i />미정</span>{selected && <span className="kg-relation-key">선수 ━ 현재 ◎ 후속 ┄</span>}</div>
      </main>
      {selected && <ConceptDetailPanel key={selected} index={index} selected={selected} progress={progress} onSelect={navigateConcept} onUpdate={(id, status) => { if (update(id, status)) setStatusMessage(`${index.concepts.get(id)!.name} 상태: ${{ known: '앎', unknown: '모름', unset: '미정' }[status]} 저장됨`); }} onClose={close} />}
    </div>
    <footer className="kg-bottom-bar"><span><span className="kg-save-dot" />{counts.known}개 개념을 이해했어요 <span className="kg-bottom-progress"><i style={{ width: `${counts.all ? counts.known / counts.all * 100 : 0}%` }} /></span><b>{counts.all ? Math.round(counts.known / counts.all * 100) : 0}%</b></span><small>이 브라우저에 저장</small></footer>
    <span className="kg-sr-only" role="status" aria-live="polite">{error || statusMessage}</span>
  </>;
}
