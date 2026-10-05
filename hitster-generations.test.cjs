const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('./hitster-generations-core.js');
const fixture = () => core.groups.flatMap((group, i) => [0, 1, 2].map(n => ({ id: group + n, group, title: 'שיר ' + i + n, artist: 'אמן ' + i, year: 2000 + i })));
test('arithmetic series: 4–20 groups, ten participants per group', () => {
  assert.deepEqual(Array.from({ length: 17 }, (_, i) => core.participantTotal(i + 4)), Array.from({ length: 17 }, (_, i) => 40 + i * 10));
  for (const invalid of [3, 21, 4.5, NaN]) assert.throws(() => core.participantTotal(invalid));
});
test('age-group counts must sum to total; no inferred age distribution', () => {
  assert.deepEqual(core.participantPlan(20, [40, 100, 60]), { groupCount: 20, perGroup: 10, total: 200, counts: [40, 100, 60] });
  for (const counts of [[40, 100, 59], [0, 100, 100], [40.5, 100, 59.5], []]) assert.throws(() => core.participantPlan(20, counts));
});
test('three stages advance in order, equal turns even after wrong answers, no repeats', () => {
  const songs = fixture(), state = core.create(songs, 3), ids = [];
  for (let i = 0; i < 9; i++) {
    const song = songs.find(item => item.id === state.queue[state.index]);
    assert.equal(core.stage(state), Math.floor(i / 3)); ids.push(song.id);
    assert.equal(core.answer(state, song, song.group, i % 2 ? 'wrong' : song.title, song.artist), !(i % 2));
    core.reveal(state); core.next(state);
  }
  assert.ok(core.done(state)); assert.equal(new Set(ids).size, 9); assert.deepEqual(state.scores, [2, 1, 2]);
});
test('wrong respondent group rejected without consuming attempt or score', () => {
  const songs = fixture(), state = core.create(songs, 1), before = JSON.stringify(state);
  assert.throws(() => core.answer(state, songs[0], 'adults', songs[0].title, songs[0].artist), /רק ילדים/);
  assert.equal(JSON.stringify(state), before);
});
test('reveal and repeated submissions cannot earn points', () => {
  const songs = fixture(), state = core.create(songs, 1);
  core.answer(state, songs[0], 'children', songs[0].title, songs[0].artist);
  assert.throws(() => core.answer(state, songs[0], 'children', songs[0].title, songs[0].artist));
  core.reveal(state); core.next(state); core.reveal(state);
  assert.throws(() => core.answer(state, songs[3], 'adults', songs[3].title, songs[3].artist));
  assert.deepEqual(state.scores, [1, 0, 0]);
});
test('cannot bypass a stage, skip hidden solution or repeat finished stage', () => {
  const state = core.create(fixture(), 1);
  assert.throws(() => core.next(state));
  for (let i = 0; i < 3; i++) { core.reveal(state); core.next(state); }
  assert.throws(() => core.next(state));
});
test('deck requires sufficient songs per group, no duplicates or excluded artists', () => {
  assert.throws(() => core.create(fixture().filter(song => song.group !== 'children'), 1));
  assert.throws(() => core.create(fixture(), 0));
  const songs = fixture(); songs[3].title = songs[0].title; songs[3].artist = songs[0].artist;
  assert.throws(() => core.create(songs, 1), /פעם אחת/);
  const blocked = fixture(); blocked[0].artist = 'Michael Jackson';
  assert.throws(() => core.create(blocked, 1), /מוחרג/);
});
test('restore retains stage, score and revealed state; malformed ordering rejected', () => {
  const songs = fixture(), state = core.create(songs, 1);
  core.reveal(state); core.next(state); core.reveal(state);
  const restored = core.restore(JSON.parse(JSON.stringify(state)), songs);
  assert.equal(core.stage(restored), 1); assert.equal(restored.revealed, true);
  restored.queue.reverse(); assert.throws(() => core.restore(restored, songs));
});
test('Hebrew niqqud and punctuation normalize without losing letters', () => {
  assert.equal(core.norm('שָׁלוֹם!'), core.norm('שלום'));
  assert.notEqual(core.norm('שלום'), core.norm('שיר'));
});
test('DOM integration: setup, group gate, score, stage sequence, reload and isolated saves', async () => {
  const prefix = process.env.TRA_CHESS_TEST_PREFIX || '/tmp/anti-chess-test';
  const { JSDOM } = require(path.join(prefix, 'node_modules/jsdom'));
  const { indexedDB } = require(path.join(prefix, 'node_modules/fake-indexeddb'));
  const html = fs.readFileSync(path.join(__dirname, 'hitster-generations.html'), 'utf8');
  function open() {
    const dom = new JSDOM(html, { url: 'https://test.invalid/hitster-generations.html', runScripts: 'outside-only' });
    const w = dom.window;
    w.indexedDB = indexedDB; w.Blob = Blob; w.confirm = () => true;
    w.URL.createObjectURL = () => 'blob:test'; w.URL.revokeObjectURL = () => {};
    w.HTMLMediaElement.prototype.load = function () {};
    w.HTMLMediaElement.prototype.pause = function () {};
    w.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
    w.localStorage.setItem('hitster-tra-annual-888-v1', 'untouched');
    for (const name of ['hitster-generations-core.js', 'hitster-generations.js']) w.eval(fs.readFileSync(path.join(__dirname, name), 'utf8'));
    return dom;
  }
  async function until(predicate) { for (let i = 0; i < 200; i++) { if (predicate()) return; await new Promise(resolve => setTimeout(resolve, 5)); } throw Error('DOM condition timed out'); }
  const dom = open(), w = dom.window, $ = id => w.document.getElementById(id);
  const submit = id => $(id).dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  await until(() => !$('setup').hidden);
  assert.match(w.document.title, /תומר מתמטיקה/);
  assert.equal($('participant-series').children.length, 17);
  $('group-count').value = '20'; $('group-count').dispatchEvent(new w.Event('input'));
  assert.match($('participant-total').textContent, /200/);
  $('quota').value = '1'; $('quota').dispatchEvent(new w.Event('change'));
  for (let i = 0; i < 3; i++) {
    $('song-group').value = core.groups[i]; $('song-title').value = 'שיר ' + i; $('song-artist').value = 'אמן ' + i; $('song-year').value = '2000';
    Object.defineProperty($('song-audio'), 'files', { configurable: true, value: [new Blob(['fake-audio-for-test'], { type: 'audio/wav' })] });
    submit('song-form'); await until(() => $('songs').children.length === i + 1);
  }
  assert.equal($('start').disabled, true, 'Unspecified age counts must not be invented');
  [40, 100, 59].forEach((count, i) => { $('count-' + core.groups[i]).value = count; });
  $('count-seniors').dispatchEvent(new w.Event('input'));
  assert.equal($('start').disabled, true, '199 is not 200');
  $('count-seniors').value = '60'; $('count-seniors').dispatchEvent(new w.Event('input'));
  assert.equal($('start').disabled, false); $('start').click(); await until(() => !$('game').hidden);
  assert.match($('participant-summary').textContent, /40 רשאים/);
  $('respondent').value = 'adults'; $('respondent').dispatchEvent(new w.Event('change'));
  assert.equal($('submit-answer').disabled, true);
  $('respondent').value = 'children'; $('respondent').dispatchEvent(new w.Event('change'));
  $('answer-title').value = 'שיר 0'; $('answer-artist').value = 'אמן 0'; submit('answer-form');
  await until(() => $('submit-answer').disabled); $('reveal').click(); await until(() => !$('next').disabled);
  $('next').click(); await until(() => $('stage-title').textContent.includes('מבוגרים'));
  assert.equal($('respondent').value, ''); assert.equal($('submit-answer').disabled, true);
  const resumed = open(), r = id => resumed.window.document.getElementById(id);
  await until(() => !r('game').hidden); assert.match(r('stage-title').textContent, /מבוגרים/);
  assert.match(r('participant-summary').textContent, /20 קבוצות · 200 משתתפים בסך הכול · 100 רשאים/);
  dom.window.close();
  r('reveal').click(); await until(() => !r('next').disabled); r('next').click();
  await until(() => r('stage-title').textContent.includes('הגיל השלישי'));
  r('reveal').click(); await until(() => !r('next').disabled); r('next').click();
  await until(() => !r('summary').hidden); assert.match(r('scores').textContent, /ילדים: 1 מתוך 1/);
  assert.equal(resumed.window.localStorage.getItem('hitster-tra-annual-888-v1'), 'untouched');
  resumed.window.close();
});
