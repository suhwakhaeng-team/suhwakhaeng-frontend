import type { MapPosition } from '../types/learningGraph.ts';

// Keep the original 36-concept map as the visual baseline. New concepts occupy
// nearby free branches rather than recentering or reordering the existing map.
// Adjust only branches that need a prerequisite step or a parallel merge.
const positions: Record<string, MapPosition> = {
  '도수분포표': { x: -70, y: 204 },
  '평균': { x: 70, y: -4 },
  '최빈값': { x: 70, y: 100 },
  '도수분포다각형': { x: 70, y: 204 },
  '히스토그램': { x: 70, y: 308 },
  '편차': { x: 210, y: -4 },
  '분산': { x: 350, y: -4 },
  '표준편차': { x: 490, y: -4 },
  '산점도': { x: 630, y: -4 },
  '상관관계': { x: 770, y: -4 },
  '산포도': { x: 630, y: 100 },
  '중앙값': { x: 210, y: 100 },
  '줄기와 잎': { x: 210, y: 308 },

  '곱의 법칙': { x: -70, y: 60 },
  '합의 법칙': { x: -70, y: 164 },
  '팩토리얼': { x: 70, y: 112 },

  '순열': { x: -140, y: 112 },
  '조합': { x: 0, y: 112 },
  '중복조합': { x: 140, y: 60 },
  '이항정리': { x: 140, y: 164 },
  '원순열': { x: 0, y: -96 },
  '같은 것이 있는 순열': { x: 0, y: 8 },
  '중복순열': { x: 0, y: 268 },
  '함수의 개수': { x: 140, y: 268 },

  '배반사건': { x: 210, y: 60 },
  '표본공간과 사건': { x: -70, y: 164 },
  '수학적 확률': { x: 70, y: 164 },
  '여사건': { x: 210, y: 164 },
  '확률의 덧셈 정리': { x: 350, y: 112 },

  '조건부확률': { x: -280, y: 112 },
  '확률의 곱셈정리': { x: -140, y: 112 },
  '사건의 독립': { x: 0, y: 112 },
  '독립시행의 확률': { x: 140, y: 112 },

  '확률변수': { x: -350, y: 112 },
  '이산확률변수': { x: -210, y: 112 },
  '이항분포': { x: 70, y: 8 },
  '기댓값': { x: 70, y: 112 },
  '이산확률분포': { x: -70, y: 112 },

  '연속확률변수': { x: -280, y: 112 },
  '확률밀도함수': { x: -140, y: 112 },
  '정규분포': { x: 0, y: 112 },
  '표준정규분포': { x: 140, y: 60 },
  '표준화': { x: 280, y: 60 },
  '이항분포의 정규근사': { x: 420, y: 60 },

  '모집단': { x: -280, y: 112 },
  '표본조사': { x: -140, y: 112 },
  '임의추출': { x: 0, y: 112 },
  '표본평균': { x: 140, y: 60 },
  '표본비율': { x: 140, y: 164 },
  '신뢰구간': { x: 280, y: 112 },
  '모평균': { x: -140, y: 8 },
  '전수조사': { x: -140, y: 216 },
};

const legacyNames: Record<string, string> = {
  '독립사건': '사건의 독립',
  '중복조합의 활용': '중복조합',
  '이항계수의 활용': '이항정리',
  '확률질량함수': '이산확률분포',
  '확률분포': '이산확률분포',
};

export function curriculumConceptPosition(name: string): MapPosition | undefined {
  const point = positions[legacyNames[name] ?? name];
  return point ? { ...point } : undefined;
}
