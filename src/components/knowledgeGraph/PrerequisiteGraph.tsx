import { useMemo } from 'react';
import type { GraphIndex, ProgressMap } from '../../types/learningGraph';
import { getPrerequisiteStages, statusOf } from '../../services/learningGraph';

type Point = { x: number; y: number };
type Edge = { source: string; target: string };

function reduceEdges(edges: Edge[]) {
  const outgoing = new Map<string, string[]>();
  for (const edge of edges) outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
  return edges.filter(edge => {
    const queue = (outgoing.get(edge.source) ?? []).filter(id => id !== edge.target);
    const visited = new Set(queue);
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const current = queue[cursor];
      if (current === edge.target) return false;
      for (const next of outgoing.get(current) ?? []) {
        if (!visited.has(next)) { visited.add(next); queue.push(next); }
      }
    }
    return true;
  });
}

function buildLayout(index: GraphIndex, selected: string) {
  const stages = getPrerequisiteStages(index, selected);
  const included = new Set(stages.flat());
  const edges = reduceEdges(stages.flatMap(stage => stage.flatMap(target =>
    index.concepts.get(target)!.prerequisites
      .filter(source => included.has(source) && source !== target)
      .map(source => ({ source, target })),
  )));
  const maxStageSize = Math.max(1, ...stages.map(stage => stage.length));
  const width = Math.max(272, 56 + maxStageSize * 76);
  const height = Math.max(96, 48 + (stages.length - 1) * 72);
  const points = new Map<string, Point>();
  for (const [stageIndex, stage] of stages.entries()) {
    const gap = width / (stage.length + 1);
    stage.forEach((id, indexInStage) => points.set(id, { x: gap * (indexInStage + 1), y: 22 + stageIndex * 72 }));
  }
  return { stages, edges, points, width, height };
}

function edgePath(source: Point, target: Point) {
  const midY = (source.y + target.y) / 2;
  return `M ${source.x} ${source.y + 9} V ${midY} H ${target.x} V ${target.y - 10}`;
}

export default function PrerequisiteGraph({ index, selected, progress, onSelect }: {
  index: GraphIndex;
  selected: string;
  progress: ProgressMap;
  onSelect: (id: string) => void;
}) {
  const layout = useMemo(() => buildLayout(index, selected), [index, selected]);
  const current = index.concepts.get(selected)!;
  return <section className="kg-prereq" aria-label="선수개념 경로">
    <header><strong>선수개념 그래프</strong></header>
    <div className="kg-prereq-graph">
      <svg viewBox={`0 0 ${layout.width} ${layout.height}`} style={{ minWidth: layout.width, height: layout.height }} role="img" aria-label={`${current.name}까지의 선수개념 관계`}>
        <defs>
          <marker id="kg-mini-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M 0 0 L 8 4 L 0 8 z" />
          </marker>
        </defs>
        <g aria-hidden="true">{layout.edges.map(edge => <path
          key={`${edge.source}-${edge.target}`}
          className="kg-mini-edge"
          d={edgePath(layout.points.get(edge.source)!, layout.points.get(edge.target)!)}
          markerEnd="url(#kg-mini-arrow)"
        />)}</g>
        {layout.stages.flatMap(stage => stage.map(id => {
          const concept = index.concepts.get(id)!;
          const assessed = concept.metadata?.assessmentStatus?.toLowerCase();
          const point = layout.points.get(id)!;
          return <g key={id}
            className={`kg-mini-node status-${statusOf(progress, id)} ${assessed ? `assessment-${assessed}` : ''} ${id === selected ? 'is-current' : ''}`}
            transform={`translate(${point.x} ${point.y})`}
            role="button" tabIndex={0} aria-label={concept.name} aria-current={id === selected ? 'step' : undefined}
            onClick={() => onSelect(id)}
            onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(id); } }}>
            <title>{concept.name}</title>
            <circle className="kg-hit" r="22" />
            <circle className="kg-mini-halo" r={id === selected ? 10 : 8} />
            <circle className="kg-mini-core" r="3.5" />
            <text y="22" textAnchor="middle">{concept.name.length > 8 ? `${concept.name.slice(0, 8)}…` : concept.name}</text>
            <text className="kg-mini-grade" y="34" textAnchor="middle">{concept.metadata?.grade ?? '학년 미정'}</text>
          </g>;
        }))}
      </svg>
    </div>
    {layout.stages.length === 1 && <small>바로 시작할 수 있는 개념</small>}
  </section>;
}
