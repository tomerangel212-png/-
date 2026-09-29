"""Match existing cards to official iTunes previews; media is verified by the player.

This never changes the 888-card deck and never redistributes downloaded audio.
"""
import concurrent.futures
import datetime
import json
import re
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path


def normalize(value):
    value = unicodedata.normalize('NFKD', value).lower().replace('&', ' and ')
    return ' '.join(re.findall(r'[^\W_]+', value, re.UNICODE))


def overlap(left, right):
    a, b = set(normalize(left).split()), set(normalize(right).split())
    return len(a & b) / max(len(a), len(b), 1)


def lookup(card):
    query = urllib.parse.urlencode(dict(media='music', entity='song', limit=25,
                                       country='US', term=card['title'] + ' ' + card['artist']))
    try:
        with urllib.request.urlopen('https://itunes.apple.com/search?' + query, timeout=4) as r:
            results = json.load(r).get('results', [])
        ranked = []
        for candidate in results:
            if not candidate.get('previewUrl') or re.search(r'karaoke|tribute', candidate.get('artistName', '') + candidate.get('collectionName', ''), re.I):
                continue
            title = overlap(candidate.get('trackName', ''), card['title'])
            artist = overlap(candidate.get('artistName', ''), card['artist'])
            # More conservative than runtime search; alternate versions remain a runtime fallback.
            if title >= .8 and artist >= .6:
                ranked.append((title * 72 + artist * 28, candidate))
        if not ranked:
            return None
        candidate = max(ranked, key=lambda item: item[0])[1]
        return card['id'], dict(url=candidate['previewUrl'], trackId=candidate['trackId'],
                                title=candidate['trackName'], artist=candidate['artistName'], storefront='US')
    except Exception:
        return None


if __name__ == '__main__':
    cards = json.loads(Path('hitster-alltime-888.json').read_text())['cards']
    # Breadth first: one card per chart year before remaining cards.
    cards = cards[::12] + [card for i, card in enumerate(cards) if i % 12]
    previews, checked = {}, 0
    started = time.monotonic()
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for result in pool.map(lookup, cards):
            checked += 1
            if result:
                previews[result[0]] = result[1]
            if checked % 50 == 0:
                print(f'{checked}/888 checked; {len(previews)} matched', flush=True)
    output = dict(schemaVersion=1, generatedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                  source='iTunes Search API', cardsChecked=checked, previews=previews)
    Path('hitster-preview-manifest.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
    print(f'{len(previews)}/888 matched in {time.monotonic() - started:.1f}s', flush=True)
