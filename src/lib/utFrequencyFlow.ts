import type { CurriculumItem } from '../types/home';
import type { CurriculumMapItem } from '../types/curriculumMap';
import type { TopologyResponse } from '../types/topology';

export const UT_FREQUENCY_FLOW_ENABLED = true;
export const UT_FREQUENCY_TOPIC_NAME = '도수분포표';
export const UT_FREQUENCY_LEARNING_ROUTE = '/main/learning/frequency-table';
export const UT_FREQUENCY_COMPLETION_STORAGE_KEY = 'dev_frequency_assessment_ut1_passed';

const UT_FREQUENCY_RECOMMENDATION: CurriculumItem = {
  id: 'ut-frequency-table',
  topicName: UT_FREQUENCY_TOPIC_NAME,
  categoryPath: '자료의 정리 > 도수분포표',
  problemCount: 3,
  reasoning: 'UT에서 게임형 개념 학습과 확인 평가 흐름을 검증합니다.',
};

const UT_POST_FREQUENCY_RECOMMENDATIONS: CurriculumItem[] = [
  {
    id: 'ut-mode',
    topicName: '최빈값',
    categoryPath: '자료의 정리 > 최빈값',
    problemCount: 3,
    reasoning: '도수분포표 다음 개념으로 대표값을 학습합니다.',
  },
  {
    id: 'ut-scatter-plot',
    topicName: '산점도',
    categoryPath: '자료의 정리 > 산점도',
    problemCount: 3,
    reasoning: '두 변수의 관계를 시각적으로 해석합니다.',
  },
];

export function isUtFrequencyConcept(topicName: string): boolean {
  return topicName.trim() === UT_FREQUENCY_TOPIC_NAME;
}

export function hasCompletedUtFrequencyLearning(): boolean {
  try { return localStorage.getItem(UT_FREQUENCY_COMPLETION_STORAGE_KEY) === 'true'; }
  catch { return false; }
}

/**
 * UT 동안만 도수분포표를 첫 번째 추천으로 올린다.
 * 서버가 생성한 추천은 제거하지 않고 뒤에 그대로 유지한다.
 */
export function applyUtFrequencyRecommendation(
  items: CurriculumItem[],
  activeId: string | null,
  completed = hasCompletedUtFrequencyLearning(),
): { items: CurriculumItem[]; activeId: string | null } {
  if (!UT_FREQUENCY_FLOW_ENABLED) return { items, activeId };

  if (completed) {
    const nextItems = UT_POST_FREQUENCY_RECOMMENDATIONS.map(fallback =>
      items.find(item => item.topicName.trim() === fallback.topicName) ?? fallback,
    );
    const nextNames = new Set(nextItems.map(item => item.topicName.trim()));
    const nextIds = new Set(nextItems.map(item => item.id));
    const remaining = items.filter(item =>
      !isUtFrequencyConcept(item.topicName)
      && !nextNames.has(item.topicName.trim())
      && !nextIds.has(item.id),
    );
    return { items: [...nextItems, ...remaining], activeId: nextItems[0].id };
  }

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

export function applyUtFrequencyMasteryToOverview(
  items: CurriculumMapItem[],
  completed = hasCompletedUtFrequencyLearning(),
): CurriculumMapItem[] {
  if (!UT_FREQUENCY_FLOW_ENABLED || !completed) return items;
  return items.map(item => isUtFrequencyConcept(item.tagName)
    ? { ...item, status: 'MASTERED', colorDepth: 100 }
    : item);
}

export function applyUtFrequencyMasteryToTopology(
  topology: TopologyResponse,
  completed = hasCompletedUtFrequencyLearning(),
): TopologyResponse {
  if (!UT_FREQUENCY_FLOW_ENABLED || !completed) return topology;
  return {
    ...topology,
    nodes: topology.nodes.map(node => isUtFrequencyConcept(node.tagName)
      ? { ...node, status: 'MASTERED', colorDepth: 100 }
      : node),
  };
}
