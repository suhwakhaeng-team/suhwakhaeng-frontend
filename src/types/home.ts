// 홈 화면 타입. CurriculumItem 은 BE `GET /users/{uid}/curriculum` 응답과 매핑.
// 변환은 `lib/curriculumClient.ts#fetchCurriculum` 에서 수행.

export interface CurriculumItem {
  // BE topicId (String). 서버 스키마에 맞춰 string 으로 유지.
  id: string;
  topicName: string;
  categoryPath: string;
  problemCount: number;
  // 커리큘럼 생성 이유 (학생 친화적 문구). 현재 UI 미표시, 향후 카드 확장용.
  reasoning: string;
}

export interface ReviewItem {
  id: number;
  topicName: string;
  categoryName: string;
}

// BE GET /users/{uid}/daily-stats 응답과 1:1.
// - todaySolvedCount: Asia/Seoul 기준 오늘 풀이 건수
// - streakDays: 최근 풀이 날짜가 오늘 또는 어제일 때 그 날짜부터 역순 연속 일수, 아니면 0
// - today: 집계 기준 날짜 (yyyy-MM-dd)
export interface DailyStats {
  todaySolvedCount: number;
  streakDays: number;
  today: string;
}

// BE /curriculum API 미호출 상황(개발/프리뷰)용 샘플. 런타임 기본값으로 쓰지 말 것.
export const curriculumPlaceholder: CurriculumItem[] = [
  { id: 'placeholder-1', topicName: '원순열',               categoryPath: '경우의 수 > 여러 가지 순열',       problemCount: 3, reasoning: '' },
  { id: 'placeholder-2', topicName: '중복순열',             categoryPath: '경우의 수 > 여러 가지 순열',       problemCount: 3, reasoning: '' },
  { id: 'placeholder-3', topicName: '같은 것이 있는 순열',  categoryPath: '경우의 수 > 여러 가지 순열',       problemCount: 3, reasoning: '' },
  { id: 'placeholder-4', topicName: '중복조합',             categoryPath: '경우의 수 > 중복조합과 이항정리', problemCount: 3, reasoning: '' },
  { id: 'placeholder-5', topicName: '중복조합과 수의 활용', categoryPath: '경우의 수 > 중복조합과 이항정리', problemCount: 3, reasoning: '' },
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
