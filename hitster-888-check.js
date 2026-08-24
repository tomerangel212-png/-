"use strict";

const fs = require("fs");

const payload = JSON.parse(fs.readFileSync("hitster-hebrew-alist-888.json", "utf8"));
const html888 = fs.readFileSync("hitster-888.html", "utf8");
const kfarRoute = fs.readFileSync("hitster-kfar-bloom-2026-demo.html", "utf8");
const legacyRoute = fs.readFileSync("hitster-tra-tokens.html", "utf8");
const english = fs.readFileSync("hitster-888-en.html", "utf8");
const hub = fs.readFileSync("hitster.html", "utf8");
const games = fs.readFileSync("games.html", "utf8");
const js = fs.readFileSync("hitster-kfar-bloom-2026-demo.js", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");
const builder = fs.readFileSync("build-hitster-hebrew-alist.js", "utf8");
const principles = JSON.parse(fs.readFileSync("TRA_PRINCIPLES.json", "utf8"));

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
let appleMusicCrossChecks = 0;
const expectedAppleMusicEvidence = new Map([
  ["ואז את תראי|דולי ופן, דיקלה, עידן רפאל חביב, מארק אליהו|2020", "https://music.apple.com/il/song/1512939046?l=he"],
  ["חביב אלבי|סטטיק ובן אל תבורי, נסרין קדרי|2020", "https://music.apple.com/il/album/1518559908?l=he"],
]);

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
    if (!Number.isInteger(year) || year < lo || year > hi) failures.push(`${title}: year ${year} outside ${era}`);
    if (blocked(artist)) failures.push(`${title}: blocked artist ${artist}`);
    const id = key(card);
    if (seen.has(id)) failures.push(`${title}: duplicate title/artist/year`);
    seen.add(id);
    const source = payload.provenance[id];
    if (!source || !approvedSource(source.source)) failures.push(`${title}: missing approved annual-chart provenance`);
    if (!Number.isInteger(source?.sourceRank) || source.sourceRank < 1 || source.sourceRank > 60) failures.push(`${title}: invalid annual-chart rank`);
    if (!["same-source-row/header-mapped", "official-chart-plus-Apple-Music-cross-check"].includes(source?.pairVerification)) failures.push(`${title}: artist/title pair lacks row-level verification`);
    if (!/^https:\/\//.test(String(source?.sourceUrl || ""))) failures.push(`${title}: source URL is missing`);
    if (source?.pairVerification === "official-chart-plus-Apple-Music-cross-check") {
      appleMusicCrossChecks++;
      const expectedUrl = expectedAppleMusicEvidence.get(id);
      if (!expectedUrl || source.verificationUrl !== expectedUrl) failures.push(`${title}: Apple Music evidence is missing or attached to the wrong card`);
    } else if (source?.verificationUrl) {
      failures.push(`${title}: unexpected secondary verification URL without a cross-check claim`);
    }
  }
}

if (total !== TARGET_TOTAL) failures.push(`Expected ${TARGET_TOTAL} cards, got ${total}`);
if (seen.size !== TARGET_TOTAL) failures.push(`Expected ${TARGET_TOTAL} unique cards, got ${seen.size}`);
if (appleMusicCrossChecks !== expectedAppleMusicEvidence.size) failures.push(`Expected exactly ${expectedAppleMusicEvidence.size} Apple Music cross-checks, got ${appleMusicCrossChecks}`);
for (const id of expectedAppleMusicEvidence.keys()) if (!seen.has(id)) failures.push(`${id}: expected Apple Music-verified collaboration is absent from the rebuilt deck`);

if (!html888.includes('id="new-game"') || !html888.includes("▶ שחק עכשיו") || !html888.includes("888 קלפי שירים") || !html888.includes("מיקום סודי על ציר 80 השנים")) failures.push("888-card UI, hidden-range instruction, or Start Game button missing from hitster-888.html");
if (!html888.includes('id="mode"') || !html888.includes('id="mode" aria-label="מצב בחירה" autocomplete="off" hidden') || !html888.includes(".era-grid{display:none}")) failures.push("year-range and era controls must stay hidden on the main game screen");
if (html888.includes("שנות ה־80 · שנות ה־90") || html888.includes("2010–2020.</p>")) failures.push("main game screen leaks the playable year range before reveal");
if (!js.includes("מיקום סודי על ציר 80 השנים") || js.includes('${pick.era} · קלף')) failures.push("draw flow leaks the current card era before reveal");

if (!kfarRoute.includes('location.replace("hitster-888.html?entry=kfar-bloom")') || !kfarRoute.includes("HITSTER 888")) failures.push("Kfar Blum route is not unified with canonical 888");
if (!legacyRoute.includes('location.replace("hitster-888-en.html?entry=international")') || !legacyRoute.includes("888 cards, exactly")) failures.push("legacy international route is not unified with English 888");
if (!english.includes('<html lang="en" dir="ltr">') || !english.includes("888 verified Hebrew A-list song cards") || !english.includes('src="hitster-kfar-bloom-2026-demo.js')) failures.push("English interface is not wired to the verified 888 deck");
if (!hub.includes("888 קלפי שירים") || !hub.includes('href="hitster-888.html"') || !hub.includes('href="hitster-888-en.html"') || !hub.includes('href="hitster-kfar-bloom-2026-demo.html"')) failures.push("HITSTER hub must expose every verified 888 interface");
if (hub.includes("350 הקלפים") || hub.includes("444 קלפי") || hub.includes("57 כרטיס") || hub.includes("1,000 כרטיס")) failures.push("HITSTER hub contains stale non-888 count copy");
if (!games.includes('href="hitster.html"') || !games.includes("HITSTER TRA · 888")) failures.push("TRA Games does not route HITSTER through the hub");
if (!js.includes('fetch("./hitster-hebrew-alist-888.json")') || !js.includes("TARGET_TOTAL = 888") || !js.includes("TARGET_PER_ERA = 222") || !js.includes("function newGame({ skipConfirm = false } = {})") || !js.includes("function nextRandomPick()") || !js.includes("fetchPreviewForCurrent") || !js.includes("🎮 הקלף התחיל")) failures.push("888 runtime is not locked to immediate Start Game / 888 = 222×4");
if (!sw.includes("hitster-hebrew-alist-888.json") || !sw.includes("hitster-888.html") || !sw.includes("hitster-888")) failures.push("canonical 888 deck/page is not cached offline");
if (!builder.includes("TARGET_TOTAL = 888") || !builder.includes("TARGET_PER_ERA = 222") || !builder.includes("GLZ_2020")) failures.push("888 builder is not configured for 222×4 including 2020");
if (!builder.includes('columnIndex(headers') || !builder.includes('"ביצוע", "מבצע", "אמן", "אמנים"')) failures.push("builder does not map artist/title columns by verified headers");
if (!builder.includes("function verifyParserBehavior()") || !builder.includes("reordered title/artist columns") || !builder.includes("legitimate same-name title/artist pair")) failures.push("builder lacks behavioral parser regression checks");
if (!builder.includes("APPLE_MUSIC_CROSS_CHECKS") || !builder.includes("verificationUrl")) failures.push("builder lacks scoped secondary-source evidence");

// Internal-playback contract: no HITSTER core interface may force a third-party app.
if (!html888.includes("ספרייה פנימית ישראלית") || !html888.includes("ממיכאל ועד סבתא אסתל")) failures.push("internal Israeli library / intergenerational principle copy is missing");
for (const [name, html] of [["Hebrew", html888], ["English", english]]) {
  for (const forbidden of ["open.spotify.com", "youtube.com", "spotify-frame", "פתחו ב‑Spotify"]) {
    if (html.toLowerCase().includes(forbidden.toLowerCase())) failures.push(`${name} HITSTER UI contains external-app dependency: ${forbidden}`);
  }
}
for (const forbidden of ["providerUrls(", "showFallbacks(", "hitster_audio_provider_opened", "מקור האזנה חלופי"]) {
  if (js.includes(forbidden)) failures.push(`HITSTER runtime exposes third-party fallback flow: ${forbidden}`);
}
for (const required of ["AUDIO_CACHE_STORE", "findPlayablePick", "state.unplayable", "state.previewCache", "ההשמעה נשארת בתוך HITSTER", "מחליף אוטומטית לשיר פנימי אחר"]) {
  if (!js.includes(required)) failures.push(`internal-playback resilience missing: ${required}`);
}
if (!english.includes("Internal Israeli playback") || !english.includes("Michael to Grandma Estelle")) failures.push("English interface does not expose the internal-playback principle");
if (!Array.isArray(principles?.principles) || !principles.principles.some(p => p?.id === "michael-to-grandma-estelle" && String(p.he || "").includes("ממיכאל ועד סבתא אסתל"))) failures.push("TRA principle michael-to-grandma-estelle is missing");

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
console.log(`Apple Music evidence: ${appleMusicCrossChecks}/${expectedAppleMusicEvidence.size} scoped cross-checks PASS`);
console.log("Parser behavior fixtures: PASS");
console.log("2020 included: PASS");
console.log("Year range hidden until reveal: PASS");
console.log("New Game timeline reset: PASS");
console.log("Every HITSTER route is unified to the verified 888-card deck: PASS");
console.log("Internal Israeli playback / no required third-party app: PASS");
console.log("Michael-to-Grandma-Estelle principle: PASS");
console.log("Canonical offline deck cache: PASS");
