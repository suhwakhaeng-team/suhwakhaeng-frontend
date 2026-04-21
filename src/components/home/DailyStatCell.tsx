import { colors, radius, spacing, typography } from '../../lib/designTokens';

interface Props {
  icon: string;         // 이모지(플레이스홀더 아이콘)
  iconColor?: string;
  title: string;
  value: string;
}

export default function DailyStatCell({ icon, iconColor, title, value }: Props) {
  return (
    <div
      style={{
        flex: 1,
        padding: spacing.md,
        background: colors.brand50,
        borderRadius: radius.md,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md,
      }}
    >
      <span
        style={{
          fontSize: 22,
          color: iconColor ?? colors.brand500,
          lineHeight: 1,
        }}
        aria-hidden
      >
        {icon}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ ...typography.bodyTextLgMedium, color: colors.gray700 }}>
          {title}
        </span>
        <span style={{ ...typography.bodyTextXLSemiBold, color: colors.gray900 }}>
          {value}
        </span>
      </div>
    </div>
  );
}
