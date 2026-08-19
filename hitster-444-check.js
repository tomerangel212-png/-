"use strict";

const fs = require("fs");

const payload = JSON.parse(fs.readFileSync("hitster-hebrew-alist-444.json", "utf8"));
const html = fs.readFileSync("hitster-kfar-bloom-2026-demo.html", "utf8");
const js = fs.readFileSync("hitster-kfar-bloom-2026-demo.js", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");
const builder = fs.readFileSync("build-hitster-hebrew-alist.js", "utf8");

const TARGET_TOTAL = 444;
const ranges = {
  "1948–1959": [1948, 1959],
  "1960–1969": [1960, 1969],
  "1970–1979": [1970, 1979],
  "1980–1989": [1980, 1989],
  "1990–1999": [1990, 1999],
  "2000–2009": [2000, 2009],
  "2010–2019": [2010, 2019],
  "2020–2026": [2020, 2026],
};
const allowedSources = new Set(["המצעד של המדינה 2009", "שיר ה-75 של ישראל 2023"]);
const blockedParts = ["אייל גולן", "michael jackson", "eyal golan"];
const norm = value => String(value || "").normalize("NFKC").trim().toLocaleLowerCase("he");
const key = card => `${norm(card[0])}|${norm(card[1])}|${card[2]}`;
const hasHebrew = value => /[\u0590-\u05FF]/.test(String(value || ""));
const hasLatin = value => /[A-Za-z]/.test(String(value || ""));
const blocked = artist => blockedParts.some(part => norm(artist).includes(norm(part)));
const failures = [];
const seen = new Set();
let total = 0;

if (payload?.meta?.total !== TARGET_TOTAL) failures.push(`meta.total must be ${TARGET_TOTAL}`);
if (!payload?.eras || !payload?.provenance) failures.push("generated A-list payload is missing eras/provenance");

for (const [era, [lo, hi]] of Object.entries(ranges)) {
  const cards = payload?.eras?.[era];
  if (!Array.isArray(cards)) { failures.push(`${era}: missing era array`); continue; }
  for (const card of cards) {
    total++;
    if (!Array.isArray(card) || card.length !== 3) { failures.push(`${era}: malformed card`); continue; }
    const [title, artist, year] = card;
    if (!hasHebrew(title) || hasLatin(title)) failures.push(`${title}: title is not Hebrew-only`);
    if (!hasHebrew(artist) || hasLatin(artist)) failures.push(`${artist}: artist is not Hebrew-only`);
    if (!Number.isInteger(year) || year < lo || year > hi) failures.push(`${title}: year ${year} outside ${era}`);
    if (blocked(artist)) failures.push(`${title}: blocked artist ${artist}`);
    const id = key(card);
    if (seen.has(id)) failures.push(`${title}: duplicate title/artist/year`);
    seen.add(id);
    const source = payload.provenance[id];
    if (!source || !allowedSources.has(source.source)) failures.push(`${title}: missing approved A-list provenance`);
    if (!Number.isInteger(source?.sourceRank) || source.sourceRank < 1) failures.push(`${title}: invalid A-list rank`);
  }
}

if (total !== TARGET_TOTAL) failures.push(`Expected ${TARGET_TOTAL} cards, got ${total}`);
if (seen.size !== TARGET_TOTAL) failures.push(`Expected ${TARGET_TOTAL} unique cards, got ${seen.size}`);
if (!html.includes('id="new-game"') || !html.includes("444 קלפי שירים בעברית בלבד") || !html.includes("A-list בלבד")) failures.push("Hebrew A-list UI or New Game button missing");
if (!js.includes('fetch("./hitster-hebrew-alist-444.json")') || !js.includes("function newGame()") || !js.includes("TARGET_TOTAL = 444")) failures.push("Runtime is not locked to generated Hebrew A-list deck / New Game");
if (js.includes("hitster-expansion-444.json") || js.includes("hitster-kfar-bloom-2026-demo-data.json")) failures.push("Runtime still references legacy mixed-language HITSTER data");
if (!sw.includes("hitster-hebrew-alist-444.json")) failures.push("Hebrew A-list deck is not cached for offline use");
if (!builder.includes("pizmonet.co.il") || !builder.includes("israelhayom.co.il")) failures.push("A-list builder is missing ranked source URLs");

if (failures.length) {
  console.error("HITSTER 444 HEBREW A-LIST GATE FAILED:\n");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("HITSTER 444 Hebrew A-list gate PASSED");
for (const era of Object.keys(ranges)) console.log(`${era}: ${payload.eras[era].length}`);
console.log(`Total: ${total}/444 unique Hebrew A-list cards`);
console.log("Approved provenance: PASS");
console.log("Blocked artists: PASS");
console.log("New Game timeline reset: PASS");
console.log("Offline deck cache: PASS");
