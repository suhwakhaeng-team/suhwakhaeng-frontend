import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../../lib/apiClient';
import {
  anProblemsForConcept,
  previewBnConnection,
  wrongBnAttempts,
  type BnConnectionResponse,
  type ConnectedQuestion,
} from '../../lib/bnConnectionMap';
import type { AnswerItem } from '../../types/learning';
import './DiagnosticBnConnectionMap.css';

const GRAPH_WIDTH = 620;
const BN_X = 96;
const CONCEPT_X = 286;
const AN_X = 510;

function nodeY(index: number, count: number, height: number, spacing = 76): number {
  return height / 2 + (index - (count - 1) / 2) * spacing;
}

function curvedEdge(x1: number, y1: number, x2: number, y2: number): string {
  const bend = Math.max(36, (x2 - x1) * 0.55);
  return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
}

function ProblemButton({ question, selected, highlighted, drilledAnId, onClick }: {
  question: ConnectedQuestion;
  selected: boolean;
  highlighted: boolean;
  drilledAnId: number | null;
  onClick: () => void;
}) {
  return <button type="button" className={`bn-map-an${selected ? ' selected' : ''}${highlighted ? ' highlighted' : ''}`} onClick={onClick} aria-pressed={selected}>
    <span>AN 문제 #{question.id}{drilledAnId === question.id && <em>진단에서 풂</em>}</span>
    <strong>{question.description}</strong>
    <small>{question.concepts.join(' · ')}</small>
  </button>;
}

export default function DiagnosticBnConnectionMap({ answers, demo = false }: { answers: AnswerItem[]; demo?: boolean }) {
  const attempts = useMemo(() => wrongBnAttempts(answers), [answers]);
  const [selectedBnId, setSelectedBnId] = useState<number | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [selectedAnId, setSelectedAnId] = useState<number | null>(null);
  const [connection, setConnection] = useState<BnConnectionResponse | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');

  const attempt = attempts.find(item => item.bn.problemId === selectedBnId) ?? attempts[0] ?? null;
  const demoConnection = useMemo(() => demo && attempt ? previewBnConnection(attempt) : null, [demo, attempt]);

  useEffect(() => {
    if (!attempt || demo) return;
    let cancelled = false;
    apiClient.get<BnConnectionResponse>(`/learning/bn-connections?questionId=${attempt.bn.problemId}`)
      .then(response => {
        if (cancelled) return;
        if (response.success && response.data) {
          setConnection(response.data);
          setLoadState('ready');
        } else {
          setConnection(null);
          setLoadState('error');
        }
      })
      .catch(() => {
        if (!cancelled) { setConnection(null); setLoadState('error'); }
      });
    return () => { cancelled = true; };
  }, [attempt, demo]);

  const currentConnection = demo ? demoConnection : connection;
  const current = currentConnection?.bn.id === attempt?.bn.problemId ? currentConnection : null;
  const concept = current?.concepts.includes(selectedConcept ?? '') ? selectedConcept! : current?.concepts[0] ?? null;
  const relatedAn = current?.anProblems ?? [];
  const highlightedAn = current && concept ? anProblemsForConcept(current, concept) : [];
  const selectedAn = relatedAn.find(question => question.id === selectedAnId) ?? highlightedAn[0] ?? relatedAn[0] ?? null;
  const graphHeight = Math.max(500, (Math.max((current?.concepts.length ?? 0) * 76, relatedAn.length * 82)) + 120);

  const selectBn = (id: number) => {
    setSelectedBnId(id);
    setSelectedConcept(null);
    setSelectedAnId(null);
    setLoadState('loading');
  };
  const selectConcept = (name: string) => {
    setSelectedConcept(name);
    setSelectedAnId(null);
  };

  return <section className="bn-map-section" aria-labelledby="bn-map-title">
    <div className="bn-map-intro">
      <span>레벨테스트에서 틀린 BN</span>
      <h2 id="bn-map-title">문제 연결 지도</h2>
      <p>BN 문제 하나를 고르면, 그 문제에 필요한 개념과 각 개념을 확인하는 AN 문제를 볼 수 있어요.</p>
    </div>
    {attempts.length === 0 ? <div className="bn-map-empty">틀린 BN 문제가 없어 연결 지도가 비어 있어요.</div> : <>
      <div className="bn-map-picker" role="group" aria-label="틀린 BN 문제 선택">
        {attempts.map((item, index) => <button key={item.bn.problemId} type="button"
          className={attempt?.bn.problemId === item.bn.problemId ? 'selected' : ''}
          onClick={() => selectBn(item.bn.problemId)} aria-pressed={attempt?.bn.problemId === item.bn.problemId}>
          <small>BN {index + 1}</small><strong>{item.bn.topic}</strong>
        </button>)}
      </div>
      {!current ? <div className="bn-map-empty" role="status">{loadState === 'error' ? '연결된 AN 문제를 불러오지 못했어요. 서버 연결을 확인해 주세요.' : '연결된 개념과 문제를 불러오는 중...'}</div> : <>
        <div className="bn-map-summary">
          <div><span>선택한 BN #{current.bn.id}</span><strong>{current.bn.title}</strong></div>
          <small>개념 {current.concepts.length}개 <b>·</b> AN 문제 {current.anProblems.length}개</small>
        </div>
        {current.concepts.length === 0 ? <div className="bn-map-empty">이 BN 문제에는 연결된 개념 태그가 없어요.</div> : <>
          <div className="bn-map-legend"><span><i className="bn-dot" /> 틀린 BN</span><span><i className="concept-dot" /> 연결 개념</span><span><i className="an-dot" /> AN 문제</span><small>개념이나 문제를 눌러 연결을 확인해 보세요</small></div>
          <div className="bn-map-graph-scroll"><div className="bn-map-graph" style={{ width: GRAPH_WIDTH, height: graphHeight }} role="group" aria-label="BN에서 개념을 거쳐 AN 문제로 이어지는 지도">
            <div className="bn-map-column-title" style={{ left: BN_X }}>BN 문제</div>
            <div className="bn-map-column-title" style={{ left: CONCEPT_X }}>연결 개념</div>
            <div className="bn-map-column-title" style={{ left: AN_X }}>AN 문제</div>
            <svg viewBox={`0 0 ${GRAPH_WIDTH} ${graphHeight}`} aria-hidden="true">
              {current.concepts.map((name, index) => <path key={`bn:${name}`} d={curvedEdge(BN_X + 74, graphHeight / 2, CONCEPT_X - 70, nodeY(index, current.concepts.length, graphHeight))} className={name === concept ? 'active' : ''} />)}
              {current.concepts.flatMap((name, conceptIndex) => relatedAn.flatMap((question, questionIndex) => question.concepts.includes(name)
                ? [<path key={`${name}:${question.id}`} d={curvedEdge(CONCEPT_X + 70, nodeY(conceptIndex, current.concepts.length, graphHeight), AN_X - 82, nodeY(questionIndex, relatedAn.length, graphHeight, 82))} className={name === concept ? 'active' : ''} />]
                : []))}
            </svg>
            <div className="bn-map-bn" style={{ left: BN_X, top: graphHeight / 2 }}><span>틀린 BN</span><strong>#{current.bn.id}</strong><small>여기서 시작</small></div>
            {current.concepts.map((name, index) => <button key={name} type="button"
              className={`bn-map-concept${name === concept ? ' selected' : ''}`}
              style={{ left: CONCEPT_X, top: nodeY(index, current.concepts.length, graphHeight) }}
              onClick={() => selectConcept(name)} aria-pressed={name === concept}>
              <strong>{name}</strong><small>AN {anProblemsForConcept(current, name).length}개</small>
            </button>)}
            {relatedAn.map((question, index) => <div key={question.id} className="bn-map-graph-an" style={{ left: AN_X, top: nodeY(index, relatedAn.length, graphHeight, 82) }}>
              <ProblemButton question={question} selected={question.id === selectedAn?.id} highlighted={question.concepts.includes(concept ?? '')} drilledAnId={attempt?.drilledAn?.problemId ?? null} onClick={() => setSelectedAnId(question.id)} />
            </div>)}
            {relatedAn.length === 0 && <div className="bn-map-graph-none" style={{ left: AN_X, top: graphHeight / 2 }}>연결된 AN 문제가 아직 없어요</div>}
          </div></div>
          <p className="bn-map-scroll-hint">지도를 좌우로 움직여 전체 연결을 볼 수 있어요.</p>
          <div className="bn-map-bn-answer"><strong>BN 문제 내용</strong><p>{current.bn.description}</p><small>내 답: {attempt?.bn.userAnswer || '미입력'}</small></div>
          {selectedAn && <div className="bn-map-detail" aria-live="polite">
            <span>선택한 AN 문제 #{selectedAn.id}</span>
            <p>{selectedAn.description}</p>
            {attempt?.drilledAn?.problemId === selectedAn.id && <small>레벨테스트에서 풂 · {attempt.drilledAn.correct ? '정답' : '오답'}</small>}
          </div>}
        </>}
      </>}
    </>}
  </section>;
}
