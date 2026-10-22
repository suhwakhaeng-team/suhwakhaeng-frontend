import { useEffect, useRef, useState } from 'react';
import { ut2Api, UT2ApiError, validUT2Reply, UT2_CACHE_KEY, UT2_CREATE_KEY, UT2_PENDING_KEY, type UT2Action, type UT2Credential, type UT2Reply } from './ut2ServerApi';
import { disconnectUT2Participant } from './ut2ParticipantSwitch';
import type { UT2SurveySubmission } from '../../types/ut2Survey';

const api = ut2Api(import.meta.env.PROD ? '/api/v1' : import.meta.env.VITE_UT2_API_BASE_URL || '/api/v1');
type Cache = { credential: UT2Credential; reply: UT2Reply };
type Pending = { id: string; action: UT2Action };
export default function useUT2Server() {
  const [reply, setReply] = useState<UT2Reply | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hasPending, setHasPending] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [conflict, setConflict] = useState(false);
  const cache = useRef<Cache | null>(null);
  const pending = useRef<Pending | null>(null);
  const lock = useRef(false);
  const install = (next: UT2Reply, credential: UT2Credential) => {
    if (!validUT2Reply(next) || next.session.id !== credential.id) throw new Error('서버 기록 형식이 올바르지 않아요. 기존 연결은 보존했습니다.');
    localStorage.setItem(UT2_CACHE_KEY, JSON.stringify({ credential, reply: next }));
    cache.current = { credential, reply: next }; setReply(next);
  };
  const clearPending = () => { localStorage.removeItem(UT2_PENDING_KEY); pending.current = null; setHasPending(false); };
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      try {
        const raw = localStorage.getItem(UT2_CACHE_KEY);
        if (!raw) return;
        const saved: Cache = JSON.parse(raw);
        if (!saved.credential || !/^[a-f0-9]{64}$/.test(saved.credential.token) || !validUT2Reply(saved.reply) || saved.reply.session.id !== saved.credential.id) throw new Error('저장된 참가자 연결이 올바르지 않아요. 관리자에게 문의해 주세요.');
        const outstanding: Pending | null = JSON.parse(localStorage.getItem(UT2_PENDING_KEY) || 'null');
        const remote = await api.get(saved.credential);
        if (cancelled) return;
        install(remote, saved.credential);
        if (outstanding?.id === remote.session.id) {
          if (outstanding.action.actionId === remote.session.lastActionId) clearPending();
          else {
            pending.current = outstanding; setHasPending(true);
            setConflict(outstanding.action.revision !== remote.revision);
            setError('이전에 제출한 답안이 미저장 상태예요. 다시 저장해 주세요.');
          }
        }
      } catch (e) { if (!cancelled) { setBlocked(true); setError(e instanceof Error ? e.message : '기록을 불러오지 못했어요.'); } }
      finally { if (!cancelled) setLoading(false); }
    }
    void restore(); return () => { cancelled = true; };
  }, []);
  async function create(nickname: string, password: string) {
    if (lock.current || pending.current || blocked) return;
    lock.current = true; setBusy(true); setError('');
    try {
      let creating = JSON.parse(localStorage.getItem(UT2_CREATE_KEY) || 'null') as { nickname: string; token: string } | null;
      if (!creating || creating.nickname !== nickname) {
        creating = { nickname, token: Array.from(crypto.getRandomValues(new Uint8Array(32)), v => v.toString(16).padStart(2, '0')).join('') };
        localStorage.setItem(UT2_CREATE_KEY, JSON.stringify(creating));
      }
      const next = await api.create(password, nickname, creating.token);
      install(next, { id: next.session.id, token: creating.token }); localStorage.removeItem(UT2_CREATE_KEY);
      return next;
    } catch (e) { setError(e instanceof Error ? e.message : '참가자를 만들지 못했어요.'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function flush() {
    if (lock.current || !cache.current || !pending.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const next = await api.act(cache.current.credential, pending.current.action);
      install(next, cache.current.credential); clearPending(); return next;
    } catch (e) { setConflict(e instanceof UT2ApiError && e.status === 409); setError(e instanceof Error ? e.message : '저장하지 못했어요.'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function act(action: Omit<UT2Action, 'revision' | 'actionId'>) {
    if (!cache.current || lock.current || pending.current) return;
    const next: Pending = { id: cache.current.credential.id, action: { ...action, actionId: crypto.randomUUID(), revision: cache.current.reply.revision } };
    try { localStorage.setItem(UT2_PENDING_KEY, JSON.stringify(next)); }
    catch { setError('복구용 답안을 이 기기에 보관하지 못했어요. 저장 공간을 확인해 주세요.'); return; }
    pending.current = next; setHasPending(true); return flush();
  }
  function startNew(): boolean {
    if (loading || blocked || lock.current || pending.current || !cache.current) return false;
    try { disconnectUT2Participant(localStorage, crypto.randomUUID()); }
    catch (e) { setError(e instanceof Error ? e.message : '이전 연결 정보를 안전하게 보관하지 못했어요.'); return false; }
    setError(''); setHasPending(false); setConflict(false);
    return true;
  }
  async function recoverConflict() {
    if (!conflict || lock.current || !pending.current || !cache.current) return;
    lock.current = true; setBusy(true);
    try {
      const next = await api.get(cache.current.credential);
      // Preserve the stale answer separately; never apply it to a different current question.
      localStorage.setItem(`${UT2_PENDING_KEY}:preserved:${pending.current.action.actionId}`, JSON.stringify(pending.current));
      install(next, cache.current.credential); clearPending(); setConflict(false); setError(''); return next;
    } catch (e) { setError(e instanceof Error ? e.message : '다른 탭의 기록을 가져오지 못했어요.'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function submitSurvey(answers: UT2SurveySubmission) {
    if (!cache.current || lock.current || pending.current || blocked) throw new Error('참가자 연결을 확인한 뒤 다시 제출해 주세요.');
    lock.current = true; setBusy(true);
    try {
      const next = await api.survey(cache.current.credential, answers);
      install(next, cache.current.credential);
      return next;
    } finally { lock.current = false; setBusy(false); }
  }
  return { reply, loading, busy, error, blocked, conflict, hasPending, create, act, retry: flush, recoverConflict, startNew, enter: api.enter, submitSurvey };
}
