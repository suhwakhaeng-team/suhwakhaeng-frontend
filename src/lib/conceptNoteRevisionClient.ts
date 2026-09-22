import type {
  ConceptNoteRevisionResult,
  ConceptNoteRevisionSubmission,
} from '../types/conceptNoteRevision';
import { apiClient } from './apiClient';

const LOCAL_STORAGE_KEY = 'concept_note_revision_requests';

const saveLocally = (payload: ConceptNoteRevisionSubmission) => {
  const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
  const requests = existing ? JSON.parse(existing) as unknown[] : [];
  requests.push({ id: crypto.randomUUID(), ...payload, submittedAt: new Date().toISOString() });
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(requests));
};

export async function submitConceptNoteRevision(
  uid: string | null,
  payload: ConceptNoteRevisionSubmission,
): Promise<{ savedLocally: boolean }> {
  if (uid) {
    const response = await apiClient.post<ConceptNoteRevisionResult>(
      `/users/${encodeURIComponent(uid)}/concept-note-revision-requests`,
      payload,
    );
    if (!response.success || !response.data) {
      if (import.meta.env.DEV) {
        saveLocally(payload);
        return { savedLocally: true };
      }
      throw new Error(response.error ?? '수정 요청을 보내지 못했습니다.');
    }
    return { savedLocally: false };
  }

  saveLocally(payload);
  return { savedLocally: true };
}
