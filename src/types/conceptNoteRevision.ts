export type ConceptNoteRevisionType =
  | 'HARD_TO_UNDERSTAND'
  | 'POSSIBLE_ERROR'
  | 'NEED_EXAMPLE'
  | 'CONFUSING_VISUAL'
  | 'OTHER';

export interface ConceptNoteRevisionSubmission {
  conceptName: string;
  requestType: ConceptNoteRevisionType;
  detail: string;
}

export interface ConceptNoteRevisionResult {
  id: number;
  status: string;
  submittedAt: string;
}
