import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors, spacing, radius, typography } from '../../lib/designTokens';
import type { AdaptiveQuestion, StudySubmitResponse } from '../../types/adaptive';
import { saveProblem, unsaveProblem } from '../../lib/savedProblemClient';
import { tokenStorage } from '../../lib/tokenStorage';
import ProblemContent from '../../components/ProblemContent';
import QuestionPrompt from '../../components/QuestionPrompt';

interface ResultState {
  isCorrect: boolean;
  explanation: string | null;
  question: AdaptiveQuestion;
  submitResponse: StudySubmitResponse | null;
  questions: AdaptiveQuestion[];
  currentIndex: number;
}

export default function ProblemResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResultState | null;
  const [isSaved, setIsSaved] = useState(false);
  const [isSaveInflight, setIsSaveInflight] = useState(false);

  if (!state) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', paddingTop: 80 }}>
        <p style={{ color: colors.gray500, ...typography.bodyTextXLRegular }}>결과 데이터가 없습니다.</p>
        <button
          onClick={() => navigate('/main/home')}
          style={{
            marginTop: spacing.lg,
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

  const { isCorrect, explanation, question, questions, currentIndex } = state;
  const hasNextQuestion = currentIndex + 1 < questions.length;
  const tagLabel = question.tags?.[0]?.tagName ?? '';
  const correctChoice = question.answerType === 'MULTIPLE_CHOICE'
    ? ({ A: question.choiceA, B: question.choiceB, C: question.choiceC, D: question.choiceD } as const)[question.answer as 'A' | 'B' | 'C' | 'D']
    : null;

  // "문제 저장하기" 토글. UI 즉시 반영(optimistic) 후 BE 동기화, 실패 시 롤백.
  // iOS `ProblemResultReducer.saveProblemToggled` 와 동일 정책.
  const handleSaveToggle = async () => {
    if (isSaveInflight) return; // 중복 클릭 방어
    const uid = tokenStorage.getUid();
    if (!uid) return;
    const willBeSaved = !isSaved;
    setIsSaved(willBeSaved); // optimistic
    setIsSaveInflight(true);
    try {
      if (willBeSaved) {
        await saveProblem(uid, question.questionId);
      } else {
        await unsaveProblem(uid, question.questionId);
      }
    } catch (err) {
      // 실패 시 롤백. 사용자에게는 별도 toast 미표시 (iOS 정책 일치).
      console.warn('[ProblemResult] save toggle failed — 롤백', err);
      setIsSaved(!willBeSaved);
    } finally {
      setIsSaveInflight(false);
    }
  };

  const handleNext = () => {
    if (hasNextQuestion) {
      navigate('/main/problem/start', {
        state: { questions, currentIndex: currentIndex + 1 },
      });
    } else {
      // 모든 문제 소진 → 새 문제 세트 fetch (state 없이 진입하면 자동 fetch)
      navigate('/main/problem/start');
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', paddingTop: spacing.x3l }}>
      {/* 정답/오답 표시 */}
      <div style={{ textAlign: 'center', marginBottom: spacing.xxl }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: radius.full,
            background: isCorrect ? '#DCFCE7' : '#FEE2E2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            marginBottom: spacing.lg,
            fontSize: 28,
            fontWeight: 700,
            color: isCorrect ? colors.green500 : colors.red500,
          }}
        >
          {isCorrect ? '○' : '✕'}
        </div>
        <h2 style={{ ...typography.headingXLBold, color: isCorrect ? colors.green500 : colors.red500 }}>
          {isCorrect ? '정답입니다!' : '오답입니다'}
        </h2>
      </div>

      {/* 문제 정보 */}
      {tagLabel && (
        <span
          style={{
            display: 'inline-block',
            padding: `${spacing.xxs}px ${spacing.sm}px`,
            background: colors.brand50,
            color: colors.brand600,
            borderRadius: radius.full,
            ...typography.captionSemiBold,
            marginBottom: spacing.sm,
          }}
        >
          {tagLabel}
        </span>
      )}

      <div
        style={{
          padding: spacing.lg,
          background: colors.gray50,
          borderRadius: radius.md,
          ...typography.bodyTextXLRegular,
          color: colors.gray700,
          whiteSpace: 'pre-wrap',
          marginBottom: spacing.lg,
        }}
      >
        <QuestionPrompt
          problem={{
            description: question.content,
            answerType: question.answerType,
            choiceA: question.choiceA,
            choiceB: question.choiceB,
            choiceC: question.choiceC,
            choiceD: question.choiceD,
          }}
          value={question.answer}
          onChange={() => undefined}
          disabled
        />
      </div>

      {/* 정답 표시 */}
      <div
        style={{
          padding: spacing.lg,
          background: '#DCFCE7',
          borderRadius: radius.sm,
          marginBottom: spacing.lg,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        <span style={{ ...typography.bodyTextXLSemiBold, color: colors.green500 }}>정답:</span>
        <div style={{ ...typography.bodyTextXLSemiBold, color: colors.gray800, minWidth: 0 }}>
          <ProblemContent content={correctChoice ? `${question.answer}. ${correctChoice}` : question.answer} />
        </div>
      </div>

      {/* 해설 */}
      {explanation && (
        <div
          style={{
            padding: spacing.xl,
            background: colors.white,
            border: `1px solid ${colors.gray200}`,
            borderRadius: radius.md,
            marginBottom: spacing.xxl,
          }}
        >
          <h3 style={{ ...typography.headingMdBold, color: colors.gray800, marginBottom: spacing.md }}>해설</h3>
          <div style={{ ...typography.bodyTextXLRegular, color: colors.gray700, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
            <ProblemContent content={explanation} />
          </div>
        </div>
      )}

      {/* 버튼 */}
      <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'center', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleSaveToggle}
          disabled={isSaveInflight}
          aria-pressed={isSaved}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: spacing.sm,
            padding: `${spacing.md}px ${spacing.lg}px`,
            background: 'transparent',
            border: 'none',
            color: colors.gray700,
            ...typography.bodyTextXLRegular,
            cursor: isSaveInflight ? 'wait' : 'pointer',
            opacity: isSaveInflight ? 0.6 : 1,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              borderRadius: 4,
              border: `2px solid ${isSaved ? colors.brand500 : colors.gray400}`,
              background: isSaved ? colors.brand500 : 'transparent',
              color: colors.white,
              fontSize: 14,
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
            {isSaved ? '✓' : ''}
          </span>
          문제 저장하기
        </button>
        <button
          onClick={handleNext}
          style={{
            padding: `${spacing.md}px ${spacing.xxl}px`,
            background: colors.brand600,
            color: colors.white,
            border: 'none',
            borderRadius: radius.sm,
            ...typography.bodyTextXLSemiBold,
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          {hasNextQuestion ? '다음 문제' : '새 문제 풀기'}
        </button>
        <button
          onClick={() => navigate('/main/home')}
          style={{
            padding: `${spacing.md}px ${spacing.xxl}px`,
            background: colors.gray100,
            color: colors.gray700,
            border: 'none',
            borderRadius: radius.sm,
            ...typography.bodyTextXLSemiBold,
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          홈으로
        </button>
      </div>
    </div>
  );
}
