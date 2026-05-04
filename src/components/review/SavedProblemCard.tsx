import { useState } from 'react';
import { colors, radius, spacing, typography } from '../../lib/designTokens';
import type { SavedProblem } from '../../types/savedProblem';

interface Props {
  problem: SavedProblem;
  onRetry?: () => void;
}

export default function SavedProblemCard({ problem, onRetry }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasExplanation = !!problem.explanation && problem.explanation.trim().length > 0;
  const savedDate = problem.savedAt.slice(0, 10); // yyyy-MM-dd

  return (
    <div
      style={{
        background: colors.white,
        border: `1px solid ${colors.gray200}`,
        borderRadius: radius.md,
        padding: spacing.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
      }}
    >
      <p
        style={{
          ...typography.bodyTextLgMedium,
          color: colors.gray900,
          margin: 0,
          whiteSpace: 'pre-wrap',
          lineHeight: 1.5,
        }}
      >
        {problem.content}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ ...typography.captionMedium, color: colors.gray500 }}>정답</span>
          <span style={{ ...typography.bodyTextXLSemiBold, color: colors.brand600 }}>{problem.answer}</span>
        </div>
        <span style={{ ...typography.captionMedium, color: colors.gray400 }}>저장 {savedDate}</span>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            alignSelf: 'flex-start',
            background: colors.brand500,
            border: 'none',
            borderRadius: radius.full,
            color: colors.white,
            ...typography.bodyTextXLSemiBold,
            cursor: 'pointer',
            padding: `${spacing.sm}px ${spacing.lg}px`,
          }}
        >
          다시 풀기
        </button>
      )}

      {hasExplanation && (
        <>
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            style={{
              alignSelf: 'flex-start',
              background: 'transparent',
              border: 'none',
              color: colors.brand500,
              ...typography.bodyTextLgMedium,
              cursor: 'pointer',
              padding: 0,
              paddingLeft: spacing.lg,
            }}
          >
            {isExpanded ? '해설 닫기 ▴' : '해설 보기 ▾'}
          </button>
          {isExpanded && (
            <div
              style={{
                borderTop: `1px solid ${colors.gray200}`,
                paddingTop: spacing.sm,
                ...typography.bodyTextLgRegular,
                color: colors.gray700,
                whiteSpace: 'pre-wrap',
                lineHeight: 1.7,
              }}
            >
              {problem.explanation}
            </div>
          )}
        </>
      )}
    </div>
  );
}
