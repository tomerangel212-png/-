"use strict";

const fs = require("fs");
const failures = [];
const requiredFiles = [
  "index.html","games.html","games.js","games-hub.js","conversation-questions.js",
  "hitster.html","hitster-888.html","hitster-888-en.html","hitster-kfar-bloom-2026-demo.html","hitster-tra-tokens.html",
  "hitster-kfar-bloom-2026-demo.js","hitster-hebrew-alist-888.json","hitster-888-check.js",
  "casino-angel.html","connect-talk.html","music-drive.html","music-editor.html","links/index.html",
  "links.html","tree.html","linktree.html","tomer-links.html","tra-dashboard/index.html","app.js","styles.css","manifest.webmanifest","sw.js",
];
const read = file => fs.readFileSync(file, "utf8");

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`missing required production file: ${file}`);
  else if (fs.statSync(file).size === 0) failures.push(`empty production file: ${file}`);
}

const htmlFiles = requiredFiles.filter(file => file.endsWith(".html"));
for (const file of htmlFiles) {
  if (!fs.existsSync(file)) continue;
  const source = read(file);
  if (!/<html[\s>]/i.test(source)) failures.push(`${file}: missing <html>`);
  if (!/<title>[^<]+<\/title>/i.test(source)) failures.push(`${file}: missing non-empty <title>`);
  if (!/<meta[^>]+name=["']viewport["']/i.test(source)) failures.push(`${file}: missing viewport meta`);
}

if (fs.existsSync("index.html")) {
  const home = read("index.html");
  if (!home.includes("כל 16 המשחקים")) failures.push("index.html: homepage must advertise all 16 games");
  if (/כל 15 המשחקים|15 משחקים\./.test(home)) failures.push("index.html: stale 15-game copy remains");
}

if (fs.existsSync("hitster.html")) {
  const hub = read("hitster.html");
  for (const route of ['href="hitster-888.html"','href="hitster-888-en.html"','href="hitster-kfar-bloom-2026-demo.html"']) if (!hub.includes(route)) failures.push(`hitster.html: missing route ${route}`);
  if (!hub.includes("888 קלפי שירים")) failures.push("hitster.html: canonical 888-card copy missing");
  if (/57 כרטיס|1,000 כרטיס|350 הקלפים|444 קלפי/.test(hub)) failures.push("hitster.html: stale non-888 count remains");
  if (hub.includes("חזרה לכל 15 משחקי TRA")) failures.push("hitster.html: stale 15-game navigation remains");
  if (!hub.includes("ממיכאל ועד סבתא אסתל")) failures.push("hitster.html: intergenerational internal-playback principle missing");
}

if (fs.existsSync("hitster-888.html")) {
  const full = read("hitster-888.html");
  if (!full.includes("888 קלפי שירים") || !full.includes("מיקום סודי על ציר 80 השנים")) failures.push("hitster-888.html: 888-card hidden-range copy missing");
  if (!full.includes(".era-grid{display:none}") || !full.includes('id="mode" aria-label="מצב בחירה" autocomplete="off" hidden')) failures.push("hitster-888.html: year-range controls must be hidden");
  if (full.includes("שנות ה־80 · שנות ה־90") || full.includes("2010–2020.</p>")) failures.push("hitster-888.html: playable year range leaked before reveal");
  if (!/id=["']audio["'][^>]*preload=["']metadata["']/i.test(full)) failures.push("hitster-888: audio should preload metadata for mobile playback");
  if (!/id=["']audio["'][^>]*playsinline/i.test(full)) failures.push("hitster-888: audio should use playsinline for iOS compatibility");
  if (!full.includes('id="new-game"')) failures.push("hitster-888: New Game control missing");
}

if (fs.existsSync("hitster-888-en.html")) {
  const english = read("hitster-888-en.html");
  if (!english.includes('<html lang="en" dir="ltr">')) failures.push("hitster English: language/direction missing");
  if (!english.includes("888 verified Hebrew A-list song cards")) failures.push("hitster English: verified 888 identity missing");
  if (!english.includes('src="hitster-kfar-bloom-2026-demo.js')) failures.push("hitster English: shared 888 runtime missing");
  if (!/id=["']audio["'][^>]*preload=["']metadata["']/i.test(english) || !/id=["']audio["'][^>]*playsinline/i.test(english)) failures.push("hitster English: mobile audio element incomplete");
  if (/open\.spotify\.com|youtube\.com|spotify-frame/i.test(english)) failures.push("hitster English: external-app dependency reintroduced");
}

if (fs.existsSync("hitster-kfar-bloom-2026-demo.html")) {
  const kfar = read("hitster-kfar-bloom-2026-demo.html");
  if (!kfar.includes('location.replace("hitster-888.html?entry=kfar-bloom")') || !kfar.includes("HITSTER 888")) failures.push("hitster Kfar Blum: route must resolve to canonical 888");
}
if (fs.existsSync("hitster-tra-tokens.html")) {
  const legacy = read("hitster-tra-tokens.html");
  if (!legacy.includes('location.replace("hitster-888-en.html?entry=international")') || !legacy.includes("888 cards, exactly")) failures.push("legacy international HITSTER: route must resolve to English 888");
}

if (fs.existsSync("hitster-kfar-bloom-2026-demo.js")) {
  const fullJs = read("hitster-kfar-bloom-2026-demo.js");
  if (!fullJs.includes("prepareAudio(state.current.preview)")) failures.push("hitster-888 runtime: preview audio is not prepared before play tap");
  if (!fullJs.includes("function verifyPreview") || !fullJs.includes("resolvePlayablePreview") || !fullJs.includes("const pick = state.nextPick;") || fullJs.includes("state.nextPick || nextRandomPick()") || !fullJs.includes("handleAudioEnded")) failures.push("hitster-888 runtime: a card may not be drawn before its internal audio is verified");
  if (!/error\?\.name\s*===\s*["']NotAllowedError["']/.test(fullJs)) failures.push("hitster-888 runtime: blocked-playback recovery missing");
  if (!fullJs.includes("findPlayablePick") || !fullJs.includes("קטע השמע אינו זמין כרגע") || !fullJs.includes("↻ נסו אודיו")) failures.push("hitster-888 runtime: internal audio recovery missing");
  if (/providerUrls\(|showFallbacks\(|hitster_audio_provider_opened/.test(fullJs)) failures.push("hitster-888 runtime: external provider fallback reintroduced");
}

if (fs.existsSync("games.html")) {
  const games = read("games.html");
  if (!games.includes('href="hitster.html"')) failures.push("games.html: HITSTER must route through hitster.html hub");
  if (!games.includes('href="music-editor.html"')) failures.push("games.html: music editor game route missing");
  if (!games.includes('data-game-number="16"')) failures.push("games.html: game 16 missing");
  if (!games.includes('<script src="conversation-questions.js"></script>')) failures.push("games.html: shared conversation question bank is not loaded");
  if (!games.includes("TRA Station · 999")) failures.push("games.html: TRA Station 999 missing");
}

if (fs.existsSync("connect-talk.html")) {
  const connect = read("connect-talk.html");
  if (!connect.includes('<script src="conversation-questions.js"></script>')) failures.push("connect-talk.html: shared conversation question bank is not loaded");
  if (!connect.includes("TRA GAMES · משחק 11")) failures.push("connect-talk.html: wrong game number");
}

if (fs.existsSync("links/index.html")) {
  const links = read("links/index.html");
  if (!links.includes('rel="canonical" href="https://tomerangel212-png.github.io/-/links/"')) failures.push("links/index.html: canonical final tree URL missing");
  for (const route of ['href="../music-drive.html"','href="../music-editor.html"','href="../hitster-888.html"']) if (!links.includes(route)) failures.push(`links/index.html: missing route ${route}`);
  if (!links.includes("מאיזה מכשיר נכנסת?") || !links.includes('data-device="mobile"') || !links.includes('data-device="desktop"')) failures.push("links/index.html: device selection opening screen missing");
  if (!links.includes("mode-mobile") || !links.includes("mode-desktop") || !links.includes("tra-device-view")) failures.push("links/index.html: device-specific persisted layout missing");
  if (!links.includes("URLSearchParams") || !links.includes("params.get('view')")) failures.push("links/index.html: shareable ?view mode missing");
  for (const alias of ["links.html","tree.html","linktree.html","tomer-links.html"]) {
    const source = read(alias);
    if (!source.includes("url=./links/") || !source.includes('href="https://tomerangel212-png.github.io/-/links/"')) failures.push(`${alias}: does not redirect to canonical final tree`);
  }
}

if (failures.length) {
  console.error("TRA production smoke check FAILED:\n");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`TRA production smoke check PASSED: ${requiredFiles.length}/${requiredFiles.length} required files present and non-empty.`);
console.log(`HTML baseline PASSED: ${htmlFiles.length}/${htmlFiles.length} pages have html/title/viewport.`);
console.log("TRA Games canonical release: 16 games · shared conversation bank · PASS");
console.log("HITSTER release: one verified 888 deck · Hebrew + English + Kfar Blum routes · internal playback · PASS");
console.log("TRA Station 999 route present · PASS");
