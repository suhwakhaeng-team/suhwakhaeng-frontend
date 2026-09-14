import { useMemo } from 'react';
import type { GraphIndex, ProgressMap } from '../../types/learningGraph';
import { getRelatedConcepts, statusOf } from '../../services/learningGraph';
import { curvedEdge } from '../../services/learningGraphLayout';
import GraphIcon from './GraphIcon';

export default function PrerequisiteGraph({ index, selected, progress, onSelect, onBack, canBack }: {
  index: GraphIndex; selected: string; progress: ProgressMap; onSelect: (id: string) => void; onBack: () => void; canBack: boolean;
}) {
  const graph = useMemo(() => {
    const queue = [selected], depths = new Map([[selected, 0]]);
    // Bounded rendering only; diagnosis still traverses the entire dataset.
    for (let i = 0; i < queue.length && queue.length < 16; i++) {
      for (const id of index.concepts.get(queue[i])!.prerequisites) {
        if (!depths.has(id) && queue.length < 16) { depths.set(id, depths.get(queue[i])! + 1); queue.push(id); }
      }
    }
    const rows = new Map<number, string[]>();
    queue.forEach(id => rows.set(depths.get(id)!, [...(rows.get(depths.get(id)!) ?? []), id]));
    const positions = new Map<string, { x: number; y: number }>();
    let y = 32;
    // Keep the selected concept and its direct prerequisites visible before scrolling.
    [...rows.entries()].sort((a, b) => a[0] - b[0]).forEach(([, ids]) => {
      for (let start = 0; start < ids.length; start += 3) {
        const group = ids.slice(start, start + 3);
        group.forEach((id, i) => positions.set(id, { x: 304 / (group.length + 1) * (i + 1), y }));
        y += 69;
      }
    });
    return { ids: queue, positions, height: y + 3, total: getRelatedConcepts(index, selected, 'ancestors').size + 1 };
  }, [index, selected]);
  const direct = new Set(index.concepts.get(selected)!.prerequisites);
  return <section className="kg-prereq" aria-label="선수개념 미니 그래프">
    <header><div><span className="kg-eyebrow">PREREQUISITES</span><h3>이해의 뿌리</h3></div><button className="kg-icon-button" title="이전에 본 개념" aria-label="이전에 본 개념" disabled={!canBack} onClick={onBack}><GraphIcon name="back" /></button></header>
    <p>연결된 개념을 눌러 더 이전으로 탐색해요.</p>
    <div className="kg-prereq-scroll">
      <svg viewBox={`0 0 304 ${graph.height}`} aria-label={`${index.concepts.get(selected)!.name}의 선수개념 관계`}>
        <defs><marker id="kg-mini-arrow" viewBox="0 0 10 10" refX="17" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#62798e" /></marker></defs>
        {graph.ids.flatMap(id => index.concepts.get(id)!.prerequisites.filter(p => graph.positions.has(p)).map(p => <path key={`${p}:${id}`} d={curvedEdge(graph.positions.get(p)!, graph.positions.get(id)!)} className={`kg-mini-edge ${id === selected ? 'is-direct' : ''}`} markerEnd="url(#kg-mini-arrow)" />))}
        {graph.ids.map(id => {
          const p = graph.positions.get(id)!, c = index.concepts.get(id)!;
          return <g key={id} transform={`translate(${p.x},${p.y})`} className={`kg-mini-node status-${statusOf(progress, id)} ${id === selected ? 'is-current' : ''} ${!direct.has(id) && id !== selected ? 'is-indirect' : ''}`} role="button" tabIndex={0} aria-label={`선수 그래프: ${c.name}${id === selected ? ', 현재 개념' : ''}`} onClick={() => onSelect(id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(id); } }}>
            <title>{c.name} · {id === selected ? '현재' : direct.has(id) ? '직접 선수개념' : '간접 선수개념'}</title><circle className="kg-hit" r="22" /><circle className="kg-mini-ring" r="12" /><circle r="5" /><text textAnchor="middle" y="29">{c.name.length > 10 ? `${c.name.slice(0, 9)}…` : c.name}</text>
          </g>;
        })}
      </svg>
    </div>
    <footer><span><i /> 직접 선수</span><span><i /> 간접 선수</span><span>◎ 현재</span></footer>
    {graph.total > graph.ids.length && <small>가까운 {graph.ids.length - 1}개 / 전체 {graph.total - 1}개 선수개념 표시. 노드를 눌러 이어서 탐색하세요.</small>}
    {graph.ids.length === 1 && <small>선수개념이 없는 시작 개념이에요.</small>}
  </section>;
}
