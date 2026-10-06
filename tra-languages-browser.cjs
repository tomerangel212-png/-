'use strict';
// Runs against a project-subpath HTTP server; speech is deliberately stubbed, not heard.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = __dirname;
const prefix = '/-/';
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith(prefix)) throw new Error('outside project');
    const file = path.resolve(root, decodeURIComponent(url.pathname.slice(prefix.length)));
    if (!file.startsWith(root + path.sep)) throw new Error('outside root');
    const body = await fs.promises.readFile(file);
    const type = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8'}[path.extname(file)];
    res.writeHead(200, {'Content-Type': type || 'text/plain', 'Cache-Control':'no-store'}); res.end(body);
  } catch (_) { res.writeHead(404); res.end('Not found'); }
});
let browser, groups = 0;
const errors = [];
function pass(name) { console.log('PASS: ' + name); groups++; }
async function fresh() {
  const context = await browser.newContext({viewport: {width: 390, height: 844}});
  await context.addInitScript(() => {
    window.traSpeechCalls = [];
    Object.defineProperty(window, 'speechSynthesis', {configurable: true, value: {
      cancel() {}, speak(u) { window.traSpeechCalls.push({text: u.text, lang: u.lang}); }
    }});
    window.SpeechSynthesisUtterance = function (text) { this.text = text; };
  });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  return {context, page};
}
async function ready(page, word) {
  await page.waitForFunction(text => document.getElementById('word').textContent === text &&
    document.getElementById('lesson').getAttribute('aria-busy') === 'false', word);
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + prefix + 'tra-languages.html';
  browser = await chromium.launch({headless: true, executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox']});
  let {context, page} = await fresh();
  await page.goto(url); await ready(page, 'Hello');
  assert.equal(await page.locator('#lang option').count(), 4);
  for (const id of ['en','es','fr','it']) {
    const pack = JSON.parse(fs.readFileSync(path.join(root, 'data/languages/lessons/' + id + '.json')));
    await page.selectOption('#lang', id); await ready(page, pack.items[0][0]);
    await page.click('#speak');
    assert.deepEqual(await page.evaluate(() => window.traSpeechCalls.at(-1)), {text: pack.items[0][0], lang: pack.speechTag});
    for (let i = 0; i < pack.items.length; i++) {
      const button = page.getByRole('button', {name: pack.items[i][1], exact: true});
      await button.click(); await button.click(); // An answer can only score once.
      assert.equal(await page.textContent('#gameScore'), String((i + 1) * 10));
      await page.click('#next');
    }
    assert.equal(await page.evaluate(() => localStorage.getItem('traLanguagesLastScore')), '50');
    assert.equal(await page.locator('#progress').getAttribute('max'), '5');
    assert.equal(await page.locator('#speak').isDisabled(), true);
  }
  pass('all four complete games, 20 items, score persistence, double-answer guard and four speech tags');
  await page.click('#next'); await ready(page, 'Ciao');
  for (let i = 0; i < 3; i++) {
    const meanings = ['שָׁלוֹם','תּוֹדָה','מוּזִיקָה'];
    const wrong = page.locator('.choice').filter({hasNotText: meanings[i]}).first();
    await wrong.click(); await page.click('#next');
  }
  await ready(page, 'Ciao');
  assert.equal(await page.textContent('#gameLives'), '3');
  assert.equal(await page.textContent('#gameScore'), '0');
  pass('three-life game and in-place restart without destroying language-switch controls');
  await page.waitForFunction(() => !document.getElementById('catalogSearch').disabled);
  await page.fill('#catalogSearch', 'language:he');
  assert.equal(await page.locator('#catalogResults li').count(), 1);
  assert.match(await page.textContent('#catalogResults'), /Hebrew.*Catalog only/);
  assert.equal(await page.locator('#lang option').count(), 4);
  await page.fill('#catalogSearch', '');
  await page.fill('#mapEntityId', 'language:he');
  await page.fill('#grapheme', '<img src=x onerror="window.mapXSS=1">');
  await page.fill('#catalogCount', '0');
  await page.selectOption('#catalogCategory', 'archive');
  await page.click('#addSound');
  const rows = await page.evaluate(() => JSON.parse(localStorage.getItem('traLanguagesSoundMap')));
  assert.equal(rows[0].count, 0);
  assert.equal(rows[0].catalogId, 'language:he');
  assert.equal(rows[0].provenance, 'user-supplied');
  assert.equal(await page.locator('#soundMap img').count(), 0);
  assert.equal(await page.evaluate(() => window.mapXSS), undefined);
  assert.match(await page.textContent('#catalogStatus'), /10 languages · 2 macrolanguages · 4 regional locales · 0 dialects · 0 accents · 4 lesson packs/);
  pass('catalog-only search, truthful derived counts and safe local map with stable reference and count zero');
  await page.fill('#grapheme', 'ת');
  await page.fill('#mapEntityId', 'language:unknown');
  await page.click('#addSound');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('traLanguagesSoundMap')).length), 1);
  await page.fill('#mapEntityId', '');
  await page.click('#addSound');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('traLanguagesSoundMap'))[1].catalogId), null);
  pass('unknown catalog IDs blocked while free-text notes remain available');
  const legacy = [{g:'ט',seq:'ער',ipa:'t',word:'תּוֹדָה',lang:'legacy language label',dialect:'legacy dialect label',category:'adaptation',count:0,custom:{keep:true}}];
  await page.evaluate(rows => localStorage.setItem('traLanguagesSoundMap', JSON.stringify(rows)), legacy);
  await page.reload(); await ready(page, 'Hello');
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('traLanguagesSoundMap'))), legacy);
  await page.click('#addSound');
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('traLanguagesSoundMap'))[0]), legacy[0]);
  pass('legacy map rows and unknown historical fields preserved without automatic migration');
  await page.evaluate(() => localStorage.setItem('traLanguagesSoundMap', '{broken'));
  await page.reload(); await ready(page, 'Hello'); await page.click('#addSound');
  assert.equal(await page.evaluate(() => localStorage.getItem('traLanguagesSoundMap')), '{broken');
  assert.notEqual(await page.textContent('#mapStatus'), '');
  pass('corrupt local storage is not overwritten and cannot crash lessons');
  await context.close();

  ({context, page} = await fresh());
  let fail = true;
  await page.route('**/data/languages/lessons/en.json', route => fail ? route.fulfill({status:503, body:'unavailable'}) : route.continue());
  await page.goto(url);
  await page.waitForFunction(() => !document.getElementById('retryLesson').hidden);
  assert.equal(await page.locator('#next').isDisabled(), true);
  await page.selectOption('#lang', 'fr'); await ready(page, 'Bonjour');
  await page.selectOption('#lang', 'en');
  await page.waitForFunction(() => !document.getElementById('retryLesson').hidden);
  fail = false; await page.click('#retryLesson'); await ready(page, 'Hello');
  pass('missing lesson shows retry, other packs still work and failed fetch recovers');
  await page.route('**/data/languages/lessons/es.json', async route => {
    await new Promise(resolve => setTimeout(resolve, 250)); await route.continue();
  });
  await page.selectOption('#lang', 'es'); await page.selectOption('#lang', 'fr');
  await ready(page, 'Bonjour'); await page.waitForTimeout(400);
  assert.equal(await page.textContent('#word'), 'Bonjour');
  assert.equal(await page.inputValue('#lang'), 'fr');
  pass('delayed previous language request cannot overwrite a newer selection');
  await context.close();

  ({context, page} = await fresh());
  await page.route('**/data/languages/catalog.json', route => route.fulfill({status:200, contentType:'application/json', body:'{bad json'}));
  await page.goto(url); await ready(page, 'Hello');
  await page.waitForFunction(() => !document.getElementById('retryCatalog').hidden);
  await page.click('#addSound');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('traLanguagesSoundMap')).length), 1);
  await page.unroute('**/data/languages/catalog.json');
  await page.click('#retryCatalog');
  await page.waitForFunction(() => !document.getElementById('catalogSearch').disabled);
  pass('malformed catalog isolated from lessons/notes and independently retryable');
  for (const width of [320,390,900]) {
    await page.setViewportSize({width, height: 900});
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).direction), 'rtl');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'horizontal overflow at ' + width);
  }
  await page.setViewportSize({width:390, height:844});
  await page.selectOption('#lang', 'en'); await ready(page, 'Hello');
  await page.focus('#lang'); await page.keyboard.press('ArrowDown'); await ready(page, 'Hola');
  await page.screenshot({path: process.env.TRA_LANGUAGES_SCREENSHOT || 'tra-languages-mobile.png', fullPage:true});
  pass('RTL, keyboard language selection, 320/390/900px layouts and project-subpath assets');
  await context.close();

  ({context, page} = await fresh());
  await page.route('**/data/languages/lesson-packs.json', route => route.fulfill({status:404, body:'not found'}));
  await page.goto(url);
  await page.waitForFunction(() => !document.getElementById('retryLesson').hidden);
  assert.equal(await page.locator('#lang').isDisabled(), true);
  await page.unroute('**/data/languages/lesson-packs.json');
  await page.click('#retryLesson'); await ready(page, 'Hello');
  await page.evaluate(() => {
    Object.defineProperty(window, 'speechSynthesis', {value: {cancel() {}, speak() {throw new Error('no device voice');}}});
  });
  await page.click('#speak');
  assert.notEqual(await page.textContent('#feedback'), '');
  assert.equal(await page.locator('.choice').count(), 3);
  pass('missing manifest recovers; unavailable speech does not prevent written lessons');
  assert.deepEqual(errors, [], 'uncaught browser errors');
  console.log(groups + ' browser groups passed; no uncaught page errors. Speech was stubbed.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
});
