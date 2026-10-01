export type HintFeedbackType =
  | 'HARD_TO_UNDERSTAND'
  | 'TOO_VAGUE'
  | 'TOO_DIRECT'
  | 'POSSIBLE_ERROR'
  | 'OTHER';

export interface HintFeedbackSubmission {
  questionId: number;
  feedbackTarget: 'QUESTION' | 'EXPLANATION' | 'HINT';
  hintText: string;
  feedbackType: HintFeedbackType;
  detail: string;
}

export interface HintFeedbackResult {
  id: number;
  status: string;
  submittedAt: string;
}
