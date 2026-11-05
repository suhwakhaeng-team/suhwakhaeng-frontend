import type { UT2SurveySubmission } from '../../types/ut2Survey';

export const UT5_CACHE_KEY = 'suhwakhaeng:ut5:server:v1';
export const UT5_CREATE_KEY = 'suhwakhaeng:ut5:create:v1';
export const UT5_PENDING_KEY = 'suhwakhaeng:ut5:pending:v1';
export type UT5Response = { questionId?: string; nodeId?: string; variant?: number; answer: string | null; correct?: boolean; seconds: number; answeredAt: number };
export type UT5Run = { form: 'A' | 'B'; total: number; responses: UT5Response[] };
export type UT5Session = {
  activeGoal?: string;
  lessons: Record<string, {label: string; note: string}>;
  surveySubmitted?: boolean; rewardEntered?: boolean;
  learnedConcepts?: string[];
  reviewCounts: Record<string, number>;
  id: string; participant: string; createdAt: number; bankVersion: 1 | 2 | 3 | 4 | 5; stage: 'pre' | 'learning' | 'post' | 'done';
  pre: UT5Run; post: UT5Run; history: UT5Response[]; weak: string[]; completed: string[];
  results: Record<string, 'passed' | 'failed'>; attempts: Record<string, number>; learningNode: string | null;
  recommended: string | null; lastActionId: string | null;
  question: { id?: string; nodeId?: string; prompt: string; choices?: string[]; group?: string } | null;
  feedback: { nodeId: string; nextNode: string; prompt: string; explanation: string; unknown: boolean } | null;
};
export type UT5Reply = { session: UT5Session; revision: number };
export type UT5Credential = { id: string; token: string };
export type UT5Action = { actionId: string; revision: number; type: 'answer' | 'open' | 'continue' | 'post' | 'lesson' | 'review'; questionId?: string; nodeId?: string; variant?: number; answer?: string | null; seconds?: number; elapsedSeconds?: number; startedAt?: number; interruptions?: number };
export class UT5ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) { super(message); this.status = status; }
}
export function ut5Api(base = '/api/v1', transport: typeof fetch = fetch) {
  async function request<T>(path: string, method: string, body?: unknown, token?: string): Promise<T> {
    let response: globalThis.Response;
    try {
      response = await transport(`${base.replace(/\/$/, '')}/ut5${path}`, { method,
        headers: { 'Content-Type': 'application/json', ...(token ? { 'X-UT-Token': token } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    } catch { throw new UT5ApiError('서버에 연결하지 못했어요. 입력은 보관 중이니 다시 저장해 주세요.'); }
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new UT5ApiError(data?.error || `5차 UT 서버 요청 실패 (${response.status})`, response.status);
    }
    return response.status === 204 ? undefined as T : response.json();
  }
  return {
    enter: (password: string) => request<void>('/entry', 'POST', { password }),
    create: (password: string, nickname: string, token: string) => request<UT5Reply>('/sessions', 'POST', { password, nickname, token }),
    get: (c: UT5Credential) => request<UT5Reply>(`/sessions/${encodeURIComponent(c.id)}`, 'GET', undefined, c.token),
    survey: (c: UT5Credential, answers: UT2SurveySubmission) => request<UT5Reply>(`/sessions/${encodeURIComponent(c.id)}/survey`, 'POST', answers, c.token),
    act: (c: UT5Credential, a: UT5Action) => request<UT5Reply>(`/sessions/${encodeURIComponent(c.id)}/actions`, 'POST', a, c.token),
  };
}
export function validUT5Reply(value: unknown): value is UT5Reply {
  const r = value as UT5Reply | null;
  return !!r && Number.isSafeInteger(r.revision) && !!r.session && [1,2,3,4,5].includes(r.session.bankVersion)
    && r.session.pre?.form === 'A' && r.session.post?.form === 'B'
    && typeof r.session.id === 'string' && typeof r.session.participant === 'string'
    && ['pre', 'learning', 'post', 'done'].includes(r.session.stage)
    && [r.session.pre, r.session.post].every(run => run?.total === 5 && Array.isArray(run.responses) && run.responses.length <= 5)
    && Array.isArray(r.session.weak) && Array.isArray(r.session.history) && Array.isArray(r.session.completed)
    && !!r.session.results && !!r.session.attempts && !!r.session.reviewCounts;
}
export function ut5Score(run: UT5Run) {
  const responses = run.responses;
  const timedResponses = responses.filter(r => r.answer !== null);
  const total = 5;
  const count = responses.filter(r => r.correct).length;
  return { count, total, accuracy: responses.length === total && responses.every(r => typeof r.correct === 'boolean') ? count / total * 100 : null,
    average: timedResponses.length ? timedResponses.reduce((sum, r) => sum + r.seconds, 0) / timedResponses.length : null,
    unknown: responses.filter(r => r.answer === null).length };
}
