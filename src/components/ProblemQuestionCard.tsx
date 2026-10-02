import QuestionPrompt from './QuestionPrompt';
import { colors, radius, spacing, typography } from '../lib/designTokens';

type PromptProps = Parameters<typeof QuestionPrompt>[0];

// Exact problem/choice presentation used by the live solver and the local flow.
export default function ProblemQuestionCard({ tagLabel, ...prompt }: PromptProps & { tagLabel?: string }) {
  return <>
    {tagLabel && <span style={{ display: 'inline-block', padding: `${spacing.xxs}px ${spacing.sm}px`, background: colors.brand50,
      color: colors.brand600, borderRadius: radius.full, ...typography.captionSemiBold, marginBottom: spacing.md }}>{tagLabel}</span>}
    <div style={{ padding: spacing.xl, background: colors.gray50, borderRadius: radius.md, minHeight: 120,
      whiteSpace: 'pre-wrap', ...typography.bodyTextXLRegular, color: colors.gray800, lineHeight: 1.7 }}>
      <QuestionPrompt {...prompt} />
    </div>
  </>;
}
