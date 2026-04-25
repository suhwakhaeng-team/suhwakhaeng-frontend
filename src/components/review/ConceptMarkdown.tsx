import { Fragment } from 'react';
import { colors, spacing, typography } from '../../lib/designTokens';

/**
 * 시연용 단순 Markdown 렌더. 헤딩 `## `, 리스트 `- `, 빈 줄, 일반 단락만 처리.
 * 풀 Markdown 파서가 아니라 줄 단위 분기. 강조/링크는 그대로 평문.
 */
interface Props {
  content: string;
}

type Line =
  | { kind: 'heading'; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'blank' };

function parse(raw: string): Line[] {
  return raw.split('\n').map((rawLine) => {
    const trimmed = rawLine.trim();
    if (trimmed === '') return { kind: 'blank' };
    if (trimmed.startsWith('## ')) return { kind: 'heading', text: trimmed.slice(3) };
    if (trimmed.startsWith('# ')) return { kind: 'heading', text: trimmed.slice(2) };
    if (trimmed.startsWith('- ')) return { kind: 'bullet', text: trimmed.slice(2) };
    return { kind: 'paragraph', text: trimmed };
  });
}

export default function ConceptMarkdown({ content }: Props) {
  const lines = parse(content);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
      {lines.map((line, idx) => (
        <Fragment key={idx}>
          {line.kind === 'heading' && (
            <h3
              style={{
                ...typography.headingMdBold,
                color: colors.gray900,
                margin: 0,
                marginTop: spacing.sm,
              }}
            >
              {line.text}
            </h3>
          )}
          {line.kind === 'bullet' && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ color: colors.gray500 }}>•</span>
              <span style={{ ...typography.bodyTextLgRegular, color: colors.gray800 }}>{line.text}</span>
            </div>
          )}
          {line.kind === 'paragraph' && (
            <p
              style={{
                ...typography.bodyTextLgRegular,
                color: colors.gray800,
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {line.text}
            </p>
          )}
          {line.kind === 'blank' && <div style={{ height: 4 }} />}
        </Fragment>
      ))}
    </div>
  );
}
