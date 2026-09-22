export const STEPS = [
  { title: '도수분포표 읽어보기', subtitle: '정리하는 이유', goal: '표에서 구간별 인원을 확인하세요.', tip: '도수는 그 구간에 들어가는 자료의 개수예요.' },
  { title: '구간에 분류해보기', subtitle: '이상과 미만', goal: '20 이상 30 미만인 카드를 모두 선택하세요.', tip: '20 이상은 20을 포함하고, 30 미만은 30을 포함하지 않아요.' },
  { title: '도수 세어보기', subtitle: '구간별 개수', goal: '20 이상 30 미만인 학생은 몇 명인가요?', tip: '해당 구간의 자료를 하나씩 세어보세요. 같은 숫자도 각각 한 명이에요.' },
  { title: '표의 빈칸 채워보기', subtitle: '빈칸 완성', goal: '첫 번째 행을 참고해 빈칸을 채우세요.', tip: '한 자료는 한 구간에만 들어가요. 도수의 합은 자료의 전체 개수와 같아요.' },
  { title: '새 자료로 표 만들어보기', subtitle: '새로운 자료', goal: '새 자료의 도수를 세어 표를 완성하세요.', tip: '각 구간에 속하는 자료를 세고, 마지막에 도수의 합을 확인해보세요.' },
  { title: '표를 만들고 해석해보기', subtitle: '만들고 해석하기', goal: '가장 많은 구간과 전체 인원을 구하세요.', tip: '표를 완성한 뒤 가장 큰 도수를 찾아요. 전체 인원은 도수의 합이에요.' },
] as const;

export const RANGES = ['10 이상 20 미만', '20 이상 30 미만', '30 이상 40 미만'];
export const DATASETS = {
  practice: [12, 18, 20, 23, 23, 29, 30, 35],
  independent: [10, 15, 19, 20, 28, 30, 31, 34, 39],
  challenge: [11, 16, 19, 20, 22, 25, 29, 30, 38],
  review: [10, 19, 20, 24, 30, 31, 33, 36, 39],
};

export function frequencies(data: readonly number[]) {
  return [10, 20, 30].map(lower => data.filter(value => value >= lower && value < lower + 10).length);
}

export function checkMission(step: number, answers: string[], selected: number[], review = false): boolean {
  if (step === 0) return answers[0] === '1';
  if (step === 1) return selected.length === 3 && [20, 23, 29].every(value => selected.includes(value));
  if (step === 2) return answers[0]?.trim() !== '' && Number(answers[0]) === 4;
  const data = review ? DATASETS.review : step === 3 ? DATASETS.practice : step === 4 ? DATASETS.independent : DATASETS.challenge;
  const expected = frequencies(data);
  if (!expected.every((count, index) => answers[index]?.trim() !== '' && Number(answers[index]) === count)) return false;
  if (step !== 5) return true;
  return answers[3] === String(expected.indexOf(Math.max(...expected))) && answers[4]?.trim() !== '' && Number(answers[4]) === data.length;
}

export type CourseProgress = { completed: number[]; reviewPassed: boolean };
export const EMPTY_PROGRESS: CourseProgress = { completed: [], reviewPassed: false };
export const STORAGE_KEY = 'dev_frequency_course_v1';

export function parseProgress(raw: string | null): CourseProgress {
  try {
    const value: unknown = JSON.parse(raw ?? 'null');
    if (!value || typeof value !== 'object' || !('completed' in value) || !Array.isArray(value.completed)) return EMPTY_PROGRESS;
    // Only restore a contiguous unlocked path, never arbitrary corrupted step IDs.
    const completed: number[] = [];
    for (let index = 0; index < STEPS.length && value.completed.includes(index); index++) completed.push(index);
    return { completed, reviewPassed: completed.length === STEPS.length && 'reviewPassed' in value && value.reviewPassed === true };
  } catch { return EMPTY_PROGRESS; }
}
