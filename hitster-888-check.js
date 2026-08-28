"use strict";

const fs = require("fs");
const read = file => fs.readFileSync(file, "utf8");
const failures = [];
const check = (label, condition) => { if (!condition) failures.push(label); };
const normalize = value => String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

const deck = JSON.parse(read("hitster-alltime-888.json"));
const html = read("hitster-888.html");
const english = read("hitster-888-en.html");
const engine = read("hitster-original.js");
const serviceWorker = read("sw.js");
const hub = read("hitster.html");
const mobile = read("hitster-mobile.html");
const kfar = read("hitster-kfar-bloom-2026-demo.html");
const legacy = read("hitster-tra-tokens.html");

check("deck has exactly 888 cards", deck.total === 888 && Array.isArray(deck.cards) && deck.cards.length === 888);
check("deck declares chart-year basis", deck.yearBasis === "chart-year" && deck.range && deck.range.from === 1950 && deck.range.to === 2023);
const yearCounts = new Map();
const identities = new Set();
let blocked = 0;
for (const card of deck.cards || []) {
  const valid = card && card.id && card.title && card.artist && Number.isInteger(card.chartYear) && Number.isInteger(card.chartRank) && card.yearBasis === "chart-year" && String(card.sourceUrl || "").startsWith("https://");
  check(`complete card ${card && card.id || "unknown"}`, valid);
  if (!valid) continue;
  yearCounts.set(card.chartYear, (yearCounts.get(card.chartYear) || 0) + 1);
  const identity = `${normalize(card.title)}|${normalize(card.artist)}`;
  if (identities.has(identity)) failures.push(`duplicate song/artist: ${card.title} — ${card.artist}`);
  identities.add(identity);
  if (/michael jackson|eyal golan|אייל גולן/i.test(card.artist)) blocked += 1;
}
for (let year = 1950; year <= 2023; year += 1) check(`12 cards in chart year ${year}`, yearCounts.get(year) === 12);
check("no blocked artists", blocked === 0);
check("Hebrew game loads annual runtime", html.includes('src="hitster-original.js') && html.includes('id="audio"') && html.includes('preload="metadata"') && html.includes("playsinline"));
check("English game loads annual runtime", english.includes('<html lang="en" dir="ltr">') && english.includes('src="hitster-original.js') && english.includes('id="audio"') && english.includes("playsinline"));
check("game hides range until reveal", !html.includes("1950–2023") && html.includes("שנת מצעד"));
check("engine loads new deck", engine.includes('DATA_URL = "./hitster-alltime-888.json"') && engine.includes("PREVIEW_SECONDS = 30"));
check("engine has separate stars", engine.includes("START_STARS = 5") && engine.includes("MAX_STARS = 12") && engine.includes("exact_song_and_artist"));
check("engine caches previews when possible", engine.includes("AUDIO_CACHE_NAME") && engine.includes("cachedPreview") && engine.includes("cacheRemotePreview") && engine.includes("navigator.onLine"));
check("engine has no external app fallback", !/open\.spotify\.com|youtube\.com|deezer\.com|soundcloud\.com/i.test(engine));
check("service worker caches annual deck and mobile entry", serviceWorker.includes('"./hitster-alltime-888.json"') && serviceWorker.includes("AUDIO_CACHE") && serviceWorker.includes('"./hitster-888-en.html"') && serviceWorker.includes('"./hitster-mobile.html"'));
check("hub explains truthful audio behavior", hub.includes("קטעי שמע נשמרים אחרי השמעה") && hub.includes('href="hitster-mobile.html"') && hub.includes('href="hitster-mobile.html?lang=en"'));
check("mobile entry uses current annual games", mobile.includes('id="game"') && mobile.includes('allow="autoplay"') && mobile.includes('"hitster-888.html"') && mobile.includes('"hitster-888-en.html"'));
check("mobile entry attempts draw and in-page playback", mobile.includes('getElementById("next-card")') && mobile.includes('getElementById("play-clip")') && mobile.includes("next.click()") && mobile.includes("play.click()"));
check("Kfar route resolves to mobile annual game", kfar.includes('location.replace("hitster-mobile.html?entry=kfar-bloom")') && kfar.includes("888"));
check("legacy route resolves to English annual game", legacy.includes('location.replace("hitster-888-en.html?entry=international")') && legacy.includes("888"));

if (failures.length) {
  console.error("HITSTER annual 888 quality gate FAILED:\n" + failures.map(item => `- ${item}`).join("\n"));
  process.exit(1);
}
console.log("HITSTER annual 888 quality gate PASSED: 74 chart years × 12 cards; stars, mobile entry, and 30-second cached previews verified.");
