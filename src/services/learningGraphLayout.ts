import type { GraphIndex } from '../types/learningGraph.ts';

export interface Point { x: number; y: number }
export const CONCEPT_PAGE_SIZE = 18;

export function layoutUnits(index: GraphIndex, expandedId: string | null) {
  const degree = new Map(index.data.units.map(u => [u.id, 0]));
  const successors = new Map(index.data.units.map(u => [u.id, [] as string[]]));
  const depth = new Map(index.data.units.map(u => [u.id, 0]));
  index.unitEdges.forEach(e => {
    degree.set(e.target, degree.get(e.target)! + 1);
    successors.get(e.source)!.push(e.target);
  });
  const queue = index.data.units.filter(u => degree.get(u.id) === 0).map(u => u.id);
  for (let i = 0; i < queue.length; i++) {
    for (const child of successors.get(queue[i]) ?? []) {
      depth.set(child, Math.max(depth.get(child)!, depth.get(queue[i])! + 1));
      degree.set(child, degree.get(child)! - 1);
      if (degree.get(child) === 0) queue.push(child);
    }
  }
  const columns = new Map<number, string[]>();
  index.data.units.forEach(u => {
    const level = depth.get(u.id)!;
    columns.set(level, [...(columns.get(level) ?? []), u.id]);
  });
  const points = new Map<string, Point>();
  columns.forEach((ids, level) => ids.forEach((id, i) => {
    points.set(id, { x: level * 245, y: (i - (ids.length - 1) / 2) * 285 + Math.sin(level * 1.6) * 108 });
  }));
  const active = expandedId ? points.get(expandedId) : undefined;
  if (active) {
    const origin = { ...active };
    points.forEach((p, id) => {
      if (id === expandedId) return;
      const dx = p.x - origin.x, dy = p.y - origin.y;
      const length = Math.hypot(dx, dy) || 1;
      p.x += dx / length * 125;
      p.y += dy / length * 125;
    });
  }
  return points;
}

export function layoutConcepts(ids: string[], center: Point) {
  const points = new Map<string, Point>();
  ids.forEach((id, i) => {
    const ring = Math.floor(i / 9), count = Math.min(ids.length - ring * 9, 9);
    const angle = ((i % 9) / count) * Math.PI * 2 - Math.PI / 2 + ring * .3;
    const radius = 136 + ring * 104;
    points.set(id, { x: center.x + Math.cos(angle) * radius * 1.15, y: center.y + Math.sin(angle) * radius });
  });
  return points;
}

export function curvedEdge(a: Point, b: Point) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const bend = Math.min(65, Math.hypot(dx, dy) * .18);
  return `M${a.x},${a.y} Q${(a.x + b.x) / 2 - dy / (Math.hypot(dx, dy) || 1) * bend},${(a.y + b.y) / 2 + dx / (Math.hypot(dx, dy) || 1) * bend} ${b.x},${b.y}`;
}
