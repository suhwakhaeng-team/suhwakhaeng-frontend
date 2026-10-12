import { teamSectionsForConcept, type TeamBlock, type TeamSection } from '../../data/teamConcepts';
import './TeamConceptContent.css';

function Blocks({ blocks }: { blocks: TeamBlock[] }) {
  return <>{blocks.map((block, index) => {
    if (block.kind === 'heading') return <h4 key={index}>{block.text}</h4>;
    if (block.kind === 'paragraph') return <p key={index}>{block.text}</p>;
    if (block.kind === 'image') return <figure key={index}><img src={block.src} alt={block.alt} loading="lazy" /></figure>;
    if (block.kind === 'list') {
      const List = block.ordered ? 'ol' : 'ul';
      return <List key={index} {...(block.ordered ? { start: block.start ?? 1 } : {})}>{block.items.map((item, i) => <li key={i}>{item}</li>)}</List>;
    }
    return <div className="team-table-scroll" key={index}><table><thead><tr>{block.rows[0]?.map((cell, i) => <th key={i} scope="col">{cell}</th>)}</tr></thead><tbody>{block.rows.slice(1).map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>;
  })}</>;
}
export default function TeamConceptContent({ sections, collapsible = true }: { sections: TeamSection[]; collapsible?: boolean }) {
  return <div className="team-concept-content">{sections.map(section => collapsible
    ? <details key={section.id}><summary>{section.title}</summary><Blocks blocks={section.blocks} /></details>
    : <section key={section.id} aria-label={section.title}><h3>{section.title}</h3><Blocks blocks={section.blocks} /></section>)}</div>;
}
export function TeamConceptSupplement({ conceptName }: { conceptName: string }) {
  const sections = teamSectionsForConcept(conceptName);
  if (!sections.length) return null;
  return <section className="team-concept-supplement"><h3>개념 보충 설명</h3><TeamConceptContent sections={sections} /><a href={`/concepts?concept=${encodeURIComponent(conceptName)}`}>전체 설명과 응용 유형 보기 →</a></section>;
}
