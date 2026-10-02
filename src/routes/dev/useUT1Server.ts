import { useCallback, useEffect, useRef, useState } from 'react';
import { decodeStore, emptyStore, pauseTimer, type UTSession, type UTStore } from './ut1Model';
import { ut1Api, UT1Sync, type UT1Cache } from './ut1ServerApi';
import { DELETED_PARTICIPANT_MESSAGE, disconnectDeletedParticipant, isDeletedParticipant, UT_CREATE_KEY, UT_SERVER_CACHE_KEY } from './ut1RecoveryModel';

const CACHE_KEY = UT_SERVER_CACHE_KEY;
const CREATE_KEY = UT_CREATE_KEY;
const configured = import.meta.env.VITE_UT1_API_BASE_URL;
// Never use the read-only production-bank preview URL to write UT data from localhost.
const api = ut1Api(import.meta.env.PROD ? '/api/v1' : configured || '/api/v1');
function validSession(session: UTSession) {
  return decodeStore(JSON.stringify({ version: 1, activeId: session?.id, sessions: [session] })).sessions[0];
}
function readCache(): UT1Cache | null {
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  const cache = JSON.parse(raw) as UT1Cache;
  if (!cache.credential || !/^[a-f0-9]{64}$/.test(cache.credential.token) || cache.credential.id !== cache.session?.id || !Number.isSafeInteger(cache.credential.revision) || !validSession(cache.session)) throw new Error('저장된 서버 기록을 읽을 수 없어요. 기존 기록은 보존했습니다.');
  return cache;
}
function storeFor(session: UTSession): UTStore { return { version: 1, activeId: session.id, sessions: [session] }; }

export default function useUT1Server(enabled: boolean) {
  const [store, setStore] = useState<UTStore>(emptyStore);
  const [error, setError] = useState(''); const [blocked, setBlocked] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [loading, setLoading] = useState(enabled); const [saving, setSaving] = useState(false);
  const sync = useRef<UT1Sync | null>(null); const latest = useRef(store); latest.current = store;
  const canSync = useRef(false); const failed = useRef(false);
  const connectionVersion = useRef(0);
  const install = useCallback((cache: UT1Cache) => {
    sync.current?.stop();
    const version = ++connectionVersion.current;
    sync.current = new UT1Sync(api, cache, (next, failure, busy) => {
      if (version !== connectionVersion.current) return;
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); }
      catch { setError('이 기기에 복구용 기록을 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.'); setBlocked(true); failed.current = true; return; }
      failed.current = !!failure; setError(isDeletedParticipant(failure) ? DELETED_PARTICIPANT_MESSAGE : failure?.message ?? ''); setSaving(busy);
      if (failure && [400, 401, 403, 404, 409, 410].includes(failure.status)) setBlocked(true);
      if (isDeletedParticipant(failure)) { setDeleted(true); canSync.current = false; sync.current?.stop(); }
    });
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    canSync.current = true;
  }, []);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    async function restore() {
      try {
        const cache = readCache();
        if (!cache) return;
        const remote = await api.get(cache.credential);
        if (cancelled) return;
        if (!validSession(remote.session)) throw new Error('서버 기록 형식이 달라요. 기존 기록은 보존했습니다.');
        const ownLostWrite = cache.lastSent && JSON.stringify(cache.lastSent) === JSON.stringify(remote.session);
        if (cache.pending && cache.credential.revision !== remote.revision && !ownLostWrite) {
          setStore(storeFor(validSession(cache.session))); setBlocked(true);
          throw new Error('다른 탭에서 기록이 변경됐어요. 이 기기의 미저장 기록을 보존했습니다. 다른 탭을 닫고 관리자에게 확인해 주세요.');
        }
        const session = validSession(cache.pending ? cache.session : remote.session);
        const next = { ...cache, session, credential: { ...cache.credential, revision: remote.revision } };
        install(next); setStore(storeFor(session));
      } catch (caught) { if (!cancelled) {
        setDeleted(isDeletedParticipant(caught));
        setError(isDeletedParticipant(caught) ? DELETED_PARTICIPANT_MESSAGE : caught instanceof Error ? caught.message : '기록을 불러오지 못했어요.'); setBlocked(true);
      } }
      finally { if (!cancelled) setLoading(false); }
    }
    void restore();
    return () => { cancelled = true; canSync.current = false; sync.current?.stop(); };
  }, [enabled, install]);
  useEffect(() => {
    if (!enabled || !canSync.current || blocked) return;
    const session = store.sessions.find(s => s.id === store.activeId);
    if (session) sync.current?.enqueue(pauseTimer(session));
  }, [store, enabled, blocked]);
  useEffect(() => {
    if (!enabled) return;
    const snapshot = () => {
      const s = latest.current.sessions.find(value => value.id === latest.current.activeId);
      if (s && canSync.current && !blocked && !failed.current) sync.current?.enqueue(pauseTimer(s));
    };
    const interval = window.setInterval(snapshot, 2000);
    window.addEventListener('pagehide', snapshot);
    return () => { window.clearInterval(interval); window.removeEventListener('pagehide', snapshot); };
  }, [enabled, blocked]);
  async function createParticipant(nickname: string, password: string) {
    await sync.current?.flush();
    if (sync.current?.cache.pending) throw new Error('이전 참가자 기록을 먼저 서버에 저장해 주세요.');
    let creating = JSON.parse(localStorage.getItem(CREATE_KEY) || 'null') as { nickname: string; token: string } | null;
    if (!creating || creating.nickname !== nickname) {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      creating = { nickname, token: Array.from(bytes, v => v.toString(16).padStart(2, '0')).join('') };
      localStorage.setItem(CREATE_KEY, JSON.stringify(creating));
    }
    let reply;
    try { reply = await api.create(password, nickname, creating.token); }
    catch (caught) {
      if (isDeletedParticipant(caught)) {
        canSync.current = false; sync.current?.stop();
        setDeleted(true); setBlocked(true); setError(DELETED_PARTICIPANT_MESSAGE);
      }
      throw caught;
    }
    if (!validSession(reply.session)) throw new Error('서버의 참가자 기록 형식이 올바르지 않아요.');
    install({ credential: { id: reply.session.id, token: creating.token, revision: reply.revision }, session: reply.session, pending: false });
    localStorage.removeItem(CREATE_KEY);
    setStore(storeFor(reply.session)); setError(''); setBlocked(false); setDeleted(false); return reply.session;
  }
  function startNewParticipant(): boolean {
    if (!deleted || loading) return false;
    try { disconnectDeletedParticipant(localStorage); }
    catch {
      setError('이전 연결 정보를 안전하게 보관하지 못했어요. 브라우저 저장 공간을 확인하고 다시 시도해 주세요.');
      return false;
    }
    ++connectionVersion.current; sync.current?.stop(); sync.current = null;
    canSync.current = false; failed.current = false;
    setStore(emptyStore()); setError(''); setBlocked(false); setDeleted(false); setSaving(false);
    return true;
  }
  async function retry() {
    if (blocked || !sync.current) { window.location.reload(); return; }
    failed.current = false; await sync.current.flush();
  }
  return { store, setStore, error, deleted, blocked: blocked || loading, saving, createParticipant, enter: api.enter, retry, startNewParticipant };
}
