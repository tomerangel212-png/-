#!/usr/bin/env python3
"""Regression checks for public orientation data, static fallback and privacy policy."""
import hashlib
import json
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows = []
        self.links = []
        self.external_scripts = []
        self.row = None
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'tr' and 'data-entry' in attrs:
            self.row = [attrs['data-entry'], '']
        if tag == 'a':
            self.links.append(attrs.get('href', ''))
        if tag == 'script' and 'src' in attrs:
            self.external_scripts.append(attrs['src'])
    def handle_data(self, text):
        if self.row is not None:
            self.row[1] += text
    def handle_endtag(self, tag):
        if tag == 'tr' and self.row is not None:
            self.rows.append(self.row)
            self.row = None

def check(condition, message):
    if not condition:
        raise AssertionError(message)


def main():
    data = json.loads((ROOT / 'data/navigation/huji-orientation-06-10.json').read_text())
    charter = json.loads((ROOT / 'TRA_PRINCIPLES.json').read_text())
    source = (ROOT / 'tra-orientation.html').read_text()
    page = Page()
    page.feed(source)
    rows = dict(page.rows)
    entries = data['entries']
    check(len(entries) == len(rows) == 41, 'All 41 poster entries must remain unique and visible in the static HTML.')
    check(set(rows) == {entry['id'] for entry in entries}, 'Data and HTML IDs differ.')
    for entry in entries:
        check(entry['room'] in rows[entry['id']], 'Room mismatch: ' + entry['id'])
        check(entry['label_he'] in rows[entry['id']], 'Label mismatch: ' + entry['id'])
    sw = next(entry for entry in entries if entry['group'] == 'social-work')
    check(sw['room'] == '283' and sw['room_kind'] == 'auditorium' and sw['schedule'] == 'custom', 'Social work must retain its own room and session.')
    check(data['schedules']['custom'] == {'start': '13:15', 'end': '14:45'}, 'Social-work time changed.')
    check(data['schedules']['A'] == {'start': '13:15', 'end': '14:00'}, 'Round A changed.')
    check(data['schedules']['B'] == {'start': '14:15', 'end': '15:00'}, 'Round B changed.')
    ppe = next(entry for entry in entries if entry['room'] == '21205')
    check(ppe['schedule'] == 'A', 'PPE must remain round A only.')
    check(data['source']['year'] is None, 'Never infer a year from this poster.')
    check(data['source']['coordinates'] is None and not data['source']['indoor_route_verified'], 'Do not invent an indoor route.')
    check(not any(data['privacy'].values()), 'No personal records or tracking may be enabled.')
    check(not page.external_scripts, 'The orientation page must not load third-party scripts.')
    script = re.search(r'<script>(.*?)</script>', source, re.S).group(1)
    for token in ['localStorage', 'sessionStorage', 'document.cookie', 'geolocation', 'fetch(', 'XMLHttpRequest', 'posthog', 'sendBeacon']:
        check(token not in script, 'Unexpected collection or network call: ' + token)
    check('<html lang="he" dir="rtl">' in source, 'Hebrew RTL is required.')
    check('aria-live="polite"' in source and '<noscript>' in source, 'Accessible status and no-script fallback are required.')
    links = Page()
    links.feed((ROOT / 'links/index.html').read_text())
    check(links.links.count('../tra-orientation.html') == 1, 'Add exactly one orientation navigation link.')
    policy = charter['governance']['knowledge_preservation']
    check(policy['personal_data'] == 'exclude' and policy['precedence'] == 'privacy-before-preservation', 'Privacy must override preservation.')
    check(policy['automatic_publication'] is False, 'Preservation is not publication consent.')
    check(len(charter['principles']) >= 37, 'Preserve the original 36 principles and add one.')
    check(sum(item['id'] == 'knowledge-preservation' for item in charter['principles']) == 1, 'Missing new principle.')
    print('PASS: 41 rooms; two explicit schedule exceptions; source uncertainty; static RTL fallback; local-only search; navigation; privacy-first preservation.')

if __name__ == '__main__':
    main()
