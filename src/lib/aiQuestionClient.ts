import { apiClient } from './apiClient';

export interface AiQuestionUsage {
  date: string;
  limit: number;
  used: number;
  remaining: number;
  resetsAt: string;
  maxInputCharacters: number;
  maxOutputTokens: number;
  model: string;
}

export const aiQuestionClient = {
  async fetchUsage(): Promise<AiQuestionUsage> {
    const response = await apiClient.get<AiQuestionUsage>('/ai/questions/usage');
    if (!response.success || !response.data) {
      throw new Error(response.error ?? '오늘의 AI 질문 횟수를 확인하지 못했어요.');
    }
    return response.data;
  },
};
