import { useState } from 'react';
import { conceptNotesByName } from '../../data/conceptNotes';
import {
  qMapConnectionsFor,
  qMapPreviewConnections,
  qMapPreviewProblems,
  qMapProblemById,
  qMapTodayProblems,
  type QMapConnection,
  type QMapProblem,
} from '../../lib/qMapPreview';
import './QMapPreviewPage.css';

const todayProblems = qMapTodayProblems();

const connectionKindLabels = {
  repair: '개념 다시 확인',
  deepen: '같은 개념 심화',
  combine: '배운 개념 결합',
} as const;

function difficultyLabel(difficulty: number) {
  if (difficulty >= 4) return '도전';
  if (difficulty >= 3) return '보통';
  return '기초';
}

function otherProblem(connection: QMapConnection, problemId: string) {
  return qMapProblemById(connection.from === problemId ? connection.to : connection.from);
}

function ProblemNode({ problem, selected, nearby, onSelect }: {
  problem: QMapProblem;
  selected: boolean;
  nearby: boolean;
  onSelect: (id: string) => void;
}) {
  return <button
    type="button"
    className={`qmap-node qmap-node--${problem.status}${selected ? ' is-selected' : ''}${nearby ? ' is-nearby' : ''}`}
    style={{ left: `${(problem.x / 900) * 100}%`, top: `${(problem.y / 720) * 100}%` }}
    onClick={() => onSelect(problem.id)}
    aria-pressed={selected}
    aria-label={`${problem.code} ${problem.title}, ${problem.level}, 난이도 ${problem.difficulty}, ${problem.status === 'today' ? `오늘 ${problem.todayOrder}번` : problem.status === 'solved' ? '이전에 푼 문제' : '진단에서 틀린 문제'}`}
  >
    <span className="qmap-node__eyebrow">
      <span>{problem.code}</span>
      {problem.todayOrder != null && <span className="qmap-node__order">오늘 {problem.todayOrder}</span>}
    </span>
    <strong>{problem.title}</strong>
    <span className="qmap-node__meta">{problem.level} <span aria-hidden="true">·</span> {difficultyLabel(problem.difficulty)} {problem.difficulty}/5</span>
  </button>;
}

export default function QMapPreviewPage() {
  const [selectedId, setSelectedId] = useState('today-combine');
  const selected = qMapProblemById(selectedId) ?? todayProblems[0];
  const connections = qMapConnectionsFor(selected.id);
  const connectedIds = new Set(connections.flatMap(connection => [connection.from, connection.to]));

  return <main className="qmap-page">
    <div className="qmap-shell">
      <header className="qmap-header">
        <div>
          <div className="qmap-kicker">SUHWAKHAENG LAB <span>LOCAL PREVIEW</span></div>
          <h1>Q-Map <span>문제에서 문제로 이어지는 학습 지도</span></h1>
          <p>틀린 문제에서 출발해 필요한 개념을 확인하고, 배운 내용을 오늘의 문제에 다시 적용해 봅니다.</p>
          <a href="/dev/goal-learning" style={{ display: 'inline-block', marginTop: 12, color: '#286646', fontSize: 13, fontWeight: 700 }}>목표 문제 하나로 시작하는 학습 체험 →</a>
        </div>
        <div className="qmap-header__numbers" aria-label="시안에 포함된 문제 수">
          <div><strong>01</strong><span>틀린 진단 문제</span></div>
          <div><strong>04</strong><span>이전에 푼 문제</span></div>
          <div><strong>05</strong><span>오늘의 문제</span></div>
        </div>
      </header>

      <section className="qmap-today" aria-labelledby="qmap-today-title">
        <div className="qmap-section-heading">
          <div><span className="qmap-section-heading__overline">TODAY'S PATH</span><h2 id="qmap-today-title">오늘 풀 5문제</h2></div>
          <p>개념 하나를 깊게 묻는 AN과 여러 개념을 함께 쓰는 BN을 섞은 예시예요.</p>
        </div>
        <div className="qmap-today__list">
          {todayProblems.map(problem => <button
            type="button"
            key={problem.id}
            className={`qmap-today__item${selected.id === problem.id ? ' is-selected' : ''}`}
            onClick={() => setSelectedId(problem.id)}
            aria-pressed={selected.id === problem.id}
          >
            <span className="qmap-today__number">{problem.todayOrder}</span>
            <span className="qmap-today__copy"><strong>{problem.title}</strong><small>{problem.level} · {difficultyLabel(problem.difficulty)} {problem.difficulty}/5</small></span>
            <span className="qmap-today__arrow" aria-hidden="true">↗</span>
          </button>)}
        </div>
      </section>

      <section className="qmap-workspace" aria-label="문제 연결 지도와 선택한 문제 정보">
        <div className="qmap-graph-panel">
          <div className="qmap-panel-heading">
            <div><span className="qmap-section-heading__overline">PROBLEM NETWORK</span><h2>문제 연결 지도</h2></div>
            <p>문제 카드를 눌러 연결 이유를 확인하세요.</p>
          </div>
          <div className="qmap-legend" aria-label="문제와 연결선 범례">
            <span><i className="qmap-legend__dot qmap-legend__dot--wrong" />진단 오답</span>
            <span><i className="qmap-legend__dot qmap-legend__dot--solved" />이전에 푼 문제</span>
            <span><i className="qmap-legend__dot qmap-legend__dot--today" />오늘의 문제</span>
          </div>
          <div className="qmap-graph-scroll">
            <div className="qmap-graph">
              <div className="qmap-graph__column qmap-graph__column--first"><span>레벨테스트</span></div>
              <div className="qmap-graph__column qmap-graph__column--second"><span>이전에 푼 문제</span></div>
              <div className="qmap-graph__column qmap-graph__column--third"><span>오늘의 문제</span></div>
              <svg className="qmap-graph__edges" viewBox="0 0 900 720" preserveAspectRatio="none" aria-hidden="true">
                {qMapPreviewConnections.map((connection, index) => {
                  const from = qMapProblemById(connection.from);
                  const to = qMapProblemById(connection.to);
                  if (!from || !to) return null;
                  const middle = (from.x + to.x) / 2;
                  const active = connection.from === selected.id || connection.to === selected.id;
                  return <path
                    key={`${connection.from}-${connection.to}-${index}`}
                    className={`qmap-graph__edge qmap-graph__edge--${connection.kind}${active ? ' is-active' : ''}`}
                    d={`M ${from.x} ${from.y} C ${middle} ${from.y}, ${middle} ${to.y}, ${to.x} ${to.y}`}
                  />;
                })}
              </svg>
              {qMapPreviewProblems.map(problem => <ProblemNode
                key={problem.id}
                problem={problem}
                selected={problem.id === selected.id}
                nearby={connectedIds.has(problem.id)}
                onSelect={setSelectedId}
              />)}
            </div>
          </div>
          <div className="qmap-edge-legend">
            <span><i className="qmap-edge-legend__line qmap-edge-legend__line--repair" />개념 다시 확인</span>
            <span><i className="qmap-edge-legend__line qmap-edge-legend__line--deepen" />같은 개념 심화</span>
            <span><i className="qmap-edge-legend__line qmap-edge-legend__line--combine" />배운 개념 결합</span>
          </div>
        </div>

        <aside className="qmap-inspector" aria-label="선택한 문제 상세">
          <div className="qmap-inspector__top">
            <span className="qmap-section-heading__overline">SELECTED PROBLEM</span>
            <span className={`qmap-inspector__status qmap-inspector__status--${selected.status}`}>{selected.status === 'today' ? `오늘 ${selected.todayOrder}번` : selected.status === 'solved' ? '이전에 푼 문제' : '진단 오답'}</span>
          </div>
          <h2><span>{selected.code}</span> {selected.title}</h2>
          <div className="qmap-inspector__metadata"><span>{selected.level} 문제</span><span>난이도 {selected.difficulty}/5 · {difficultyLabel(selected.difficulty)}</span></div>
          <div className="qmap-inspector__prompt"><span>문제 예시</span><p>{selected.prompt}</p></div>
          <div className="qmap-inspector__block">
            <h3>이 문제에서 쓰는 개념</h3>
            <div className="qmap-inspector__tags">{selected.tags.map(tag => <span key={tag}>#{tag}</span>)}</div>
          </div>
          <div className="qmap-inspector__block">
            <h3>이 문제와 연결된 문제 <small>{connections.length}</small></h3>
            {connections.length === 0 ? <p className="qmap-inspector__empty">연결된 문제가 없습니다.</p> : <div className="qmap-inspector__connections">
              {connections.map((connection, index) => {
                const other = otherProblem(connection, selected.id);
                if (!other) return null;
                return <button key={`${other.id}-${index}`} type="button" onClick={() => setSelectedId(other.id)}>
                  <span className={`qmap-inspector__connection-kind qmap-inspector__connection-kind--${connection.kind}`}>{connectionKindLabels[connection.kind]}</span>
                  <strong>{other.code} {other.title}</strong>
                  <small>{connection.label} · #{connection.sharedTags.join(' #')}</small>
                </button>;
              })}
            </div>}
          </div>
          <div className="qmap-inspector__block qmap-inspector__notes">
            <div className="qmap-inspector__note-heading"><div><span className="qmap-section-heading__overline">CONCEPT NOTES</span><h3>관련 개념 노트</h3></div><span>태그별로 준비된 노트</span></div>
            {selected.tags.map(tag => {
              const note = conceptNotesByName[tag];
              if (!note) return null;
              return <div className="qmap-inspector__note" key={tag}>
                <strong>{note.title}</strong>
                <p>{note.summary}</p>
                <ul>{note.recap.slice(0, 2).map(line => <li key={line}>{line}</li>)}</ul>
              </div>;
            })}
          </div>
        </aside>
      </section>
      <p className="qmap-disclaimer">화면 검토용 로컬 시안입니다. 문제·연결·오늘의 5문제는 예시 데이터이며 실제 추천 및 학생 기록과 연결되지 않습니다.</p>
    </div>
  </main>;
}
