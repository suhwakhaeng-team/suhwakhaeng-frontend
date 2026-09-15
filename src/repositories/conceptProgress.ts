import type { ConceptStatus, ProgressMap } from '../types/learningGraph.ts';

export interface ConceptProgressRepository {
  load(): ProgressMap;
  setStatus(conceptId: string, status: ConceptStatus): ProgressMap;
  subscribe(listener: () => void): () => void;
}

const isStatus = (value: unknown): value is ConceptStatus => ['known', 'unknown', 'unset'].includes(String(value));

/** Self-assessment is separate from server mastery; versioned and scoped to both account and dataset. */
export function createLocalProgressRepository(
  userId: string,
  datasetId: string,
  conceptIds: string[],
  storage: Pick<Storage, 'getItem' | 'setItem'>,
): ConceptProgressRepository {
  const key = `suhwakhaeng:learning-graph:v1:${encodeURIComponent(userId)}:${encodeURIComponent(datasetId)}`;
  const allowed = new Set(conceptIds);
  const load = (): ProgressMap => {
    const raw = storage.getItem(key);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !('version' in parsed) || parsed.version !== 1 ||
        !('statuses' in parsed) || !parsed.statuses || typeof parsed.statuses !== 'object') {
      throw new Error('저장된 학습 상태 형식을 읽을 수 없습니다.');
    }
    return Object.fromEntries(Object.entries(parsed.statuses).filter(([id, value]) => allowed.has(id) && isStatus(value)));
  };
  return {
    load,
    setStatus(id, status) {
      if (!allowed.has(id) || !isStatus(status)) throw new Error('올바르지 않은 개념 상태입니다.');
      const statuses = { ...load(), [id]: status };
      storage.setItem(key, JSON.stringify({ version: 1, statuses }));
      return statuses;
    },
    subscribe(listener) {
      if (typeof window === 'undefined') return () => {};
      const handler = (event: StorageEvent) => { if (event.key === key || event.key === null) listener(); };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },
  };
}
