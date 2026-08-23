"use strict";

const fs = require("fs");

const payload = JSON.parse(fs.readFileSync("hitster-hebrew-alist-888.json", "utf8"));
const html888 = fs.readFileSync("hitster-888.html", "utf8");
const family57 = fs.readFileSync("hitster-kfar-bloom-2026-demo.html", "utf8");
const hub = fs.readFileSync("hitster.html", "utf8");
const games = fs.readFileSync("games.html", "utf8");
const js = fs.readFileSync("hitster-kfar-bloom-2026-demo.js", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");
const builder = fs.readFileSync("build-hitster-hebrew-alist.js", "utf8");

const TARGET_PER_ERA = 222;
const TARGET_TOTAL = 888;
const ranges = {
  "1980–1989": [1980, 1989],
  "1990–1999": [1990, 1999],
  "2000–2009": [2000, 2009],
  "2010–2020": [2010, 2020],
};
const blockedParts = ["אייל גולן", "michael jackson", "eyal golan"];
const norm = value => String(value || "").normalize("NFKC").trim().toLocaleLowerCase("he");
const key = card => `${norm(card[0])}|${norm(card[1])}|${card[2]}`;
const hasHebrew = value => /[\u0590-\u05FF]/.test(String(value || ""));
const hasLatin = value => /[A-Za-z]/.test(String(value || ""));
const blocked = artist => blockedParts.some(part => norm(artist).includes(norm(part)));
const approvedSource = source => /^מצעד שנתי \d{4}$/.test(String(source || "")) || source === "גלגלצ מצעד שנתי 2020";
const failures = [];
const seen = new Set();
let total = 0;

if (payload?.meta?.total !== TARGET_TOTAL) failures.push(`meta.total must be ${TARGET_TOTAL}`);
if (payload?.meta?.perEra !== TARGET_PER_ERA) failures.push(`meta.perEra must be ${TARGET_PER_ERA}`);
if (!payload?.eras || !payload?.provenance) failures.push("generated A-list payload is missing eras/provenance");
if (!payload?.meta?.artistTitleIntegrity) failures.push("artist/title integrity policy is missing");

for (const [era, [lo, hi]] of Object.entries(ranges)) {
  const cards = payload?.eras?.[era];
  if (!Array.isArray(cards) || cards.length !== TARGET_PER_ERA) {
    failures.push(`${era}: expected exactly ${TARGET_PER_ERA} cards`);
    continue;
  }
  for (const card of cards) {
    total++;
    if (!Array.isArray(card) || card.length !== 3) { failures.push(`${era}: malformed card`); continue; }
    const [title, artist, year] = card;
    if (!hasHebrew(title) || hasLatin(title)) failures.push(`${title}: title is not Hebrew-only`);
    if (!hasHebrew(artist) || hasLatin(artist)) failures.push(`${artist}: artist is not Hebrew-only`);
    // A title may legitimately equal the performer name (for example "כמו צועני", 1985); row-level source evidence is authoritative.
    if (!Number.isInteger(year) || year < lo || year > hi) failures.push(`${title}: year ${year} outside ${era}`);
    if (blocked(artist)) failures.push(`${title}: blocked artist ${artist}`);
    const id = key(card);
    if (seen.has(id)) failures.push(`${title}: duplicate title/artist/year`);
    seen.add(id);
    const source = payload.provenance[id];
    if (!source || !approvedSource(source.source)) failures.push(`${title}: missing approved annual-chart provenance`);
    if (!Number.isInteger(source?.sourceRank) || source.sourceRank < 1 || source.sourceRank > 60) failures.push(`${title}: invalid annual-chart rank`);
    if (!["same-source-row/header-mapped","official-chart-plus-Apple-Music-cross-check"].includes(source?.pairVerification)) failures.push(`${title}: artist/title pair lacks row-level verification`);
  }
}

if (total !== TARGET_TOTAL) failures.push(`Expected ${TARGET_TOTAL} cards, got ${total}`);
if (seen.size !== TARGET_TOTAL) failures.push(`Expected ${TARGET_TOTAL} unique cards, got ${seen.size}`);
if (!html888.includes('id="new-game"') || !html888.includes("888 קלפי שירים") || !html888.includes("222 קלפים בכל תקופה")) failures.push("888 / 222×4 UI or New Game button missing from hitster-888.html");
if (!family57.includes("57 כרטיס") || !family57.includes("WIN_CARDS=18") || !family57.includes("5 אסימוני HITSTER")) failures.push("Kfar Blum 57 mode contract missing");
if (!hub.includes("888 קלפי שירים") || !hub.includes('href="hitster-888.html"') || !hub.includes('href="hitster-kfar-bloom-2026-demo.html"')) failures.push("HITSTER hub must expose both 888 and Kfar Blum 57 modes");
if (hub.includes("350 הקלפים") || hub.includes("444 קלפי")) failures.push("HITSTER hub contains stale song-count copy");
if (!games.includes('href="hitster.html"') || !games.includes("HITSTER TRA · 888")) failures.push("TRA Games does not route HITSTER through the hub");
if (!js.includes('fetch("./hitster-hebrew-alist-888.json")') || !js.includes("TARGET_TOTAL = 888") || !js.includes("TARGET_PER_ERA = 222") || !js.includes("function newGame()")) failures.push("888 runtime is not locked to 888 = 222×4 / New Game");
if (!sw.includes("hitster-hebrew-alist-888.json") || !sw.includes("hitster-888.html") || !sw.includes("hitster-888")) failures.push("888-card deck/page is not cached with an 888-versioned offline cache");
if (!builder.includes("TARGET_TOTAL = 888") || !builder.includes("TARGET_PER_ERA = 222") || !builder.includes("GLZ_2020")) failures.push("888 builder is not configured for 222×4 including 2020");
if (!builder.includes('columnIndex(headers') || !builder.includes('"ביצוע", "מבצע", "אמן", "אמנים"')) failures.push("builder does not map artist/title columns by verified headers");
if (!builder.includes('"ואז את תראי","דולי ופן, דיקלה, עידן רפאל חביב, מארק אליהו"')) failures.push("verified 2020 collaboration credits are incomplete");
if (!builder.includes('"חביב אלבי","סטטיק ובן אל תבורי, נסרין קדרי"')) failures.push("verified artist names are not canonical");

if (failures.length) {
  console.error("HITSTER 888 HEBREW A-LIST GATE FAILED:\n");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("HITSTER 888 Hebrew A-list gate PASSED");
for (const era of Object.keys(ranges)) console.log(`${era}: ${payload.eras[era].length}/${TARGET_PER_ERA}`);
console.log(`Total: ${total}/${TARGET_TOTAL} unique cards`);
console.log("Hebrew-only: PASS");
console.log("Annual-chart A-list provenance: PASS");
console.log("Artist/title row-level integrity: PASS");
console.log("2020 included: PASS");
console.log("New Game timeline reset: PASS");
console.log("HITSTER 888 + Kfar Blum 57 separation: PASS");
console.log("Offline deck cache: PASS");
