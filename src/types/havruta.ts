// iOS `HavrutaDTO.swift`와 1:1 대응. 계산 프로퍼티는 헬퍼 함수로 분리.

export interface StartHavrutaSessionRequest {
  uid: string;
  questionId: number | null;
  tagId?: number | null;
  transcript: string;
}

export interface SendHavrutaMessageRequest {
  uid: string;
  questionId: number | null;
  tagId?: number | null;
  transcript: string;
}

export interface UpdateHavrutaSessionRequest {
  uid: string;
  title: string;
}

export interface HavrutaSessionResponse {
  sessionId: number;
  tagId: number;
  tagName: string | null;
  chapterName: string | null;
  title: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface HavrutaMessageResponse {
  messageId: number;
  senderType: 'USER' | 'AI';
  content: string;
  createdAt: string | null;
}

export interface HavrutaExchangeResponse {
  userMessage: HavrutaMessageResponse;
  aiMessage: HavrutaMessageResponse;
}

export interface HavrutaStartSessionResponse {
  session: HavrutaSessionResponse;
  exchange: HavrutaExchangeResponse;
}

export const isUserMessage = (m: HavrutaMessageResponse): boolean => m.senderType === 'USER';

export const categoryLabel = (s: HavrutaSessionResponse): string => {
  if (s.chapterName && s.tagName) return `${s.chapterName} > ${s.tagName}`;
  return s.tagName ?? '';
};

export const displayTitle = (s: HavrutaSessionResponse): string => {
  if (s.title && s.title.length > 0) return s.title;
  return s.tagName ?? '';
};

export const shortDate = (s: HavrutaSessionResponse): string => {
  const source = s.updatedAt ?? s.createdAt ?? '';
  if (!source) return '';
  const parts = source.slice(0, 10).split('-');
  if (parts.length !== 3) return '';
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isFinite(month) || !Number.isFinite(day)) return '';
  return `${month}/${day}`;
};
