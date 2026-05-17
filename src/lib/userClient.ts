import { apiClient } from './apiClient';
import type { UserSummaryResponse } from '../types/auth';

export async function updateNickname(uid: string, nickname: string) {
  return apiClient.patch<UserSummaryResponse>(`/users/${uid}/nickname`, { nickname });
}

export async function updateGrade(uid: string, grade: number) {
  return apiClient.patch<UserSummaryResponse>(`/users/${uid}/grade`, { grade });
}
