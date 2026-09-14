import type { ConceptStatus, GraphIndex, LearningGraphData, ProgressMap } from '../types/learningGraph.ts';

export function createGraphIndex(data: LearningGraphData): GraphIndex {
  const concepts = new Map(data.concepts.map(c => [c.id, c]));
  const units = new Map(data.units.map(u => [u.id, u]));
  if (concepts.size !== data.concepts.length || units.size !== data.units.length) {
    throw new Error('개념 또는 단원 ID가 중복되어 있습니다.');
  }
  const unitConcepts: GraphIndex['unitConcepts'] = new Map(data.units.map(u => [u.id, []]));
  const successors = new Map<string, string[]>(data.concepts.map(c => [c.id, []]));
  const unitEdges = new Map<string, { source: string; target: string }>();
  const addUnitEdge = (source: string, target: string) => {
    if (source !== target) unitEdges.set(JSON.stringify([source, target]), { source, target });
  };
  for (const u of data.units) {
    if (u.subjectId !== data.subject.id) throw new Error(`단원 ${u.id}의 과목이 올바르지 않습니다.`);
    for (const id of u.prerequisites) {
      if (!units.has(id)) throw new Error(`선수 단원 ${id}를 찾을 수 없습니다.`);
      addUnitEdge(id, u.id);
    }
  }
  for (const c of data.concepts) {
    if (!units.has(c.unitId)) throw new Error(`개념 ${c.id}의 단원을 찾을 수 없습니다.`);
    unitConcepts.get(c.unitId)!.push(c);
    for (const id of new Set(c.prerequisites)) {
      const prerequisite = concepts.get(id);
      if (!prerequisite) throw new Error(`선수개념 ${id}를 찾을 수 없습니다.`);
      successors.get(id)!.push(c.id);
      addUnitEdge(prerequisite.unitId, c.unitId);
    }
  }
  return { data, concepts, units, unitConcepts, successors, unitEdges: [...unitEdges.values()] };
}

export const statusOf = (progress: ProgressMap, id: string): ConceptStatus => progress[id] ?? 'unset';

/** Iterative traversal: deep or cyclic content never consumes the JS call stack. */
export function getRelatedConcepts(index: GraphIndex, id: string, direction: 'ancestors' | 'descendants') {
  const visited = new Set<string>([id]);
  const result = new Set<string>();
  const queue = [id];
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const next = direction === 'ancestors'
      ? index.concepts.get(queue[cursor])?.prerequisites ?? []
      : index.successors.get(queue[cursor]) ?? [];
    for (const child of next) {
      if (!visited.has(child)) { visited.add(child); result.add(child); queue.push(child); }
    }
  }
  return result;
}

export function getMissingPrerequisites(index: GraphIndex, id: string, progress: ProgressMap) {
  const direct = new Set(index.concepts.get(id)?.prerequisites ?? []);
  return [...getRelatedConcepts(index, id, 'ancestors')]
    .filter(key => statusOf(progress, key) !== 'known')
    .map(key => ({ concept: index.concepts.get(key)!, status: statusOf(progress, key), direct: direct.has(key) }));
}

/** Follow only unresolved paths, stopping at known concepts. Cycles are reported, never ranked as roots. */
export function getRootLearningGaps(index: GraphIndex, id: string, progress: ProgressMap) {
  const reachable = new Set<string>();
  const paths = new Map<string, string | null>();
  const queue: string[] = [];
  for (const key of index.concepts.get(id)?.prerequisites ?? []) {
    if (statusOf(progress, key) !== 'known' && !reachable.has(key)) {
      reachable.add(key); paths.set(key, id); queue.push(key);
    }
  }
  for (let cursor = 0; cursor < queue.length; cursor++) {
    for (const key of index.concepts.get(queue[cursor])?.prerequisites ?? []) {
      if (statusOf(progress, key) !== 'known' && !reachable.has(key)) {
        reachable.add(key); paths.set(key, queue[cursor]); queue.push(key);
      }
    }
  }
  const remaining = new Map<string, number>();
  const roots: string[] = [];
  for (const key of reachable) {
    const count = new Set(index.concepts.get(key)!.prerequisites.filter(p => reachable.has(p))).size;
    remaining.set(key, count);
    if (!count) roots.push(key);
  }
  // Peel acyclic leaves. Nodes left over depend on a cycle and cannot be safely ordered.
  const peeled = [...roots];
  const removed = new Set<string>();
  for (let cursor = 0; cursor < peeled.length; cursor++) {
    const key = peeled[cursor];
    removed.add(key);
    for (const successor of index.successors.get(key) ?? []) {
      if (!remaining.has(successor)) continue;
      const count = remaining.get(successor)! - 1;
      remaining.set(successor, count);
      if (count === 0) peeled.push(successor);
    }
  }
  const pathTo = (key: string) => {
    const path = [key];
    const seen = new Set(path);
    let parent = paths.get(key);
    while (parent && !seen.has(parent)) { seen.add(parent); path.unshift(parent); parent = paths.get(parent); }
    return path;
  };
  return {
    roots: roots.map(key => ({ concept: index.concepts.get(key)!, status: statusOf(progress, key), path: pathTo(key) })),
    cycleBlocked: [...reachable].filter(key => !removed.has(key)),
  };
}

export function getUnitProgress(index: GraphIndex, unitId: string, progress: ProgressMap) {
  const concepts = index.unitConcepts.get(unitId) ?? [];
  const known = concepts.filter(c => statusOf(progress, c.id) === 'known').length;
  return { known, total: concepts.length, ratio: concepts.length ? known / concepts.length : 0 };
}

export function getGapPath(index: GraphIndex, progress: ProgressMap) {
  const path = new Set<string>();
  const queue = index.data.concepts.filter(c => statusOf(progress, c.id) === 'unknown').map(c => c.id);
  queue.forEach(id => path.add(id));
  for (let cursor = 0; cursor < queue.length; cursor++) {
    for (const id of index.concepts.get(queue[cursor])!.prerequisites) {
      if (!path.has(id)) { path.add(id); queue.push(id); }
    }
  }
  return path;
}
