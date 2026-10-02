import type { UTSession } from './ut1Model.ts';

export type UT1Reply = { session: UTSession; revision: number };
export type UT1Credential = { id: string; token: string; revision: number };
export class UT1ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) { super(message); this.status = status; }
}
// Deliberately separate from account JWT refresh and the existing diagnostic API.
export function ut1Api(base = '/api/v1', transport: typeof fetch = fetch) {
  async function request<T>(path: string, method: string, body?: unknown, token?: string): Promise<T> {
    let response: globalThis.Response;
    try {
      response = await transport(`${base.replace(/\/$/, '')}/ut1${path}`, {
        method, headers: { 'Content-Type': 'application/json', ...(token ? { 'X-UT-Token': token } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch { throw new UT1ApiError('서버에 연결하지 못했어요. 이 기기에 기록을 보관 중입니다. 연결 후 다시 저장해 주세요.'); }
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new UT1ApiError(data?.error || (response.status === 404 ? '학습 체험 서버가 아직 활성화되지 않았어요.' : `서버 저장 실패 (${response.status})`), response.status);
    }
    return response.status === 204 ? undefined as T : response.json();
  }
  return {
    enter: (password: string) => request<void>('/entry', 'POST', { password }),
    create: (password: string, nickname: string, token: string) => request<UT1Reply>('/sessions', 'POST', { password, nickname, token, testVersion: 2 }),
    get: (credential: UT1Credential) => request<UT1Reply>(`/sessions/${encodeURIComponent(credential.id)}`, 'GET', undefined, credential.token),
    save: (credential: UT1Credential, session: UTSession) => request<UT1Reply>(`/sessions/${encodeURIComponent(credential.id)}`, 'PUT', { revision: credential.revision, session }, credential.token),
  };
}
export type UT1Api = ReturnType<typeof ut1Api>;
export type UT1Cache = { credential: UT1Credential; session: UTSession; pending: boolean; lastSent?: UTSession };

// One in-flight write per participant; coalescing retains every append-only answer.
export class UT1Sync {
  api: UT1Api;
  cache: UT1Cache;
  notify: (cache: UT1Cache, error: UT1ApiError | null, busy: boolean) => void;
  private pending: UTSession | null;
  private active: Promise<void> | null = null;
  private stopped = false;
  constructor(api: UT1Api, cache: UT1Cache, notify: UT1Sync['notify']) {
    this.api = api; this.cache = cache; this.notify = notify; this.pending = cache.pending ? cache.session : null;
  }
  enqueue(session: UTSession) {
    if (this.stopped || session.id !== this.cache.credential.id) return;
    if (JSON.stringify(session) === JSON.stringify(this.cache.session)) {
      if (this.cache.pending && !this.active) void this.flush();
      return;
    }
    this.pending = session; this.cache = { ...this.cache, session, pending: true };
    this.notify(this.cache, null, true); void this.flush();
  }
  stop() { this.stopped = true; }
  flush(): Promise<void> {
    if (this.active) return this.active;
    if (this.stopped) return Promise.resolve();
    this.active = this.drain().finally(() => { this.active = null; }); return this.active;
  }
  private async drain() {
    while (this.pending && !this.stopped) {
      const sent = this.pending; this.pending = null;
      this.cache = { ...this.cache, lastSent: sent }; this.notify(this.cache, null, true);
      try {
        const reply = await this.api.save(this.cache.credential, sent);
        this.cache = { ...this.cache, credential: { ...this.cache.credential, revision: reply.revision }, pending: this.pending !== null };
        if (!this.stopped) this.notify(this.cache, null, this.pending !== null);
      } catch (caught) {
        const error = caught instanceof UT1ApiError ? caught : new UT1ApiError('서버에 기록을 저장하지 못했어요.');
        // A lost response might already have committed. Resolve only an exact own-write match.
        if (error.status === 409 || error.status === 0) {
          try {
            const remote = await this.api.get(this.cache.credential);
            if (JSON.stringify(remote.session) === JSON.stringify(sent)) {
              this.cache = { ...this.cache, credential: { ...this.cache.credential, revision: remote.revision }, pending: this.pending !== null };
              if (!this.stopped) this.notify(this.cache, null, this.pending !== null);
              continue;
            }
          } catch { /* Keep the local cache; never claim a save succeeded. */ }
        }
        this.pending = this.pending ?? sent; this.cache = { ...this.cache, pending: true };
        if (!this.stopped) this.notify(this.cache, error, false);
        return;
      }
    }
  }
}
