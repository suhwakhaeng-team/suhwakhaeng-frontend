import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { tokenStorage } from '../../lib/tokenStorage';
import { colors, spacing, radius, typography } from '../../lib/designTokens';
import type { AdaptiveQuestion, StudySubmitRequest, StudySubmitResponse } from '../../types/adaptive';

interface LocationState {
  questions?: AdaptiveQuestion[];
  currentIndex?: number;
}

export default function ProblemSolvingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [questions, setQuestions] = useState<AdaptiveQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [showWrongBadge, setShowWrongBadge] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submittingRef = useRef(false);
  const questionStartedAt = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  const currentQuestion = questions[currentIndex] ?? null;

  const fetchQuestions = useCallback(async () => {
    const uid = tokenStorage.getUid();
    if (!uid) {
      setError('로그인이 필요합니다.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await apiClient.get<AdaptiveQuestion[]>(`/adaptive/questions?uid=${uid}`);
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      setQuestions(res.data);
      setCurrentIndex(0);
      resetQuestionState();
    } else {
      setError(res.error ?? '문제를 불러올 수 없습니다.');
    }
    setIsLoading(false);
  }, []);

  const resetQuestionState = () => {
    setAttemptCount(0);
    setShowWrongBadge(false);
    setAnswer('');
    questionStartedAt.current = Date.now();
  };

  // location.key 변경 감지로 navigate마다 상태 동기화
  useEffect(() => {
    const state = location.state as LocationState | null;
    if (state?.questions && state.questions.length > 0) {
      setQuestions(state.questions);
      setCurrentIndex(state.currentIndex ?? 0);
      resetQuestionState();
      setIsLoading(false);
      setError(null);
    } else {
      fetchQuestions();
    }
  }, [location.key, fetchQuestions]);

  const submitToServer = async (questionId: number, isCorrect: boolean, timeTakenSec: number) => {
    const uid = tokenStorage.getUid();
    if (!uid) return null;

    const body: StudySubmitRequest = { uid, questionId, isCorrect, timeTakenSec };
    const res = await apiClient.post<StudySubmitResponse>('/adaptive/submit', body);
    return res.success ? res.data : null;
  };

  const handleSubmit = async () => {
    if (!currentQuestion || submittingRef.current) return;

    const normalizedUser = answer.trim().toLowerCase();
    const normalizedCorrect = currentQuestion.answer.trim().toLowerCase();

    if (!normalizedUser) return;

    const isCorrect = normalizedUser === normalizedCorrect;
    const elapsed = Math.max(0, Math.round((Date.now() - questionStartedAt.current) / 1000));
    const newAttemptCount = attemptCount + 1;

    if (isCorrect) {
      submittingRef.current = true;
      setIsSubmitting(true);
      const submitResponse = await submitToServer(currentQuestion.questionId, true, elapsed);
      submittingRef.current = false;
      setIsSubmitting(false);

      navigate('/main/problem-result', {
        state: {
          isCorrect: true,
          explanation: currentQuestion.explanation,
          question: currentQuestion,
          submitResponse,
          questions,
          currentIndex,
        },
      });
      return;
    }

    // 1회 오답: 인라인 배지, 답 비움
    if (newAttemptCount === 1) {
      setAttemptCount(1);
      setShowWrongBadge(true);
      setAnswer('');
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }

    // 2회 오답: 서버 제출 후 해설 화면
    if (newAttemptCount === 2) {
      submittingRef.current = true;
      setIsSubmitting(true);
      const submitResponse = await submitToServer(currentQuestion.questionId, false, elapsed);
      submittingRef.current = false;
      setIsSubmitting(false);

      navigate('/main/problem-result', {
        state: {
          isCorrect: false,
          explanation: currentQuestion.explanation,
          question: currentQuestion,
          submitResponse,
          questions,
          currentIndex,
        },
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleSubmit();
    }
  };

  // --- 로딩 ---
  if (isLoading) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', paddingTop: 80 }}>
        <p style={{ color: colors.gray500, ...typography.bodyTextXLRegular }}>문제를 불러오는 중...</p>
      </div>
    );
  }

  // --- 에러 ---
  if (error) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', paddingTop: 80 }}>
        <p style={{ color: colors.red500, ...typography.bodyTextXLRegular, marginBottom: spacing.lg }}>{error}</p>
        <button
          onClick={fetchQuestions}
          style={{
            padding: `${spacing.sm}px ${spacing.xl}px`,
            background: colors.brand600,
            color: colors.white,
            border: 'none',
            borderRadius: radius.sm,
            ...typography.bodyTextXLSemiBold,
            cursor: 'pointer',
          }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  // --- 문제 없음 ---
  if (!currentQuestion) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', paddingTop: 80 }}>
        <p style={{ color: colors.gray500, ...typography.bodyTextXLRegular, marginBottom: spacing.lg }}>
          풀 수 있는 문제가 없습니다.
        </p>
        <button
          onClick={() => navigate('/main/home')}
          style={{
            padding: `${spacing.sm}px ${spacing.xl}px`,
            background: colors.gray100,
            border: 'none',
            borderRadius: radius.sm,
            ...typography.bodyTextXLSemiBold,
            cursor: 'pointer',
          }}
        >
          홈으로
        </button>
      </div>
    );
  }

  const tagLabel = currentQuestion.tags?.[0]?.tagName ?? '';

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* 상단: 진행 표시 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl }}>
        <button
          onClick={() => navigate('/main/home')}
          style={{ background: 'none', border: 'none', ...typography.bodyTextXLRegular, color: colors.gray500, cursor: 'pointer' }}
        >
          ← 나가기
        </button>
        <span style={{ ...typography.captionSemiBold, color: colors.gray400 }}>
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* 태그 */}
      {tagLabel && (
        <span
          style={{
            display: 'inline-block',
            padding: `${spacing.xxs}px ${spacing.sm}px`,
            background: colors.brand50,
            color: colors.brand600,
            borderRadius: radius.full,
            ...typography.captionSemiBold,
            marginBottom: spacing.md,
          }}
        >
          {tagLabel}
        </span>
      )}

      {/* 문제 내용 */}
      <div
        style={{
          padding: spacing.xl,
          background: colors.gray50,
          borderRadius: radius.md,
          minHeight: 120,
          whiteSpace: 'pre-wrap',
          ...typography.bodyTextXLRegular,
          color: colors.gray800,
          lineHeight: 1.7,
        }}
      >
        {currentQuestion.content}
      </div>

      {/* 오답 배지 */}
      {showWrongBadge && (
        <div
          style={{
            marginTop: spacing.md,
            padding: `${spacing.sm}px ${spacing.lg}px`,
            background: '#FEF2F2',
            borderRadius: radius.sm,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          <span style={{ color: colors.red500, fontWeight: 700 }}>✕</span>
          <span style={{ color: colors.red500, ...typography.bodyTextXLSemiBold }}>오답입니다. 다시 풀어보세요.</span>
        </div>
      )}

      {/* 답 입력 */}
      <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.xl, alignItems: 'center' }}>
        <input
          ref={inputRef}
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="답 입력"
          disabled={isSubmitting}
          style={{
            flex: 1,
            padding: spacing.md,
            border: `1px solid ${showWrongBadge ? colors.red500 : colors.gray200}`,
            borderRadius: radius.sm,
            ...typography.bodyTextXLRegular,
            fontSize: 16,
            outline: 'none',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !answer.trim()}
          style={{
            padding: `${spacing.sm + 2}px ${spacing.xl}px`,
            background: isSubmitting || !answer.trim() ? colors.gray300 : colors.brand600,
            color: colors.white,
            border: 'none',
            borderRadius: radius.sm,
            ...typography.bodyTextXLSemiBold,
            fontSize: 16,
            cursor: isSubmitting || !answer.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? '제출 중...' : '확인'}
        </button>
      </div>
    </div>
  );
}
