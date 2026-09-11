import type { FeedbackSubmission, FeedbackSubmissionResult } from '../types/feedback';
import { apiClient } from './apiClient';

export async function submitFeedback(uid: string, payload: FeedbackSubmission) {
  const response = await apiClient.post<FeedbackSubmissionResult>(
    `/users/${uid}/feedback`,
    payload,
  );

  if (!response.success || !response.data) {
    throw new Error(response.error ?? '피드백을 제출하지 못했습니다.');
  }

  return response.data;
}
