import { useEffect, useState } from 'react';
import { apiClient } from './apiClient';

export function useSolutionHint(questionId: number | undefined): string | null {
  const [loaded, setLoaded] = useState<{ questionId: number; hint: string | null } | null>(null);

  useEffect(() => {
    if (questionId === undefined) return;
    let active = true;
    void apiClient.get<{ solutionHint: string | null }>(
      `/adaptive/questions/${questionId}/solution-hint`,
    ).then(response => {
      if (active) setLoaded({ questionId, hint: response.success ? response.data?.solutionHint ?? null : null });
    });
    return () => { active = false; };
  }, [questionId]);

  return loaded?.questionId === questionId ? loaded?.hint ?? null : null;
}
