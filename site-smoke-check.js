"use strict";

const fs = require("fs");

const requiredFiles = [
  "index.html",
  "games.html",
  "games.js",
  "games-hub.js",
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

if (fs.existsSync("hitster.html")) {
  const hub = fs.readFileSync("hitster.html", "utf8");
  if (!hub.includes("888 קלפי שירים")) failures.push("hitster.html: canonical 888-card copy missing");
  if (hub.includes("350 הקלפים") || hub.includes("444 קלפי")) failures.push("hitster.html: stale song count remains");
}

if (fs.existsSync("games.html")) {
  const games = fs.readFileSync("games.html", "utf8");
  if (!games.includes('href="hitster.html"')) failures.push("games.html: HITSTER must route through hitster.html hub");
  if (!games.includes('href="music-editor.html"')) failures.push("games.html: music editor game route missing");
  if (!games.includes('data-game-number="16"')) failures.push("games.html: game 16 missing");
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
console.log("HITSTER canonical release: 888 cards · unified hub · PASS");
console.log("Music additions: Family Musical Journey + Music Editor game · PASS");
