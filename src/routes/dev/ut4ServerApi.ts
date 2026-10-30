import type { UT2SurveySubmission } from '../../types/ut2Survey';

export const UT4_CACHE_KEY = 'suhwakhaeng:ut4:server:v1';
export const UT4_CREATE_KEY = 'suhwakhaeng:ut4:create:v1';
export const UT4_PENDING_KEY = 'suhwakhaeng:ut4:pending:v1';
export type UT4Response = { questionId?: string; nodeId?: string; variant?: number; answer: string | null; correct?: boolean; seconds: number; answeredAt: number };
export type UT4Run = { form: 'A' | 'B'; total: number; responses: UT4Response[] };
export type UT4Session = {
  surveySubmitted?: boolean; rewardEntered?: boolean;
  learnedConcepts?: string[];
  reviewCounts: Record<string, number>;
  id: string; participant: string; createdAt: number; bankVersion: 1; stage: 'pre' | 'learning' | 'post' | 'done';
  pre: UT4Run; post: UT4Run; history: UT4Response[]; weak: string[]; completed: string[];
  results: Record<string, 'passed' | 'failed'>; attempts: Record<string, number>; learningNode: string | null;
  recommended: string | null; lastActionId: string | null;
  question: { id?: string; nodeId?: string; prompt: string; group?: string } | null;
  feedback: { nodeId: string; nextNode: string; prompt: string; explanation: string; unknown: boolean } | null;
};
export type UT4Reply = { session: UT4Session; revision: number };
export type UT4Credential = { id: string; token: string };
export type UT4Action = { actionId: string; revision: number; type: 'answer' | 'open' | 'continue' | 'post' | 'lesson' | 'review'; questionId?: string; nodeId?: string; variant?: number; answer?: string | null; seconds?: number };
export class UT4ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) { super(message); this.status = status; }
}
export function ut4Api(base = '/api/v1', transport: typeof fetch = fetch) {
  async function request<T>(path: string, method: string, body?: unknown, token?: string): Promise<T> {
    let response: globalThis.Response;
    try {
      response = await transport(`${base.replace(/\/$/, '')}/ut4${path}`, { method,
        headers: { 'Content-Type': 'application/json', ...(token ? { 'X-UT-Token': token } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    } catch { throw new UT4ApiError('서버에 연결하지 못했어요. 입력은 보관 중이니 다시 저장해 주세요.'); }
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new UT4ApiError(data?.error || `4차 UT 서버 요청 실패 (${response.status})`, response.status);
    }
    return response.status === 204 ? undefined as T : response.json();
  }
  return {
    enter: (password: string) => request<void>('/entry', 'POST', { password }),
    create: (password: string, nickname: string, token: string) => request<UT4Reply>('/sessions', 'POST', { password, nickname, token }),
    get: (c: UT4Credential) => request<UT4Reply>(`/sessions/${encodeURIComponent(c.id)}`, 'GET', undefined, c.token),
    survey: (c: UT4Credential, answers: UT2SurveySubmission) => request<UT4Reply>(`/sessions/${encodeURIComponent(c.id)}/survey`, 'POST', answers, c.token),
    act: (c: UT4Credential, a: UT4Action) => request<UT4Reply>(`/sessions/${encodeURIComponent(c.id)}/actions`, 'POST', a, c.token),
  };
}
export function validUT4Reply(value: unknown): value is UT4Reply {
  const r = value as UT4Reply | null;
  return !!r && Number.isSafeInteger(r.revision) && !!r.session && r.session.bankVersion === 1
    && r.session.pre?.form === 'A' && r.session.post?.form === 'B'
    && typeof r.session.id === 'string' && typeof r.session.participant === 'string'
    && ['pre', 'learning', 'post', 'done'].includes(r.session.stage)
    && [r.session.pre, r.session.post].every(run => run?.total === 6 && Array.isArray(run.responses) && run.responses.length <= 6)
    && Array.isArray(r.session.weak) && Array.isArray(r.session.history) && Array.isArray(r.session.completed)
    && !!r.session.results && !!r.session.attempts && !!r.session.reviewCounts;
}
export function ut4Score(run: UT4Run, group?: 'foundation' | 'application' | 'extension') {
  const responses = group === 'foundation' ? run.responses.slice(0, 3) : group === 'application' ? run.responses.slice(3, 4) : group === 'extension' ? run.responses.slice(4, 6) : run.responses;
  const total = group === 'foundation' ? 3 : group === 'application' ? 1 : group === 'extension' ? 2 : 6;
  const count = responses.filter(r => r.correct).length;
  return { count, total, accuracy: responses.length === total && responses.every(r => typeof r.correct === 'boolean') ? count / total * 100 : null,
    average: responses.length ? responses.reduce((sum, r) => sum + r.seconds, 0) / responses.length : null,
    unknown: responses.filter(r => r.answer === null).length };
}
