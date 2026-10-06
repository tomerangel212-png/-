'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const D = require('./tra-languages-data.js');
const read = file => JSON.parse(fs.readFileSync(path.join(__dirname, 'data/languages', file), 'utf8'));
const clone = x => JSON.parse(JSON.stringify(x));
const catalog = read('catalog.json');
const manifest = read('lesson-packs.json');
const packs = Object.fromEntries(manifest.packs.map(p => [p.id, read(p.path)]));

test('catalog, manifest, every lesson and all references satisfy the v1 contract', () => {
  assert.equal(D.validateReferences(catalog, manifest, packs), true);
});
test('coverage is computed from records; locales/macrolanguages are not extra individual languages', () => {
  assert.deepEqual(D.coverage(catalog), {language: 10, macrolanguage: 2, locale: 4, dialect: 0, accent: 0});
  assert.equal(catalog.coverage.complete, false);
  assert.equal(catalog.entities.find(e => e.id === 'language:ase').kind, 'language');
  for (const id of ['cmn', 'yue']) assert.equal(catalog.entities.find(e => e.id === 'language:' + id).macrolanguageId, 'language:zh');
});
test('the original four pack labels and speech locales remain unchanged', () => {
  assert.deepEqual(manifest.packs.map(p => [p.id, p.label]), [['en','English'],['es','Español'],['fr','Français'],['it','Italiano']]);
  assert.deepEqual(Object.values(packs).map(p => p.speechTag), ['en-US','es-ES','fr-FR','it-IT']);
});
// SHA-256 over JSON.stringify(originalItems), extracted from the original Git blob
// 81040ebd7fa453e7d7bd2960de3b354a618fb6cb, not recomputed from the new fixtures.
const originalHashes = {
  "en": "7b9ba3fae01339aacbc5cbeca159dc203ce62d2fe01f406519584979dd58e3ec",
  "es": "2aa919499434de48f8feace641d0e5fef88ef14bddebae1540c7d5570a7cc904",
  "fr": "eb3e9b883c8b42ed28a39bb85f3e6478e89d3b9d41f9f8838421794fe25af529",
  "it": "63c03c9ef699405c3e28a1d473195fee723d651e3834c0a8f277081e570f10cd"
};
for (const id of Object.keys(originalHashes)) test(id + ': every original word, translation, niqqud and item order is preserved', () => {
  assert.equal(packs[id].items.length, 5);
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(packs[id].items)).digest('hex'), originalHashes[id]);
});
for (const [name, change, expected] of [
  ['unknown schema', c => { c.schemaVersion = 99; }, /schemaVersion/],
  ['complete-coverage claim', c => { c.coverage.complete = true; }, /incomplete seed/],
  ['duplicate entity ID', c => { c.entities.push(clone(c.entities[0])); }, /duplicate entity/],
  ['duplicate BCP 47 tag', c => { c.entities.push({...clone(c.entities[0]), id: 'language:duplicate'}); }, /Duplicate BCP/],
  ['missing source', c => { c.entities[0].refs = []; }, /Missing entity source/],
  ['unknown source', c => { c.entities[0].refs[0].sourceId = 'absent'; }, /Unresolved source/],
  ['unsafe source URL', c => { c.sources[0].url = 'javascript:alert(1)'; }, /source metadata/],
  ['dangling parent', c => { c.entities.find(e => e.kind === 'locale').parentId = 'language:absent'; }, /Missing variety parent/],
  ['wrong locale language', c => { c.entities.find(e => e.kind === 'locale').parentId = 'language:fr'; }, /Locale must extend/],
  ['false macrolanguage parent', c => { c.entities[0].macrolanguageId = 'language:fr'; }, /macrolanguage membership/],
  ['invented kind', c => { c.entities[0].kind = 'model'; }, /entity kind/],
]) test('reject ' + name, () => {
  const c = clone(catalog); change(c); assert.throws(() => D.validateCatalog(c), expected);
});
function fixtureVariety(id, kind, parentId) {
  return {id, kind, name: 'Synthetic validator fixture, not catalog data', bcp47: null, parentId,
    refs: [{sourceId: 'iana', record: 'synthetic test reference'}]};
}
test('schema supports separately sourced dialects/accents without inventing BCP 47 tags', () => {
  const c = clone(catalog);
  c.entities.push(fixtureVariety('dialect:test', 'dialect', 'language:en'));
  c.entities.push(fixtureVariety('accent:test', 'accent', 'dialect:test'));
  D.validateCatalog(c);
  assert.equal(D.coverage(c).accent, 1);
  assert.equal(D.coverage(catalog).accent, 0);
});
test('reject cycles in variety ancestry', () => {
  const c = clone(catalog);
  c.entities.push(fixtureVariety('dialect:test', 'dialect', 'accent:test'));
  c.entities.push(fixtureVariety('accent:test', 'accent', 'dialect:test'));
  assert.throws(() => D.validateCatalog(c), /Cyclic/);
});
for (const badPath of ['../secret.json','https://example.com/lesson.json','/lessons/en.json','lessons/%2e%2e/en.json'])
  test('reject unsafe pack path ' + badPath, () => {
    const m = clone(manifest); m.packs[0].path = badPath;
    assert.throws(() => D.validateManifest(m), /Unsafe pack path/);
  });
test('reject duplicate pack IDs and paths', () => {
  const m = clone(manifest); m.packs.push(clone(m.packs[0]));
  assert.throws(() => D.validateManifest(m), /duplicate pack/);
  m.packs[m.packs.length - 1].id = 'other';
  assert.throws(() => D.validateManifest(m), /duplicate pack path/);
});
test('reject wrong identity, empty content, bad items and unsourced lessons', () => {
  const descriptor = manifest.packs[0];
  for (const change of [p => {p.id = 'he';}, p => {p.items = [];}, p => {p.items = [['Hello','']];}, p => {delete p.provenance;}]) {
    const p = clone(packs.en); change(p); assert.throws(() => D.validatePack(p, descriptor));
  }
});
test('reject dangling lesson references and unrelated speech locales', () => {
  const m = clone(manifest); m.packs[0].entityId = 'language:absent';
  assert.throws(() => D.validateReferences(catalog, m, packs), /unknown catalog/);
  const p = clone(packs); p.en.speechTag = 'fr-FR';
  assert.throws(() => D.validateReferences(catalog, manifest, p), /Unlinked speech locale/);
});
test('lesson length comes from the pack, not an engine constant of five', () => {
  const p = clone(packs.en); p.items.push(['Additional fixture', 'תּוֹדָה']);
  assert.equal(D.validatePack(p, manifest.packs[0]).items.length, 6);
});
function mockStore(handler) {
  const requests = [];
  const store = D.createStore(async url => {
    requests.push(url);
    if (handler) { const result = handler(url); if (result) return result; }
    return {ok: true, json: async () => read(url.slice('data/languages/'.length))};
  });
  return {store, requests};
}
test('load one pack lazily, deduplicate requests and never download other packs implicitly', async () => {
  const {store, requests} = mockStore();
  const [a, b] = await Promise.all([store.pack('en'), store.pack('en')]);
  assert.strictEqual(a, b);
  assert.deepEqual(requests, ['data/languages/lesson-packs.json', 'data/languages/lessons/en.json']);
});
test('a catalog entry is not an available lesson and does not silently fall back to English', async () => {
  const {store, requests} = mockStore();
  await assert.rejects(store.pack('he'), /No lesson pack/);
  assert.equal(requests.length, 1);
});
test('catalog failure does not prevent an existing lesson from loading', async () => {
  const {store} = mockStore(url => url.endsWith('catalog.json') ? {ok: false} : null);
  await assert.rejects(store.catalog());
  assert.equal((await store.pack('fr')).items[0][0], 'Bonjour');
});
for (const mode of ['http', 'json', 'network', 'contract']) test(mode + ' failure is retryable, not cached forever', async () => {
  let fail = true;
  const {store} = mockStore(url => {
    if (url.endsWith('/en.json') && fail) {
      if (mode === 'network') throw new Error('offline');
      return {ok: mode !== 'http', json: async () => {
        if (mode === 'json') throw new SyntaxError('invalid JSON');
        return {schemaVersion: 99};
      }};
    }
  });
  await assert.rejects(store.pack('en'));
  fail = false;
  assert.equal((await store.pack('en')).id, 'en');
});
test('HTML is a view, with relative assets, preserved routes and all five archive categories', () => {
  const html = fs.readFileSync(path.join(__dirname, 'tra-languages.html'), 'utf8');
  assert.match(html, /<html lang="he" dir="rtl">/);
  assert.doesNotMatch(html, /const sets|en-US|J’apprends|Estoy aprendiendo/);
  for (const asset of ['tra-languages-data.js','tra-languages.js']) {
    assert.ok(html.includes('src="' + asset + '"'));
    assert.ok(fs.existsSync(path.join(__dirname, asset)));
  }
  for (const route of ['links/', 'tra-art-try.html']) assert.ok(html.includes('href="' + route + '"'));
  for (const category of ['archive','language','model','learning','adaptation']) assert.ok(html.includes('value="' + category + '"'));
  assert.ok(html.includes('© 2026 Tomer Rafael Angel'));
});
