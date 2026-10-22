import type { GraphIndex } from '../types/learningGraph.ts';

export interface Point { x: number; y: number }
export interface FocusedGraphLayout {
  points: Map<string, Point>;
  routes: Map<string, Point[]>;
}
export const CONCEPT_PAGE_SIZE = 18;
export const conceptEdgeKey = (source: string, target: string) => `${source}:${target}`;

type PrerequisiteMap = ReadonlyMap<string, readonly string[]>;

const LATE_BRANCH_LANE_OFFSET = 220;
const LATE_BRANCH_CONCEPT_LIFT = 200;
const UNIT_HORIZONTAL_GAP = 225;
const DATA_BASICS_DETAIL_OFFSET = 40;

function layeredLayout(ids: string[], prerequisites: PrerequisiteMap, horizontalGap: number, verticalGap: number, alignShortBranchesToMerge = false, lateBranchIds?: Set<string>) {
  const idSet = new Set(ids);
  const inputOrder = new Map(ids.map((id, index) => [id, index]));
  const degree = new Map(ids.map(id => [id, 0]));
  const successors = new Map(ids.map(id => [id, [] as string[]]));
  const predecessors = new Map(ids.map(id => [id, [] as string[]]));
  const level = new Map(ids.map(id => [id, 0]));

  ids.forEach(target => {
    for (const source of prerequisites.get(target) ?? []) {
      if (!idSet.has(source) || source === target) continue;
      degree.set(target, degree.get(target)! + 1);
      successors.get(source)!.push(target);
      predecessors.get(target)!.push(source);
    }
  });

  const queue = ids.filter(id => degree.get(id) === 0);
  const ordered: string[] = [];
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const source = queue[cursor];
    ordered.push(source);
    for (const target of successors.get(source) ?? []) {
      level.set(target, Math.max(level.get(target)!, level.get(source)! + 1));
      degree.set(target, degree.get(target)! - 1);
      if (degree.get(target) === 0) queue.push(target);
    }
  }

  // Cycles have no valid topological order. Keep them visible in a stable final
  // column instead of inventing a backwards prerequisite direction.
  const cyclic = ids.filter(id => !ordered.includes(id));
  const finalLevel = Math.max(0, ...level.values()) + (ordered.length ? 1 : 0);
  cyclic.forEach(id => level.set(id, finalLevel));
  const naturalLevel = new Map(level);

  // A short secondary route into a late merge reads more clearly beside the
  // merge than at the far-left origin. Move it to the latest valid rank while
  // preserving every prerequisite direction (for example, 자료의 정리 → 통계적 추정).
  if (alignShortBranchesToMerge) {
    for (const id of [...ordered].reverse()) {
      const next = successors.get(id) ?? [];
      if (!next.length) continue;
      level.set(id, Math.min(...next.map(target => level.get(target)! - 1)));
    }
  }

  const layers = new Map<number, string[]>();
  for (const id of [...ordered, ...cyclic]) {
    const rank = level.get(id)!;
    const layer = layers.get(rank) ?? [];
    layer.push(id);
    layers.set(rank, layer);
  }

  // Repeated barycentric sweeps keep connected branches on the same visual
  // lane and reduce crossings, while ranks preserve prerequisite direction.
  const ranks = [...layers.keys()].sort((a, b) => a - b);
  const position = new Map<string, number>();
  const refreshPositions = () => {
    for (const rank of ranks) {
      const layer = layers.get(rank)!;
      const denominator = Math.max(1, layer.length - 1);
      layer.forEach((id, index) => position.set(id, index / denominator));
    }
  };
  const sortByNeighbours = (layer: string[], neighbours: ReadonlyMap<string, string[]>) => {
    layer.sort((a, b) => {
      const barycenter = (id: string) => {
        const connected = (neighbours.get(id) ?? []).filter(next => position.has(next));
        return connected.length
          ? connected.reduce((sum, next) => sum + position.get(next)!, 0) / connected.length
          : position.get(id) ?? inputOrder.get(id)!;
      };
      return barycenter(a) - barycenter(b) || inputOrder.get(a)! - inputOrder.get(b)!;
    });
  };
  refreshPositions();
  for (let sweep = 0; sweep < 5; sweep++) {
    for (const rank of ranks.slice(1)) {
      sortByNeighbours(layers.get(rank)!, predecessors);
      refreshPositions();
    }
    for (const rank of ranks.slice(0, -1).reverse()) {
      sortByNeighbours(layers.get(rank)!, successors);
      refreshPositions();
    }
  }

  const points = new Map<string, Point>();
  for (const [rank, layer] of layers) {
    const gap = Math.max(76, verticalGap);
    const mainline = layer.filter(id => naturalLevel.get(id) === rank);
    const lateBranches = layer.filter(id => naturalLevel.get(id) !== rank);
    if (alignShortBranchesToMerge && mainline.length && lateBranches.length) {
      mainline.forEach((id, index) => points.set(id, {
        x: rank * horizontalGap,
        y: (index - (mainline.length - 1) / 2) * gap,
      }));
      const mainlineTop = -(mainline.length - 1) / 2 * gap;
      lateBranches.forEach((id, index) => points.set(id, {
        x: rank * horizontalGap,
        y: mainlineTop - LATE_BRANCH_LANE_OFFSET - (lateBranches.length - 1 - index) * gap,
      }));
      lateBranches.forEach(id => lateBranchIds?.add(id));
      continue;
    }
    layer.forEach((id, index) => points.set(id, {
      x: rank * horizontalGap,
      y: (index - (layer.length - 1) / 2) * gap,
    }));
  }
  return points;
}

function layoutUnitGraph(index: GraphIndex) {
  if (index.data.units.every(unit => unit.mapPosition)) {
    return {
      points: new Map(index.data.units.map(unit => [unit.id, { ...unit.mapPosition! }])),
      lateBranchIds: new Set<string>(),
    };
  }
  const prerequisites = new Map(index.data.units.map(unit => [unit.id, [] as string[]]));
  index.unitEdges.forEach(edge => prerequisites.get(edge.target)!.push(edge.source));
  const lateBranchIds = new Set<string>();
  const points = layeredLayout(index.data.units.map(unit => unit.id), prerequisites, UNIT_HORIZONTAL_GAP, 132, true, lateBranchIds);
  return { points, lateBranchIds };
}

export function layoutUnits(index: GraphIndex) {
  return layoutUnitGraph(index).points;
}

/** Keep the unit overview above revealed details, including tall branches. */
export function layoutContextUnits(unitPoints: ReadonlyMap<string, Point>, conceptPoints: ReadonlyMap<string, Point>) {
  if (!unitPoints.size || !conceptPoints.size) return new Map(unitPoints);
  const conceptTop = Math.min(...[...conceptPoints.values()].map(point => point.y));
  const unitBottom = Math.max(...[...unitPoints.values()].map(point => point.y));
  // Includes unit counts below their circles and concept labels above theirs.
  const offset = Math.min(0, conceptTop - unitBottom - 130);
  return new Map([...unitPoints].map(([id, point]) => [id, { x: point.x, y: point.y + offset }]));
}

export function layoutConcepts(ids: string[], center: Point, prerequisites: PrerequisiteMap = new Map()) {
  if (!ids.length) return new Map();
  const raw = layeredLayout(ids, prerequisites, 140, 104);
  const xs = [...raw.values()].map(point => point.x);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const middleX = (minX + maxX) / 2;
  // The expanded unit remains the cluster heading. Its concepts sit below it,
  // ordered left-to-right from prerequisite to dependent concept.
  return new Map([...raw].map(([id, point]) => [id, {
    x: center.x + point.x - middleX,
    y: center.y + 112 + point.y,
  }]));
}

/** Lay out a revealed prerequisite graph with Sugiyama-style virtual nodes. */
export function layoutFocusedGraph(index: GraphIndex, ids: ReadonlySet<string>): FocusedGraphLayout {
  const concepts = index.data.concepts.filter(concept => ids.has(concept.id));
  if (!concepts.length) return { points: new Map(), routes: new Map() };
  const target = concepts.find(concept => !(index.successors.get(concept.id) ?? []).some(id => ids.has(id)));
  const targetUnit = target ? index.units.get(target.unitId) : undefined;
  if (targetUnit?.mapPosition && concepts.every(concept => concept.mapPosition)) {
    const includedUnits = index.data.units.filter(unit => concepts.some(concept => concept.unitId === unit.id));
    const degrees = new Map(includedUnits.map(unit => [unit.id, 0]));
    const nextUnits = new Map(includedUnits.map(unit => [unit.id, new Set<string>()]));
    for (const concept of concepts) for (const source of concept.prerequisites) {
      const sourceUnit = index.concepts.get(source)?.unitId;
      if (!ids.has(source) || !sourceUnit || sourceUnit === concept.unitId) continue;
      if (!nextUnits.get(sourceUnit)!.has(concept.unitId)) {
        nextUnits.get(sourceUnit)!.add(concept.unitId);
        degrees.set(concept.unitId, degrees.get(concept.unitId)! + 1);
      }
    }
    const order = includedUnits.filter(unit => degrees.get(unit.id) === 0).map(unit => unit.id);
    for (let cursor = 0; cursor < order.length; cursor++) {
      for (const next of nextUnits.get(order[cursor]) ?? []) {
        degrees.set(next, degrees.get(next)! - 1);
        if (degrees.get(next) === 0) order.push(next);
      }
    }
    for (const unit of includedUnits) if (!order.includes(unit.id)) order.push(unit.id);
    const bounds = (unitId: string) => {
      const xs = (index.unitConcepts.get(unitId) ?? []).filter(concept => concept.mapPosition)
        .map(concept => concept.mapPosition!.x);
      return { min: Math.min(...xs), max: Math.max(...xs) };
    };
    const centers = new Map([[targetUnit.id, targetUnit.mapPosition.x]]);
    let cursorX = targetUnit.mapPosition.x + bounds(targetUnit.id).min - 140;
    for (const unitId of order.filter(id => id !== targetUnit.id).reverse()) {
      const unitBounds = bounds(unitId);
      const centerX = cursorX - unitBounds.max;
      centers.set(unitId, centerX);
      cursorX = centerX + unitBounds.min - 140;
    }
    // Preserve the selected unit's familiar shape. Additional prerequisite
    // units occupy separate clusters, without reshuffling its existing nodes.
    return {
      points: new Map(concepts.map(concept => [concept.id, {
        x: centers.get(concept.unitId)! + concept.mapPosition!.x,
        y: targetUnit.mapPosition!.y + concept.mapPosition!.y,
      }])),
      routes: new Map(),
    };
  }
  const prerequisites = new Map(concepts.map(concept => [
    concept.id,
    concept.prerequisites.filter(id => ids.has(id)),
  ]));
  const realIds = concepts.map(concept => concept.id);
  const inputOrder = new Map(realIds.map((id, order) => [id, order]));
  const degree = new Map(realIds.map(id => [id, 0]));
  const successors = new Map(realIds.map(id => [id, [] as string[]]));
  const rank = new Map(realIds.map(id => [id, 0]));
  for (const target of realIds) for (const source of prerequisites.get(target) ?? []) {
    degree.set(target, degree.get(target)! + 1);
    successors.get(source)!.push(target);
  }
  const queue = realIds.filter(id => degree.get(id) === 0);
  const ordered: string[] = [];
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const source = queue[cursor];
    ordered.push(source);
    for (const target of successors.get(source) ?? []) {
      rank.set(target, Math.max(rank.get(target)!, rank.get(source)! + 1));
      degree.set(target, degree.get(target)! - 1);
      if (degree.get(target) === 0) queue.push(target);
    }
  }
  const cyclic = realIds.filter(id => !ordered.includes(id));
  const finalRank = Math.max(0, ...rank.values()) + (ordered.length ? 1 : 0);
  cyclic.forEach(id => rank.set(id, finalRank));

  const layers = new Map<number, string[]>();
  const virtualOrder = new Map<string, number>();
  const adjacentPredecessors = new Map<string, string[]>();
  const adjacentSuccessors = new Map<string, string[]>();
  const routeIds = new Map<string, string[]>();
  const addToLayer = (id: string, nodeRank: number) => {
    const layer = layers.get(nodeRank) ?? [];
    layer.push(id);
    layers.set(nodeRank, layer);
    adjacentPredecessors.set(id, []);
    adjacentSuccessors.set(id, []);
  };
  realIds.forEach(id => addToLayer(id, rank.get(id)!));

  for (const target of realIds) for (const source of prerequisites.get(target) ?? []) {
    const sourceRank = rank.get(source)!, targetRank = rank.get(target)!;
    const route = [source];
    if (targetRank > sourceRank + 1) {
      for (let currentRank = sourceRank + 1; currentRank < targetRank; currentRank++) {
        const virtualId = `@${source}:${target}:${currentRank}`;
        addToLayer(virtualId, currentRank);
        virtualOrder.set(virtualId, ((inputOrder.get(source) ?? 0) + (inputOrder.get(target) ?? 0)) / 2);
        route.push(virtualId);
      }
    }
    route.push(target);
    routeIds.set(conceptEdgeKey(source, target), route);
    for (let i = 1; i < route.length; i++) {
      adjacentSuccessors.get(route[i - 1])!.push(route[i]);
      adjacentPredecessors.get(route[i])!.push(route[i - 1]);
    }
  }

  const ranks = [...layers.keys()].sort((a, b) => a - b);
  const position = new Map<string, number>();
  const orderOf = (id: string) => inputOrder.get(id) ?? virtualOrder.get(id) ?? Number.MAX_SAFE_INTEGER;
  const refreshPositions = () => {
    for (const currentRank of ranks) {
      const layer = layers.get(currentRank)!;
      const denominator = Math.max(1, layer.length - 1);
      layer.forEach((id, index) => position.set(id, index / denominator));
    }
  };
  const sortByNeighbours = (layer: string[], neighbours: ReadonlyMap<string, string[]>) => layer.sort((a, b) => {
    const barycenter = (id: string) => {
      const connected = neighbours.get(id) ?? [];
      return connected.length
        ? connected.reduce((sum, neighbour) => sum + (position.get(neighbour) ?? 0), 0) / connected.length
        : position.get(id) ?? 0;
    };
    return barycenter(a) - barycenter(b) || orderOf(a) - orderOf(b);
  });
  refreshPositions();
  for (let sweep = 0; sweep < 8; sweep++) {
    for (const currentRank of ranks.slice(1)) {
      sortByNeighbours(layers.get(currentRank)!, adjacentPredecessors);
      refreshPositions();
    }
    for (const currentRank of ranks.slice(0, -1).reverse()) {
      sortByNeighbours(layers.get(currentRank)!, adjacentSuccessors);
      refreshPositions();
    }
  }

  const raw = new Map<string, Point>();
  for (const currentRank of ranks) {
    const layer = layers.get(currentRank)!;
    layer.forEach((id, row) => raw.set(id, {
      x: currentRank * 230,
      y: (row - (layer.length - 1) / 2) * 126,
    }));
  }
  const minY = Math.min(...[...raw.values()].map(point => point.y));
  const translate = (point: Point): Point => ({ x: point.x, y: point.y - minY + 155 });
  return {
    points: new Map(realIds.map(id => [id, translate(raw.get(id)!)])),
    routes: new Map([...routeIds].map(([key, route]) => [key, route.map(id => translate(raw.get(id)!))])),
  };
}

export function layoutFocusedConcepts(index: GraphIndex, ids: ReadonlySet<string>) {
  return layoutFocusedGraph(index, ids).points;
}

/** Draw one independently traceable route through its virtual waypoints. */
export function routedConceptEdge(route: readonly Point[]) {
  if (route.length < 2) return '';
  const points = route.map(point => ({ ...point }));
  const first = points[0], second = points[1], last = points.at(-1)!, beforeLast = points.at(-2)!;
  const startDirection = Math.sign(second.x - first.x) || 1;
  const endDirection = Math.sign(last.x - beforeLast.x) || 1;
  points[0] = { x: first.x + startDirection * 10, y: first.y };
  points[points.length - 1] = { x: last.x - endDirection * 10, y: last.y };
  let path = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const source = points[i - 1], target = points[i];
    const middleX = (source.x + target.x) / 2;
    path += ` C${middleX},${source.y} ${middleX},${target.y} ${target.x},${target.y}`;
  }
  return path;
}

/** Stable positions for every concept, whether it is currently hidden or shown. */
export function layoutAllConcepts(index: GraphIndex, unitPoints: ReadonlyMap<string, Point>) {
  const result = new Map<string, Point>();
  const { lateBranchIds } = layoutUnitGraph(index);
  for (const unit of index.data.units) {
    const concepts = index.unitConcepts.get(unit.id) ?? [];
    const prerequisites = new Map(concepts.map(concept => [concept.id, concept.prerequisites]));
    const unitPoint = unitPoints.get(unit.id) ?? { x: 0, y: 0 };
    // Keep the unit in its compact upper lane, but open its details farther
    // upward so the expanded cluster cannot cover the main route below.
    const conceptCenter = lateBranchIds.has(unit.id)
      ? { ...unitPoint, y: unitPoint.y - LATE_BRANCH_CONCEPT_LIFT }
      : unitPoint;
    for (const [id, point] of layoutConcepts(concepts.map(concept => concept.id), conceptCenter, prerequisites)) {
      const anchor = index.concepts.get(id)?.mapPosition;
      if (anchor) {
        result.set(id, { x: unitPoint.x + anchor.x, y: unitPoint.y + anchor.y });
        continue;
      }
      // Only lower this unit's details; keep its heading and other clusters fixed.
      result.set(id, unit.id === 'course:data-basics'
        ? { ...point, y: point.y + DATA_BASICS_DETAIL_OFFSET }
        : point);
    }
  }
  return result;
}

export function directedEdge(a: Point, b: Point, sourceRadius = 34, targetRadius = 34) {
  if (Math.abs(b.x - a.x) < 20) {
    const direction = b.y >= a.y ? 1 : -1;
    const startY = a.y + direction * sourceRadius;
    const endY = b.y - direction * targetRadius;
    const control = Math.max(45, Math.abs(endY - startY) * .45);
    return `M${a.x},${startY} C${a.x},${startY + direction * control} ${b.x},${endY - direction * control} ${b.x},${endY}`;
  }
  const direction = b.x >= a.x ? 1 : -1;
  const startX = a.x + direction * sourceRadius;
  const endX = b.x - direction * targetRadius;
  const distance = Math.abs(endX - startX);
  const control = Math.max(55, distance * .48);
  // Long, level-skipping relationships arc above intermediate columns instead
  // of passing through the nodes that happen to sit between both endpoints.
  const arc = distance > 330 ? -direction * Math.min(105, distance * .18) : 0;
  return `M${startX},${a.y} C${startX + direction * control},${a.y + arc} ${endX - direction * control},${b.y + arc} ${endX},${b.y}`;
}

export function curvedEdge(a: Point, b: Point) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const bend = Math.min(65, Math.hypot(dx, dy) * .18);
  return `M${a.x},${a.y} Q${(a.x + b.x) / 2 - dy / (Math.hypot(dx, dy) || 1) * bend},${(a.y + b.y) / 2 + dx / (Math.hypot(dx, dy) || 1) * bend} ${b.x},${b.y}`;
}
