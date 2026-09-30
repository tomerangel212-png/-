"use strict";
const fs = require("fs"), assert = require("node:assert/strict"), vm = require("vm");
const deck = JSON.parse(fs.readFileSync("hitster-israeli-annual.json", "utf8"));
const manifest = JSON.parse(fs.readFileSync("hitster-israeli-preview-manifest.json", "utf8"));
const engine = fs.readFileSync("hitster-original.js", "utf8");
const context = { language: "he" };
vm.createContext(context);
for (const [start, end] of [["  function normalize(", "  function createInitialState("], ["  function overlapScore(", "  function fetchWithTimeout("], ["  function catalogTitle(", "  async function lookupPreviewInCountry("]]) {
  const a=engine.indexOf(start),b=engine.indexOf(end,a);
  assert.ok(a>=0 && b>a, `Missing matcher section ${start}`);
  vm.runInContext(engine.slice(a,b),context);
}
const validatorStart=engine.indexOf("  function validateDeck(payload) {"),validatorEnd=engine.indexOf("  async function loadDeck()",validatorStart);
vm.runInContext(engine.slice(validatorStart,validatorEnd),context);
context.validateDeck(deck);
const international=JSON.parse(fs.readFileSync("hitster-alltime-888.json","utf8"));
assert.throws(()=>context.validateDeck(international));
for(const patch of [{title:"Wonderwall"},{chartPublisher:"Billboard"},{id:deck.cards[1].id}]) {
 const invalid=JSON.parse(JSON.stringify(deck));Object.assign(invalid.cards[0],patch);
 assert.throws(()=>context.validateDeck(invalid));
}
context.language="en";context.validateDeck(international);assert.throws(()=>context.validateDeck(deck));context.language="he";
assert.equal(deck.total, 300); assert.equal(deck.cards.length, 300);
assert.deepEqual(deck.range, {from: 2002, to: 2026}); assert.equal(deck.yearBasis,"chart-year");
const ids=new Set(),identities=new Set(),years=new Map();
for(const card of deck.cards) {
  assert.ok(card.id.startsWith(`israel-chart-${card.chartYear}-`));
  assert.ok(!ids.has(card.id)); ids.add(card.id);
  assert.ok(/[א-ת]/.test(card.title) && !/[a-z]/i.test(card.title));
  assert.ok(/[א-ת]/.test(card.artist));
  assert.ok(!/michael jackson|eyal golan|אייל גולן|איל גולן/i.test(card.artist));
  assert.equal(card.chartPublisher,"גלגלצ"); assert.equal(card.yearBasis,"chart-year");
  assert.ok(Number.isInteger(card.chartRank) && card.chartRank>0);
  assert.ok(card.sourceUrl.startsWith("https://he.wikipedia.org/wiki/מצעד_הפזמונים_העברי_השנתי"));
  const identity=context.normalize(card.title)+"|"+context.normalize(card.artist);
  assert.ok(!identities.has(identity),`Duplicate ${identity}`); identities.add(identity);
  years.set(card.chartYear,(years.get(card.chartYear)||0)+1);
  const preview=manifest.previews[card.id]; assert.ok(preview,`Missing preview ${card.id}`);
  assert.equal(new URL(preview.url).hostname,"audio-ssl.itunes.apple.com");
  assert.ok(Number.isInteger(preview.trackId) && preview.trackId>0);
  assert.ok(context.previewTitleMatch(card,preview.title)>=.8,`Title mismatch ${card.id}: ${preview.title}`);
  assert.ok(context.previewArtistMatch(card,preview.artist)>=.5,`Artist mismatch ${card.id}: ${preview.artist}`);
}
for(let y=2002;y<=2026;y++)assert.equal(years.get(y),12,`Year ${y} quota`);
assert.equal(Object.keys(manifest.previews).length,300);
const example=deck.cards.find(c=>c.title==="שלמים");
assert.equal(context.previewArtistMatch(example,"Idan Rafael Haviv"),1);
assert.equal(context.previewArtistMatch(example,"Sarit Hadad"),0);
assert.equal(context.previewTitleMatch(example,"שיר אחר"),0);
assert.ok(engine.includes('STORAGE_KEY = "hitster-tra-israeli-chart-v1"'));
assert.ok(engine.includes('DATA_URL = "./hitster-israeli-annual.json"'));
assert.ok(engine.includes('"./hitster-israeli-preview-manifest.json"'));
const sw=fs.readFileSync("sw.js","utf8");
for(const name of ["hitster-israeli-annual.json","hitster-israeli-preview-manifest.json"]) assert.ok(sw.includes(name));
console.log("Israeli Galgalatz gate PASSED: 300 Hebrew chart cards, 25 equal annual quotas, 300 matching official Apple previews, isolated storage and offline assets.");
