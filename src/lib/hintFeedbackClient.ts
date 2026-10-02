import type { HintFeedbackResult, HintFeedbackSubmission } from '../types/hintFeedback';
import { apiClient } from './apiClient';

export async function submitHintFeedback(
  uid: string | null,
  payload: HintFeedbackSubmission,
): Promise<void> {
  if (!uid) throw new Error('로그인 후 피드백을 보낼 수 있어요.');

  const response = await apiClient.post<HintFeedbackResult>(
    `/users/${encodeURIComponent(uid)}/hint-feedback`,
    payload,
  );
  if (!response.success || !response.data) {
    throw new Error(response.error ?? '피드백을 보내지 못했습니다.');
  }
}
