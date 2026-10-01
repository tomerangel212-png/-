"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("hitster-original.js", "utf8");
function section(start, end) { return source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start))); }
(async () => {
  const cards = Array.from({length: 60}, (_, i) => ({id: "song-" + i}));
  const used = new Set();
  const attempted = [];
  const manifest = Object.fromEntries(cards.map(c => [c.id, {url:"https://audio.test/" + c.id}]));
  const context = {
    previewMemo: {}, previewManifest: manifest, previewFailures: {}, previewGeneration: 1,
    state: {current:null}, MAX_PREVIEW_CANDIDATES:8, Date,
    unusedCards: () => cards.filter(c => !used.has(c.id)), shuffle:a=>a,
    isGameLocked:()=>false, deleteCachedPreview:async()=>{}, releasePreview:()=>{}, track:()=>{},
    resolvePlayablePreview:async c=>({src:manifest[c.id].url}),
    loadPreviewIntoPlayer:async c=>{ attempted.push(c.id); if(Number(c.id.split("-")[1])<8) throw new Error("temporary failure"); }
  };
  vm.createContext(context);
  vm.runInContext(section("  function forgetPreview(", "  async function primeNextCard("), context);
  assert.equal(await context.findAndLoadNextCard(1), null);
  assert.equal(used.size, 0, "failed preparation must not consume cards");
  assert.equal(Object.keys(manifest).length, 60, "transient errors must preserve known audio URLs");
  let pick = await context.findAndLoadNextCard(1);
  assert.equal(pick.card.id, "song-8", "next batch advances beyond failed eight candidates");
  used.add(pick.card.id);
  for(let turn=1; turn<35; turn++){
    pick=await context.findAndLoadNextCard(1);
    assert.ok(pick, "round "+(turn+1)+" must prepare a new card");
    assert.ok(!used.has(pick.card.id)); used.add(pick.card.id);
  }
  assert.equal(used.size,35, "no six-round or thirty-card limit");
  context.previewGeneration=2;
  assert.equal(await context.findAndLoadNextCard(1),null,"cancelled generation cannot prepare cards");

  let scheduled = [];
  let attempts = 0;
  const retry = {
    state:{current:null}, nextReady:null, nextReadyPromise:null, nextPreparationRetry:null,
    preparationRetries:0, previewGeneration:1, playerLoadGeneration:1, preparationToken:0,
    preparing:false, language:"he", PREPARATION_BUDGET_MS:25,
    t:{preparing:"preparing",noMore:"noMore",audioReady:"ready"},
    window:{TRAAudio:{bounded:async f=>f()}},
    unusedCards:()=>[{}], isGameLocked:()=>false, render:()=>{}, setStatus:()=>{},
    findAndLoadNextCard:async()=>{attempts++;return null;}, releasePreview:()=>{},
    clearPlayerSource:()=>{}, completeRequestedPlayback:()=>{}, track:()=>{},
    setTimeout:f=>{ const id={f}; scheduled.push(id);return id; },
    clearTimeout:id=>{scheduled=scheduled.filter(x=>x!==id);}
  };
  vm.createContext(retry);
  vm.runInContext(section("  async function primeNextCard(", "  function armClipTimer("),retry);
  vm.runInContext(section("  function clearNextReady(", "  function currentCard("),retry);
  await retry.primeNextCard();
  for(let i=0;i<3;i++){assert.equal(scheduled.length,1); scheduled.shift().f();await new Promise(resolve=>setImmediate(resolve));}
  assert.equal(attempts,4,"one initial batch plus three automatic recovery batches");
  assert.equal(scheduled.length,0,"recovery must remain bounded");
  await retry.primeNextCard(); assert.equal(scheduled.length,1);
  retry.clearNextReady(); assert.equal(scheduled.length,0,"reset cancels pending retry");
  console.log("HITSTER recovery OK: transient sources retained, candidate rotation, 35 distinct rounds, bounded retry and reset.");
})().catch(e=>{console.error(e);process.exit(1);});


// Run gesture/metadata race regressions in the existing deployment gate.
require("./hitster-activation-check.js");
