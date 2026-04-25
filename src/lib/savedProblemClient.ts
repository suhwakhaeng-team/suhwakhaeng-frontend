import { apiClient } from './apiClient';
import type { SavedProblem } from '../types/savedProblem';

/**
 * 저장된 문제 CRUD. iOS `SavedProblemAPIClient` 와 동일 엔드포인트.
 *
 * - GET    /api/v1/users/{uid}/saved-problems?tagId=  (tagId optional)
 * - POST   /api/v1/users/{uid}/saved-problems         { questionId } — 멱등
 * - DELETE /api/v1/users/{uid}/saved-problems/{questionId}
 */

export async function fetchSavedProblems(uid: string, tagId?: number): Promise<SavedProblem[]> {
  const qs = tagId != null ? `?tagId=${tagId}` : '';
  const res = await apiClient.get<SavedProblem[]>(`/users/${uid}/saved-problems${qs}`);
  if (!res.success || !res.data) {
    throw new Error(res.error ?? '저장 문제 조회 실패');
  }
  return res.data;
}

export async function saveProblem(uid: string, questionId: number): Promise<SavedProblem> {
  const res = await apiClient.post<SavedProblem>(`/users/${uid}/saved-problems`, { questionId });
  if (!res.success || !res.data) {
    throw new Error(res.error ?? '문제 저장 실패');
  }
  return res.data;
}

export async function unsaveProblem(uid: string, questionId: number): Promise<void> {
  const res = await apiClient.delete<boolean>(`/users/${uid}/saved-problems/${questionId}`);
  if (!res.success) {
    throw new Error(res.error ?? '문제 저장 해제 실패');
  }
}
