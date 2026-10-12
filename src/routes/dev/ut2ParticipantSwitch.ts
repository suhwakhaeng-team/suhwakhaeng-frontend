import { UT2_CACHE_KEY, UT2_CREATE_KEY, UT2_PENDING_KEY } from './ut2ServerApi.ts';

// Explicit participant change only: preserve the old connection, never delete server records.
export function disconnectUT2Participant(storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>, backupId: string) {
  if (storage.getItem(UT2_PENDING_KEY) !== null) throw new Error('미저장 답안을 먼저 서버에 저장해 주세요.');
  const cache = storage.getItem(UT2_CACHE_KEY);
  const creating = storage.getItem(UT2_CREATE_KEY);
  if (cache !== null || creating !== null) {
    const backupKey = `${UT2_CACHE_KEY}:disconnected:${backupId}`;
    if (storage.getItem(backupKey) !== null) throw new Error('이전 연결 백업이 이미 있어요. 다시 시도해 주세요.');
    storage.setItem(backupKey, JSON.stringify({ cache, creating }));
  }
  storage.removeItem(UT2_CREATE_KEY);
  // Keep the old participant available for "continue" until a new one is created.
}
