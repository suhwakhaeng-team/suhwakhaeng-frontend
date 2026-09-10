import { Fragment } from 'react';
import MathText from './MathText';
import { colors, radius, spacing, typography } from '../lib/designTokens';

/**
 * 문제 본문 렌더러. 일반 텍스트는 줄바꿈 보존(pre-wrap) 그대로 두고,
 * 마크다운 표 블록(`| a | b |` + `| --- | --- |` 구분줄)만 감지해 HTML <table> 로 그린다.
 *
 * 노션 문제의 표준정규분포표 등이 평문으로 노출되던 문제를 해결한다.
 * 폰트/색은 부모(문제 카드)에서 상속받고, 표만 자체 스타일을 가진다.
 */
interface Props {
  content: string;
}

type Block =
  | { kind: 'text'; text: string }
  | { kind: 'table'; header: string[]; rows: string[][] };

// `| --- | :--: |` 같은 구분줄: 파이프/하이픈/콜론/공백만으로 이뤄지고 하이픈을 포함.
function isSeparator(line: string): boolean {
  const t = line.trim();
  return t.includes('-') && /^\|?[\s:|-]+\|?$/.test(t);
}

// 표 행을 셀 배열로. 바깥 파이프 제거 후 `|` 로 분리.
function toCells(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

// i행이 표의 시작인가: 현재 줄에 `|` 가 있고 다음 줄이 구분줄.
function isTableStart(lines: string[], i: number): boolean {
  return lines[i].includes('|') && i + 1 < lines.length && isSeparator(lines[i + 1]);
}

function parseBlocks(content: string): Block[] {
  const lines = content.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    if (isTableStart(lines, i)) {
      const header = toCells(lines[i]);
      let j = i + 2; // 헤더 + 구분줄 다음
      const rows: string[][] = [];
      while (j < lines.length && lines[j].includes('|') && lines[j].trim() !== '') {
        rows.push(toCells(lines[j]));
        j += 1;
      }
      blocks.push({ kind: 'table', header, rows });
      i = j;
    } else {
      const textLines: string[] = [];
      while (i < lines.length && !isTableStart(lines, i)) {
        textLines.push(lines[i]);
        i += 1;
      }
      const text = textLines.join('\n');
      if (text.trim() !== '') blocks.push({ kind: 'text', text });
    }
  }
  return blocks;
}

export default function ProblemContent({ content }: Props) {
  const blocks = parseBlocks(content);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      {blocks.map((block, idx) => (
        <Fragment key={idx}>
          {block.kind === 'text' && <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}><MathText text={block.text} /></div>}
          {block.kind === 'table' && (
            <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
            <table
              style={{
                borderCollapse: 'collapse',
                margin: `${spacing.xs}px 0`,
                background: colors.white,
                borderRadius: radius.sm,
                overflow: 'hidden',
                border: `1px solid ${colors.gray200}`,
                ...typography.bodyTextLgRegular,
                color: colors.gray800,
              }}
            >
              <thead>
                <tr>
                  {block.header.map((cell, c) => (
                    <th
                      key={c}
                      style={{
                        background: colors.gray50,
                        border: `1px solid ${colors.gray200}`,
                        padding: `${spacing.sm}px ${spacing.md}px`,
                        textAlign: 'center',
                        ...typography.bodyTextLgMedium,
                        color: colors.gray700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <MathText text={cell} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) => (
                      <td
                        key={c}
                        style={{
                          border: `1px solid ${colors.gray200}`,
                          padding: `${spacing.sm}px ${spacing.md}px`,
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <MathText text={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}
