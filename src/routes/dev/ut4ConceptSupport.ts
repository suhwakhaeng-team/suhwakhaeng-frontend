const t = String.raw;
export type VisualStep = { title: string; text: string; images: { file: string; alt: string }[]; formula: string };
const image = (file: string, alt: string) => ({ file, alt });

/** Counts are server-owned review clicks, independent for each concept and participant. */
export function reviewLevel(nodeId: string, count: number): number {
  if (nodeId === 'c-conditional') return Math.min(4, Math.max(1, Math.floor(count)));
  return count >= 3 ? 2 : 1;
}

const all: VisualStep = {
  title: '먼저 전체 12명을 살펴봐요',
  text: 'A는 안경을 쓴 사람 6명, B는 모자를 쓴 사람 8명이에요. 두 가지 모두에 해당하는 사람은 4명이에요. 보통 확률은 전체 12명을 기준으로 구해요.',
  images: [image('conditional-all.png', '전체 12명 중 안경 6명, 모자 8명, 공통 4명을 표시한 그림')],
  formula: t`$P(A)=\frac6{12},\quad P(B)=\frac8{12}$`,
};
const given: VisualStep = {
  title: '조건 B인 사람만 새로운 전체로 남겨요',
  text: '모자를 쓴 사람 중 안경도 쓴 비율을 구해요. B 밖은 제외하고 모자를 쓴 8명만 봐요. 그중 안경도 쓴 4명이 분자가 돼요.',
  images: [image('conditional-given.png', '모자를 쓴 8명을 새 전체로 남기고 공통 4명을 강조한 그림')],
  formula: t`$P(A\mid B)=\frac{P(A\cap B)}{P(B)}=\frac48=\frac12$`,
};
const notation: VisualStep = {
  title: '기호를 뒤에서부터 읽어봐요',
  text: 'P는 확률, A는 알고 싶은 사건, 막대 오른쪽의 B는 이미 주어진 조건이에요. P(A | B)는 “B일 때 A일 확률”, 즉 모자를 쓴 사람 중 안경도 쓴 비율이라고 읽어요.',
  images: [image('conditional-notation.png', 'P(A | B)의 P·A·조건 B와 뒤에서부터 읽는 순서를 설명한 그림')],
  formula: t`$P(A\mid B)$`,
};

export function visualSteps(nodeId: string, count: number): VisualStep[] {
  const level = reviewLevel(nodeId, count);
  if (nodeId === 'c-conditional') return level <= 1 ? [] : level === 2 ? [all] : level === 3 ? [given, all] : [notation, all, given];
  if (level === 1) return [];
  if (nodeId === 'c-addition') return [
    { title: 'A와 B를 따로 보고 공통 부분을 찾아요', text: 'A는 왼쪽 원 전체, B는 오른쪽 원 전체예요. 교집합은 두 원이 겹치는 부분이에요. A와 B를 더하면 이 공통 부분을 두 번 세게 돼요.',
      images: [image('venn-1.png', 'A 전체를 칠한 그림'), image('venn-2.png', 'B 전체를 칠한 그림'), image('venn-3.png', 'A와 B의 교집합만 칠한 그림')], formula: t`$P(A)+P(B)$` },
    { title: '겹친 부분을 한 번 빼면 합집합이에요', text: '진하게 겹친 부분을 한 번 빼요. 그러면 A 또는 B에 속하는 영역을 빠짐없이 한 번씩 센 합집합이 돼요.',
      images: [image('venn-4.png', 'A와 B를 더해 교집합이 진하게 겹친 그림'), image('venn-5.png', '한 번 빼야 할 교집합을 점선으로 표시한 그림'), image('venn-6.png', '중복 없이 합집합 전체를 칠한 그림')], formula: t`$P(A\cup B)=P(A)+P(B)-P(A\cap B)$` },
  ];
  if (nodeId === 'c-complement') return [
    { title: '여사건은 그 일이 일어나지 않는 부분이에요', text: '원 A 바깥에 칠해진 부분이 A의 여사건이에요. A와 A의 여사건을 합치면 네모 전체인 1이 돼요. 그래서 전체에서 A를 빼요.',
      images: [image('venn-9.png', '사건 A 바깥인 A의 여사건을 칠한 그림')], formula: t`$P(A^c)=1-P(A)$` },
    { title: '드모르간: A도 B도 아닌 부분은 합집합의 반대예요', text: '두 원 바깥에 칠해진 부분은 A도 아니고 B도 아닌 경우예요. 두 원 안쪽인 합집합과 합치면 전체 1이므로, 합집합을 1에서 빼면 돼요.',
      images: [image('venn-7.png', '두 원 바깥인 A와 B 모두의 여사건을 칠한 그림'), image('venn-6.png', '두 원 안쪽인 합집합을 칠한 그림')], formula: t`$A^c\cap B^c=(A\cup B)^c,\quad P(A^c\cap B^c)=1-P(A\cup B)$` },
  ];
  return [];
}
