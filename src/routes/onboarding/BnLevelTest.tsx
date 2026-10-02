import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { useOnboarding, type Grade } from '../../contexts/OnboardingContext';
import { useAuth } from '../../contexts/AuthContext';
import { colors, radius, spacing, typography } from '../../lib/designTokens';
import QuestionPrompt from '../../components/QuestionPrompt';
import { parseQuestionChoices } from '../../lib/questionChoices';
import { hasStructuredChoices, isProblemAnswerCorrect } from '../../lib/answerEvaluation';
import type {
  LearningProblem,
  LearningProblemDTO,
  AnswerItem,
  AnswerSubmissionRequest,
  LearningRouteResponse,
} from '../../types/learning';

type LoadState = 'loading' | 'ready' | 'empty' | 'error';
// 현재 보여주는 문항의 단계: BN(복합) 본문제 / AN(하위 개념) drill-down.
type Phase = 'bn' | 'an';
const UNKNOWN_ANSWER = '모르겠습니다';

// 학년 enum → BE 정수 매핑 (중1=1 ~ 고3=6).
function gradeStringToInt(g: Grade | null): number | undefined {
  if (!g) return undefined;
  const map: Record<Grade, number> = {
    middle1: 1,
    middle2: 2,
    middle3: 3,
    high1: 4,
    high2: 5,
    high3: 6,
  };
  return map[g];
}

/**
 * BN(복합개념) drill-down 진단.
 *
 * 흐름: BN 문제를 1개씩(확률→통계, 노션순) 출제 →
 *  - 맞으면 다음 BN
 *  - 틀리면 그 BN의 하위 AN 문제 1개 출제(GET /learning/drilldown-an)
 *      · AN 맞음(4.1) / AN 틀림(4.2) 모두 기록만 하고 다음 BN (상/중/하 판정은 BE S3)
 *      · 해당 AN 이 없으면 그냥 다음 BN
 * BN 전부 소진 시 누적 답안을 POST /learning/submit (nodeLevel=BN).
 *
 * AN/SAN 직접선택 모드는 기존 배치 흐름(LevelTestPage)을 그대로 사용한다 — 본 컴포넌트는 BN 전용.
 */
export default function BnLevelTest() {
  const navigate = useNavigate();
  const { grade, subject, units, setLevelTestResult } = useOnboarding();
  const { markOnboardingCompleted } = useAuth();

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [bnProblems, setBnProblems] = useState<LearningProblem[]>([]);
  const [bnIndex, setBnIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('bn');
  const [anProblem, setAnProblem] = useState<LearningProblem | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [accumulated, setAccumulated] = useState<AnswerItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const busyRef = useRef(false); // 다음 처리(채점·drill fetch·제출) 중복 방지
  const enterAtRef = useRef<number>(0); // 현재 문항 진입 시각(ms). 로드/문항 변경 effect 에서 세팅.

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // 현재 보여줄 문항.
  const currentProblem = phase === 'an' ? anProblem : bnProblems[bnIndex];

  // 문항이 바뀌면 풀이시간 측정 시작점 리셋.
  useEffect(() => {
    enterAtRef.current = Date.now();
  }, [bnIndex, phase, anProblem]);

  const loadBnProblems = useCallback(async () => {
    setLoadState('loading');
    const params = new URLSearchParams();
    params.set('nodeLevel', 'BN');
    const response = await apiClient.get<LearningProblemDTO[]>(`/learning/problems?${params.toString()}`);
    if (!mountedRef.current) return;
    if (!response.success || !response.data) {
      setLoadState('error');
      return;
    }
    if (response.data.length === 0) {
      setBnProblems([]);
      setLoadState('empty');
      return;
    }
    // 서버가 저장된 진단 순서대로 반환한다.
    setBnProblems(response.data);
    setBnIndex(0);
    setPhase('bn');
    setAnProblem(null);
    setCurrentAnswer('');
    setAccumulated([]);
    enterAtRef.current = Date.now();
    setLoadState('ready');
  }, []);

  useEffect(() => {
    void loadBnProblems();
  }, [loadBnProblems]);

  const submitAll = useCallback(async (answers: AnswerItem[]) => {
    setIsSubmitting(true);
    setSubmitError(null);
    const body: AnswerSubmissionRequest = { answers, nodeLevel: 'BN' };
    const response = await apiClient.post<LearningRouteResponse>('/learning/submit', body);
    if (!mountedRef.current) return;
    if (!response.success || !response.data) {
      setIsSubmitting(false);
      setSubmitError(response.error || '결과 제출에 실패했습니다. 다시 시도해주세요.');
      return;
    }
    setLevelTestResult({ ...response.data, diagnosticAnswers: answers });
    const gradeInt = gradeStringToInt(grade);
    const unitsCsv = units.length ? units.join(',') : undefined;
    await markOnboardingCompleted(gradeInt, subject ?? undefined, unitsCsv).catch(() => {});
    navigate('/onboarding/result');
  }, [grade, subject, units, setLevelTestResult, markOnboardingCompleted, navigate]);

  // BN 다음 문제로 진행(없으면 제출). drill 상태를 초기화한다.
  const advanceToNextBn = useCallback((answers: AnswerItem[]) => {
    setAnProblem(null);
    setPhase('bn');
    if (bnIndex + 1 >= bnProblems.length) {
      void submitAll(answers);
    } else {
      setBnIndex((i) => i + 1);
      setCurrentAnswer('');
    }
  }, [bnIndex, bnProblems.length, submitAll]);

  const handleNext = useCallback(async (answerOverride?: string) => {
    const problem = currentProblem;
    if (!problem || busyRef.current || isSubmitting) return;
    const submittedAnswer = answerOverride ?? currentAnswer;
    if (submittedAnswer.trim().length === 0) return;
    busyRef.current = true;

    const timeTakenSec = Math.max(0, Math.round((Date.now() - enterAtRef.current) / 1000));
    const correct = isProblemAnswerCorrect(problem, submittedAnswer);
    const item: AnswerItem = {
      problemId: problem.id,
      topic: problem.topic,
      userAnswer: submittedAnswer,
      correct,
      timeTakenSec,
      concepts: problem.concepts,
      diagnosticRole: phase === 'bn' ? 'main' : 'drilldown',
    };
    const nextAccumulated = [...accumulated, item];
    setAccumulated(nextAccumulated);

    // AN(하위 개념) 단계면 결과만 기록하고 다음 BN으로.
    if (phase === 'an') {
      busyRef.current = false;
      advanceToNextBn(nextAccumulated);
      return;
    }

    // BN 본문제: 맞으면 다음 BN, 틀리면 drill-down AN 요청.
    if (correct) {
      busyRef.current = false;
      advanceToNextBn(nextAccumulated);
      return;
    }

    const drill = await apiClient.get<LearningProblemDTO>(`/learning/drilldown-an?questionId=${problem.id}`);
    busyRef.current = false;
    if (!mountedRef.current) return;
    if (drill.success && drill.data) {
      setAnProblem(drill.data);
      setPhase('an');
      setCurrentAnswer('');
    } else {
      // 해당 AN 문제가 없으면 그냥 다음 BN.
      advanceToNextBn(nextAccumulated);
    }
  }, [currentProblem, currentAnswer, accumulated, phase, isSubmitting, advanceToNextBn]);

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
          onClick={() => void loadBnProblems()}
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
          출제된 복합개념 문제가 없습니다.
        </p>
      </div>
    );
  }

  // 진행률: BN 기준(하위 AN 풀이는 같은 BN 칸 안에서 진행).
  const progressPercent = ((bnIndex + (phase === 'an' ? 0.5 : 0)) / bnProblems.length) * 100;
  const canProceed = currentAnswer.trim().length > 0;

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
            color: phase === 'an' ? colors.gray500 : colors.brand500,
            margin: 0,
            marginBottom: spacing.sm,
          }}
        >
          {phase === 'an'
            ? '↳ 기초 개념 확인'
            : `복합개념 ${bnIndex + 1} / ${bnProblems.length}`}
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
        <div
          style={{
            ...typography.bodyTextXLRegular,
            color: colors.gray700,
            margin: 0,
          }}
        >
          {currentProblem && <QuestionPrompt problem={currentProblem} value={currentAnswer} onChange={setCurrentAnswer} disabled={isSubmitting} />}
        </div>

        {!hasStructuredChoices(currentProblem) && !parseQuestionChoices(currentProblem?.description ?? '') && <input
          type={currentProblem?.answerType === 'NUMBER' ? 'number' : 'text'}
          inputMode={currentProblem?.answerType === 'NUMBER' ? 'decimal' : undefined}
          step={currentProblem?.answerType === 'NUMBER' ? 'any' : undefined}
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === 'Enter') void handleNext();
          }}
          placeholder={currentProblem?.answerType === 'NUMBER' ? '숫자만 입력하세요' : '답을 입력하세요'}
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
        />}
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

      <button
        type="button"
        onClick={() => void handleNext(UNKNOWN_ANSWER)}
        disabled={isSubmitting}
        style={{
          width: '100%',
          marginTop: spacing.lg,
          padding: `${spacing.md}px 0`,
          background: colors.white,
          color: colors.gray500,
          border: `1px solid ${colors.gray300}`,
          borderRadius: radius.md,
          ...typography.bodyTextXLRegular,
          cursor: isSubmitting ? 'default' : 'pointer',
        }}
      >
        모르겠습니다
      </button>

      {/* 다음/제출 버튼 (drill-down 은 뒤로가기 없음 — 전진형) */}
      <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.xl }}>
        <button
          onClick={() => void handleNext()}
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
          {isSubmitting ? '제출 중...' : '다음'}
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
