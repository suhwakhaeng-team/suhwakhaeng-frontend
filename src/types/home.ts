// 홈 화면 placeholder 타입. 추후 BE API(`/users/{uid}/curriculum`, `/users/{uid}/review`)가
// 구현되면 응답 스키마로 교체.

export interface CurriculumItem {
  id: number;
  topicName: string;
  categoryPath: string;
  problemCount: number;
}

export interface ReviewItem {
  id: number;
  topicName: string;
  categoryName: string;
}

export const curriculumPlaceholder: CurriculumItem[] = [
  { id: 1, topicName: '원순열',               categoryPath: '경우의 수 > 여러 가지 순열',         problemCount: 3 },
  { id: 2, topicName: '중복순열',             categoryPath: '경우의 수 > 여러 가지 순열',         problemCount: 3 },
  { id: 3, topicName: '같은 것이 있는 순열',  categoryPath: '경우의 수 > 여러 가지 순열',         problemCount: 3 },
  { id: 4, topicName: '중복조합',             categoryPath: '경우의 수 > 중복조합과 이항정리',   problemCount: 3 },
  { id: 5, topicName: '중복조합과 수의 활용', categoryPath: '경우의 수 > 중복조합과 이항정리',   problemCount: 3 },
];

export const reviewPlaceholder: ReviewItem[] = [
  { id: 1, topicName: '원순열',              categoryName: '여러 가지 순열' },
  { id: 2, topicName: '중복조합',            categoryName: '중복조합과 이항정리' },
  { id: 3, topicName: '같은 것이 있는 순열', categoryName: '여러 가지 순열' },
];

// BE `grade: number | null`(1~3 중1~중3, 4~6 고1~고3) 전제 단순 매핑
export function gradeLabel(grade: number | null | undefined): string | null {
  if (grade == null) return null;
  if (grade >= 1 && grade <= 3) return `중${grade}`;
  if (grade >= 4 && grade <= 6) return `고${grade - 3}`;
  return null;
}
