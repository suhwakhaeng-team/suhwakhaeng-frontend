import { colors, radius, spacing, typography } from '../lib/designTokens';
import type { CurriculumCardItem } from '../lib/curriculumDefinition';
import CurriculumTopicRowView from './CurriculumTopicRowView';

function masteryDisplay(mastery: number): { text: string; color: string } {
  if (mastery < 0) return { text: '미진단', color: colors.gray400 };
  const percent = Math.round(mastery * 100);
  if (mastery >= 0.7) return { text: `${percent}%`, color: colors.green500 };
  if (mastery >= 0.4) return { text: `${percent}%`, color: colors.yellow500 };
  return { text: `${percent}%`, color: colors.red500 };
}

interface Props {
  card: CurriculumCardItem;
}

export default function CurriculumCardView({ card }: Props) {
  const { text: masteryText, color: masteryColor } = masteryDisplay(card.mastery);

  return (
    <div
      style={{
        width: 320,
        minWidth: 320,
        background: colors.white,
        borderRadius: radius.lg,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        padding: spacing.xl,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
      }}
    >
      {/* 헤더: 단원명 + 이해도 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ ...typography.headingMdBold, color: colors.gray900 }}>
            {card.unitName}
          </div>
          {card.grade && (
            <div style={{ ...typography.captionSemiBold, color: colors.gray400, marginTop: spacing.xxs }}>
              {card.grade}
            </div>
          )}
        </div>
        <span style={{ ...typography.bodyTextXLSemiBold, color: masteryColor, flexShrink: 0 }}>
          {masteryText}
        </span>
      </div>

      {/* 토픽 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, marginTop: spacing.sm }}>
        {card.topics.map((topic) => (
          <CurriculumTopicRowView key={topic} topic={topic} />
        ))}
      </div>
    </div>
  );
}
