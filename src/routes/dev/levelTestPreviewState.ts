import { NODES, NODE_BY_ID, descendantDepths, nextAvailableConcept, type NodeStatus } from './levelTestPreviewModel.ts';
import { LEVEL_TEST_QUESTIONS } from './levelTestQuestionBank.ts';

export const ANSWER_KEYS = ['A', 'B', 'C', 'D'] as const;
export type AnswerKey = typeof ANSWER_KEYS[number];
export type PreviewAnswer = { type: 'answer'; answer: AnswerKey } | { type: 'unknown' } | { type: 'demo'; isCorrect: boolean };
export type AnswerRecord = {
  conceptId: string;
  selectedAnswer: AnswerKey | null;
  isCorrect: boolean;
  skipped: boolean;
  demo: boolean;
  durationSeconds: number;
};
export type FeedbackState = {
  isCorrect: boolean;
  skipped: boolean;
  demo?: boolean;
  explanation: string;
  prunedCount: number;
  nextId?: string;
};
export type UnitReview = {
  domain: string;
  beforeStatuses: Record<string, NodeStatus>;
  passedIds: string[];
  failedIds: string[];
  prunedIds: string[];
  nextId?: string;
};
export type PreviewSession = {
  statuses: Record<string, NodeStatus>;
  currentId: string;
  selectedAnswer: AnswerKey | null;
  feedback: FeedbackState | null;
  isComplete: boolean;
  message: string;
  history: AnswerRecord[];
  questionStartedAt: number;
  unitStartStatuses: Record<string, NodeStatus>;
  unitReview: UnitReview | null;
};

const nodeIds = new Set(NODES.map(node => node.id));
export function emptyPreviewSession(now = Date.now()): PreviewSession {
  return {
    statuses: {}, currentId: 'sum-rule', selectedAnswer: null, feedback: null,
    isComplete: false, message: '가장 기초인 합의 법칙부터 확인합니다.',
    history: [], questionStartedAt: now, unitStartStatuses: {}, unitReview: null,
  };
}

export function resolvePreviewAnswer(state: PreviewSession, input: PreviewAnswer, now = Date.now()): PreviewSession {
  if (state.feedback || state.isComplete || state.statuses[state.currentId]) return state;
  const question = LEVEL_TEST_QUESTIONS[state.currentId];
  const node = NODE_BY_ID.get(state.currentId);
  if (!question || !node) return state;
  const demo = input.type === 'demo';
  const skipped = input.type === 'unknown';
  const selectedAnswer = input.type === 'answer' ? input.answer : null;
  const isCorrect = input.type === 'demo' ? input.isCorrect : selectedAnswer === question.answer;
  const statuses = { ...state.statuses, [state.currentId]: isCorrect ? 'passed' as const : 'failed' as const };
  const pruned = isCorrect ? new Map<string, number>() : descendantDepths([state.currentId]);
  const newlyPrunedCount = [...pruned.keys()].filter(id => !statuses[id]).length;
  pruned.forEach((_, id) => { if (!statuses[id]) statuses[id] = 'pruned'; });
  const nextId = nextAvailableConcept(statuses);
  return {
    ...state, statuses, selectedAnswer,
    feedback: { isCorrect, skipped, demo, explanation: question.explanation, prunedCount: newlyPrunedCount, nextId },
    history: [...state.history, {
      conceptId: state.currentId, selectedAnswer, isCorrect, skipped, demo,
      durationSeconds: Math.max(0, Math.round((now - state.questionStartedAt) / 1000)),
    }],
    message: isCorrect ? `${node.label} 확인 완료 · 연결된 다음 개념이 열렸습니다.`
      : `${node.label}에서 멈춤 · 후속 ${newlyPrunedCount}개 개념을 이번 테스트에서 접었습니다.`,
  };
}

export function continuePreviewTest(state: PreviewSession, now = Date.now()): PreviewSession {
  if (!state.feedback || state.isComplete) return state;
  const nextId = nextAvailableConcept(state.statuses);
  if (!nextId) return { ...state, isComplete: true, feedback: null, selectedAnswer: null,
    message: '현재 응답으로 확인 가능한 모든 경로를 검사했습니다.' };
  const next = NODE_BY_ID.get(nextId)!;
  return { ...state, currentId: nextId, selectedAnswer: null, feedback: null, questionStartedAt: now,
    message: `${next.domain}의 ${next.label} 개념을 확인합니다.` };
}

// Questions continue without showing feedback; only a unit boundary opens the map review.
export function resumeUnitFlow(state: PreviewSession, now = Date.now()): PreviewSession {
  if (!state.feedback || state.isComplete || state.unitReview) return state;
  const domain = NODE_BY_ID.get(state.currentId)!.domain;
  const nextId = nextAvailableConcept(state.statuses);
  if (nextId && NODE_BY_ID.get(nextId)!.domain === domain) {
    const next = continuePreviewTest(state, now);
    return { ...next, message: `응답을 기록했어요. ${domain} 진단을 이어갑니다.` };
  }
  const changedIds = Object.keys(state.statuses).filter(id => !state.unitStartStatuses[id]);
  return { ...state,
    unitReview: {
      domain, beforeStatuses: { ...state.unitStartStatuses }, nextId,
      passedIds: changedIds.filter(id => state.statuses[id] === 'passed'),
      failedIds: changedIds.filter(id => state.statuses[id] === 'failed'),
      prunedIds: changedIds.filter(id => state.statuses[id] === 'pruned'),
    },
    message: `${domain} 진단이 끝났어요. 지도에서 결과를 확인합니다.`,
  };
}

export function submitUnitAnswer(state: PreviewSession, input: PreviewAnswer, now = Date.now()): PreviewSession {
  if (state.unitReview || state.isComplete) return state;
  return resumeUnitFlow(resolvePreviewAnswer(state, input, now), now);
}

export function continueAfterUnitReview(state: PreviewSession, now = Date.now()): PreviewSession {
  if (!state.unitReview) return state;
  return { ...continuePreviewTest(state, now), unitReview: null, unitStartStatuses: { ...state.statuses } };
}

export type ReviewPhase = 'waiting' | 'pass' | 'prune' | 'done';
export function unitReviewMapStatuses(state: PreviewSession, phase: ReviewPhase): Record<string, NodeStatus> {
  if (!state.unitReview) return state.isComplete ? state.statuses : state.unitStartStatuses;
  if (phase === 'waiting') return state.unitReview.beforeStatuses;
  if (phase === 'pass') return { ...state.unitReview.beforeStatuses,
    ...Object.fromEntries(state.unitReview.passedIds.map(id => [id, 'passed' as const])) };
  return state.statuses;
}

export function parsePreviewSession(raw: string | null, now = Date.now()): PreviewSession {
  if (!raw) return emptyPreviewSession(now);
  try {
    const value = JSON.parse(raw);
    if (!value || !nodeIds.has(value.currentId) || typeof value.message !== 'string'
      || typeof value.isComplete !== 'boolean' || !value.statuses || Array.isArray(value.statuses)
      || typeof value.statuses !== 'object'
      || Object.entries(value.statuses).some(([id, status]) => !nodeIds.has(id) || !['passed', 'failed', 'pruned'].includes(String(status)))
      || (value.selectedAnswer !== null && !ANSWER_KEYS.includes(value.selectedAnswer))) {
      return emptyPreviewSession(now);
    }
    const feedback = value.feedback;
    if (feedback !== null && (!feedback || typeof feedback.isCorrect !== 'boolean'
      || typeof feedback.skipped !== 'boolean' || typeof feedback.explanation !== 'string'
      || (feedback.demo !== undefined && typeof feedback.demo !== 'boolean')
      || !Number.isInteger(feedback.prunedCount) || feedback.prunedCount < 0
      || (feedback.nextId !== undefined && !nodeIds.has(feedback.nextId)))) {
      return emptyPreviewSession(now);
    }
    const nextId = nextAvailableConcept(value.statuses);
    if ((value.isComplete && (feedback !== null || nextId !== undefined))
      || (!value.isComplete && feedback === null && nextId !== value.currentId)
      || (feedback && (value.isComplete || feedback.nextId !== nextId
        || value.statuses[value.currentId] !== (feedback.isCorrect ? 'passed' : 'failed')))) {
      return emptyPreviewSession(now);
    }
    // Preserve progress saved before answer history was added to this prototype.
    const history = value.history ?? [];
    if (!Array.isArray(history) || history.some(record => !record || !nodeIds.has(record.conceptId)
      || (record.selectedAnswer !== null && !ANSWER_KEYS.includes(record.selectedAnswer))
      || typeof record.isCorrect !== 'boolean' || typeof record.skipped !== 'boolean'
      || typeof record.demo !== 'boolean' || !Number.isFinite(record.durationSeconds) || record.durationSeconds < 0)
      || new Set(history.map(record => record.conceptId)).size !== history.length) return emptyPreviewSession(now);
    const unitStartStatuses = value.unitStartStatuses ?? Object.fromEntries(Object.entries(value.statuses)
      .filter(([id]) => NODE_BY_ID.get(id)!.domain !== NODE_BY_ID.get(value.currentId)!.domain));
    if (!unitStartStatuses || typeof unitStartStatuses !== 'object' || Array.isArray(unitStartStatuses)
      || Object.entries(unitStartStatuses).some(([id, status]) => !nodeIds.has(id) || status !== value.statuses[id])) return emptyPreviewSession(now);
    const unitReview = value.unitReview ?? null;
    if (unitReview && (!feedback || unitReview.domain !== NODE_BY_ID.get(value.currentId)!.domain
      || unitReview.nextId !== nextId || (nextId && NODE_BY_ID.get(nextId)!.domain === unitReview.domain)
      || !unitReview.beforeStatuses || typeof unitReview.beforeStatuses !== 'object'
      || JSON.stringify(unitReview.beforeStatuses) !== JSON.stringify(unitStartStatuses)
      || ['passed', 'failed', 'pruned'].some(status => {
        const ids = unitReview[`${status}Ids`];
        const expected = Object.keys(value.statuses).filter(id => !unitStartStatuses[id] && value.statuses[id] === status);
        return !Array.isArray(ids) || ids.length !== expected.length || new Set(ids).size !== ids.length || ids.some((id: unknown) => typeof id !== 'string' || !expected.includes(id));
      }))) return emptyPreviewSession(now);
    return {
      statuses: value.statuses, currentId: value.currentId, selectedAnswer: value.selectedAnswer,
      feedback, isComplete: value.isComplete, message: value.message, history,
      questionStartedAt: Number.isFinite(value.questionStartedAt) ? Math.min(value.questionStartedAt, now) : now,
      unitStartStatuses, unitReview,
    };
  } catch { return emptyPreviewSession(now); }
}
