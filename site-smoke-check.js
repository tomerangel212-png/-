"use strict";

const fs = require("fs");

const requiredFiles = [
  "index.html",
  "games.html",
  "games.js",
  "games-hub.js",
  "conversation-questions.js",
  "hitster.html",
  "hitster-kfar-bloom-2026-demo.html",
  "hitster-kfar-bloom-2026-demo.js",
  "hitster-4549-check.js",
  "hitster-888-check.js",
  "casino-angel.html",
  "connect-talk.html",
  "music-drive.html",
  "music-editor.html",
  "links/index.html",
  "tra-dashboard/index.html",
  "app.js",
  "styles.css",
  "manifest.webmanifest",
  "sw.js",
];

const failures = [];
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`missing required production file: ${file}`);
  else if (fs.statSync(file).size === 0) failures.push(`empty production file: ${file}`);
}

const htmlFiles = requiredFiles.filter((file) => file.endsWith(".html"));
for (const file of htmlFiles) {
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, "utf8");
  if (!/<html[\s>]/i.test(source)) failures.push(`${file}: missing <html>`);
  if (!/<title>[^<]+<\/title>/i.test(source)) failures.push(`${file}: missing non-empty <title>`);
  if (!/<meta[^>]+name=["']viewport["']/i.test(source)) failures.push(`${file}: missing viewport meta`);
}

if (fs.existsSync("index.html")) {
  const home = fs.readFileSync("index.html", "utf8");
  if (!home.includes("כל 16 המשחקים")) failures.push("index.html: homepage must advertise all 16 games");
  if (/כל 15 המשחקים|15 משחקים\./.test(home)) failures.push("index.html: stale 15-game copy remains");
}

if (fs.existsSync("hitster.html")) {
  const hub = fs.readFileSync("hitster.html", "utf8");
  if (!hub.includes("ספריית Hezel · 4,549")) failures.push("hitster.html: canonical 4,549-card internal library copy missing");
  if (!hub.includes("0</strong>ספקי סטרימינג")) failures.push("hitster.html: zero-streaming-provider statement missing");
}

if (fs.existsSync("hitster-kfar-bloom-2026-demo.html")) {
  const demo = fs.readFileSync("hitster-kfar-bloom-2026-demo.html", "utf8");
  if (!/id=["']audio["'][^>]*preload=["']metadata["']/i.test(demo)) failures.push("hitster demo: audio should preload metadata for mobile playback");
  if (!/id=["']audio["'][^>]*playsinline/i.test(demo)) failures.push("hitster demo: audio should use playsinline for iOS compatibility");
  if (!demo.includes('id="hezel-file"')) failures.push("hitster demo: Hezel file importer missing");
  if (!demo.includes('id="audio-files"')) failures.push("hitster demo: local audio importer missing");
}

if (fs.existsSync("hitster-kfar-bloom-2026-demo.js")) {
  const demoJs = fs.readFileSync("hitster-kfar-bloom-2026-demo.js", "utf8");
  if (!demoJs.includes("const HEZEL_EXPECTED_TOTAL = 4549")) failures.push("hitster demo: expected 4,549-card gate missing");
  if (!demoJs.includes('readStoredZipEntry(buffer, "backup.json")')) failures.push("hitster demo: direct Hezel backup parser missing");
  if (!demoJs.includes("indexedDB.open(DB_NAME, DB_VERSION)")) failures.push("hitster demo: IndexedDB internal library missing");
  for (const forbidden of ["itunes.apple.com", "open.spotify.com", "youtube.com", "youtu.be", "soundcloud.com", "api.deezer.com"]) {
    if (demoJs.toLowerCase().includes(forbidden)) failures.push(`hitster demo: forbidden external runtime dependency ${forbidden}`);
  }
}

if (fs.existsSync("games.html")) {
  const games = fs.readFileSync("games.html", "utf8");
  if (!games.includes('href="hitster.html"')) failures.push("games.html: HITSTER must route through hitster.html hub");
  if (!games.includes('href="music-editor.html"')) failures.push("games.html: music editor game route missing");
  if (!games.includes('data-game-number="16"')) failures.push("games.html: game 16 missing");
  if (!games.includes('<script src="conversation-questions.js"></script>')) failures.push("games.html: shared conversation question bank is not loaded");
}

if (fs.existsSync("connect-talk.html")) {
  const connect = fs.readFileSync("connect-talk.html", "utf8");
  if (!connect.includes('<script src="conversation-questions.js"></script>')) failures.push("connect-talk.html: shared conversation question bank is not loaded");
  if (!connect.includes("TRA GAMES · משחק 11")) failures.push("connect-talk.html: wrong game number");
}

if (fs.existsSync("links/index.html")) {
  const links = fs.readFileSync("links/index.html", "utf8");
  if (!links.includes('href="../music-drive.html"')) failures.push("links/index.html: family musical journey route missing");
}

if (failures.length) {
  console.error("TRA production smoke check FAILED:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`TRA production smoke check PASSED: ${requiredFiles.length}/${requiredFiles.length} required files present and non-empty.`);
console.log(`HTML baseline PASSED: ${htmlFiles.length}/${htmlFiles.length} pages have html/title/viewport.`);
console.log("TRA Games canonical release: 16 games · shared conversation bank · PASS");
console.log("HITSTER canonical release: Hezel 4,549 · IndexedDB · local audio · zero runtime streaming providers · PASS");
console.log("Music additions: Family Musical Journey + Music Editor game · PASS");
