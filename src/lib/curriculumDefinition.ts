// 단원 → 토픽 정적 매핑 (iOS CurriculumDefinition.swift 1:1 포팅)

export interface CurriculumUnit {
  id: string;
  grade: string;
  unitName: string;
  topics: string[];
}

export interface CurriculumCardItem {
  id: string;
  grade: string;
  unitName: string;
  mastery: number;
  topics: string[];
}

const CURRICULUM_UNITS: CurriculumUnit[] = [
  { id: 'u1', grade: '중1', unitName: '자료와 가능성', topics: ['중앙값', '최빈값', '평균'] },
  { id: 'u2', grade: '중1', unitName: '도수분포표와 상대도수', topics: ['줄기와 잎', '도수분포표', '히스토그램', '도수분포다각형'] },
  { id: 'u3', grade: '중3', unitName: '산포도', topics: ['편차', '분산', '표준편차', '산포도'] },
  { id: 'u4', grade: '중3', unitName: '상자그림과 산점도', topics: ['산점도', '상관관계'] },
  { id: 'u5', grade: '고2', unitName: '확률변수와 확률분포', topics: ['확률변수', '확률분포', '연속확률변수', '확률밀도함수'] },
  { id: 'u6', grade: '고2', unitName: '이산확률변수의 기댓값과 표준편차', topics: ['이산확률변수', '확률질량함수', '기댓값'] },
  { id: 'u7', grade: '고2', unitName: '이항분포', topics: ['이항분포'] },
  { id: 'u8', grade: '고2', unitName: '정규분포', topics: ['정규분포', '표준정규분포'] },
  { id: 'u9', grade: '고2', unitName: '모집단과 표본', topics: ['모집단', '전수조사', '표본조사'] },
  { id: 'u10', grade: '고2', unitName: '표본평균과 표본비율의 분포', topics: ['모평균', '표본평균', '임의추출'] },
  { id: 'u11', grade: '고2', unitName: '모평균과 모비율의 추정', topics: ['모평균의 추정', '모비율의 추정'] },
];

export function buildCurriculumCards(
  topicMastery: Record<string, number>,
): CurriculumCardItem[] {
  const matched = new Set<string>();
  const cards: CurriculumCardItem[] = [];

  for (const unit of CURRICULUM_UNITS) {
    const mastery = topicMastery[unit.unitName] ?? -1;
    matched.add(unit.unitName);
    cards.push({
      id: unit.id,
      grade: unit.grade,
      unitName: unit.unitName,
      mastery,
      topics: unit.topics,
    });
  }

  // 정적 목록에 없는 단원이 API에 있으면 끝에 추가
  for (const [unitName, mastery] of Object.entries(topicMastery)) {
    if (!matched.has(unitName)) {
      cards.push({
        id: `extra-${unitName}`,
        grade: '',
        unitName,
        mastery,
        topics: [],
      });
    }
  }

  return cards;
}
