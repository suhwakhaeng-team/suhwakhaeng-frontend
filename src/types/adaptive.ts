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
  answerType?: 'NUMBER' | 'MULTIPLE_CHOICE' | null;
  choiceA?: string | null;
  choiceB?: string | null;
  choiceC?: string | null;
  choiceD?: string | null;
  numericTolerance?: number | null;
  explanation: string | null;
  difficulty: number | null;
  tags: AdaptiveQuestionTag[];
}

export interface StudySubmitRequest {
  uid: string;
  questionId: number;
  isCorrect: boolean;
  timeTakenSec: number;
  userAnswer?: string; // 사용자가 쓴 답(오답 기록용)
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
