import { useEffect, useMemo, useState } from 'react';
import type { ConceptStatus, LearningGraphData, ProgressMap } from '../../types/learningGraph';
import { createLocalProgressRepository } from '../../repositories/conceptProgress';

export function useConceptProgress(data: LearningGraphData, userId: string) {
  const repository = useMemo(() => createLocalProgressRepository(userId, data.id, data.concepts.map(c => c.id), {
    getItem: key => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  }), [data, userId]);
  const [saved, setSaved] = useState<{ statuses: ProgressMap; error: string }>(() => {
    try { return { statuses: repository.load(), error: '' }; }
    catch { return { statuses: {}, error: '저장된 상태를 읽지 못했습니다. 브라우저 저장 설정을 확인해주세요.' }; }
  });
  useEffect(() => repository.subscribe(() => {
    try { setSaved({ statuses: repository.load(), error: '' }); }
    catch { setSaved(previous => ({ ...previous, error: '다른 탭의 변경을 불러오지 못했습니다.' })); }
  }), [repository]);
  const update = (id: string, status: ConceptStatus) => {
    try { setSaved({ statuses: repository.setStatus(id, status), error: '' }); return true; }
    catch { setSaved(previous => ({ ...previous, error: '저장하지 못해 상태를 변경하지 않았어요. 브라우저 저장 공간·설정을 확인해주세요.' })); return false; }
  };
  return { progress: useMemo(() => ({ ...data.initialProgress, ...saved.statuses }), [data.initialProgress, saved.statuses]), error: saved.error, update };
}
