import type { UT2SurveySubmission } from '../../types/ut2Survey';

export const UT3_CACHE_KEY = 'suhwakhaeng:ut3:server:v1';
export const UT3_CREATE_KEY = 'suhwakhaeng:ut3:create:v1';
export const UT3_PENDING_KEY = 'suhwakhaeng:ut3:pending:v1';
export type UT3Response = { questionId?: string; nodeId?: string; variant?: number; answer: string | null; correct?: boolean; seconds: number; answeredAt: number };
export type UT3Run = { form: 'A' | 'B'; total: number; responses: UT3Response[] };
export type UT3Session = {
  surveySubmitted?: boolean; rewardEntered?: boolean;
  id: string; participant: string; createdAt: number; bankVersion: 1; stage: 'pre' | 'learning' | 'post' | 'done';
  pre: UT3Run; post: UT3Run; history: UT3Response[]; weak: string[]; completed: string[];
  results: Record<string, 'passed' | 'failed'>; attempts: Record<string, number>; learningNode: string | null;
  recommended: string | null; lastActionId: string | null;
  question: { id?: string; nodeId?: string; prompt: string; group?: string } | null;
  feedback: { nodeId: string; nextNode: string; prompt: string; explanation: string; unknown: boolean } | null;
};
export type UT3Reply = { session: UT3Session; revision: number };
export type UT3Credential = { id: string; token: string };
export type UT3Action = { actionId: string; revision: number; type: 'answer' | 'open' | 'continue' | 'post'; questionId?: string; nodeId?: string; variant?: number; answer?: string | null; seconds?: number };
export class UT3ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) { super(message); this.status = status; }
}
export function ut3Api(base = '/api/v1', transport: typeof fetch = fetch) {
  async function request<T>(path: string, method: string, body?: unknown, token?: string): Promise<T> {
    let response: globalThis.Response;
    try {
      response = await transport(`${base.replace(/\/$/, '')}/ut3${path}`, { method,
        headers: { 'Content-Type': 'application/json', ...(token ? { 'X-UT-Token': token } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    } catch { throw new UT3ApiError('서버에 연결하지 못했어요. 입력은 보관 중이니 다시 저장해 주세요.'); }
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new UT3ApiError(data?.error || `3차 UT 서버 요청 실패 (${response.status})`, response.status);
    }
    return response.status === 204 ? undefined as T : response.json();
  }
  return {
    enter: (password: string) => request<void>('/entry', 'POST', { password }),
    create: (password: string, nickname: string, token: string) => request<UT3Reply>('/sessions', 'POST', { password, nickname, token }),
    get: (c: UT3Credential) => request<UT3Reply>(`/sessions/${encodeURIComponent(c.id)}`, 'GET', undefined, c.token),
    survey: (c: UT3Credential, answers: UT2SurveySubmission) => request<UT3Reply>(`/sessions/${encodeURIComponent(c.id)}/survey`, 'POST', answers, c.token),
    act: (c: UT3Credential, a: UT3Action) => request<UT3Reply>(`/sessions/${encodeURIComponent(c.id)}/actions`, 'POST', a, c.token),
  };
}
export function validUT3Reply(value: unknown): value is UT3Reply {
  const r = value as UT3Reply | null;
  return !!r && Number.isSafeInteger(r.revision) && !!r.session && r.session.bankVersion === 1
    && r.session.pre?.form === 'A' && r.session.post?.form === 'B'
    && typeof r.session.id === 'string' && typeof r.session.participant === 'string'
    && ['pre', 'learning', 'post', 'done'].includes(r.session.stage)
    && [r.session.pre, r.session.post].every(run => run?.total === 4 && Array.isArray(run.responses) && run.responses.length <= 4)
    && Array.isArray(r.session.weak) && Array.isArray(r.session.history) && Array.isArray(r.session.completed)
    && !!r.session.results && !!r.session.attempts;
}
export function ut3Score(run: UT3Run, group?: 'foundation' | 'application') {
  const responses = group === 'foundation' ? run.responses.slice(0, 3) : group === 'application' ? run.responses.slice(3) : run.responses;
  const total = group === 'foundation' ? 3 : group === 'application' ? 1 : 4;
  const count = responses.filter(r => r.correct).length;
  return { count, total, accuracy: responses.length === total && responses.every(r => typeof r.correct === 'boolean') ? count / total * 100 : null,
    average: responses.length ? responses.reduce((sum, r) => sum + r.seconds, 0) / responses.length : null,
    unknown: responses.filter(r => r.answer === null).length };
}
