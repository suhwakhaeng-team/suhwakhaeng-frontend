// BE `CurriculumOverviewResponse` 의 웹 도메인 타입.
// iOS `CurriculumMapItem` / `MasteryStatus` 와 동일 구조.

export type MasteryStatus = 'MASTERED' | 'IN_PROGRESS' | 'WEAK' | 'UNDIAGNOSED';

export interface CurriculumMapItem {
  id: string;            // tagId
  tagName: string;
  categoryPath: string;
  status: MasteryStatus;
  colorDepth: number | null;
}

// BE 응답에 미지의 status 문자열이 올 경우 안전하게 UNDIAGNOSED 로 수렴.
export function coerceStatus(raw: string): MasteryStatus {
  switch (raw) {
    case 'MASTERED':
    case 'IN_PROGRESS':
    case 'WEAK':
    case 'UNDIAGNOSED':
      return raw;
    default:
      return 'UNDIAGNOSED';
  }
}
