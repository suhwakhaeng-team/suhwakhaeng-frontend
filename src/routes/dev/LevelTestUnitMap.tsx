import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  EDGES, X_BY_STAGE, NODE_WIDTH, NODE_CENTER_Y, NODE_RADIUS,
  ADDITION_GATE_EDGES, edgePath, descendantDepths, type NodeStatus, type TransitionState,
} from './levelTestPreviewModel';
import { unitMapLayout, unitMapEdgeStatus } from './levelTestUnitMapLayout';

// Only the completed unit is mounted; no other unit or dashboard shell is included.
export default function LevelTestUnitMap({ domain, statuses, transition, variant = 'review' }: {
  domain: string;
  statuses: Record<string, NodeStatus>;
  transition: TransitionState | null;
  variant?: 'review' | 'result';
}) {
  const { nodes, nodeById, width, height } = unitMapLayout(domain, variant);
  const ids = new Set(nodes.map(node => node.id));
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const updateScale = () => {
      if (variant === 'result') {
        setScale(Math.max(.8, Math.min(1.5, (viewport.clientWidth - 48) / width, (viewport.clientHeight - 32) / height)));
        return;
      }
      // Preserve readable labels on small screens and allow horizontal panning.
      const availableHeight = Math.max(240, window.innerHeight - 240);
      setScale(Math.max(.65, Math.min(1.15, viewport.clientWidth / width, availableHeight / height)));
    };
    const observer = new ResizeObserver(updateScale);
    observer.observe(viewport);
    window.addEventListener('resize', updateScale);
    return () => { observer.disconnect(); window.removeEventListener('resize', updateScale); };
  }, [width, height, variant]);

  const pruneDepths = transition?.kind === 'prune' ? descendantDepths(transition.rootIds) : new Map<string, number>();
  const edgeClass = (from: string, to: string) => {
    const cutting = transition?.kind === 'prune' && (transition.rootIds.includes(from) || transition.nodeIds.includes(from) || transition.nodeIds.includes(to));
    const flowing = transition?.kind === 'pass' && transition.nodeIds.includes(from) && transition.nodeIds.includes(to);
    return `is-${unitMapEdgeStatus(statuses, from, to)}${cutting ? ' is-cutting' : ''}${flowing ? ' is-flowing' : ''}`;
  };

  return <div ref={viewportRef} className={`ltm-unit-map-window${variant === 'result' ? ' ltm-result-unit-map' : ''}`} tabIndex={0} role="region" aria-label={`${domain} 단원 결과 지도`}>
    <div className="ltm-unit-map-size" style={{ width: width * scale, height: height * scale }}>
      <div className="ltm-unit-map-canvas" style={{ width, height, transform: `scale(${scale})` }}>
        <svg className="ltm-edges" style={{ width, height }} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          <defs><marker id="ltm-unit-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>
          <g>
            {EDGES.filter(([from, to]) => ids.has(from) && ids.has(to)).map(([from, to]) => {
              if (ADDITION_GATE_EDGES.has(`${from}-${to}`)) return null;
              const source = nodeById.get(from)!;
              const target = nodeById.get(to)!;
              if (source.stage === target.stage) return null;
              return <path key={`${from}-${to}`} d={edgePath(source, target)} className={edgeClass(from, to)} />;
            })}
            {ids.has('addition') && (() => {
              const addition = nodeById.get('addition')!;
              const gateX = 664;
              const gateY = addition.y + NODE_CENTER_Y;
              const bothPassed = statuses.complement === 'passed' && statuses.disjoint === 'passed';
              const gatePruned = statuses.addition === 'pruned';
              return <g className="ltm-edge-merge">
                {['complement', 'disjoint'].map(id => {
                  const source = nodeById.get(id)!;
                  const x = X_BY_STAGE[source.stage] + NODE_WIDTH / 2 + NODE_RADIUS;
                  const y = source.y + NODE_CENTER_Y;
                  return <path key={id} d={`M ${x} ${y} C ${x + 42} ${y}, ${gateX - 42} ${gateY}, ${gateX} ${gateY}`} className={edgeClass(id, 'addition')} />;
                })}
                <path d={`M ${gateX} ${gateY} L ${X_BY_STAGE[addition.stage] + NODE_WIDTH / 2 - NODE_RADIUS} ${gateY}`} className={`ltm-merge-tail ${gatePruned ? 'is-pruned' : bothPassed ? 'is-passed' : 'is-idle'}`} />
              </g>;
            })()}
          </g>
        </svg>
        {nodes.map(node => {
          const status = statuses[node.id] ?? 'idle';
          const passing = transition?.kind === 'pass' && transition.nodeIds.includes(node.id);
          const failing = transition?.kind === 'prune' && transition.rootIds.includes(node.id);
          const pruning = transition?.kind === 'prune' && transition.nodeIds.includes(node.id);
          const delay = passing ? transition.nodeIds.indexOf(node.id) * 110 : Math.min(pruneDepths.get(node.id) ?? 0, 6) * 110;
          return <div key={node.id} role="img"
            aria-label={`${node.label}, ${status === 'passed' ? '통과' : status === 'failed' ? '학습 필요' : status === 'pruned' ? '이번 진단 생략' : '미확인'}`}
            className={`ltm-node is-${status}${passing ? ' is-just-passed' : ''}${failing ? ' is-failing' : ''}${pruning ? ' is-pruning' : ''}`}
            style={{ left: X_BY_STAGE[node.stage], top: node.y, '--transition-delay': `${delay}ms` } as CSSProperties}>
            <span>{node.label}</span>
            <i className="ltm-node-glyph" aria-hidden="true"><i /><i /></i>
            {status !== 'idle' && <b aria-hidden="true">{status === 'passed' ? '✓' : status === 'failed' ? '!' : '—'}</b>}
          </div>;
        })}
      </div>
    </div>
  </div>;
}
