import katex from 'katex';
import 'katex/dist/katex.min.css';

/** Render only explicitly delimited formulas. Ordinary content remains escaped React text. */
export default function MathText({ text }: { text: string }) {
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);
  return <>{parts.map((part, i) => {
    if (!part.startsWith('$') || !part.endsWith('$') || part.length < 3) return part;
    const displayMode = part.startsWith('$$');
    const formula = part.slice(displayMode ? 2 : 1, displayMode ? -2 : -1);
    try {
      const html = katex.renderToString(formula, { displayMode, throwOnError: true, trust: false, strict: 'warn' });
      return <span key={i} style={displayMode ? { display: 'block', overflowX: 'auto', maxWidth: '100%' } : undefined} dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return <span key={i} title="수식 문법을 확인해주세요">{part}</span>;
    }
  })}</>;
}
