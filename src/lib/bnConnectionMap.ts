import type { AnswerItem } from '../types/learning';

export interface ConnectedQuestion {
  id: number;
  title: string;
  description: string;
  concepts: string[];
}

export interface BnConnectionResponse {
  bn: ConnectedQuestion;
  concepts: string[];
  anProblems: ConnectedQuestion[];
}

export interface WrongBnAttempt {
  bn: AnswerItem;
  drilledAn: AnswerItem | null;
}

/** BN 진단 답안은 BN 바로 뒤에 해당 BN의 AN drill-down 답안이 온다. */
export function wrongBnAttempts(answers: AnswerItem[]): WrongBnAttempt[] {
  const attempts: WrongBnAttempt[] = [];
  for (let index = 0; index < answers.length; index += 1) {
    const answer = answers[index];
    if (answer.diagnosticRole !== 'main' || answer.correct) continue;
    const next = answers[index + 1];
    attempts.push({ bn: answer, drilledAn: next?.diagnosticRole === 'drilldown' ? next : null });
  }
  return attempts;
}

/** 개발용 미리보기. 실제 연결 문항은 /learning/bn-connections 응답을 사용한다. */
export function previewBnConnection(attempt: WrongBnAttempt): BnConnectionResponse {
  const concepts = [...new Set((attempt.bn.concepts ?? []).map(name => name.trim()).filter(Boolean))];
  const anProblems = concepts.map((concept, index) => ({
    id: attempt.drilledAn && index === 0 ? attempt.drilledAn.problemId : attempt.bn.problemId * 10 + index + 1,
    title: `${concept} 확인 문제`,
    description: `${concept} 개념을 확인하는 AN 문항 (시안용 예시)`,
    concepts: [concept],
  }));
  return {
    bn: {
      id: attempt.bn.problemId,
      title: attempt.bn.topic,
      description: `${attempt.bn.topic} BN 문항 (시안용 예시)`,
      concepts,
    },
    concepts,
    anProblems,
  };
}

export function anProblemsForConcept(connection: BnConnectionResponse, concept: string): ConnectedQuestion[] {
  return connection.anProblems.filter(question => question.concepts.includes(concept));
}
