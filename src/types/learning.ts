// iOS Suhwakhaeng의 learning 도메인 타입과 1:1 매칭.
// 서버 응답은 ApiResponse<T>로 래핑되므로 여기서는 data 필드의 실제 형태만 정의한다.

export interface LearningProblemDTO {
  id: number;
  topic: string;
  title: string;
  description: string;
  answer: string;
}

export type LearningProblem = LearningProblemDTO;

export interface AnswerItem {
  problemId: number;
  topic: string;
  userAnswer: string;
  correct: boolean;
}

export interface AnswerSubmissionRequest {
  answers: AnswerItem[];
}

export interface LearningRouteResponse {
  topicMastery: Record<string, number>;
  learningRoute: string;
  overallAssessment: string;
}
