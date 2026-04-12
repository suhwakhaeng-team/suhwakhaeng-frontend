import { colors, radius, spacing, typography } from '../lib/designTokens';

interface Props {
  topic: string;
}

export default function CurriculumTopicRowView({ topic }: Props) {
  return (
    <div
      style={{
        background: colors.gray50,
        borderRadius: radius.sm,
        padding: `${spacing.md}px ${spacing.lg}px`,
        ...typography.bodyTextXLSemiBold,
        color: colors.gray700,
      }}
    >
      {topic}
    </div>
  );
}
