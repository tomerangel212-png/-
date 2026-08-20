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
  "hitster-hebrew-alist-888.json",
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
  if (!hub.includes("888 קלפי שירים")) failures.push("hitster.html: canonical 888-card copy missing");
  if (hub.includes("350 הקלפים") || hub.includes("444 קלפי")) failures.push("hitster.html: stale song count remains");
  if (hub.includes("חזרה לכל 15 משחקי TRA")) failures.push("hitster.html: stale 15-game navigation remains");
}

if (fs.existsSync("hitster-kfar-bloom-2026-demo.html")) {
  const demo = fs.readFileSync("hitster-kfar-bloom-2026-demo.html", "utf8");
  if (!/id=["']audio["'][^>]*preload=["']metadata["']/i.test(demo)) failures.push("hitster demo: audio should preload metadata for mobile playback");
  if (!/id=["']audio["'][^>]*playsinline/i.test(demo)) failures.push("hitster demo: audio should use playsinline for iOS compatibility");
}

if (fs.existsSync("hitster-kfar-bloom-2026-demo.js")) {
  const demoJs = fs.readFileSync("hitster-kfar-bloom-2026-demo.js", "utf8");
  if (!demoJs.includes("prepareAudio(state.current.preview)")) failures.push("hitster demo: preview audio is not prepared before play tap");
  if (!/error\?\.name\s*===\s*["']NotAllowedError["']/.test(demoJs)) failures.push("hitster demo: blocked-playback recovery missing");
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
console.log("HITSTER canonical release: 888 cards · iOS playback prep · Offline · PASS");
console.log("Music additions: Family Musical Journey + Music Editor game · PASS");
