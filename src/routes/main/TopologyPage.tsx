import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, spacing, radius, typography } from '../../lib/designTokens';
import { fetchTopology } from '../../lib/curriculumTopologyClient';
import { tokenStorage } from '../../lib/tokenStorage';
import type { TopologyNode, TopologyEdge, TopologyResponse } from '../../types/topology';
import type { MasteryStatus } from '../../types/curriculumMap';

const NODE_W = 152;
const NODE_H = 68;
const H_GAP = 72;
const V_GAP = 20;
const SECTION_PAD_X = 28;
const SECTION_PAD_TOP = 32;
const SECTION_PAD_BOTTOM = 28;
const SECTION_GAP = 16;
const BANNER_H = 40;
const CHIP_W = 112;
const CHIP_H = 32;
const CHIP_GAP_X = 8;
const CHIP_GAP_Y = 8;
const CHIPS_PER_ROW = 6;
const CANVAS_MARGIN = 16;

const CHAPTERS = ['경우의 수', '확률', '통계'] as const;
type Chapter = typeof CHAPTERS[number];

const CHAPTER_COLOR: Record<Chapter, string> = {
  '경우의 수': colors.brand500,
  '확률': '#8B5CF6',
  '통계': '#10B981',
};

const CHAPTER_BG: Record<Chapter, string> = {
  '경우의 수': '#EFF6FF',
  '확률': '#F5F3FF',
  '통계': '#ECFDF5',
};

const EXTRA_EDGES: TopologyEdge[] = [
  { source: '도수분포표', target: '히스토그램' },
  { source: '도수분포표', target: '도수분포다각형' },
  { source: '평균', target: '분산' },
  { source: '분산', target: '표준편차' },
  { source: '표준편차', target: '확률변수' },
  { source: '확률변수', target: '이산확률변수' },
  { source: '확률변수', target: '연속확률변수' },
  { source: '이산확률변수', target: '기댓값' },
  { source: '연속확률변수', target: '확률밀도함수' },
  { source: '이항분포', target: '정규분포' },
  { source: '정규분포', target: '표준정규분포' },
  { source: '모집단', target: '임의추출' },
  { source: '표본평균', target: '신뢰구간' },
];

function extractChapter(categoryPath: string): Chapter {
  const first = categoryPath.split(' > ')[0].trim();
  if ((CHAPTERS as readonly string[]).includes(first)) return first as Chapter;
  return '통계';
}

function statusBg(status: MasteryStatus, locked: boolean): string {
  if (locked) return colors.gray100;
  switch (status) {
    case 'MASTERED': return '#ECFDF5';
    case 'IN_PROGRESS': return '#FFFBEB';
    case 'WEAK': return '#FEF2F2';
    default: return colors.white;
  }
}

function statusBorderColor(status: MasteryStatus, locked: boolean): string {
  if (locked) return colors.gray300;
  switch (status) {
    case 'MASTERED': return '#22C55E';
    case 'IN_PROGRESS': return '#EAB308';
    case 'WEAK': return '#EF4444';
    default: return colors.gray300;
  }
}

function statusLabel(status: MasteryStatus, locked: boolean): string {
  if (locked) return '🔒 잠김';
  switch (status) {
    case 'MASTERED': return '✓ 통과';
    case 'IN_PROGRESS': return '◐ 진행';
    case 'WEAK': return '⚠ 약점';
    default: return '○ 미진단';
  }
}

function statusLabelColor(status: MasteryStatus, locked: boolean): string {
  if (locked) return colors.gray400;
  switch (status) {
    case 'MASTERED': return '#16A34A';
    case 'IN_PROGRESS': return '#CA8A04';
    case 'WEAK': return '#DC2626';
    default: return colors.gray500;
  }
}

// 선수 개념이 있는 노드가 WEAK이면 UNDIAGNOSED로 표시 (루트 개념만 약점 표시)
function effectiveStatus(node: TopologyNode, predecessors: Map<string, string[]>): MasteryStatus {
  if (node.status === 'WEAK' && (predecessors.get(node.tagName) ?? []).length > 0) {
    return 'UNDIAGNOSED';
  }
  return node.status;
}

interface NodeLayout {
  node: TopologyNode;
  x: number;
  y: number;
  isChip: boolean;
  chapter: Chapter;
}

interface SectionRect {
  chapter: Chapter;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ComputedLayout {
  nodeLayouts: NodeLayout[];
  sectionRects: SectionRect[];
  edges: TopologyEdge[];
  successors: Map<string, string[]>;
  predecessors: Map<string, string[]>;
  canvasWidth: number;
  canvasHeight: number;
}

function computeLayout(nodes: TopologyNode[], apiEdges: TopologyEdge[]): ComputedLayout {
  const nameSet = new Set(nodes.map(n => n.tagName));

  const edges: TopologyEdge[] = [
    ...apiEdges,
    ...EXTRA_EDGES.filter(e => nameSet.has(e.source) && nameSet.has(e.target)),
  ];

  const successors = new Map<string, string[]>();
  const predecessors = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  const nodesInEdges = new Set<string>();

  nodes.forEach(n => {
    successors.set(n.tagName, []);
    predecessors.set(n.tagName, []);
    inDegree.set(n.tagName, 0);
  });

  edges.forEach(e => {
    if (!nameSet.has(e.source) || !nameSet.has(e.target)) return;
    successors.get(e.source)!.push(e.target);
    predecessors.get(e.target)!.push(e.source);
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
    nodesInEdges.add(e.source);
    nodesInEdges.add(e.target);
  });

  // Kahn's topological sort
  const inDegCopy = new Map(inDegree);
  const topo: string[] = [];
  const queue = nodes.filter(n => inDegCopy.get(n.tagName) === 0).map(n => n.tagName);
  while (queue.length > 0) {
    const curr = queue.shift()!;
    topo.push(curr);
    for (const s of (successors.get(curr) ?? [])) {
      const d = (inDegCopy.get(s) ?? 1) - 1;
      inDegCopy.set(s, d);
      if (d === 0) queue.push(s);
    }
  }

  const depth = new Map<string, number>();
  nodes.forEach(n => depth.set(n.tagName, 0));
  for (const name of topo) {
    const d = depth.get(name) ?? 0;
    for (const s of (successors.get(name) ?? [])) {
      if (d + 1 > (depth.get(s) ?? 0)) depth.set(s, d + 1);
    }
  }

  let maxDepth = 0;
  depth.forEach(d => { if (d > maxDepth) maxDepth = d; });

  const canvasWidth =
    CANVAS_MARGIN * 2 + SECTION_PAD_X * 2 + (maxDepth + 1) * NODE_W + maxDepth * H_GAP;

  const nodeLayouts: NodeLayout[] = [];
  const sectionRects: SectionRect[] = [];
  let currentY = CANVAS_MARGIN;

  for (const chapter of CHAPTERS) {
    const chNodes = nodes.filter(n => extractChapter(n.categoryPath) === chapter);
    const connected = chNodes.filter(n => nodesInEdges.has(n.tagName));
    const isolated = chNodes.filter(n => !nodesInEdges.has(n.tagName));

    const byDepth = new Map<number, TopologyNode[]>();
    connected.forEach(n => {
      const d = depth.get(n.tagName) ?? 0;
      if (!byDepth.has(d)) byDepth.set(d, []);
      byDepth.get(d)!.push(n);
    });

    let maxRows = 0;
    byDepth.forEach(arr => { if (arr.length > maxRows) maxRows = arr.length; });

    const nodeAreaTop = currentY + BANNER_H + SECTION_PAD_TOP;

    byDepth.forEach((arr, d) => {
      arr.forEach((n, rowIdx) => {
        nodeLayouts.push({
          node: n,
          x: CANVAS_MARGIN + SECTION_PAD_X + d * (NODE_W + H_GAP),
          y: nodeAreaTop + rowIdx * (NODE_H + V_GAP),
          isChip: false,
          chapter,
        });
      });
    });

    const connectedHeight = maxRows > 0 ? maxRows * NODE_H + (maxRows - 1) * V_GAP : 0;
    const chipAreaTop = nodeAreaTop + connectedHeight + (connectedHeight > 0 ? 16 : 0);

    isolated.forEach((n, idx) => {
      const col = idx % CHIPS_PER_ROW;
      const row = Math.floor(idx / CHIPS_PER_ROW);
      nodeLayouts.push({
        node: n,
        x: CANVAS_MARGIN + SECTION_PAD_X + col * (CHIP_W + CHIP_GAP_X),
        y: chipAreaTop + row * (CHIP_H + CHIP_GAP_Y),
        isChip: true,
        chapter,
      });
    });

    const chipRows = Math.ceil(isolated.length / CHIPS_PER_ROW);
    const chipHeight = chipRows > 0 ? chipRows * CHIP_H + (chipRows - 1) * CHIP_GAP_Y : 0;

    const sectionHeight =
      BANNER_H +
      SECTION_PAD_TOP +
      connectedHeight +
      (connectedHeight > 0 && chipHeight > 0 ? 16 : 0) +
      chipHeight +
      SECTION_PAD_BOTTOM;

    sectionRects.push({
      chapter,
      x: CANVAS_MARGIN,
      y: currentY,
      width: canvasWidth - CANVAS_MARGIN * 2,
      height: sectionHeight,
    });

    currentY += sectionHeight + SECTION_GAP;
  }

  return {
    nodeLayouts,
    sectionRects,
    edges,
    successors,
    predecessors,
    canvasWidth,
    canvasHeight: currentY,
  };
}

export default function TopologyPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<TopologyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  useEffect(() => {
    const uid = tokenStorage.getUid();
    if (!uid) return;
    fetchTopology(uid)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const layout = useMemo(() => {
    if (!data) return null;
    return computeLayout(data.nodes, data.edges);
  }, [data]);

  const nodeByName = useMemo(() => {
    if (!data) return new Map<string, TopologyNode>();
    return new Map(data.nodes.map(n => [n.tagName, n]));
  }, [data]);

  function isLocked(node: TopologyNode): boolean {
    if (!layout) return false;
    if (node.status !== 'UNDIAGNOSED') return false;
    const preds = layout.predecessors.get(node.tagName) ?? [];
    return preds.length > 0 && preds.some(p => {
      const pNode = nodeByName.get(p);
      return !pNode || pNode.status !== 'MASTERED';
    });
  }

  const selectedNode = selectedName ? (nodeByName.get(selectedName) ?? null) : null;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <span style={{ ...typography.bodyTextLgRegular, color: colors.gray500 }}>불러오는 중…</span>
      </div>
    );
  }

  if (error || !layout) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <span style={{ ...typography.bodyTextLgRegular, color: colors.red500 }}>
          {error ?? '데이터를 불러오지 못했습니다.'}
        </span>
      </div>
    );
  }

  const { nodeLayouts, sectionRects, edges, successors, predecessors, canvasWidth, canvasHeight } = layout;
  const posMap = new Map(nodeLayouts.map(nl => [nl.node.tagName, nl]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl }}>
        <button
          onClick={() => navigate('/main/home')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            ...typography.bodyTextXLSemiBold,
            color: colors.brand500,
            padding: 0,
          }}
        >
          ← 홈으로
        </button>
        <h2 style={{ ...typography.headingLgBold, color: colors.gray900, margin: 0 }}>개념 지도</h2>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: spacing.lg }}>
          {([
            { label: '통과', color: '#16A34A' },
            { label: '진행', color: '#CA8A04' },
            { label: '약점', color: '#DC2626' },
            { label: '미진단', color: colors.gray500 },
          ] as const).map(item => (
            <span
              key={item.label}
              style={{ ...typography.captionMedium, color: item.color, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: item.color, display: 'inline-block', flexShrink: 0,
              }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div style={{ overflow: 'auto', flex: 1, borderRadius: radius.lg, border: `1px solid ${colors.gray200}` }}>
        <div style={{ position: 'relative', width: canvasWidth, height: canvasHeight }}>
          <svg
            width={canvasWidth}
            height={canvasHeight}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          >
            <defs>
              <marker id="arr" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <polygon points="0 0, 6 3.5, 0 7" fill={colors.gray300} />
              </marker>
              <marker id="arr-weak" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <polygon points="0 0, 6 3.5, 0 7" fill="#FCA5A5" />
              </marker>
            </defs>

            {/* Section backgrounds */}
            {sectionRects.map(r => (
              <g key={r.chapter}>
                <rect
                  x={r.x} y={r.y} width={r.width} height={r.height}
                  fill={CHAPTER_BG[r.chapter]} rx={radius.lg}
                />
                {/* Banner */}
                <rect
                  x={r.x} y={r.y} width={r.width} height={BANNER_H}
                  fill={CHAPTER_COLOR[r.chapter]} rx={radius.lg}
                />
                {/* Fill rounded bottom corners of banner */}
                <rect
                  x={r.x} y={r.y + BANNER_H - radius.lg}
                  width={r.width} height={radius.lg}
                  fill={CHAPTER_COLOR[r.chapter]}
                />
                <text
                  x={r.x + 18}
                  y={r.y + BANNER_H / 2 + 6}
                  fill="white"
                  fontWeight={700}
                  fontSize={15}
                >
                  {r.chapter}
                </text>
              </g>
            ))}

            {/* Edges */}
            {edges.map((e, i) => {
              const src = posMap.get(e.source);
              const tgt = posMap.get(e.target);
              if (!src || !tgt || src.isChip || tgt.isChip) return null;

              const x1 = src.x + NODE_W;
              const y1 = src.y + NODE_H / 2;
              const x2 = tgt.x - 1;
              const y2 = tgt.y + NODE_H / 2;
              const cx = (x1 + x2) / 2;
              const isWeak = src.node.status === 'WEAK';

              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={isWeak ? '#FCA5A5' : colors.gray300}
                  strokeWidth={2}
                  markerEnd={isWeak ? 'url(#arr-weak)' : 'url(#arr)'}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {nodeLayouts.map(nl => {
            const locked = isLocked(nl.node);
            const eStatus = effectiveStatus(nl.node, predecessors);
            const bc = statusBorderColor(eStatus, locked);

            if (nl.isChip) {
              return (
                <button
                  key={nl.node.tagName}
                  onClick={() => setSelectedName(nl.node.tagName)}
                  style={{
                    position: 'absolute',
                    left: nl.x,
                    top: nl.y,
                    width: CHIP_W,
                    height: CHIP_H,
                    borderRadius: radius.full,
                    border: `1px solid ${CHAPTER_COLOR[nl.chapter]}`,
                    background: colors.white,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: `0 ${spacing.sm}px`,
                    overflow: 'hidden',
                    boxShadow: selectedName === nl.node.tagName ? `0 0 0 2px ${CHAPTER_COLOR[nl.chapter]}` : 'none',
                  }}
                >
                  <span style={{
                    ...typography.captionMedium,
                    color: colors.gray700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {nl.node.tagName}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={nl.node.tagName}
                onClick={() => setSelectedName(nl.node.tagName)}
                style={{
                  position: 'absolute',
                  left: nl.x,
                  top: nl.y,
                  width: NODE_W,
                  height: NODE_H,
                  borderRadius: radius.md,
                  borderTop: `1px solid ${bc}`,
                  borderRight: `1px solid ${bc}`,
                  borderBottom: `1px solid ${bc}`,
                  borderLeft: `4px solid ${CHAPTER_COLOR[nl.chapter]}`,
                  background: statusBg(eStatus, locked),
                  cursor: 'pointer',
                  textAlign: 'left',
                  padding: spacing.sm,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  opacity: locked ? 0.6 : 1,
                  boxSizing: 'border-box',
                  boxShadow: selectedName === nl.node.tagName
                    ? `0 0 0 2px ${CHAPTER_COLOR[nl.chapter]}`
                    : '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >
                <span style={{
                  ...typography.bodyTextXLSemiBold,
                  color: locked ? colors.gray400 : colors.gray900,
                  lineHeight: 1.3,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {nl.node.tagName}
                </span>
                <span style={{ ...typography.captionMedium, color: statusLabelColor(eStatus, locked) }}>
                  {statusLabel(eStatus, locked)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Side panel */}
      {selectedNode && (
        <div
          style={{
            position: 'fixed',
            right: 0,
            top: 0,
            bottom: 0,
            width: 284,
            background: colors.white,
            boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
            padding: spacing.xl,
            overflowY: 'auto',
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.lg,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <p style={{ ...typography.captionMedium, color: colors.gray500, margin: 0 }}>
                {selectedNode.categoryPath}
              </p>
              <h3 style={{ ...typography.headingMdBold, color: colors.gray900, margin: '4px 0 0' }}>
                {selectedNode.tagName}
              </h3>
            </div>
            <button
              onClick={() => setSelectedName(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 18,
                color: colors.gray400,
                padding: 0,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>

          {(() => {
            const selLocked = isLocked(selectedNode);
            const selEStatus = effectiveStatus(selectedNode, predecessors);
            return (
              <span style={{
                ...typography.captionSemiBold,
                color: statusLabelColor(selEStatus, selLocked),
                padding: `${spacing.xxs}px ${spacing.sm}px`,
                borderRadius: radius.full,
                background: statusBg(selEStatus, selLocked),
                border: `1px solid ${statusBorderColor(selEStatus, selLocked)}`,
                alignSelf: 'flex-start',
              }}>
                {statusLabel(selEStatus, selLocked)}
              </span>
            );
          })()}

          {/* Prerequisites */}
          {(predecessors.get(selectedNode.tagName) ?? []).length > 0 && (
            <div>
              <p style={{ ...typography.captionSemiBold, color: colors.gray500, margin: '0 0 8px' }}>
                이 개념을 배우려면
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                {(predecessors.get(selectedNode.tagName) ?? []).map(name => {
                  const n = nodeByName.get(name);
                  if (!n) return null;
                  return (
                    <button
                      key={name}
                      onClick={() => setSelectedName(name)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: `${spacing.xs}px ${spacing.sm}px`,
                        borderRadius: radius.sm,
                        background: statusBg(n.status, false),
                        cursor: 'pointer',
                        border: `1px solid ${statusBorderColor(n.status, false)}`,
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ ...typography.captionMedium, color: colors.gray800 }}>{name}</span>
                      <span style={{ ...typography.captionMedium, color: statusLabelColor(effectiveStatus(n, predecessors), false) }}>
                        {statusLabel(effectiveStatus(n, predecessors), false)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Successors */}
          {(successors.get(selectedNode.tagName) ?? []).length > 0 && (
            <div>
              <p style={{ ...typography.captionSemiBold, color: colors.gray500, margin: '0 0 8px' }}>
                이걸 배우면 열리는 개념
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                {(successors.get(selectedNode.tagName) ?? []).map(name => {
                  const n = nodeByName.get(name);
                  if (!n) return null;
                  const nLocked = isLocked(n);
                  const nEStatus = effectiveStatus(n, predecessors);
                  return (
                    <button
                      key={name}
                      onClick={() => setSelectedName(name)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: `${spacing.xs}px ${spacing.sm}px`,
                        borderRadius: radius.sm,
                        background: statusBg(nEStatus, nLocked),
                        cursor: 'pointer',
                        border: `1px solid ${statusBorderColor(nEStatus, nLocked)}`,
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ ...typography.captionMedium, color: colors.gray800 }}>{name}</span>
                      <span style={{ ...typography.captionMedium, color: statusLabelColor(nEStatus, nLocked) }}>
                        {statusLabel(nEStatus, nLocked)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
