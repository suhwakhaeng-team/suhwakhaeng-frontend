import { apiClient } from './apiClient';
import type {
  StartHavrutaSessionRequest,
  SendHavrutaMessageRequest,
  UpdateHavrutaSessionRequest,
  HavrutaSessionResponse,
  HavrutaMessageResponse,
  HavrutaExchangeResponse,
  HavrutaStartSessionResponse,
} from '../types/havruta';

function unwrap<T>(
  response: { success: boolean; data: T | null; error: string | null },
  fallback: string,
): T {
  if (!response.success || response.data === null || response.data === undefined) {
    throw new Error(response.error ?? fallback);
  }
  return response.data;
}

export const havrutaClient = {
  async startSession(req: StartHavrutaSessionRequest): Promise<HavrutaStartSessionResponse> {
    const res = await apiClient.post<HavrutaStartSessionResponse>('/havruta/sessions/start', req);
    return unwrap(res, '세션 시작 실패');
  },

  async fetchSessions(uid: string): Promise<HavrutaSessionResponse[]> {
    const res = await apiClient.get<HavrutaSessionResponse[]>(
      `/havruta/sessions?uid=${encodeURIComponent(uid)}`,
    );
    return unwrap(res, '세션 목록 조회 실패');
  },

  async fetchMessages(sessionId: number, uid: string): Promise<HavrutaMessageResponse[]> {
    const res = await apiClient.get<HavrutaMessageResponse[]>(
      `/havruta/sessions/${sessionId}/messages?uid=${encodeURIComponent(uid)}`,
    );
    return unwrap(res, '메시지 조회 실패');
  },

  async sendMessage(
    sessionId: number,
    req: SendHavrutaMessageRequest,
  ): Promise<HavrutaExchangeResponse> {
    const res = await apiClient.post<HavrutaExchangeResponse>(
      `/havruta/sessions/${sessionId}/messages`,
      req,
    );
    return unwrap(res, '메시지 전송 실패');
  },

  async updateSession(
    sessionId: number,
    req: UpdateHavrutaSessionRequest,
  ): Promise<HavrutaSessionResponse> {
    const res = await apiClient.put<HavrutaSessionResponse>(
      `/havruta/sessions/${sessionId}`,
      req,
    );
    return unwrap(res, '세션 수정 실패');
  },

  async deleteSession(sessionId: number, uid: string): Promise<void> {
    const res = await apiClient.delete<string>(
      `/havruta/sessions/${sessionId}?uid=${encodeURIComponent(uid)}`,
    );
    if (!res.success) throw new Error(res.error ?? '세션 삭제 실패');
  },
};
