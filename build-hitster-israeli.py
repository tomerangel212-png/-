#!/usr/bin/env python3
"""Build a year-balanced Hebrew Galgalatz deck from chart archive facts.
Requires beautifulsoup4 and the verified preview manifest. Run: python build-hitster-israeli.py [--archive-dir DIR].
Only explicitly labeled Galgalatz lists are eligible; missing years fail closed.
The original annual rank is retained when unavailable previews or blocked entries are skipped.
"""
from bs4 import BeautifulSoup
import argparse, json, re, unicodedata, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PAGES = [
    'מצעד הפזמונים העברי השנתי (ה\'תש"ס–ה\'תשס"ט)',
    'מצעד הפזמונים העברי השנתי (ה\'תש"ע–ה\'תשע"ט)',
    'מצעד הפזמונים העברי השנתי (ה\'תש"ף ואילך)',
]
ALIASES = json.loads((ROOT / 'hitster-israeli-artist-aliases.json').read_text())
OVERRIDES = json.loads((ROOT / 'hitster-israeli-catalog-overrides.json').read_text())

def norm(value):
    return re.sub(r'[^א-תa-z0-9]', '', unicodedata.normalize('NFKC', value).lower())

def parse_archive(html, page):
    groups = {}; year = None; publisher = None
    soup = BeautifulSoup(html, 'html.parser')
    for element in soup.find_all(['h2', 'h3', 'h4', 'p', 'dl', 'table', 'ul', 'ol']):
        if element.name in ['h2', 'h3']:
            match = re.search(r'(19\d{2}|20\d{2})', element.get_text())
            year = int(match[1]) if match else None; publisher = None
            continue
        if not year or not 2002 <= year <= 2026:
            continue
        if element.name in ['p', 'dl', 'h4']:
            text = element.get_text(' ', strip=True)
            if re.match(r'^(?:המצעד|הדירוג|מצעד |גלגלצ|בגלגלצ|כאן גימל|מדיה פורסט|רשת ג)', text):
                publisher = 'גלגלצ' if 'גלגלצ' in text else None
            continue
        if publisher != 'גלגלצ':
            continue
        if element.name in ['ul', 'ol'] and element.find_parent(['table', 'ul', 'ol']):
            continue
        if element.name == 'table' and element.find_parent('table'):
            continue
        rows = []
        for index, item in enumerate(element.find_all('li'), 1):
            text = re.sub(r'\s+', ' ', item.get_text(' ', strip=True))
            match = re.match(r'(?:(\d+)\.\s*)?["״](.+?)["״](?:\s*\([^)]*\))?\s*[–—-]\s*(.+)', text)
            if not match:
                continue
            artist = re.split(r'\s*\(', match[3])[0].strip()
            artist = re.split(r',?\s*סול(?:ן|נית|נים|ניות)\s*:', artist)[0].strip(' ,')
            artist = re.sub(r'\s*\[\s*\d+\s*\]', '', artist)
            artist = re.sub(r'\s+,', ',', artist).replace(' ו ', ' ו')
            title = match[2].strip().rstrip(" '")
            if not re.search('[א-ת]', title) or re.search('[A-Za-z]', title) or re.search(r'אייל גולן|איל גולן', artist):
                continue
            if not re.search('[א-ת]', artist):
                continue
            aliases = []
            for original, alternatives in ALIASES.items():
                if norm(original) in norm(artist):
                    aliases.extend([original] + alternatives)
            rows.append({
                'id': f'israel-chart-{year}-{int(match[1]) if match[1] else index:03}',
                'title': title, 'artist': artist, 'artistAliases': sorted(set(aliases)),
                'lookupTitle': re.sub(r'\s*\([^)]*\)', '', title).strip(),
                'chartYear': year, 'chartRank': int(match[1]) if match[1] else index,
                'yearBasis': 'chart-year', 'chartPublisher': publisher,
                'source': 'המצעד הישראלי השנתי של גלגלצ',
                'sourceUrl': 'https://he.wikipedia.org/wiki/' + page.replace(' ', '_'),
            })
        if rows:
            groups.setdefault(year, []).append(rows)
    return groups

if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--archive-dir', type=Path)
    parser.add_argument('--previews', type=Path, default=ROOT / 'hitster-israeli-preview-manifest.json')
    args = parser.parse_args(); groups = {}
    previews = json.loads(args.previews.read_text())['previews']
    for index, page in enumerate(PAGES):
        if args.archive_dir:
            html = (args.archive_dir / f'tra-he-chart-{index + 4}.html').read_text()
        else:
            url = 'https://he.wikipedia.org/w/index.php?title=' + urllib.parse.quote(page.replace(' ', '_')) + '&action=render'
            request = urllib.request.Request(url, headers={'User-Agent': 'TRA-HITSTER chart-source-audit/1.0'})
            html = urllib.request.urlopen(request, timeout=40).read().decode()
        for year, lists in parse_archive(html, page).items():
            groups.setdefault(year, []).extend(lists)
    for lists in groups.values():
        for rows in lists:
            for card in rows:
                for key, values in OVERRIDES.get(card['id'], {}).items():
                    card[key] = sorted(set(card.get(key, []) + values))
    used = set(); cards = []
    for year in range(2002, 2027):
        selected = []
        for rows in groups.get(year, []):
            eligible = [card for card in rows if card['id'] in previews and (norm(card['title']), norm(card['artist'])) not in used]
            if len(eligible) >= 12:
                selected = eligible[:12]; break
        if len(selected) != 12:
            raise ValueError(f'No complete Galgalatz quota for {year}; refusing partial output')
        for card in selected:
            used.add((norm(card['title']), norm(card['artist'])))
        cards.extend(selected)
    payload = {'schemaVersion': 1, 'title': 'HITSTER TRA · Israeli Galgalatz annual charts',
               'yearBasis': 'chart-year', 'sourceNote': '12 eligible Hebrew entries with verified official previews per Galgalatz annual Israeli chart, selected in rank order. Years are chart years, not original release years. Annual facts transcribed from the linked archive; blocked artists and repeated song/artist identities are excluded.',
               'range': {'from': 2002, 'to': 2026}, 'total': len(cards), 'cards': cards}
    (ROOT / 'hitster-israeli-annual.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n')
    print(f'Built {len(cards)} cards: 12 per year, 2002–2026, Galgalatz only.')
