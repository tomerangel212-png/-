"use strict";
// Behavioral tests with strict gesture-only media; real device audibility remains manual.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const engine = fs.readFileSync("hitster-original.js", "utf8");
const deck = JSON.parse(fs.readFileSync("hitster-alltime-888.json", "utf8"));
const settle = async () => { for (let i = 0; i < 35; i++) await new Promise(setImmediate); };
async function harness({ offline = false, cacheIds = [], lookupMissing = false, language = "he", personalConfig = null, savedState = null, generations = false } = {}) {
  const nodes = new Map(), stores = new Map(), mediaCache = new Map(), timers = new Map();
  let gesture = false, timerId = 0, playCalls = 0, networkCalls = 0, rejectPlay = false, deferLookup = null;
  class Element {
    constructor(tag = "div") { this.tagName = tag; this.children = []; this.attrs = {}; this.events = {}; this.hidden = false; this.paused = true; this.currentTime = 0; this.duration = 60; this.value = "0"; this.dataset = {}; this.parentNode = {}; }
    set id(value) { this._id = value; nodes.set(value, this); }
    get id() { return this._id; }
    get firstChild() { return this.children[0]; }
    get options() { return this.children; }
    set src(value) { this.attrs.src = value; }
    get src() { return this.attrs.src || ""; }
    setAttribute(k, v) { this.attrs[k] = v; }
    getAttribute(k) { return this.attrs[k] || null; }
    removeAttribute(k) { delete this.attrs[k]; }
    appendChild(child) { this.children.push(child); return child; }
    append(...children) { this.children.push(...children); }
    removeChild(child) { this.children.splice(this.children.indexOf(child), 1); }
    insertAdjacentElement(_, node) { this.children.push(node); }
    focus() {}
    addEventListener(event, fn) { (this.events[event] ||= []).push(fn); }
    emit(event) { for (const fn of this.events[event] || []) fn({ target: this, preventDefault() {} }); }
    pause() { this.paused = true; this.emit("pause"); }
    load() { this.paused = true; }
    play() {
      playCalls++;
      if (!gesture || rejectPlay) return Promise.reject(Object.assign(new Error("Gesture required"), { name: "NotAllowedError" }));
      assert.ok(this.src, "Source must exist before the tap");
      this.paused = false; this.emit("playing"); return Promise.resolve();
    }
  }
  if (savedState) stores.set(generations ? "hitster-tra-generations-v1" : personalConfig ? "hitster-tra-personal-game-v1" : "hitster-tra-annual-888-v1", JSON.stringify(savedState));
  const html = fs.readFileSync("hitster-888.html", "utf8");
  for (const match of html.matchAll(/id="([^"]+)"/g)) { const node = new Element(); node.id = match[1]; }
  const document = { documentElement: { lang: language }, head: new Element(), getElementById: id => nodes.get(id), createElement: tag => new Element(tag) };
  const location = { search: generations ? "?mode=generations" : "", href: "https://hitster.test/hitster-888.html" };
  for (const id of cacheIds) mediaCache.set(new URL("./__hitster_preview_cache__/" + id, location.href).href, new Response("audio", { headers: { "content-type": "audio/mp4" } }));
  const cache = { keys: async () => [...mediaCache.keys()].map(url => new Request(url)), match: async req => mediaCache.get(req.url)?.clone(), delete: async req => mediaCache.delete(req.url), put: async (req, response) => mediaCache.set(req.url, response.clone()) };
  const alerts = [];
  const window = { TRA_PERSONAL_CONFIG: personalConfig, alert: message => alerts.push(message), location, caches: {}, addEventListener() {}, confirm: () => true, setTimeout: (fn, ms) => { timers.set(++timerId, { fn, ms }); return timerId; }, clearTimeout: id => timers.delete(id) };
  const context = { document, window, navigator: { onLine: !offline }, localStorage: { getItem: k => stores.get(k) || null, setItem: (k, v) => stores.set(k, v) }, caches: { open: async () => cache }, URL, Request, AbortController, console, setTimeout: window.setTimeout, clearTimeout: window.clearTimeout, setInterval: () => ++timerId, clearInterval() {}, fetch: async url => {
    if (url === "./hitster-alltime-888.json") return new Response(JSON.stringify(deck));
    networkCalls++;
    if (deferLookup) await deferLookup;
    if (String(url).includes("itunes.apple.com")) {
      const term = new URL(url).searchParams.get("term");
      const card = deck.cards.concat(window.TRA_GENERATIONS_CONFIG?.children || []).find(c => c.title + " " + c.artist === term);
      return new Response(JSON.stringify({ results: lookupMissing ? [] : [{ trackName: card.title, artistName: card.artist, previewUrl: "https://media.test/" + card.id }] }));
    }
    return new Response("audio", { headers: { "content-type": "audio/mp4" } });
  } };
  vm.createContext(context);
  if (generations) vm.runInContext(fs.readFileSync("hitster-generations.js", "utf8"), context);
  const exposed = engine.replace('  loadDeck().catch(function () {', '  window.test = { state: () => state, staged: () => nextAudioCard, reset: resetGame, prepare: prepareNextAudio, finish: finishCurrent, add: addToTimeline, wrong: endWrongTurn, free: freeCard, sanitize: sanitizeState, render: render, remove: removeTimelineCard, resetTimeline: resetTimeline, name: teamName };\n  loadDeck().catch(function () {');
  vm.runInContext(exposed, context);
  await settle();
  return { nodes, timers, window, cache, alerts, stores, state: () => window.test.state(), click(id) { gesture = true; nodes.get(id).emit("click"); gesture = false; }, calls: () => ({ playCalls, networkCalls }), block: value => rejectPlay = value, defer: promise => deferLookup = promise };
}
module.exports = { harness, settle, deck };
if (require.main === module) (async () => {
  const h = await harness();
  const audio = h.nodes.get("audio");
  assert.ok(h.window.test.staged());
  assert.equal(h.state().used.length, 0, "Prefetch must not consume a card");
  h.click("continue-game");
  assert.equal(h.nodes.get("start-screen").hidden, true);
  assert.equal(h.nodes.get("reset-from-start").disabled, false);
  h.click("play-clip");
  assert.equal(h.calls().playCalls, 1, "First tap must call play synchronously");
  await settle();
  const firstId = h.state().current;
  assert.equal(audio.paused, false);
  assert.equal(h.state().used.length, 1);
  assert.ok([...h.timers.values()].some(t => t.ms === 30000), "Long media must be bounded to 30s");
  audio.currentTime = 7;
  h.click("play-clip");
  assert.equal(audio.paused, true);
  h.click("play-clip"); await settle();
  assert.equal(audio.currentTime, 7, "Resume must preserve position");
  assert.equal(h.state().used.length, 1, "Replay must not consume another card");
  h.click("stop-clip");
  assert.equal(audio.currentTime, 0);
  assert.equal(audio.paused, true);
  assert.ok(audio.src, "Stop keeps the source ready to replay");
  h.window.test.finish(true); await settle();
  assert.notEqual(h.window.test.staged().id, firstId, "Played songs must never return");
  h.block(true); h.click("play-clip"); await settle();
  assert.equal(h.state().used.length, 1, "Rejected playback must not consume a card");
  h.block(false); h.click("play-clip"); await settle();
  assert.equal(h.state().used.length, 2);
  h.window.test.reset(true); await settle();
  assert.equal(h.state().used.length, 0);
  assert.ok(h.window.test.staged(), "Reset prepares a new clip");
  const offline = await harness({ offline: true, cacheIds: [deck.cards[72].id] });
  offline.click("continue-game"); offline.click("play-clip"); await settle();
  assert.equal(offline.state().current, deck.cards[72].id, "Offline selects only saved audio");
  assert.equal(offline.calls().networkCalls, 0);
  const broken = await harness({ offline: true, cacheIds: [deck.cards[0].id] });
  broken.nodes.get("audio").emit("error"); await settle();
  assert.equal(broken.window.test.staged(), null, "Broken saved audio is removed from the library");
  assert.equal(broken.state().used.length, 0);
  const unavailable = await harness({ lookupMissing: true });
  assert.equal(unavailable.state().used.length, 0);
  assert.equal(unavailable.window.test.staged(), null);
  assert.equal(unavailable.nodes.get("play-clip").disabled, false, "Unavailable audio can be retried");
  const emptyOffline = await harness({ offline: true });
  assert.equal(emptyOffline.window.test.staged(), null);
  assert.equal(emptyOffline.calls().networkCalls, 0);
  console.log("HITSTER audio regression PASSED: one-tap play, pause/resume, stop/replay, 30s cap, no repeats, failed playback, reset, offline cache, unavailable audio.");
})().catch(error => { console.error(error); process.exitCode = 1; });

