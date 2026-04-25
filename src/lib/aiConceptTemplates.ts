// 복습 ReviewDetail → AI 챗 진입 시 빈 상태에 노출되는 추천 질문 칩 텍스트.
// iOS `AIConceptReducer.defaultSuggestedPrompts(for:)` 와 1:1 동일한 카피.

/**
 * 단원명 기반 정적 추천 질문 3개를 반환한다.
 * tagName 이 비어있거나 null/undefined 면 빈 배열 (= 칩 미표시).
 */
export function getDefaultSuggestedQuestions(tagName: string | null | undefined): string[] {
  const name = tagName?.trim();
  if (!name) return [];
  return [
    `${name} 개념을 쉽게 다시 설명해줘`,
    `내가 ${name}에서 자주 틀리는 이유는?`,
    `${name}과 연결된 다음 단원은 뭐야?`,
  ];
}
