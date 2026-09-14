import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import type { ConceptStatus, GraphIndex, ProgressMap } from '../../types/learningGraph';
import { getRelatedConcepts, getUnitProgress, statusOf } from '../../services/learningGraph';
import { CONCEPT_PAGE_SIZE, curvedEdge, layoutConcepts, layoutUnits, type Point } from '../../services/learningGraphLayout';
import GraphIcon from './GraphIcon';

export interface FocusRequest { id: string; kind: 'unit' | 'concept' | 'all'; tick: number }
interface Props {
  index: GraphIndex;
  progress: ProgressMap;
  expanded: string | null;
  selected: string | null;
  page: number;
  filter: ConceptStatus | 'all';
  gapPath: Set<string> | null;
  focus: FocusRequest;
  onExpand: (id: string) => void;
  onSelect: (id: string) => void;
  onPage: (page: number) => void;
}
const palette = { unset: '#60a5fa', known: '#4ade80', unknown: '#fb7185' };
const clampZoom = (k: number) => Math.min(2.6, Math.max(.15, k));

export default function KnowledgeGraph({ index, progress, expanded, selected, page, filter, gapPath, focus, onExpand, onSelect, onPage }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ width: 1000, height: 650 });
  const [camera, setCamera] = useState({ x: 0, y: 0, k: 1 });
  const [dragging, setDragging] = useState(false);
  const cameraRef = useRef(camera);
  const pointers = useRef(new Map<number, Point>());
  const moved = useRef(false);
  const units = useMemo(() => layoutUnits(index, expanded), [index, expanded]);
  const unitConcepts = expanded ? index.unitConcepts.get(expanded) ?? [] : [];
  const visibleConcepts = unitConcepts.slice(page * CONCEPT_PAGE_SIZE, (page + 1) * CONCEPT_PAGE_SIZE);
  const points = layoutConcepts(visibleConcepts.map(c => c.id), expanded ? units.get(expanded)! : { x: 0, y: 0 });
  const ancestors = useMemo(() => selected ? getRelatedConcepts(index, selected, 'ancestors') : new Set<string>(), [index, selected]);
  const descendants = useMemo(() => selected ? getRelatedConcepts(index, selected, 'descendants') : new Set<string>(), [index, selected]);
  const relatedUnits = new Set([...ancestors, ...descendants, ...(selected ? [selected] : [])].map(id => index.concepts.get(id)!.unitId));
  const activePoint = expanded ? units.get(expanded) : null;
  const visibleMatches = visibleConcepts.filter(c => (filter === 'all' || statusOf(progress, c.id) === filter) && (!gapPath || gapPath.has(c.id))).length;

  const applyCamera = (next: typeof camera) => { cameraRef.current = next; setCamera(next); };
  const fit = () => {
    const all = [...units.values(), ...points.values()];
    if (!all.length) return;
    const minX = Math.min(...all.map(p => p.x)) - 100, maxX = Math.max(...all.map(p => p.x)) + 100;
    const minY = Math.min(...all.map(p => p.y)) - 90, maxY = Math.max(...all.map(p => p.y)) + 100;
    const k = Math.min(1.25, (size.width - 90) / (maxX - minX), (size.height - 140) / (maxY - minY));
    applyCamera({ x: size.width / 2 - (minX + maxX) / 2 * k, y: size.height / 2 - (minY + maxY) / 2 * k, k: clampZoom(k) });
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    observer.observe(svg);
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = svg.getBoundingClientRect();
      const x = event.clientX - rect.left, y = event.clientY - rect.top;
      const current = cameraRef.current, k = clampZoom(current.k * Math.exp(-event.deltaY * .0015));
      setDragging(false);
      const next = { x: x - (x - current.x) * k / current.k, y: y - (y - current.y) * k / current.k, k };
      cameraRef.current = next; setCamera(next);
    };
    svg.addEventListener('wheel', wheel, { passive: false });
    return () => { observer.disconnect(); svg.removeEventListener('wheel', wheel); };
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const all = [...units.values()];
      if (!all.length) return;
      let next: typeof camera;
      if (focus.kind === 'all') {
        const minX = Math.min(...all.map(p => p.x)) - 110, maxX = Math.max(...all.map(p => p.x)) + 110;
        const minY = Math.min(...all.map(p => p.y)) - 110, maxY = Math.max(...all.map(p => p.y)) + 110;
        const k = clampZoom(Math.min(1.25, (size.width - 80) / (maxX - minX), (size.height - 160) / (maxY - minY)));
        next = { x: size.width / 2 - (minX + maxX) / 2 * k, y: size.height / 2 - (minY + maxY) / 2 * k, k };
      } else {
        const unitId = focus.kind === 'concept' ? index.concepts.get(focus.id)?.unitId : focus.id;
        const p = unitId ? units.get(unitId) : undefined;
        if (!p) return;
        const k = clampZoom(Math.min(1.2, size.height / 590, size.width / (size.width > 800 && selected ? 850 : 620)));
        next = { x: size.width * (size.width > 800 && selected ? .65 : .5) - p.x * k, y: size.height * (size.width <= 700 && selected ? .7 : .52) - p.y * k, k };
      }
      cameraRef.current = next; setCamera(next);
    });
    return () => cancelAnimationFrame(frame);
  }, [focus, size, units, index, selected]);

  const pointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    const before = [...pointers.current.values()];
    const previous = pointers.current.get(event.pointerId)!;
    const dx = event.clientX - previous.x, dy = event.clientY - previous.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) moved.current = true;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const current = cameraRef.current;
    if (before.length === 2) {
      const after = [...pointers.current.values()];
      const rect = svgRef.current!.getBoundingClientRect();
      const distance = (p: Point[]) => Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      const oldMid = { x: (before[0].x + before[1].x) / 2 - rect.left, y: (before[0].y + before[1].y) / 2 - rect.top };
      const newMid = { x: (after[0].x + after[1].x) / 2 - rect.left, y: (after[0].y + after[1].y) / 2 - rect.top };
      const k = clampZoom(current.k * distance(after) / (distance(before) || 1));
      applyCamera({ x: newMid.x - (oldMid.x - current.x) * k / current.k, y: newMid.y - (oldMid.y - current.y) * k / current.k, k });
      moved.current = true;
    } else applyCamera({ ...current, x: current.x + dx, y: current.y + dy });
  };
  const endPointer = (event: PointerEvent<SVGSVGElement>) => { pointers.current.delete(event.pointerId); if (!pointers.current.size) setDragging(false); };
  const activate = (action: () => void) => { if (!moved.current) action(); };
  const zoom = (factor: number) => {
    const k = clampZoom(camera.k * factor);
    applyCamera({ x: size.width / 2 - (size.width / 2 - camera.x) * k / camera.k, y: size.height / 2 - (size.height / 2 - camera.y) * k / camera.k, k });
  };
  const keyActivate = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); action(); }
  };
  const isDim = (id: string) => gapPath ? !gapPath.has(id) : filter !== 'all' ? statusOf(progress, id) !== filter : !!(selected && id !== selected && !ancestors.has(id) && !descendants.has(id));

  return <>
    <svg ref={svgRef} className={`kg-canvas ${dragging ? 'is-dragging' : ''}`} aria-label="학습 개념 그래프. 방향키로 이동, 더하기·빼기로 확대 축소, 0으로 전체 보기" tabIndex={0}
      onPointerDown={event => {
        if (event.button !== 0) return;
        if (!pointers.current.size) moved.current = false;
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        // Retain node clicks; capture background drags only.
        if (!(event.target as Element).closest('[data-node]')) event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
      }} onPointerMove={pointerMove} onPointerUp={endPointer} onPointerCancel={endPointer}
      onPointerLeave={event => { if (!event.currentTarget.hasPointerCapture(event.pointerId)) endPointer(event); }}
      onKeyDown={event => {
        if ((event.target as Element).closest('[data-node]')) return;
        if (event.key === '+' || event.key === '=') zoom(1.2);
        else if (event.key === '-') zoom(1 / 1.2);
        else if (event.key === '0') fit();
        else if (event.key.startsWith('Arrow')) { event.preventDefault(); applyCamera({ ...camera, x: camera.x + (event.key === 'ArrowLeft' ? 50 : event.key === 'ArrowRight' ? -50 : 0), y: camera.y + (event.key === 'ArrowUp' ? 50 : event.key === 'ArrowDown' ? -50 : 0) }); }
      }}>
      <defs><marker id="kg-arrow" viewBox="0 0 10 10" refX="38" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#708391" /></marker></defs>
      <g className="kg-camera" style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.k})`, transition: dragging ? 'none' : undefined }}>
        {index.unitEdges.map(edge => <path key={`${edge.source}:${edge.target}`} className={`kg-unit-edge ${selected && (!relatedUnits.has(edge.source) || !relatedUnits.has(edge.target)) ? 'is-dim' : ''}`} d={curvedEdge(units.get(edge.source)!, units.get(edge.target)!)} markerEnd="url(#kg-arrow)" />)}
        {activePoint && visibleConcepts.map(c => <path key={`spoke-${c.id}`} className="kg-spoke" d={curvedEdge(activePoint, points.get(c.id)!)} />)}
        {visibleConcepts.flatMap(c => c.prerequisites.map(id => {
          const source = points.get(id) ?? units.get(index.concepts.get(id)!.unitId);
          return source && <path key={`${id}:${c.id}`} d={curvedEdge(source, points.get(c.id)!)} className={`kg-concept-edge ${selected === c.id ? 'is-direct' : ''} ${isDim(c.id) ? 'is-dim' : ''}`} />;
        }))}
        {index.data.units.map((unit, i) => {
          const p = units.get(unit.id)!;
          const stat = getUnitProgress(index, unit.id, progress);
          const matches = index.unitConcepts.get(unit.id)!.filter(c => (filter === 'all' || statusOf(progress, c.id) === filter) && (!gapPath || gapPath.has(c.id))).length;
          const dim = filter !== 'all' || gapPath ? !matches : selected && !relatedUnits.has(unit.id);
          return <g key={unit.id} className={`kg-unit ${expanded === unit.id ? 'is-expanded' : ''} ${dim ? 'is-dim' : ''}`} style={{ transform: `translate(${p.x}px, ${p.y}px)` }} data-node="unit" role="button" tabIndex={0} aria-label={`${unit.name}, ${stat.total}개 개념, ${stat.known}개 앎, ${expanded === unit.id ? '접기' : '펼치기'}`} aria-expanded={expanded === unit.id} onClick={() => activate(() => onExpand(unit.id))} onKeyDown={e => keyActivate(e, () => onExpand(unit.id))}>
            <title>{unit.description} · {stat.known}/{stat.total}개 앎</title>
            <circle className="kg-hit" r="45" /><circle className="kg-unit-halo" r="39" />
            <circle className="kg-unit-track" r="29" />
            <circle className="kg-unit-progress" r="29" strokeDasharray={`${stat.ratio * 182.21} 182.21`} transform="rotate(-90)" />
            <circle className="kg-unit-core" r="21" /><text className="kg-unit-number" textAnchor="middle" y="5">{String(i + 1).padStart(2, '0')}</text>
            <text className="kg-unit-name" textAnchor="middle" y="61">{unit.name}</text>
            <text className="kg-unit-count" textAnchor="middle" y="82">{filter !== 'all' || gapPath ? `${matches}개 일치 · ` : ''}{stat.known} / {stat.total} 이해</text>
            {expanded === unit.id && <text className="kg-unit-collapse" textAnchor="middle" y="-46">− 접기</text>}
          </g>;
        })}
        {visibleConcepts.map(c => {
          const p = points.get(c.id)!, status = statusOf(progress, c.id);
          const relationship = selected === c.id ? '선택한 개념' : ancestors.has(c.id) ? '선수개념' : descendants.has(c.id) ? '후속개념' : '';
          return <g key={c.id} transform={`translate(${p.x},${p.y})`}>
            <g className={`kg-concept ${selected === c.id ? 'is-selected' : ''} ${isDim(c.id) ? 'is-dim' : ''} ${descendants.has(c.id) ? 'is-descendant' : ''}`} style={{ '--node-color': palette[status], '--from-x': `${(activePoint?.x ?? p.x) - p.x}px`, '--from-y': `${(activePoint?.y ?? p.y) - p.y}px` } as CSSProperties} data-node="concept" role="button" tabIndex={0} aria-label={`${c.name}, ${status === 'known' ? '앎' : status === 'unknown' ? '모름' : '미정'}${relationship ? `, ${relationship}` : ''}`} onClick={() => activate(() => onSelect(c.id))} onKeyDown={e => keyActivate(e, () => onSelect(c.id))}>
              <title>{c.name} · {relationship || '개념'} · 클릭해서 학습 상태 확인</title>
              <circle className="kg-hit" r="24" /><circle className="kg-concept-aura" r="22" /><circle className="kg-concept-outline" r="15" /><circle className="kg-concept-dot" r="7" />
              <text className="kg-concept-label" textAnchor="middle" y="34">{c.name.length > 16 ? `${c.name.slice(0, 15)}…` : c.name}</text>
              {selected === c.id && <text className="kg-concept-current" textAnchor="middle" y="-28">지금 보고 있어요</text>}
            </g>
          </g>;
        })}
      </g>
    </svg>
    <div className="kg-stage-caption"><span className="kg-live-dot" /> {expanded ? `${index.units.get(expanded)?.name} · 개념 ${visibleConcepts.length}개 펼침` : '단원을 눌러 개념의 연결을 살펴보세요'}{expanded && (filter !== 'all' || gapPath) && <small>현재 펼친 개념 중 {visibleMatches}개 일치 · 나머지는 흐리게 표시</small>}</div>
    {unitConcepts.length > CONCEPT_PAGE_SIZE && <div className="kg-pagination"><button disabled={page === 0} onClick={() => onPage(page - 1)}>이전 개념</button><span>{page + 1} / {Math.ceil(unitConcepts.length / CONCEPT_PAGE_SIZE)}</span><button disabled={(page + 1) * CONCEPT_PAGE_SIZE >= unitConcepts.length} onClick={() => onPage(page + 1)}>다음 개념</button></div>}
    <div className="kg-zoom"><button aria-label="축소" onClick={() => zoom(1 / 1.2)}>−</button><span>{Math.round(camera.k * 100)}%</span><button aria-label="확대" onClick={() => zoom(1.2)}>+</button><i /><button aria-label="전체 그래프 보기" title="전체 보기 (0)" onClick={fit}><GraphIcon name="focus" /></button></div>
  </>;
}
