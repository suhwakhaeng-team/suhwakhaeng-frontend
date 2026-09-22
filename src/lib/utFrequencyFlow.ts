import type { CurriculumItem } from '../types/home';

export const UT_FREQUENCY_FLOW_ENABLED = true;
export const UT_FREQUENCY_TOPIC_NAME = '도수분포표';
export const UT_FREQUENCY_LEARNING_ROUTE = '/main/learning/frequency-table';

const UT_FREQUENCY_RECOMMENDATION: CurriculumItem = {
  id: 'ut-frequency-table',
  topicName: UT_FREQUENCY_TOPIC_NAME,
  categoryPath: '자료의 정리 > 도수분포표',
  problemCount: 3,
  reasoning: 'UT에서 게임형 개념 학습과 확인 평가 흐름을 검증합니다.',
};

export function isUtFrequencyConcept(topicName: string): boolean {
  return topicName.trim() === UT_FREQUENCY_TOPIC_NAME;
}

/**
 * UT 동안만 도수분포표를 첫 번째 추천으로 올린다.
 * 서버가 생성한 추천은 제거하지 않고 뒤에 그대로 유지한다.
 */
export function applyUtFrequencyRecommendation(
  items: CurriculumItem[],
  activeId: string | null,
): { items: CurriculumItem[]; activeId: string | null } {
  if (!UT_FREQUENCY_FLOW_ENABLED) return { items, activeId };

  const existing = items.find((item) => isUtFrequencyConcept(item.topicName));
  const frequencyItem = existing ?? UT_FREQUENCY_RECOMMENDATION;
  const remaining = items.filter(
    (item) => item.id !== frequencyItem.id && !isUtFrequencyConcept(item.topicName),
  );

  return {
    items: [frequencyItem, ...remaining],
    activeId: frequencyItem.id,
  };
}
