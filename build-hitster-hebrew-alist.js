"use strict";

const fs = require("fs");

const TARGET_PER_ERA = 222;
const TARGET_TOTAL = 888;
const OUTPUT = "hitster-hebrew-alist-888.json";
const PIZMONET_BASE = "https://pizmonet.co.il/wiki/";
const GLZ_2020_URL = "https://glz.co.il/%D7%92%D7%9C%D7%92%D7%9C%D7%A6/%D7%9B%D7%AA%D7%91%D7%95%D7%AA/%D7%94%D7%9E%D7%A6%D7%A2%D7%93-%D7%94%D7%A9%D7%A0%D7%AA%D7%99-%D7%94%D7%99%D7%A9%D7%A8%D7%90%D7%9C%D7%99-%D7%AA%D7%A9%D7%A4";

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
  [1,"שלמים","עידן רפאל חביב"],[2,"אם תרצי","חנן בן ארי"],[3,"מיליון דולר","נועה קירל"],[4,"ואז את תראי","דולי ופן, דקלה, עידן חביב"],
  [5,"זוט עני","אלה לי להב"],[6,"שמש","חנן בן ארי"],[7,"אל תעזבי ידיים","עקיבא"],[8,"אגרוף","עדן בן זקן"],
  [9,"סיבובים","עדן חסון"],[10,"נחכה לך","נתן גושן, ישי ריבו"],[11,"שבוע טוב","אברהם טל"],[12,"בין קודש לחול","אמיר דדון, שולי רנד"],
  [13,"את חסרה לי","עדן חסון"],[14,"לא יוצא למסיבות","מרגי"],[15,"באת לי פתאום","קרן פלס, רוני אלטר"],[16,"חביב אלבי","סטטיק ובן אל, נסרין"],
  [17,"Alien","Dennis Lloyd"],[18,"Feker Libi","עדן אלנה"],[19,"יש לי חור בלב בצורה שלך","ג'ירפות"],[20,"מאושרים","דולי ופן, לירן דנינו, נועה קירל"],
  [21,"אם אתה גבר","נועה קירל"],[22,"קוקוריקו","עדן בן זקן, עומר אדם"],[23,"רכבת הרים","אייל גולן"],[24,"פשוטים","עקיבא"],
  [25,"חצי בשבילי","איתי לוי"],[26,"בחלומות שלנו","דודו אהרון, עדן מאירי"],[27,"כתר מלוכה","ישי ריבו"],[28,"דיבור נגוע","מרגי"],
  [29,"מה עבר עליי","עדן חסון"],[30,"איפה את","אליעד"],[31,"אני רוצה","עידן עמדי"],[32,"תל אביב זה אני ואת","אמיר ובן, ג'יין בורדו"],
  [33,"קחי את הפחדים","בניה ברבי"],[34,"סדר עבודה","ישי ריבו"],[35,"עוד יום","פול טראנק"],[36,"במקום הכי רחוק","בניה ברבי"],
  [37,"חזרי אליי","נתן גושן"],[38,"לקחת את המפתחות","איתי לוי"],[39,"מסיבה","יסמין מועלם, שקל"],[40,"מים שקופים","עומר אדם"]
].map(([sourceRank,title,artist]) => ({ title, artist, year: 2020, sourceRank, source: "גלגלצ מצעד שנתי 2020", sourceUrl: GLZ_2020_URL }));

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

function parseAnnualChart(html, year, pageTitle) {
  const cards = [];
  for (const rowMatch of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...rowMatch[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m => decodeHtml(m[1]));
    if (cells.length < 3) continue;
    const rank = Number.parseInt(String(cells[0]).replace(/[^0-9]/g, ""), 10);
    if (!Number.isInteger(rank) || rank < 1 || rank > 60) continue;
    const title = cells[1];
    const artist = cells[2];
    cards.push({ title, artist, year, sourceRank: rank, source: `מצעד שנתי ${year}`, sourceUrl: `${PIZMONET_BASE}${encodeURIComponent(pageTitle)}` });
  }
  return cards;
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
    for (const card of selected) provenance[identity(card)] = { source: card.source, sourceRank: card.sourceRank, sourceUrl: card.sourceUrl };
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
