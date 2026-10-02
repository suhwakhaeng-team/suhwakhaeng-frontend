export const UT_SERVER_CACHE_KEY = 'suhwakhaeng:ut1:server:v1';
export const UT_CREATE_KEY = `${UT_SERVER_CACHE_KEY}:creating`;
export const DELETED_PARTICIPANT_MESSAGE = '이전 참가자의 기록이 삭제됐어요. 새 참가자로 시작하거나 관리자에게 복구를 요청해 주세요.';

export function isDeletedParticipant(error: unknown): boolean {
  return error instanceof Error && 'status' in error && error.status === 410;
}

// Called only after an explicit "start new" click on a server-confirmed deleted participant.
// Back up both raw values before detaching; never clear unrelated account or prototype storage.
export function disconnectDeletedParticipant(storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>, now = Date.now()) {
  const cache = storage.getItem(UT_SERVER_CACHE_KEY);
  const creating = storage.getItem(UT_CREATE_KEY);
  if (cache !== null || creating !== null) {
    const backupKey = `${UT_SERVER_CACHE_KEY}:disconnected:${now}`;
    if (storage.getItem(backupKey) !== null) throw new Error('연결 정보 백업이 이미 있습니다. 다시 시도해 주세요.');
    storage.setItem(backupKey, JSON.stringify({ disconnectedAt: now, cache, creating }));
  }
  storage.removeItem(UT_SERVER_CACHE_KEY);
  storage.removeItem(UT_CREATE_KEY);
}
