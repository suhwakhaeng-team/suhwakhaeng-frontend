"""Deterministic local import. Parse data only, never execute the supplied HTML."""
import argparse
import hashlib
import json
import re
import shutil
import unicodedata
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote

VOID = {'img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'wbr'}

class Parser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = {'tag': 'root', 'attrs': {}, 'children': []}
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = {'tag': tag, 'attrs': dict(attrs), 'children': []}
        self.stack[-1]['children'].append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i]['tag'] == tag:
                del self.stack[i:]
                break

    def handle_data(self, text):
        self.stack[-1]['children'].append(text)

def descendants(node, tag):
    for child in node['children']:
        if isinstance(child, dict):
            if child['tag'] == tag:
                yield child
            yield from descendants(child, tag)

def text(node):
    if isinstance(node, str):
        return node
    if node['tag'] == 'br':
        return '\n'
    return ''.join(text(c) for c in node['children'])

def clean(value):
    return re.sub(r'[ \t]+', ' ', unicodedata.normalize('NFC', value)).strip()

def main():
    cli = argparse.ArgumentParser()
    cli.add_argument('source', type=Path)
    cli.add_argument('--frontend', type=Path, required=True)
    cli.add_argument('--references', type=Path, required=True)
    args = cli.parse_args()
    files = list(args.source.glob('*.html'))
    if len(files) != 1:
        raise ValueError('Expected one HTML source')
    raw = files[0].read_bytes()
    parser = Parser()
    parser.feed(raw.decode('utf-8-sig'))
    body = next(descendants(parser.root, 'body'))
    assets, sections, repairs = [], [], []
    args.references.mkdir(parents=True, exist_ok=True)
    asset_dir = args.frontend / 'public' / 'team-concepts'
    asset_dir.mkdir(parents=True, exist_ok=True)

    def image(node, title):
        original = unquote(node['attrs'].get('src', ''))
        source = (args.source / original).resolve()
        if source.parent != args.source.resolve() or source.suffix.lower() != '.png' or not source.is_file():
            raise ValueError(f'Unsafe or missing local image: {original}')
        existing = next((a for a in assets if a['sourceName'] == original), None)
        if existing is None:
            name = f'diagram-{len(assets) + 1:02d}.png'
            shutil.copyfile(source, asset_dir / name)
            existing = {'sourceName': original, 'src': f'/team-concepts/{name}', 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()}
            assets.append(existing)
        return {'kind': 'image', 'src': existing['src'], 'alt': title + ' 설명 그림'}

    def blocks(node, title, section_id):
        out = []
        for child in node['children']:
            if isinstance(child, str) or child['tag'] in {'details', 'summary', 'script', 'style'}:
                continue
            tag, value = child['tag'], clean(text(child))
            if tag in {'h1', 'h2', 'h3', 'h4'} and value:
                if value != title:
                    out.append({'kind': 'heading', 'text': value})
            elif tag in {'p', 'blockquote'} and value:
                out.append({'kind': 'paragraph', 'text': value})
            elif tag in {'ul', 'ol'}:
                items = [clean(text(c)) for c in child['children'] if isinstance(c, dict) and c['tag'] == 'li' and not list(descendants(c, 'details'))]
                if items:
                    out.append({'kind': 'list', 'ordered': tag == 'ol', 'items': items,
                                **({'start': int(child['attrs'].get('start', '1'))} if tag == 'ol' else {})})
            elif tag == 'table':
                rows = [[clean(text(c)) for c in row['children'] if isinstance(c, dict) and c['tag'] in {'td', 'th'}] for row in descendants(child, 'tr')]
                # Restore four export-truncated conditional formulas from their explicit row labels.
                fixes = {
                    'B가 일어났을 때 A가 일어날 확률': 'P(A|B) = P(A ∩ B) / P(B), P(B)>0',
                    'A가 일어나지 않았을 때 B가 일어날 확률': 'P(B|Aᶜ) = P(B ∩ Aᶜ) / P(Aᶜ), P(Aᶜ)>0',
                    '남자일 때 안경을 쓸 확률': 'P(안경|남자) = P(안경 ∩ 남자) / P(남자), P(남자)>0',
                    '대한민국 국민일 때 서울에 살 확률': 'P(서울|대한민국 국민) = P(서울 ∩ 대한민국 국민) / P(대한민국 국민)',
                }
                for row in rows:
                    if len(row) == 2 and row[0] in fixes and row[1] in {'P(A', 'P(B', 'P(안경', 'P(서울'}:
                        repairs.append({'sectionId': section_id, 'before': row[1], 'after': fixes[row[0]], 'reason': '조건부확률 표의 내보내기 누락 복구'})
                        row[1] = fixes[row[0]]
                out.append({'kind': 'table', 'rows': rows})
            elif tag == 'figure':
                out.extend(image(img, title) for img in descendants(child, 'img'))
            elif tag == 'img':
                out.append(image(child, title))
            else:
                out.extend(blocks(child, title, section_id))
        return out

    def walk(node, ancestors):
        for child in node['children']:
            if not isinstance(child, dict):
                continue
            if child['tag'] == 'details':
                summary = next(c for c in child['children'] if isinstance(c, dict) and c['tag'] == 'summary')
                title = clean(text(summary))
                section_id = child['attrs'].get('id')
                if not section_id:
                    raise ValueError('Section without source identity')
                section = {'id': section_id, 'title': title, 'parents': ancestors, 'blocks': blocks(child, title, section_id)}
                sections.append(section)
                walk(child, ancestors + [title])
            else:
                walk(child, ancestors)
    walk(body, [])
    for unused_image in sorted(args.source.glob('*.png')):
        if not any(a['sourceName'] == unused_image.name for a in assets):
            image({'attrs': {'src': unused_image.name}}, '추가 제공 그림')
    snapshot_file = args.frontend / 'src/routes/dev/tagCatalogSnapshot.json'
    if snapshot_file.exists():
        snapshot = json.loads(snapshot_file.read_text(encoding='utf-8-sig'))
    else:
        previous = json.loads((args.frontend / 'src/data/teamConcepts.json').read_text(encoding='utf-8'))
        snapshot = {'tags': [{'id': item['tagId'], 'name': item['name']} for item in previous['tagMappings']]}
    rules = json.loads((args.frontend / 'scripts/team-concept-mapping.json').read_text(encoding='utf-8'))
    mappings = []
    for tag in snapshot['tags']:
        selectors = rules.get(tag['name'], [])
        matched = [s['id'] for s in sections if any(
            (selector.startswith('통계:') and s['parents'] == ['통계'] and s['title'] == selector[3:]) or
            (selector.startswith('확률:') and s['parents'] == ['확률'] and s['title'] == selector[3:]) or
            (not ':' in selector and (s['title'].startswith(selector[:-1]) if selector.endswith('*') else s['title'] == selector))
            for selector in selectors)]
        mappings.append({'tagId': tag['id'], 'name': tag['name'], 'sectionIds': matched})
    for section in sections:
        # Preserve text/tables/formulas in Markdown for local AI reference, independently of diagrams.
        lines = ['# ' + section['title'], '출처: 팀 제공 개념 정리', '범위: ' + ' > '.join(section['parents']), '']
        for block in section['blocks']:
            if block['kind'] in {'heading', 'paragraph'}:
                lines.append(('## ' if block['kind'] == 'heading' else '') + block['text'])
            elif block['kind'] == 'list':
                lines.extend('- ' + item for item in block['items'])
            elif block['kind'] == 'table':
                lines.extend(' / '.join(row) for row in block['rows'])
            else:
                lines.append('[그림: ' + block['alt'] + ' — ' + block['src'] + ']')
            lines.append('')
        (args.references / (section['id'] + '.md')).write_text('\n'.join(lines), encoding='utf-8')
    result = {'version': 1, 'sourceTitle': '팀 제공 확률과 통계 개념 정리', 'sourceFileName': files[0].name,
              'sourceSha256': hashlib.sha256(raw).hexdigest(), 'sections': sections, 'assets': assets, 'repairs': repairs,
              'tagMappings': mappings, 'reviewStatus': 'IMPORTED_NOT_FULL_MATH_AUDIT'}
    target = args.frontend / 'src' / 'data' / 'teamConcepts.json'
    target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (args.references / 'catalog.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'sections': len(sections), 'images': len(assets), 'repairs': len(repairs), 'groups': [s['title'] for s in sections if not s['parents']]}, ensure_ascii=False))

if __name__ == '__main__':
    main()
