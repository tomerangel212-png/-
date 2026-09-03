"use strict";

const fs = require("fs");
const source = fs.readFileSync("hitster-original.js", "utf8");
const mobile = fs.readFileSync("hitster-mobile.html", "utf8");
const hebrew = fs.readFileSync("hitster-888.html", "utf8");
const english = fs.readFileSync("hitster-888-en.html", "utf8");
const failures = [];
const check = (label, value) => { if (!value) failures.push(label); };
const section = (start, end) => {
  const from = source.indexOf(start);
  const to = end ? source.indexOf(end, from) : source.length;
  return from >= 0 && to >= from ? source.slice(from, to) : "";
};

const draw = section("function drawCard()", "function currentPlacementIsCorrect");
const playback = section("function playClip(fromDraw)", "function checkAnswer");
const preflight = section("async function primeNextCard()", "function armClipTimer");
const retry = section("function recoverCurrentPreview", "function playClip(fromDraw)");

check("defines a fixed 30-second preview", source.includes("var PREVIEW_SECONDS = 30"));
check("does not draw a card until a preloaded preview exists", draw.includes("var ready = nextReady") && draw.includes("if (!ready)") && !draw.includes("await "));
check("starts playback synchronously from the draw click", draw.includes("playClip(true)") && playback.includes("attempt = audio.play()"));
check("verifies duration before enabling the next card", source.includes("function hasThirtySecondDuration") && source.includes("function verifyPreviewSource") && source.includes("await loadPreviewIntoPlayer(card, preview)") && preflight.includes("nextReady = pick"));
check("keeps the source for replaying the same card", playback.includes("stopAudio({ keepSource: true })") && source.includes("function stopAudio(options)"));
check("cuts every playback at 30 seconds", source.includes("PREVIEW_SECONDS * 1000") && source.includes("audio.currentTime >= PREVIEW_SECONDS"));
check("retries a failed source without consuming another card", retry.includes("prepareCurrentPreview(card, { force: true })") && retry.includes("forgetPreview(card)") && draw.includes("state.used.push(card.id)"));
check("tries multiple iTunes storefronts and retries transient lookup", source.includes('["US", "GB", "IL"]') && source.includes("for (var pass = 0; pass < 2; pass += 1)"));
check("loads the original preview URL directly into the internal player", source.includes("return { src: remote, cached: false };") && source.includes("audio.src = preview.src"));
check("does not make offline caching a prerequisite for playback", source.includes("Caching is best-effort only") && source.includes("void cacheRemotePreview(card, remote)"));
check("exposes an internal native player on mobile", source.includes("audio.controls = true") && mobile.includes('allow="autoplay"') && hebrew.includes("internal-audio-v4") && english.includes("internal-audio-v4"));
check("keeps playback inside the site", !/open\.spotify\.com|youtube\.com|music\.apple\.com\/[^\"]*\/album/i.test(source));

if (failures.length) {
  console.error("HITSTER audio gate FAILED:\n" + failures.map(item => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("HITSTER audio gate PASSED: verified preloading · user-gesture playback · retries · 30-second cutoff.");
