// Adaptive Learning 도메인 타입 — 서버 /api/v1/adaptive 엔드포인트와 1:1 매칭.

export interface AdaptiveQuestionTag {
  tagId: number;
  chapterId: number;
  chapterName: string;
  tagName: string;
  baseColor: string;
}

export interface AdaptiveQuestion {
  questionId: number;
  content: string;
  answer: string;
  explanation: string | null;
  difficulty: number | null;
  tags: AdaptiveQuestionTag[];
}

export interface StudySubmitRequest {
  uid: string;
  questionId: number;
  isCorrect: boolean;
  timeTakenSec: number;
}

export interface UpdatedMastery {
  masteryId: number;
  tagId: number;
  tagName: string;
  masteryScore: number;
  correctCount: number;
  colorDepth: number;
}

export interface StudySubmitResponse {
  logId: number;
  updatedMasteries: UpdatedMastery[];
  recommendations: unknown[];
}
