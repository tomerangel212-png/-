"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("tra-audio-runtime.js", "utf8");
function runtime(fetch, controller = AbortController) {
  const events = [];
  const context = { window: { dispatchEvent: e => events.push(e) }, location: { pathname: "/test", hostname: "localhost" }, CustomEvent: class { constructor(name, data) { Object.assign(this, data); } }, fetch, AbortController: controller, setTimeout, clearTimeout };
  vm.runInNewContext(source, context);
  return { ...context.window.TRAAudio, events };
}
(async () => {
  let signal;
  const stalled = runtime(async (url, options) => { signal = options.signal; return { ok: true, json: () => new Promise(() => {}) }; });
  await assert.rejects(stalled.json("/stalled-body", {}, 20), { name: "TimeoutError" });
  assert.equal(signal.aborted, true, "deadline includes body consumption and aborts fetch");
  const legacy = runtime(() => new Promise(() => {}), null);
  await assert.rejects(legacy.json("/no-controller", {}, 20), { name: "TimeoutError" });
  const good = runtime(async () => ({ ok: true, json: async () => ({ results: [1] }) }));
  assert.equal((await good.json("/ok", {}, 100)).results[0], 1);
  for (const duration of [NaN, Infinity, -1, 0, 28.9]) assert.equal(good.durationIsValid({ duration }), false);
  for (const duration of [29, 29.977, 30.019]) assert.equal(good.durationIsValid({ duration }), true);
  let cancelled = 0;
  await good.bounded(() => Promise.resolve(true), 20, () => cancelled++);
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(cancelled, 0, "successful operations remove their deadline");
  await assert.rejects(good.bounded(() => new Promise(() => {}), 20, () => cancelled++), { name: "TimeoutError" });
  assert.equal(cancelled, 1);
  good.capture("song_preview_prepare_failed", { reason: "test" });
  assert.equal(good.events[0].detail.properties.reason, "test", "diagnostics work without analytics SDK");
  const handlers = {};
  const deleted = [];
  const worker = { self: { addEventListener: (name, handler) => handlers[name] = handler, location: { origin: "https://example.test" }, registration: { scope: "https://example.test/app/" }, clients: { claim: async () => {} } }, caches: { keys: async () => ["tra-old", "hitster-tra-preview-audio-v1", "hitster-tra-preview-audio-v2"], delete: async key => deleted.push(key), open: async () => ({ match: async key => String(key).endsWith("hitster-original.js") ? "current-runtime" : null }) }, URL };
  vm.createContext(worker); vm.runInContext(fs.readFileSync("sw.js", "utf8"), worker);
  let activation;
  handlers.activate({ waitUntil: value => activation = value }); await activation;
  assert.deepEqual(deleted, ["tra-old"], "upgrades preserve both audio caches");
  assert.equal(await worker.matchStatic({ url: "https://example.test/app/hitster-original.js?v=new" }), "current-runtime", "unvisited version query works offline");
  const manifest = JSON.parse(fs.readFileSync("hitster-preview-manifest.json", "utf8"));
  const ids = new Set(JSON.parse(fs.readFileSync("hitster-alltime-888.json", "utf8")).cards.map(card => card.id));
  for (const [id, preview] of Object.entries(manifest.previews)) {
    assert.ok(ids.has(id), "manifest only references existing cards");
    assert.match(preview.url, /^https:\/\/audio-ssl\.itunes\.apple\.com\//);
    assert.ok(preview.trackId && preview.title && preview.artist);
  }
  console.log("Audio behavior OK: body deadlines, abort fallback, finite duration, diagnostics, offline query and audio cache preservation.");
})().catch(error => { console.error(error); process.exit(1); });
