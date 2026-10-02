import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { LEARNING_NODES, type Diagnostic, type LearningGoal, type LearningState, type LearningNode } from './problemLearningModel';

// Uses the same circle glyphs, type, colors and canvas sizing as the level-test map.
export default function ProblemLearningMap({ goal, state, diagnostic, currentId, nodes = LEARNING_NODES, columnGap = 250, horizontalPadding }: {
  goal: LearningGoal; state: LearningState | null; diagnostic: Diagnostic; currentId: string;
  nodes?: Record<string, LearningNode>;
  columnGap?: number;
  horizontalPadding?: number;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const width = Math.max(...Object.values(goal.positions).map(([column]) => column)) * columnGap
    + (horizontalPadding === undefined ? 330 : 174 + horizontalPadding * 2);
  const height = Math.max(...Object.values(goal.positions).map(([, row]) => row)) * 100 + 164;
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    // Fit the whole graph inside desktop cards. Small phones retain readable
    // nodes and pan horizontally instead of shrinking text into illegibility.
    const resize = () => setScale(Math.max(viewport.clientWidth < 600 ? .8 : .55,
      Math.min(1.4, (viewport.clientWidth - 48) / width, (viewport.clientHeight - 32) / height)));
    const observer = new ResizeObserver(resize);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [height, width]);
  const point = (id: string) => {
    const [column, row] = goal.positions[id];
    return { x: (horizontalPadding ?? 34) + column * columnGap, y: 52 + row * 100 };
  };
  const passed = (id: string) => state?.results[id] ? state.results[id] === 'passed'
    : diagnostic[id] === 'passed' || (nodes[id].kind === 'concept' && diagnostic[nodes[id].conceptId!] === 'passed');
  return <div ref={viewportRef} className="ltm-unit-map-window ltm-result-unit-map plm-map-window" role="region" tabIndex={0} aria-label="목표 문제와 하위 문제, 개념의 연결 지도">
    <div className="ltm-unit-map-size" style={{ width: width * scale, height: height * scale }}>
      <div className="ltm-unit-map-canvas" style={{ width, height, transform: `scale(${scale})` }}>
        <svg className="ltm-edges" style={{ width, height }} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          <defs><marker id="plm-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>
          {Object.keys(goal.positions).flatMap(id => nodes[id].requires.map(child => {
            const from = point(child); const to = point(id);
            const startX = from.x + 87 + 26; const startY = from.y + 38;
            const endX = to.x + 87 - 26; const endY = to.y + 38;
            const bend = (endX - startX) / 2;
            return <path key={`${child}-${id}`} d={`M ${startX} ${startY} C ${startX + bend} ${startY}, ${endX - bend} ${endY}, ${endX} ${endY}`}
              className={passed(child) && passed(id) ? 'is-passed' : child === currentId || id === currentId ? 'plm-current-edge' : 'is-idle'} />;
          }))}
        </svg>
        {Object.keys(goal.positions).map(id => {
          const node = nodes[id]; const p = point(id);
          const isCurrent = id === currentId && !state?.complete;
          const status = passed(id) ? 'passed' : state?.results[id] === 'failed' || diagnostic[id] === 'failed'
            || (node.kind === 'concept' && diagnostic[node.conceptId!] === 'failed') ? 'failed' : 'idle';
          const alreadyConfirmed = status === 'passed' && state?.results[id] !== 'passed';
          return <div key={id} role="img" aria-label={`${node.kind === 'concept' ? '개념' : node.kind} ${node.label}, ${isCurrent ? '현재 위치' : alreadyConfirmed ? '진단·이전 학습에서 확인' : status === 'passed' ? '이번 학습에서 해결' : status === 'failed' ? '학습 중' : '아직 풀지 않음'}`}
            className={`ltm-node is-${status}${isCurrent ? ' is-selected' : ''}`} style={{ left: p.x, top: p.y } as CSSProperties}>
            <span>{node.label}</span><i className="ltm-node-glyph" aria-hidden="true"><i /><i /></i>
            <small className="plm-node-kind">{node.kind === 'concept' ? '개념' : node.source === 'bank' ? `${node.kind} #${node.questionId}` : node.kind === 'BN' ? 'BN · UT 목표' : 'AN · 보충'}</small>
            {isCurrent ? <em>현재</em> : status !== 'idle' && <b aria-hidden="true">{status === 'passed' ? '✓' : '!'}</b>}
          </div>;
        })}
      </div>
    </div>
  </div>;
}
