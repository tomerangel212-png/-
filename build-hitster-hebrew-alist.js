"use strict";

const fs = require("fs");

const TARGET_PER_ERA = 222;
const TARGET_TOTAL = 888;
const OUTPUT = "hitster-hebrew-alist-888.json";
const PIZMONET_BASE = "https://pizmonet.co.il/wiki/";
const GLZ_2020_URL = "https://glz.co.il/%D7%92%D7%9C%D7%92%D7%9C%D7%A6/%D7%9B%D7%AA%D7%91%D7%95%D7%AA/%D7%94%D7%9E%D7%A6%D7%A2%D7%93-%D7%94%D7%A9%D7%A0%D7%AA%D7%99-%D7%94%D7%99%D7%A9%D7%A8%D7%90%D7%9C%D7%99-%D7%AA%D7%A9%D7%A4";
const APPLE_MUSIC_CROSS_CHECKS = new Map([
  ["ואז את תראי|דולי ופן, דיקלה, עידן רפאל חביב, מארק אליהו", "https://music.apple.com/il/song/1512939046?l=he"],
  ["חביב אלבי|סטטיק ובן אל תבורי, נסרין קדרי", "https://music.apple.com/il/album/1518559908?l=he"],
]);

// Four user-requested blocks: three full decades plus 2010s with 2020 included explicitly.
const ERA_RANGES = [
  [1980, 1989, "1980–1989"],
  [1990, 1999, "1990–1999"],
  [2000, 2009, "2000–2009"],
  [2010, 2020, "2010–2020"],
];

const YEAR_PAGES = [
  [1980, 'תש"ם'], [1981, 'תשמ"א'], [1982, 'תשמ"ב'], [1983, 'תשמ"ג'], [1984, 'תשמ"ד'],
  [1985, 'תשמ"ה'], [1986, 'תשמ"ו'], [1987, 'תשמ"ז'], [1988, 'תשמ"ח'], [1989, 'תשמ"ט'],
  [1990, 'תש"ן'], [1991, 'תשנ"א'], [1992, 'תשנ"ב'], [1993, 'תשנ"ג'], [1994, 'תשנ"ד'],
  [1995, 'תשנ"ה'], [1996, 'תשנ"ו'], [1997, 'תשנ"ז'], [1998, 'תשנ"ח'], [1999, 'תשנ"ט'],
  [2000, 'תש"ס'], [2001, 'תשס"א'], [2002, 'תשס"ב'], [2003, 'תשס"ג'], [2004, 'תשס"ד'],
  [2005, 'תשס"ה'], [2006, 'תשס"ו'], [2007, 'תשס"ז'], [2008, 'תשס"ח'], [2009, 'תשס"ט'],
  [2010, 'תש"ע'], [2011, 'תשע"א'], [2012, 'תשע"ב'], [2013, 'תשע"ג'], [2014, 'תשע"ד'],
  [2015, 'תשע"ה'], [2016, 'תשע"ו'], [2017, 'תשע"ז'], [2018, 'תשע"ח'], [2019, 'תשע"ט'],
];

// Official Galgalatz 2020 annual chart, places 1–40.
const GLZ_2020 = [
  [1,"שלמים","עידן רפאל חביב"],[2,"אם תרצי","חנן בן ארי"],[3,"מיליון דולר","נועה קירל"],[4,"ואז את תראי","דולי ופן, דיקלה, עידן רפאל חביב, מארק אליהו"],
  [5,"זוט עני","אלה לי להב"],[6,"שמש","חנן בן ארי"],[7,"אל תעזבי ידיים","עקיבא"],[8,"אגרוף","עדן בן זקן"],
  [9,"סיבובים","עדן חסון"],[10,"נחכה לך","נתן גושן, ישי ריבו"],[11,"שבוע טוב","אברהם טל"],[12,"בין קודש לחול","אמיר דדון, שולי רנד"],
  [13,"את חסרה לי","עדן חסון"],[14,"לא יוצא למסיבות","מרגי"],[15,"באת לי פתאום","קרן פלס, רוני אלטר"],[16,"חביב אלבי","סטטיק ובן אל תבורי, נסרין קדרי"],
  [17,"Alien","Dennis Lloyd"],[18,"Feker Libi","עדן אלנה"],[19,"יש לי חור בלב בצורה שלך","ג'ירפות"],[20,"מאושרים","דולי ופן, לירן דנינו, נועה קירל"],
  [21,"אם אתה גבר","נועה קירל"],[22,"קוקוריקו","עדן בן זקן, עומר אדם"],[23,"רכבת הרים","אייל גולן"],[24,"פשוטים","עקיבא"],
  [25,"חצי בשבילי","איתי לוי"],[26,"בחלומות שלנו","דודו אהרון, עדן מאירי"],[27,"כתר מלוכה","ישי ריבו"],[28,"דיבור נגוע","מרגי"],
  [29,"מה עבר עליי","עדן חסון"],[30,"איפה את","אליעד"],[31,"אני רוצה","עידן עמדי"],[32,"תל אביב זה אני ואת","אמיר ובן, ג'יין בורדו"],
  [33,"קחי את הפחדים","בניה ברבי"],[34,"סדר עבודה","ישי ריבו"],[35,"עוד יום","פול טראנק"],[36,"במקום הכי רחוק","בניה ברבי"],
  [37,"חזרי אליי","נתן גושן"],[38,"לקחת את המפתחות","איתי לוי"],[39,"מסיבה","יסמין מועלם, שקל"],[40,"מים שקופים","עומר אדם"]
].map(([sourceRank, title, artist]) => {
  const verificationUrl = APPLE_MUSIC_CROSS_CHECKS.get(`${title}|${artist}`);
  return {
    title, artist, year: 2020, sourceRank,
    source: "גלגלצ מצעד שנתי 2020",
    sourceUrl: GLZ_2020_URL,
    pairVerification: verificationUrl ? "official-chart-plus-Apple-Music-cross-check" : "same-source-row/header-mapped",
    ...(verificationUrl ? { verificationUrl } : {}),
  };
});

const BLOCKED_ARTIST_PARTS = ["אייל גולן", "michael jackson", "eyal golan"];

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
  return String(value || "").normalize("NFKC").replace(/[״”]/g, '"').replace(/[׳’]/g, "'").replace(/\s+/g, " ").trim().toLocaleLowerCase("he");
}
function identity(card) { return `${normalize(card.title)}|${normalize(card.artist)}|${card.year}`; }
function hasHebrew(value) { return /[\u0590-\u05FF]/.test(String(value || "")); }
function hasLatin(value) { return /[A-Za-z]/.test(String(value || "")); }
function blockedArtist(artist) { const a = normalize(artist); return BLOCKED_ARTIST_PARTS.some(part => a.includes(normalize(part))); }
function eraFor(year) { return ERA_RANGES.find(([lo, hi]) => year >= lo && year <= hi)?.[2] || null; }
function eligible(card) {
  return card && hasHebrew(card.title) && !hasLatin(card.title) && hasHebrew(card.artist) && !hasLatin(card.artist) &&
    Number.isInteger(card.year) && Boolean(eraFor(card.year)) && !blockedArtist(card.artist);
}

function columnIndex(headers, accepted) {
  return headers.findIndex(header => accepted.includes(normalize(header)));
}
function parseAnnualChart(html, year, pageTitle) {
  const cards = [];
  for (const tableMatch of html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)) {
    const rows = [...tableMatch[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
    if (!rows.length) continue;
    const headerRow = rows.find(row => /<th\b/i.test(row[1]));
    if (!headerRow) continue;
    const headers = [...headerRow[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(match => decodeHtml(match[1]));
    const rankIndex = columnIndex(headers, ["מיקום", "מקום", "דירוג"]);
    const titleIndex = columnIndex(headers, ["שיר", "שם השיר"]);
    const artistIndex = columnIndex(headers, ["ביצוע", "מבצע", "אמן", "אמנים"]);
    if (rankIndex < 0 || titleIndex < 0 || artistIndex < 0 || titleIndex === artistIndex) continue;

    for (const rowMatch of rows) {
      if (rowMatch === headerRow) continue;
      const cells = [...rowMatch[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(match => decodeHtml(match[1]));
      if (cells.length <= Math.max(rankIndex, titleIndex, artistIndex)) continue;
      const rank = Number.parseInt(String(cells[rankIndex]).replace(/[^0-9]/g, ""), 10);
      if (!Number.isInteger(rank) || rank < 1 || rank > 60) continue;
      const title = cells[titleIndex];
      const artist = cells[artistIndex];
      if (!title || !artist) throw new Error(`${year} rank ${rank}: empty song/artist pair`);
      cards.push({
        title, artist, year, sourceRank: rank,
        source: `מצעד שנתי ${year}`,
        sourceUrl: `${PIZMONET_BASE}${encodeURIComponent(pageTitle)}`,
        pairVerification: "same-source-row/header-mapped"
      });
    }
  }
  return cards;
}

function verifyParserBehavior() {
  const reorderedColumns = `
    <table>
      <tr><th>ביצוע</th><th>דירוג</th><th>שם השיר</th></tr>
      <tr><td>מבצע לדוגמה</td><td>7</td><td>שיר לדוגמה</td></tr>
      <tr><td>כמו צועני</td><td>8</td><td>כמו צועני</td></tr>
    </table>`;
  const parsed = parseAnnualChart(reorderedColumns, 1985, 'תשמ"ה');
  if (parsed.length !== 2 || parsed[0].title !== "שיר לדוגמה" || parsed[0].artist !== "מבצע לדוגמה") {
    throw new Error("Parser regression: reordered title/artist columns were not mapped by header");
  }
  if (parsed[1].title !== "כמו צועני" || parsed[1].artist !== "כמו צועני") {
    throw new Error("Parser regression: legitimate same-name title/artist pair was not preserved");
  }

  const emptyArtist = `
    <table>
      <tr><th>מקום</th><th>שיר</th><th>מבצע</th></tr>
      <tr><td>1</td><td>שיר</td><td></td></tr>
    </table>`;
  let rejectedEmptyPair = false;
  try { parseAnnualChart(emptyArtist, 1985, 'תשמ"ה'); }
  catch { rejectedEmptyPair = true; }
  if (!rejectedEmptyPair) throw new Error("Parser regression: empty title/artist pair was accepted");
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, { headers: { "user-agent": "TRA-HITSTER-AList-Builder/2.0" }, signal: controller.signal, redirect: "follow" });
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    return await response.text();
  } finally { clearTimeout(timeout); }
}

async function main() {
  verifyParserBehavior();
  const candidates = [...GLZ_2020];
  for (const [year, pageTitle] of YEAR_PAGES) {
    const url = `${PIZMONET_BASE}${encodeURIComponent(pageTitle)}`;
    const html = await fetchText(url);
    const parsed = parseAnnualChart(html, year, pageTitle);
    if (parsed.length < 15) throw new Error(`${year}: only ${parsed.length} annual-chart songs parsed; refusing to publish.`);
    candidates.push(...parsed);
  }

  const buckets = Object.fromEntries(ERA_RANGES.map(([, , era]) => [era, []]));
  for (const card of candidates) if (eligible(card)) buckets[eraFor(card.year)].push(card);

  const eras = {};
  const provenance = {};
  for (const [, , era] of ERA_RANGES) {
    const sorted = buckets[era].sort((a, b) => a.sourceRank - b.sourceRank || a.year - b.year || a.title.localeCompare(b.title, "he"));
    const seen = new Set();
    const selected = [];
    for (const card of sorted) {
      const id = identity(card);
      if (seen.has(id)) continue;
      seen.add(id);
      selected.push(card);
      if (selected.length === TARGET_PER_ERA) break;
    }
    if (selected.length !== TARGET_PER_ERA) throw new Error(`${era}: need ${TARGET_PER_ERA} Hebrew A-list songs, found ${selected.length}`);
    eras[era] = selected.map(card => [card.title, card.artist, card.year]);
    for (const card of selected) provenance[identity(card)] = {
      source: card.source,
      sourceRank: card.sourceRank,
      sourceUrl: card.sourceUrl,
      pairVerification: card.pairVerification,
      ...(card.verificationUrl ? { verificationUrl: card.verificationUrl } : {}),
    };
  }

  const total = Object.values(eras).reduce((sum, cards) => sum + cards.length, 0);
  if (total !== TARGET_TOTAL) throw new Error(`Expected ${TARGET_TOTAL}, built ${total}`);

  const payload = {
    meta: {
      title: "HITSTER TRA · 888 בעברית · A-list",
      total: TARGET_TOTAL,
      perEra: TARGET_PER_ERA,
      eras: Object.keys(eras),
      languagePolicy: "Hebrew title and artist text only; no Latin letters",
      aListPolicy: "Only songs ranked in Israeli annual charts; lower annual rank is prioritized",
      artistTitleIntegrity: "Title and performing artist are extracted from explicitly mapped columns in the same verified chart row; selected 2020 collaborations are cross-checked against Apple Music.",
      yearPolicy: "Year shown is the verified annual-chart year for that song entry",
      blockedArtists: ["אייל גולן", "Michael Jackson"],
      generatedAt: new Date().toISOString(),
    },
    eras,
    provenance,
  };
  fs.writeFileSync(OUTPUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`Built ${TARGET_TOTAL}/${TARGET_TOTAL} Hebrew A-list HITSTER cards.`);
  for (const [era, cards] of Object.entries(eras)) console.log(`${era}: ${cards.length}/${TARGET_PER_ERA}`);
}

main().catch(error => { console.error(`HITSTER Hebrew A-list 888 build FAILED: ${error.message || error}`); process.exit(1); });
