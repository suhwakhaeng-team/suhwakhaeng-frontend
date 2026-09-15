import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import type { Concept, ConceptStatus, GraphIndex, ProgressMap } from '../../types/learningGraph';
import { getRelatedConcepts, getRelatedUnits, getUnitProgress, statusOf } from '../../services/learningGraph';
import { conceptEdgeKey, CONCEPT_PAGE_SIZE, directedEdge, layoutAllConcepts, layoutFocusedGraph, layoutUnits, routedConceptEdge, type Point } from '../../services/learningGraphLayout';
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

const palette = { unset: '#6D7280', known: '#22C55E', unknown: '#EF4444' };
const assessmentPalette = { MASTERED: '#22C55E', IN_PROGRESS: '#EAB308', WEAK: '#EF4444', UNDIAGNOSED: '#6D7280' };
const assessmentLabel = { MASTERED: '통과', IN_PROGRESS: '진행 중', WEAK: '약점', UNDIAGNOSED: '미진단' };
const clampZoom = (k: number) => Math.min(2.7, Math.max(.48, k));
const shortUnitName = (name: string) => name.split('>').at(-1)?.trim() || name;
const conceptColor = (concept: Concept, progress: ProgressMap) => concept.metadata?.assessmentStatus
  ? assessmentPalette[concept.metadata.assessmentStatus]
  : palette[statusOf(progress, concept.id)];
const conceptState = (concept: Concept, progress: ProgressMap) => concept.metadata?.assessmentStatus
  ? assessmentLabel[concept.metadata.assessmentStatus]
  : ({ known: '앎', unknown: '모름', unset: '미정' })[statusOf(progress, concept.id)];

function reduceEdges(edges: GraphIndex['unitEdges']) {
  const outgoing = new Map<string, string[]>();
  edges.forEach(edge => outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]));
  return edges.filter(edge => {
    const queue = (outgoing.get(edge.source) ?? []).filter(target => target !== edge.target);
    const visited = new Set(queue);
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const current = queue[cursor];
      if (current === edge.target) return false;
      for (const next of outgoing.get(current) ?? []) if (!visited.has(next)) { visited.add(next); queue.push(next); }
    }
    return true;
  });
}

export default function KnowledgeGraph({ index, progress, expanded, selected, page, filter, gapPath, focus, onExpand, onSelect, onPage }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ width: 1000, height: 650 });
  const [camera, setCamera] = useState({ x: 0, y: 0, k: 1 });
  const [dragging, setDragging] = useState(false);
  const [hoveredConcept, setHoveredConcept] = useState<string | null>(null);
  const layoutSelected = useDeferredValue(selected);
  const cameraRef = useRef(camera);
  const pointers = useRef(new Map<number, Point>());
  const moved = useRef(false);
  const units = useMemo(() => layoutUnits(index), [index]);
  const allConceptPoints = useMemo(() => layoutAllConcepts(index, units), [index, units]);
  const unitEdges = useMemo(() => reduceEdges(index.unitEdges), [index]);
  const unitConcepts = useMemo(() => expanded ? index.unitConcepts.get(expanded) ?? [] : [], [index, expanded]);
  const visibleConcepts = useMemo(() => unitConcepts.slice(page * CONCEPT_PAGE_SIZE, (page + 1) * CONCEPT_PAGE_SIZE), [unitConcepts, page]);
  const activePoint = expanded ? units.get(expanded) : undefined;
  const focusedState = useMemo(() => {
    if (!layoutSelected) return null;
    const ancestors = getRelatedConcepts(index, layoutSelected, 'ancestors');
    const concepts = new Set([layoutSelected, ...ancestors]);
    return { concepts, graph: layoutFocusedGraph(index, concepts) };
  }, [index, layoutSelected]);
  const prerequisiteConcepts = focusedState?.concepts ?? null;
  const displayedConcepts = useMemo(() => prerequisiteConcepts
    ? index.data.concepts.filter(concept => prerequisiteConcepts.has(concept.id))
    : visibleConcepts, [index, prerequisiteConcepts, visibleConcepts]);
  const focusedGraph = focusedState?.graph ?? null;
  const points = useMemo(() => focusedGraph?.points
    ?? new Map(displayedConcepts.map(concept => [concept.id, allConceptPoints.get(concept.id)!])),
  [allConceptPoints, displayedConcepts, focusedGraph]);
  const activeHoveredConcept = hoveredConcept && points.has(hoveredConcept) ? hoveredConcept : null;
  const hoverPath = useMemo(() => {
    if (!activeHoveredConcept) return null;
    const ancestors = getRelatedConcepts(index, activeHoveredConcept, 'ancestors');
    return new Set([activeHoveredConcept, ...ancestors]);
  }, [activeHoveredConcept, index]);
  const prerequisiteUnits = useMemo(() => {
    if (!expanded) return null;
    if (prerequisiteConcepts) {
      return new Set([...prerequisiteConcepts].map(id => index.concepts.get(id)?.unitId).filter((id): id is string => Boolean(id)));
    }
    return new Set([expanded, ...getRelatedUnits(index, expanded, 'ancestors')]);
  }, [expanded, index, prerequisiteConcepts]);

  const applyCamera = useCallback((next: typeof camera) => { cameraRef.current = next; setCamera(next); }, []);
  const framePoints = useCallback((targets: Point[], maxZoom = 1.2, horizontalPadding = 90) => {
    if (!targets.length) return;
    const reservedRight = selected && size.width >= 900 ? 310 : 0;
    const usableWidth = size.width - reservedRight;
    const minX = Math.min(...targets.map(p => p.x)) - horizontalPadding;
    const maxX = Math.max(...targets.map(p => p.x)) + horizontalPadding;
    const minY = Math.min(...targets.map(p => p.y)) - 85;
    const maxY = Math.max(...targets.map(p => p.y)) + 85;
    const k = clampZoom(Math.min(maxZoom, (usableWidth - 80) / (maxX - minX), (size.height - 105) / (maxY - minY)));
    applyCamera({ x: usableWidth / 2 - (minX + maxX) / 2 * k, y: size.height / 2 - (minY + maxY) / 2 * k, k });
  }, [applyCamera, selected, size]);
  const fit = useCallback(() => framePoints([...units.values()], 1.15), [framePoints, units]);

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
      const next = { x: x - (x - current.x) * k / current.k, y: y - (y - current.y) * k / current.k, k };
      cameraRef.current = next; setCamera(next);
    };
    svg.addEventListener('wheel', wheel, { passive: false });
    return () => { observer.disconnect(); svg.removeEventListener('wheel', wheel); };
  }, []);

  useEffect(() => {
    // 선택 테두리는 즉시 보여주고, 무거운 선수 그래프 배치가 준비된 뒤 한 번만 이동한다.
    if (focus.kind === 'concept' && focus.id !== layoutSelected) return;
    const frame = requestAnimationFrame(() => {
      if (focus.kind === 'all' || !expanded || !activePoint) framePoints([...units.values()], 1.15);
      else if (focus.kind === 'concept' && layoutSelected && points.has(layoutSelected)) {
        framePoints([points.get(layoutSelected)!], 1.35, 110);
      } else framePoints([activePoint, ...points.values()], 1.28, 90);
    });
    return () => cancelAnimationFrame(frame);
  }, [focus, expanded, activePoint, points, units, prerequisiteConcepts, framePoints, layoutSelected]);

  const pointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    const previous = pointers.current.get(event.pointerId)!;
    const dx = event.clientX - previous.x, dy = event.clientY - previous.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) moved.current = true;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    applyCamera({ ...cameraRef.current, x: cameraRef.current.x + dx, y: cameraRef.current.y + dy });
  };
  const endPointer = (event: PointerEvent<SVGSVGElement>) => { pointers.current.delete(event.pointerId); if (!pointers.current.size) setDragging(false); };
  const activate = (action: () => void) => { if (!moved.current) action(); };
  const zoom = (factor: number) => {
    const current = cameraRef.current, k = clampZoom(current.k * factor);
    applyCamera({ x: size.width / 2 - (size.width / 2 - current.x) * k / current.k, y: size.height / 2 - (size.height / 2 - current.y) * k / current.k, k });
  };
  const keyActivate = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); action(); }
  };

  return <>
    <svg ref={svgRef} className={`kg-canvas ${dragging ? 'is-dragging' : ''}`} aria-label="학습 개념 지도" tabIndex={0}
      onPointerDown={event => {
        if (event.button !== 0) return;
        moved.current = false;
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (!(event.target as Element).closest('[data-node]')) event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
      }} onPointerMove={pointerMove} onPointerUp={endPointer} onPointerCancel={endPointer}
      onKeyDown={event => {
        if ((event.target as Element).closest('[data-node]')) return;
        if (event.key === '+' || event.key === '=') zoom(1.2);
        else if (event.key === '-') zoom(1 / 1.2);
        else if (event.key === '0') fit();
      }}>
      <defs>
        <marker id="kg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 10 5 0 10Z" /></marker>
        <marker id="kg-concept-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 10 5 0 10Z" /></marker>
        <marker id="kg-concept-arrow-active" className="kg-marker-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 10 5 0 10Z" /></marker>
      </defs>
      <g className="kg-camera" style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.k})`, transition: dragging ? 'none' : undefined }}>
        {unitEdges.map(edge => {
          const relevant = !prerequisiteUnits || (prerequisiteUnits.has(edge.source) && prerequisiteUnits.has(edge.target));
          return <path key={`${edge.source}:${edge.target}`} className={`kg-unit-edge ${relevant && prerequisiteUnits ? 'is-relevant' : ''} ${!relevant ? 'is-dim' : ''}`} d={directedEdge(units.get(edge.source)!, units.get(edge.target)!, 18, 18)} markerEnd="url(#kg-arrow)" />;
        })}
        {displayedConcepts.flatMap(target => target.prerequisites
          .filter(source => points.has(source))
          .map(source => {
            const relevant = !prerequisiteConcepts || (prerequisiteConcepts.has(source) && prerequisiteConcepts.has(target.id));
            const hoverRelevant = !hoverPath || (hoverPath.has(source) && hoverPath.has(target.id));
            const route = focusedGraph?.routes.get(conceptEdgeKey(source, target.id));
            const path = route ? routedConceptEdge(route) : directedEdge(points.get(source)!, points.get(target.id)!, 10, 10);
            const highlighted = !!hoverPath && hoverRelevant;
            return <path key={`concept:${source}:${target.id}`} className={`kg-concept-edge ${relevant && prerequisiteConcepts ? 'is-relevant' : ''} ${!relevant ? 'is-dim' : ''} ${!hoverRelevant ? 'is-hover-dim' : ''} ${highlighted ? 'is-hover-active' : ''}`} d={path} markerMid={route && route.length > 2 && highlighted ? 'url(#kg-concept-arrow-active)' : undefined} markerEnd={highlighted ? 'url(#kg-concept-arrow-active)' : 'url(#kg-concept-arrow)'} />;
          }))}
        {index.data.units.map(unit => {
          const p = units.get(unit.id)!;
          const concepts = index.unitConcepts.get(unit.id) ?? [];
          const serverStates = concepts.map(concept => concept.metadata?.assessmentStatus).filter(Boolean);
          const stat = getUnitProgress(index, unit.id, progress);
          const color = serverStates.length
            ? serverStates.every(state => state === 'MASTERED') ? assessmentPalette.MASTERED
              : serverStates.includes('WEAK') ? assessmentPalette.WEAK
                : serverStates.includes('IN_PROGRESS') ? assessmentPalette.IN_PROGRESS : assessmentPalette.UNDIAGNOSED
            : stat.ratio === 1 ? palette.known : palette.unset;
          const matches = concepts.some(concept => (filter === 'all' || statusOf(progress, concept.id) === filter) && (!gapPath || gapPath.has(concept.id)));
          const dim = (!!prerequisiteUnits && !prerequisiteUnits.has(unit.id)) || (!matches && (filter !== 'all' || !!gapPath));
          return <g key={unit.id} transform={`translate(${p.x},${p.y})`} className={`kg-unit ${expanded === unit.id ? 'is-expanded' : ''} ${dim ? 'is-dim' : ''}`} style={{ '--node-color': color } as CSSProperties} data-node="unit" role="button" tabIndex={0} aria-label={`${shortUnitName(unit.name)}, ${concepts.length}개 개념`} aria-expanded={expanded === unit.id} onClick={() => activate(() => onExpand(unit.id))} onKeyDown={event => keyActivate(event, () => onExpand(unit.id))}>
            <title>{shortUnitName(unit.name)} · {concepts.length}개 개념</title>
            <circle className="kg-hit" r="30" />
            <circle className="kg-node-glow" r="18" />
            <circle className="kg-node-ring" r="11" />
            <circle className="kg-node-core" r="5" />
            <text className="kg-unit-name" textAnchor="middle" y="-25">{shortUnitName(unit.name)}</text>
            <text className="kg-unit-count" textAnchor="middle" y="32">{concepts.length}개</text>
          </g>;
        })}
        {displayedConcepts.map(concept => {
          const p = points.get(concept.id)!;
          const baseDim = (!!prerequisiteConcepts && !prerequisiteConcepts.has(concept.id)) || (filter !== 'all' && statusOf(progress, concept.id) !== filter) || (!!gapPath && !gapPath.has(concept.id));
          const hoverDim = !!hoverPath && !hoverPath.has(concept.id);
          return <g key={concept.id} transform={`translate(${p.x},${p.y})`} className={`kg-concept ${selected === concept.id ? 'is-selected' : ''} ${baseDim ? 'is-dim' : ''} ${hoverDim ? 'is-hover-dim-node' : ''} ${activeHoveredConcept === concept.id ? 'is-hover-route' : ''}`} style={{ '--node-color': conceptColor(concept, progress) } as CSSProperties} data-node="concept" role="button" tabIndex={0} aria-label={`${concept.name}, ${conceptState(concept, progress)}`} onPointerEnter={() => setHoveredConcept(current => current === concept.id ? current : concept.id)} onPointerLeave={() => setHoveredConcept(current => current === concept.id ? null : current)} onFocus={() => setHoveredConcept(current => current === concept.id ? current : concept.id)} onBlur={() => setHoveredConcept(current => current === concept.id ? null : current)} onClick={() => activate(() => onSelect(concept.id))} onKeyDown={event => keyActivate(event, () => onSelect(concept.id))}>
            <title>{concept.name} · {conceptState(concept, progress)}</title>
            <circle className="kg-hit" r="24" />
            <circle className="kg-node-glow" r="12" />
            <circle className="kg-node-ring" r="7" />
            <circle className="kg-node-core" r="3.5" />
            <text className="kg-concept-label" textAnchor="middle" y="-16">{concept.name.length > 11 ? `${concept.name.slice(0, 10)}…` : concept.name}</text>
            <text className="kg-concept-grade" textAnchor="middle" y="19">{concept.metadata?.grade ?? '학년 미정'}</text>
          </g>;
        })}
      </g>
    </svg>
    {!selected && unitConcepts.length > CONCEPT_PAGE_SIZE && <div className="kg-pagination"><button disabled={page === 0} onClick={() => onPage(page - 1)}>이전</button><span>{page + 1}/{Math.ceil(unitConcepts.length / CONCEPT_PAGE_SIZE)}</span><button disabled={(page + 1) * CONCEPT_PAGE_SIZE >= unitConcepts.length} onClick={() => onPage(page + 1)}>다음</button></div>}
    <div className="kg-zoom"><button aria-label="축소" onClick={() => zoom(1 / 1.2)}>−</button><span>{Math.round(camera.k * 100)}%</span><button aria-label="확대" onClick={() => zoom(1.2)}>+</button><i /><button aria-label="전체 보기" onClick={fit}><GraphIcon name="focus" /></button></div>
  </>;
}
