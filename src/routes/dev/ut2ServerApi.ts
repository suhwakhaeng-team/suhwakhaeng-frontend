import type { FeedbackSubmission } from '../../types/feedback';

export const UT2_CACHE_KEY = 'suhwakhaeng:ut2:server:v1';
export const UT2_CREATE_KEY = 'suhwakhaeng:ut2:create:v1';
export const UT2_PENDING_KEY = 'suhwakhaeng:ut2:pending:v1';
export type UT2Response = { questionId?: string; nodeId?: string; variant?: number; answer: string | null; correct?: boolean; seconds: number; answeredAt: number };
export type UT2Run = { form: 'A' | 'B'; total: number; responses: UT2Response[] };
export type UT2Session = {
  surveySubmitted?: boolean; rewardEntered?: boolean;
  id: string; participant: string; createdAt: number; bankVersion: 1 | 2; stage: 'pre' | 'learning' | 'post' | 'done';
  pre: UT2Run; post: UT2Run; history: UT2Response[]; weak: string[]; completed: string[];
  results: Record<string, 'passed' | 'failed'>; attempts: Record<string, number>; learningNode: string | null;
  recommended: string | null; lastActionId: string | null;
  question: { id?: string; nodeId?: string; prompt: string; group?: string } | null;
  feedback: { nodeId: string; nextNode: string; prompt: string; explanation: string; unknown: boolean } | null;
};
export type UT2Reply = { session: UT2Session; revision: number };
export type UT2Credential = { id: string; token: string };
export type UT2Action = { actionId: string; revision: number; type: 'answer' | 'open' | 'continue' | 'post'; questionId?: string; nodeId?: string; variant?: number; answer?: string | null; seconds?: number };
export class UT2ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) { super(message); this.status = status; }
}
export function ut2Api(base = '/api/v1', transport: typeof fetch = fetch) {
  async function request<T>(path: string, method: string, body?: unknown, token?: string): Promise<T> {
    let response: globalThis.Response;
    try {
      response = await transport(`${base.replace(/\/$/, '')}/ut2${path}`, { method,
        headers: { 'Content-Type': 'application/json', ...(token ? { 'X-UT-Token': token } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    } catch { throw new UT2ApiError('서버에 연결하지 못했어요. 입력은 보관 중이니 다시 저장해 주세요.'); }
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new UT2ApiError(data?.error || `2차 UT 서버 요청 실패 (${response.status})`, response.status);
    }
    return response.status === 204 ? undefined as T : response.json();
  }
  return {
    enter: (password: string) => request<void>('/entry', 'POST', { password }),
    create: (password: string, nickname: string, token: string) => request<UT2Reply>('/sessions', 'POST', { password, nickname, token }),
    get: (c: UT2Credential) => request<UT2Reply>(`/sessions/${encodeURIComponent(c.id)}`, 'GET', undefined, c.token),
    survey: (c: UT2Credential, answers: FeedbackSubmission) => request<UT2Reply>(`/sessions/${encodeURIComponent(c.id)}/survey`, 'POST', answers, c.token),
    act: (c: UT2Credential, a: UT2Action) => request<UT2Reply>(`/sessions/${encodeURIComponent(c.id)}/actions`, 'POST', a, c.token),
  };
}
export function validUT2Reply(value: unknown): value is UT2Reply {
  const r = value as UT2Reply | null;
  return !!r && Number.isSafeInteger(r.revision) && !!r.session && [1, 2].includes(r.session.bankVersion)
    && typeof r.session.id === 'string' && typeof r.session.participant === 'string'
    && ['pre', 'learning', 'post', 'done'].includes(r.session.stage)
    && [r.session.pre, r.session.post].every(run => run?.total === 13 && Array.isArray(run.responses) && run.responses.length <= 13)
    && Array.isArray(r.session.weak) && Array.isArray(r.session.history) && Array.isArray(r.session.completed)
    && !!r.session.results && !!r.session.attempts;
}
export function ut2Score(run: UT2Run, group?: 'foundation' | 'application') {
  const responses = group === 'foundation' ? run.responses.slice(0, 10) : group === 'application' ? run.responses.slice(10) : run.responses;
  const total = group === 'foundation' ? 10 : group === 'application' ? 3 : 13;
  const count = responses.filter(r => r.correct).length;
  return { count, total, accuracy: responses.length === total && responses.every(r => typeof r.correct === 'boolean') ? count / total * 100 : null,
    average: responses.length ? responses.reduce((sum, r) => sum + r.seconds, 0) / responses.length : null,
    unknown: responses.filter(r => r.answer === null).length };
}
