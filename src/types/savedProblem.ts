// 저장된 문제 (BE `SavedProblemResponse` 와 1:1).
// 결과 화면 토글 + 복습 상세 좌측 패널에서 사용.

export interface SavedProblem {
  savedId: number;
  questionId: number;
  content: string;
  answer: string;
  explanation: string | null;
  tagId: number | null;
  tagName: string | null;
  /** ISO 8601 (`yyyy-MM-dd'T'HH:mm:ss[.SSS]`) 저장 시각 */
  savedAt: string;
}
