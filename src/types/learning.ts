// iOS Suhwakhaeng의 learning 도메인 타입과 1:1 매칭.
// 서버 응답은 ApiResponse<T>로 래핑되므로 여기서는 data 필드의 실제 형태만 정의한다.

export interface LearningProblemDTO {
  id: number;
  topic: string;
  title: string;
  description: string;
  answer: string;
  answerType?: 'NUMBER' | 'MULTIPLE_CHOICE' | null;
  choiceA?: string | null;
  choiceB?: string | null;
  choiceC?: string | null;
  choiceD?: string | null;
  numericTolerance?: number | null;
  concepts?: string[];
}

export type LearningProblem = LearningProblemDTO;

export interface AnswerItem {
  problemId: number;
  topic: string;
  userAnswer: string;
  correct: boolean;
  timeTakenSec?: number; // 문항 풀이시간(초). 레벨 비교 분석용.
  concepts?: string[];
  diagnosticRole?: 'main' | 'drilldown';
}

export interface AnswerSubmissionRequest {
  answers: AnswerItem[];
  nodeLevel?: string; // 시작 계층 BN/AN/SAN (레벨 비교 수집용).
}

export interface LearningRouteResponse {
  topicMastery: Record<string, number>;
  learningRoute: string;
  overallAssessment: string;
  // 서버 응답에 클라이언트가 덧붙이는 레벨테스트 원답안.
  // BN 정답 + 오답 시 이어지는 AN 정답을 함께 보고 안정/불안정/보완 필요를 구분한다.
  diagnosticAnswers?: AnswerItem[];
}
