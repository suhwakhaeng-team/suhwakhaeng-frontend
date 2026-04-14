import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useAuth } from '../../contexts/AuthContext';
import { colors, radius, spacing, typography } from '../../lib/designTokens';
import type {
  LearningProblem,
  LearningProblemDTO,
  AnswerItem,
  AnswerSubmissionRequest,
  LearningRouteResponse,
} from '../../types/learning';

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

// 답 비교는 공백과 대소문자를 무시한다.
function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export default function LevelTestPage() {
  const navigate = useNavigate();
  const { setLevelTestResult } = useOnboarding();
  const { markOnboardingCompleted } = useAuth();

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [problems, setProblems] = useState<LearningProblem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const submittingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const loadProblems = useCallback(async () => {
    setLoadState('loading');
    const response = await apiClient.get<LearningProblemDTO[]>('/learning/problems');
    if (!mountedRef.current) return;
    if (!response.success || !response.data) {
      setLoadState('error');
      return;
    }
    if (response.data.length === 0) {
      setProblems([]);
      setLoadState('empty');
      return;
    }
    setProblems(response.data);
    setCurrentIndex(0);
    setAnswers({});
    setLoadState('ready');
  }, []);

  useEffect(() => {
    void loadProblems();
  }, [loadProblems]);

  const currentProblem = problems[currentIndex];
  const currentAnswer = currentProblem ? answers[currentProblem.id] ?? '' : '';
  const canProceed = currentAnswer.trim().length > 0;
  const isLastProblem = currentIndex === problems.length - 1;

  const handleAnswerChange = (value: string) => {
    if (!currentProblem) return;
    setAnswers((prev) => ({ ...prev, [currentProblem.id]: value }));
  };

  const submitAnswers = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    const items: AnswerItem[] = problems.map((p) => {
      const userAnswer = answers[p.id] ?? '';
      return {
        problemId: p.id,
        topic: p.topic,
        userAnswer,
        correct: normalize(p.answer) === normalize(userAnswer),
      };
    });

    const body: AnswerSubmissionRequest = { answers: items };
    const response = await apiClient.post<LearningRouteResponse>('/learning/submit', body);

    submittingRef.current = false;
    if (!mountedRef.current) return;
    setIsSubmitting(false);

    if (!response.success || !response.data) {
      setSubmitError(response.error || '결과 제출에 실패했습니다. 다시 시도해주세요.');
      return;
    }

    setLevelTestResult(response.data);
    // 서버에 온보딩 완료(isTested=true)를 기록한다.
    // 이 호출이 실패하면 재로그인/재시작 시 다시 온보딩으로 빠지므로
    // 그때 재시도하게 두고, 여기서는 학습 진행을 막지 않는다.
    void markOnboardingCompleted().catch(() => {});
    navigate('/onboarding/result');
  };

  const handleNext = () => {
    if (!canProceed) return;
    if (isLastProblem) {
      void submitAnswers();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  if (loadState === 'loading') {
    return (
      <div
        role="status"
        aria-label="문제를 불러오는 중"
        style={{ textAlign: 'center', padding: spacing.x3l, color: colors.gray500 }}
      >
        문제를 불러오는 중...
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div style={{ textAlign: 'center', padding: spacing.x3l }}>
        <p style={{ ...typography.bodyTextXLRegular, color: colors.red500 }}>
          문제를 불러올 수 없습니다.
        </p>
        <button
          onClick={() => void loadProblems()}
          style={{
            marginTop: spacing.lg,
            padding: `${spacing.md}px ${spacing.xl}px`,
            background: colors.brand500,
            color: colors.white,
            border: 'none',
            borderRadius: radius.md,
            ...typography.headingMdBold,
            cursor: 'pointer',
          }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (loadState === 'empty') {
    return (
      <div style={{ textAlign: 'center', padding: spacing.x3l }}>
        <p style={{ ...typography.bodyTextXLRegular, color: colors.gray500 }}>
          출제된 문제가 없습니다.
        </p>
      </div>
    );
  }

  const progressPercent = ((currentIndex + 1) / problems.length) * 100;

  return (
    <div style={{ position: 'relative', paddingBottom: 120 }}>
      {/* 진행률 바 */}
      <div
        style={{
          width: '100%',
          height: 6,
          borderRadius: radius.full,
          background: colors.gray200,
          overflow: 'hidden',
          marginBottom: spacing.lg,
        }}
      >
        <div
          style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: colors.brand500,
            transition: 'width 0.25s ease-in-out',
          }}
        />
      </div>

      {/* 문제 카드 */}
      <div
        style={{
          background: colors.white,
          borderRadius: radius.xl,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.06)',
          padding: `${spacing.lg}px ${spacing.xl}px ${spacing.xl}px`,
        }}
      >
        <p
          style={{
            ...typography.captionSemiBold,
            color: colors.brand500,
            margin: 0,
            marginBottom: spacing.sm,
          }}
        >
          문제 {currentIndex + 1} / {problems.length}
        </p>
        <h3
          style={{
            ...typography.headingXLSemiBold,
            color: colors.black,
            margin: 0,
            marginBottom: spacing.md,
          }}
        >
          {currentProblem?.title}
        </h3>
        <p
          style={{
            ...typography.bodyTextXLRegular,
            color: colors.gray700,
            margin: 0,
            whiteSpace: 'pre-wrap',
          }}
        >
          {currentProblem?.description}
        </p>

        <input
          type="text"
          value={currentAnswer}
          onChange={(e) => handleAnswerChange(e.target.value)}
          placeholder="답을 입력하세요"
          disabled={isSubmitting}
          style={{
            width: '100%',
            marginTop: spacing.xl,
            padding: `${spacing.md}px ${spacing.lg}px`,
            background: colors.gray100,
            border: 'none',
            borderRadius: radius.full,
            ...typography.bodyTextXLRegular,
            color: colors.black,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {submitError && (
        <p
          style={{
            ...typography.bodyTextXLRegular,
            color: colors.red500,
            textAlign: 'center',
            marginTop: spacing.lg,
          }}
        >
          {submitError}
        </p>
      )}

      {/* 네비게이션 버튼 */}
      <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.xl }}>
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            disabled={isSubmitting}
            style={{
              flex: 1,
              padding: `${spacing.lg}px 0`,
              background: colors.gray100,
              color: colors.gray700,
              border: 'none',
              borderRadius: radius.md,
              ...typography.headingMdBold,
              cursor: isSubmitting ? 'default' : 'pointer',
            }}
          >
            이전
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!canProceed || isSubmitting}
          style={{
            flex: 1,
            padding: `${spacing.lg}px 0`,
            background: canProceed && !isSubmitting ? colors.brand500 : colors.gray300,
            color: colors.white,
            border: 'none',
            borderRadius: radius.md,
            ...typography.headingMdBold,
            cursor: canProceed && !isSubmitting ? 'pointer' : 'default',
          }}
        >
          {isSubmitting ? '제출 중...' : isLastProblem ? '제출' : '다음'}
        </button>
      </div>

      {isSubmitting && (
        <div
          role="status"
          aria-label="학습 경로 생성 중"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              padding: spacing.xxl,
              background: 'rgba(0,0,0,0.6)',
              borderRadius: radius.lg,
              color: colors.white,
              ...typography.bodyTextXLRegular,
            }}
          >
            학습 경로를 생성하고 있어요…
          </div>
        </div>
      )}
    </div>
  );
}
