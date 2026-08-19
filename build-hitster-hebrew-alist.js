"use strict";

const fs = require("fs");

const TARGET_TOTAL = 444;
const PIZMONET_URL = "https://pizmonet.co.il/wiki/%D7%94%D7%9E%D7%A6%D7%A2%D7%93_%D7%A9%D7%9C_%D7%94%D7%9E%D7%93%D7%99%D7%A0%D7%94";
const MODERN_SOURCE_URL = "https://www.israelhayom.co.il/culture/music/article/13975802";
const OUTPUT = "hitster-hebrew-alist-444.json";

// Modern A-list additions are taken from the 2023 Israel Hayom + Kan Gimel top-75 poll.
// Years below are catalog-verified release years for the selected recording.
const MODERN_ALIST = [
  { title: "פנתרה", artist: "נועה קירל", year: 2022, sourceRank: 21 },
  { title: "אם תרצי", artist: "חנן בן ארי", year: 2020, sourceRank: 26 },
  { title: "אור גדול", artist: "אמיר דדון", year: 2010, sourceRank: 33 },
  { title: "דרך השלום", artist: "פאר טסי", year: 2015, sourceRank: 60 },
  { title: "אבא", artist: "שלומי שבת", year: 2007, sourceRank: 63 },
  { title: "אייכה", artist: "שולי רנד", year: 2008, sourceRank: 64 },
  { title: "גם זה יעבור", artist: "טונה", year: 2015, sourceRank: 70 },
  { title: "טודו בום", artist: "סטטיק ובן אל תבורי", year: 2017, sourceRank: 71 },
  { title: "תל אביב", artist: "עומר אדם ואריסה", year: 2013, sourceRank: 74 },
].map(card => ({ ...card, source: "שיר ה-75 של ישראל 2023", sourceUrl: MODERN_SOURCE_URL }));

const BLOCKED_ARTIST_PARTS = ["אייל גולן", "michael jackson", "eyal golan"];
const ERA_RANGES = [
  [1948, 1959, "1948–1959"],
  [1960, 1969, "1960–1969"],
  [1970, 1979, "1970–1979"],
  [1980, 1989, "1980–1989"],
  [1990, 1999, "1990–1999"],
  [2000, 2009, "2000–2009"],
  [2010, 2019, "2010–2019"],
  [2020, 2026, "2020–2026"],
];

function decodeHtml(value) {
  return String(value || "")
    .replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&ndash;|&#8211;/gi, "–")
    .replace(/&mdash;|&#8212;/gi, "—")
    .replace(/&rlm;|&lrm;/gi, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[״”]/g, '"')
    .replace(/[׳’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("he");
}

function identity(card) {
  return `${normalize(card.title)}|${normalize(card.artist)}|${card.year}`;
}

function hasHebrew(value) {
  return /[\u0590-\u05FF]/.test(String(value || ""));
}

function hasLatinLetters(value) {
  return /[A-Za-z]/.test(String(value || ""));
}

function isBlockedArtist(artist) {
  const a = normalize(artist);
  return BLOCKED_ARTIST_PARTS.some(part => a.includes(normalize(part)));
}

function eraFor(year) {
  return ERA_RANGES.find(([lo, hi]) => year >= lo && year <= hi)?.[2] || null;
}

function eligible(card) {
  return card &&
    hasHebrew(card.title) && !hasLatinLetters(card.title) &&
    hasHebrew(card.artist) && !hasLatinLetters(card.artist) &&
    Number.isInteger(card.year) && card.year >= 1948 && card.year <= 2026 &&
    !isBlockedArtist(card.artist) && Boolean(eraFor(card.year));
}

function parsePizmonet(html) {
  const cards = [];
  const rowRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  for (const rowMatch of html.matchAll(rowRe)) {
    const row = rowMatch[1];
    const cells = [...row.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(match => decodeHtml(match[1]));
    if (cells.length < 6) continue;
    const rank = Number.parseInt(cells[0].replace(/[^0-9]/g, ""), 10);
    const yearMatch = cells[5].match(/(?:19|20)\d{2}/);
    if (!Number.isInteger(rank) || rank < 1 || rank > 500 || !yearMatch) continue;
    const title = cells[1];
    const artist = cells[2];
    const year = Number(yearMatch[0]);
    cards.push({ title, artist, year, sourceRank: rank, source: "המצעד של המדינה 2009", sourceUrl: PIZMONET_URL });
  }
  return cards.sort((a, b) => a.sourceRank - b.sourceRank);
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "TRA-HITSTER-AList-Builder/1.0" },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const html = await fetchText(PIZMONET_URL);
  const ranked = parsePizmonet(html);
  if (ranked.length < 450) throw new Error(`A-list source parse returned only ${ranked.length} ranked rows; refusing to publish.`);

  const selected = [];
  const seen = new Set();
  const add = card => {
    if (!eligible(card)) return;
    const id = identity(card);
    if (seen.has(id)) return;
    seen.add(id);
    selected.push({ ...card, era: eraFor(card.year) });
  };

  // Keep recent canonical hits in the deck, then fill the remaining slots by the 2009 A-list rank.
  MODERN_ALIST.forEach(add);
  ranked.forEach(add);

  if (selected.length < TARGET_TOTAL) {
    throw new Error(`Only ${selected.length} eligible Hebrew A-list songs found; need ${TARGET_TOTAL}.`);
  }

  const finalCards = selected.slice(0, TARGET_TOTAL);
  const eras = Object.fromEntries(ERA_RANGES.map(([, , era]) => [era, []]));
  const provenance = {};
  for (const card of finalCards) {
    eras[card.era].push([card.title, card.artist, card.year]);
    provenance[identity(card)] = {
      source: card.source,
      sourceRank: card.sourceRank,
      sourceUrl: card.sourceUrl,
    };
  }

  const payload = {
    meta: {
      title: "HITSTER TRA · 444 בעברית · A-list",
      total: TARGET_TOTAL,
      languagePolicy: "Hebrew titles and Hebrew artist names only; no Latin letters",
      aListPolicy: "Ranked songs from HaMitzad Shel HaMedina 2009 plus selected modern top-75 songs from Israel Hayom + Kan Gimel 2023",
      blockedArtists: ["אייל גולן", "Michael Jackson"],
      sourceUrls: [PIZMONET_URL, MODERN_SOURCE_URL],
      generatedAt: new Date().toISOString(),
    },
    eras,
    provenance,
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`Built ${TARGET_TOTAL}/${TARGET_TOTAL} Hebrew A-list HITSTER cards.`);
  for (const [era, cards] of Object.entries(eras)) console.log(`${era}: ${cards.length}`);
}

main().catch(error => {
  console.error(`HITSTER Hebrew A-list build FAILED: ${error.message || error}`);
  process.exit(1);
});
