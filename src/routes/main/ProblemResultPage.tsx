import { useNavigate, useLocation } from 'react-router-dom';
import { colors, spacing, radius, typography } from '../../lib/designTokens';
import type { AdaptiveQuestion, StudySubmitResponse } from '../../types/adaptive';

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
        {question.content}
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
        <span style={{ ...typography.bodyTextXLSemiBold, color: colors.gray800 }}>{question.answer}</span>
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
          <p style={{ ...typography.bodyTextXLRegular, color: colors.gray700, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
            {explanation}
          </p>
        </div>
      )}

      {/* 버튼 */}
      <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'center' }}>
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
