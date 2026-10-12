import source from './teamConcepts.json';

export type TeamBlock = { kind: 'heading'; text: string } | { kind: 'paragraph'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[]; start?: number }
  | { kind: 'table'; rows: string[][] }
  | { kind: 'image'; src: string; alt: string };
export type TeamSection = { id: string; title: string; parents: string[]; blocks: TeamBlock[] };
export const teamConceptCatalog = source as unknown as {
  version: number; sourceTitle: string; sourceSha256: string; reviewStatus: string;
  sections: TeamSection[]; assets: { src: string; sourceName: string; sha256: string }[];
  repairs: { sectionId: string; before: string; after: string; reason: string }[];
  tagMappings: { tagId: number; name: string; sectionIds: string[] }[];
};
const normalize = (name: string) => name.replace(/\s+/g, '');
const aliases: Record<string, string> = { '같은 것을 포함하는 순열': '같은 것이 있는 순열', '경우의 수': '경우의수', '여사건의 확률': '여사건', '사건의 독립과 종속': '사건의 독립' };
export function teamSectionsForConcept(name: string): TeamSection[] {
  const canonical = aliases[name] || name;
  const mapping = teamConceptCatalog.tagMappings.find(item => normalize(item.name) === normalize(canonical));
  return mapping ? teamConceptCatalog.sections.filter(section => mapping.sectionIds.includes(section.id) && section.blocks.length > 0) : [];
}
export function teamSectionText(section: TeamSection): string {
  return section.blocks.map(block => block.kind === 'table' ? block.rows.map(row => row.join(' / ')).join('\n')
    : block.kind === 'list' ? block.items.join('\n') : block.kind === 'image' ? block.alt : block.text).join('\n');
}
export function searchTeamSections(query: string, group = '전체'): TeamSection[] {
  const wanted = normalize(query.trim()).toLocaleLowerCase();
  return teamConceptCatalog.sections.filter(section => (group === '전체' || section.parents[0] === group || section.title === group)
    && (!wanted || normalize(section.title + teamSectionText(section)).toLocaleLowerCase().includes(wanted)));
}

export function teamWorkedExampleParts(section: TeamSection): { question: TeamSection; steps: TeamSection[] } | null {
  const split = section.blocks.findIndex(block => block.kind === 'heading' && block.text === '풀이');
  if (split < 0) return null;
  const steps: TeamSection[] = [];
  const begin = (title: string) => steps.push({ id: `${section.id}:${steps.length}`, title, parents: [], blocks: [] });
  for (const block of section.blocks.slice(split + 1)) {
    if (block.kind === 'heading') begin(block.text);
    else if (block.kind === 'list' && block.ordered) {
      block.items.forEach((item, index) => {
        begin(`풀이 ${steps.length + 1}단계`);
        steps.at(-1)!.blocks.push({ ...block, start: (block.start ?? 1) + index, items: [item] });
      });
    } else {
      if (!steps.length) begin('풀이 방향');
      steps.at(-1)!.blocks.push(block);
    }
  }
  return { question: { ...section, blocks: section.blocks.slice(0, split) }, steps };
}
