'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const root = process.cwd();
const mime = {'.html':'text/html; charset=utf-8', '.js':'application/javascript', '.json':'application/json'};
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (error, data) => {
    res.writeHead(error ? 404 : 200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream'});
    res.end(error ? 'missing' : data);
  });
});
// A generated PCM tone tests real media decoding/progression, not provider availability or physical audibility.
function tone() {
  const samples = 8000 * 8, wav = Buffer.alloc(44 + samples * 2);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) wav.writeInt16LE(Math.round(2000 * Math.sin(2 * Math.PI * 440 * i / 8000)), 44 + i * 2);
  return wav;
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage({viewport:{width:390, height:844}});
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:' + server.address().port + '/history-and-music-catalog.html');
    await page.waitForSelector('#artist-results article');
    await page.waitForSelector('#music-results article');
    assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
    assert.equal(await page.locator('#artist-results h4').textContent(), 'רועי כפרי');
    assert.equal(await page.locator('#artist-results a').count(), 2);
    assert.equal(await page.locator('#artist-results a').first().getAttribute('href'), 'https://roykafri.com/portfolio/chords/');
    assert.equal(await page.locator('#artist-results a').nth(1).getAttribute('href'), JSON.parse(fs.readFileSync('tra-artists.json', 'utf8')).artists[0].sources[1].url);
    assert.equal(await page.locator('#music-results article').count(), 24);
    const artist = await page.locator('#artist option').nth(1).getAttribute('value');
    await page.locator('#artist').selectOption(artist);
    assert.ok((await page.locator('#music-results h3').allTextContents()).every(value => value === artist));
    await page.locator('#reset-filters').click();
    assert.equal(await page.locator('#music-results article').count(), 24);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Mobile overflow');
    await page.locator('#artist-results').screenshot({path:'history-and-music-artist-mobile.png'});
    await page.locator('#local-file').setInputFiles({name:'validation-tone.wav', mimeType:'audio/wav', buffer:tone()});
    await page.waitForFunction(() => document.querySelector('#local-audio').readyState >= 2);
    await page.evaluate(() => {
      const button = document.createElement('button'); button.id = 'validation-play'; button.textContent = 'Play test';
      button.onclick = () => document.querySelector('#local-audio').play(); document.body.append(button);
    });
    await page.locator('#validation-play').click();
    await page.waitForFunction(() => document.querySelector('#local-audio').currentTime > 0.2);
    assert.equal(await page.locator('#local-audio').evaluate(audio => audio.paused), false);
    await page.locator('#open-player').click();
    assert.equal(await page.locator('#local-audio').evaluate(audio => audio.paused), true, 'Embedded player must pause local media');
    assert.equal(await page.locator('#player-host iframe').getAttribute('src'), 'hitster-mobile.html');
    await page.locator('#local-file').setInputFiles({name:'second-tone.wav', mimeType:'audio/wav', buffer:tone()});
    assert.equal(await page.locator('#player-host iframe').count(), 0, 'Local media must remove embedded player');
    await page.waitForFunction(() => document.querySelector('#local-audio').readyState >= 2);
    await page.locator('#validation-play').click();
    await page.waitForFunction(() => document.querySelector('#local-audio').currentTime > 0.2);
    await page.locator('#local-audio').evaluate(audio => audio.pause());
    await page.locator('#validation-play').evaluate(button => button.remove());
    await page.setViewportSize({width:1280, height:900});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Desktop overflow');
    assert.deepEqual(errors, []);
    console.log('PASS Roy Kafri card and source links, RTL/mobile/desktop layout, existing filters, real PCM decoding/playback progression, and player isolation. Physical-device audibility and provider previews are not asserted.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
