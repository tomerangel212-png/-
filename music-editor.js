"use strict";

const SCORE = [100,200,300,500,1000,2000,4000,8000,16000,32000,64000,125000,250000,500000,1000000];

const HOUR_SIZE = 14;
const NEW_TRACKS_REQUIRED = 4;
const NEW_CUTOFF_YEAR = 2024;
let hourTracks = [];
let dragIndex = null;
let transitionChecks = new Set();

function songLanguage(song) {
  return /[\u0590-\u05ff]/.test(`${song.title} ${song.artist}`) ? "עברית" : "לועזית";
}
function isNewSong(song) { return Number(song.year) >= NEW_CUTOFF_YEAR; }
function metadata(song) {
  return {
    language: song.language || songLanguage(song),
    genre: String(song.genre || "").trim(),
    composer: String(song.composer || "").trim(),
    energy: Number(song.energy),
    nightSuitable: song.nightSuitable
  };
}
function longestRun(list, predicate) {
  let best = 0, currentRun = 0;
  list.forEach(item => { currentRun = predicate(item) ? currentRun + 1 : 0; best = Math.max(best, currentRun); });
  return best;
}
function pickDiverse(pool, count, selected=[]) {
  const picks = [];
  const remaining = shuffle(pool);
  while (picks.length < count && remaining.length) {
    let index = remaining.findIndex(song => {
      const all = [...selected, ...picks];
      return !all.some(existing => norm(existing.artist) === norm(song.artist)) &&
        !all.some(existing => decade(existing.year) === decade(song.year));
    });
    if (index < 0) index = remaining.findIndex(song => ![...selected, ...picks].some(existing => norm(existing.artist) === norm(song.artist)));
    if (index < 0) index = 0;
    picks.push(remaining.splice(index, 1)[0]);
  }
  return picks;
}
function buildHour() {
  const pool = filteredCatalog();
  const newPool = pool.filter(isNewSong);
  const olderPool = pool.filter(song => !isNewSong(song));
  if (newPool.length < NEW_TRACKS_REQUIRED || olderPool.length < HOUR_SIZE - NEW_TRACKS_REQUIRED) {
    throw new Error("אין מספיק שירים מאומתים כדי לבנות שעה של 14 עם ארבעה חדשים.");
  }
  const fresh = pickDiverse(newPool, NEW_TRACKS_REQUIRED);
  const older = pickDiverse(olderPool, HOUR_SIZE - NEW_TRACKS_REQUIRED, fresh);
  hourTracks = shuffle([...fresh, ...older]);
  transitionChecks = new Set();
  renderHour();
  track("music_editor_hour_built", { size:HOUR_SIZE, new_tracks:fresh.length });
}
function reorderHour(from, to) {
  if (from === to || from === null || to === null) return;
  const [moved] = hourTracks.splice(from, 1);
  hourTracks.splice(to, 0, moved);
  transitionChecks = new Set();
  renderHour();
  track("music_editor_hour_reordered", { from, to });
}
function hourScore() {
  const exactSize = hourTracks.length === HOUR_SIZE;
  const newCount = hourTracks.filter(isNewSong).length;
  const exactNew = newCount === NEW_TRACKS_REQUIRED;
  const decades = new Set(hourTracks.map(song => decade(song.year))).size;
  const artists = new Set(hourTracks.map(song => norm(song.artist))).size;
  const languages = new Set(hourTracks.map(song => metadata(song).language)).size;
  const maxNewRun = longestRun(hourTracks, isNewSong);
  const oldSameLanguageCrosses = hourTracks.slice(1).filter((song, index) => {
    const previous = hourTracks[index];
    return !isNewSong(previous) && !isNewSong(song) && metadata(previous).language === metadata(song).language;
  }).length;
  const tagged = hourTracks.filter(song => metadata(song).genre && metadata(song).composer).length;
  const score =
    (exactSize ? 200 : 0) +
    (exactNew ? 200 : 0) +
    Math.min(100, Math.max(0, decades - 1) * 20) +
    Math.min(100, artists * 8) +
    (languages >= 2 ? 60 : 0) +
    (maxNewRun <= 2 ? 120 : 0) +
    (oldSameLanguageCrosses === 0 ? 160 : 0) +
    Math.round((transitionChecks.size / Math.max(1, HOUR_SIZE - 1)) * 60);
  return { score, newCount, decades, artists, languages, maxNewRun, oldSameLanguageCrosses, tagged };
}
function renderHour() {
  const host = $("hour-list");
  const count = $("hour-count");
  const scoreEl = $("hour-score");
  const rubric = $("hour-rubric");
  host.replaceChildren();
  const review = hourScore();
  const exactSize = hourTracks.length === HOUR_SIZE;
  count.textContent = `${hourTracks.length}/${HOUR_SIZE} שירים · ${review.newCount}/${NEW_TRACKS_REQUIRED} חדשים`;
  scoreEl.textContent = `ניקוד עריכה: ${review.score}/1000`;
  hourTracks.forEach((song, index) => {
    const row = document.createElement("li");
    row.className = "hour-track";
    row.draggable = true;
    row.dataset.index = String(index);
    const meta = metadata(song);
    row.innerHTML = `<span class="hour-number">${index + 1}</span><div class="hour-main"><div class="hour-title">${song.title}${isNewSong(song) ? '<span class="new-badge">חדש</span>' : ""}</div><span class="hour-meta">${song.artist} · ${song.year} · ${meta.language}</span></div>`;
    row.addEventListener("dragstart", event => { dragIndex = index; row.classList.add("dragging"); event.dataTransfer.effectAllowed = "move"; });
    row.addEventListener("dragend", () => { dragIndex = null; row.classList.remove("dragging"); document.querySelectorAll(".hour-track").forEach(item => item.classList.remove("drag-over")); });
    row.addEventListener("dragover", event => { event.preventDefault(); row.classList.add("drag-over"); });
    row.addEventListener("dragleave", () => row.classList.remove("drag-over"));
    row.addEventListener("drop", event => { event.preventDefault(); reorderHour(dragIndex, index); });
    if (index < hourTracks.length - 1) {
      const check = document.createElement("button");
      check.type = "button";
      check.className = `transition-check${transitionChecks.has(index) ? " done" : ""}`;
      check.textContent = transitionChecks.has(index) ? "✓ קרוס סגנון+קצב אושר" : "אמת קרוס סגנון+קצב";
      check.onclick = () => { transitionChecks.add(index); renderHour(); track("music_editor_transition_checked", { index:index + 1 }); };
      row.append(check);
    }
    host.append(row);
  });
  const issues = [];
  if (!exactSize) issues.push("חובה 14 שירים בדיוק");
  if (review.newCount !== NEW_TRACKS_REQUIRED) issues.push("חובה ארבעה חדשים בדיוק");
  if (review.maxNewRun > 2) issues.push("יותר משני שירים חדשים ברצף");
  if (review.oldSameLanguageCrosses) issues.push(`${review.oldSameLanguageCrosses} קרוסים של שני שירים ישנים באותה שפה`);
  if (transitionChecks.size < Math.max(0, hourTracks.length - 1)) issues.push(`אושרו ${transitionChecks.size}/${Math.max(0, hourTracks.length - 1)} קרוסים בהאזנה`);
  rubric.innerHTML = `<strong>כללי פיילוט 1:</strong> הקרוס חייב להתאים קודם כול סגנונית וקצבית; האנרגיה נעה בגל, ללא היפוכים חדים; אין רצף ארוך של חדשים; אין שני ישנים באותה שפה ברצף; פופ גדול אינו ברירת מחדל ללילה. <br><strong>בקרת נתונים:</strong> ${review.tagged}/${hourTracks.length} שירים כוללים תגיות סגנון ומלחין מאומתות — נתון חסר אינו מקבל נקודות ואינו מומצא. ${issues.length ? '<br><strong>לטיפול:</strong> ' + issues.join(" · ") : '<br><strong>מוכן לבדיקת עורך.</strong>'}`;
}
function setupHourBuilder() {
  $("build-hour").onclick = () => { try { buildHour(); } catch (error) { $("hour-rubric").textContent = String(error.message || error); } };
  $("reshuffle-hour").onclick = () => { if (hourTracks.length === HOUR_SIZE) { hourTracks = shuffle(hourTracks); transitionChecks = new Set(); renderHour(); } else { buildHour(); } };
  buildHour();
}

const ERA_OPTIONS = [1960,1970,1980,1990,2000,2010,2020,2026];
const SOURCES = Object.freeze({
  hitster: "HITSTER TRA · 888",
  pizmonetHebrew: "פזמונט · מצעד עברי שנתי",
  pizmonetIntl: "פזמונט · מצעד לועזי שנתי",
  official: "Official Charts UK",
  glz: "גלגלצ · המצעד הישראלי"
});

// Verified chart-extension examples for decades outside the 1980–2020 HITSTER 888 core,
// plus international chart anchors across the requested eras. The core 888 is loaded live
// from hitster-hebrew-alist-888.json so both games share one canonical deck.
const CHART_EXTENSION = [
  {title:"על כפיו יביא",artist:"רבקה זהר",year:1969,market:"IL",source:SOURCES.pizmonetHebrew,rank:1},
  {title:"The Ballad of John and Yoko",artist:"The Beatles",year:1969,market:"INTL",source:SOURCES.pizmonetIntl,rank:1},
  {title:"פתאום עכשיו פתאום היום",artist:"שלמה ארצי",year:1970,market:"IL",source:SOURCES.pizmonetHebrew,rank:1},
  {title:"הללויה",artist:"חלב ודבש",year:1979,market:"IL",source:SOURCES.pizmonetHebrew,rank:1},
  {title:"In the Summertime",artist:"Mungo Jerry",year:1970,market:"INTL",source:SOURCES.official,rank:1},
  {title:"Bridge Over Troubled Water",artist:"Simon & Garfunkel",year:1970,market:"INTL",source:SOURCES.official,rank:1},
  {title:"Another Brick in the Wall",artist:"Pink Floyd",year:1980,market:"INTL",source:SOURCES.official,rank:1},
  {title:"I Have a Dream",artist:"ABBA",year:1980,market:"INTL",source:SOURCES.official,rank:2},
  {title:"Nothing Compares 2 U",artist:"Sinéad O’Connor",year:1990,market:"INTL",source:SOURCES.pizmonetIntl,rank:1},
  {title:"Vogue",artist:"Madonna",year:1990,market:"INTL",source:SOURCES.pizmonetIntl,rank:3},
  {title:"I Have a Dream / Seasons in the Sun",artist:"Westlife",year:2000,market:"INTL",source:SOURCES.official,rank:1},
  {title:"I Try",artist:"Macy Gray",year:2000,market:"INTL",source:SOURCES.official,rank:15},
  {title:"Replay",artist:"Iyaz",year:2010,market:"INTL",source:SOURCES.official,rank:1},
  {title:"Bad Romance",artist:"Lady Gaga",year:2010,market:"INTL",source:SOURCES.official,rank:4},
  {title:"Rockstar",artist:"DaBaby ft. Roddy Ricch",year:2020,market:"INTL",source:SOURCES.official,rank:1},
  {title:"Rain on Me",artist:"Lady Gaga & Ariana Grande",year:2020,market:"INTL",source:SOURCES.official,rank:2},
  {title:"Blinding Lights",artist:"The Weeknd",year:2020,market:"INTL",source:SOURCES.official,rank:2},
  {title:"איך שהיא רוקדת",artist:"עדן חסון, אופק אדנק, אגם בוחבוט",year:2026,market:"IL",source:SOURCES.glz,rank:1},
  {title:"עשר רמות מעליו",artist:"אודיה",year:2026,market:"IL",source:SOURCES.glz,rank:2},
  {title:"יוצאת מן הכלל",artist:"ליעד מאיר ואופק אדנק",year:2026,market:"IL",source:SOURCES.glz,rank:3},
  {title:"אבי הטחול",artist:"רואי אדם",year:2026,market:"IL",source:SOURCES.glz,rank:4},
  {title:"06",artist:"איתי לוי",year:2026,market:"IL",source:SOURCES.glz,rank:5},
  {title:"Rein Me In",artist:"Sam Fender & Olivia Dean",year:2026,market:"INTL",source:SOURCES.official,rank:1},
  {title:"Dai Dai",artist:"Shakira & Burna Boy",year:2026,market:"INTL",source:SOURCES.official,rank:2},
  {title:"Hate That I Made You Love Me",artist:"Ariana Grande",year:2026,market:"INTL",source:SOURCES.official,rank:3},
  {title:"Petal",artist:"Ariana Grande",year:2026,market:"INTL",source:SOURCES.official,rank:4},
  {title:"Choosin' Texas",artist:"Ella Langley",year:2026,market:"INTL",source:SOURCES.official,rank:5}
];

const $ = id => document.getElementById(id);
const shuffle = list => [...list].sort(() => Math.random() - 0.5);
const decade = year => year === 2026 ? 2026 : Math.floor(Number(year) / 10) * 10;
const norm = value => String(value || "").normalize("NFKC").trim().toLocaleLowerCase("he");
const key = song => `${norm(song.title)}|${norm(song.artist)}|${song.year}`;

let catalog = [...CHART_EXTENSION];
let hitsterCount = 0;
let selectedEra = "all";
let level = 0;
let locked = false;
let current = null;
let used = new Set();
const lifelines = { fifty:false, hint:false, skip:false };

function track(name, properties={}) {
  try { window.posthog?.capture?.(name, properties); } catch {}
}

function filteredCatalog() {
  const list = selectedEra === "all" ? catalog : catalog.filter(song => decade(song.year) === Number(selectedEra));
  return list.length ? list : catalog;
}

function uniqueSongs(list) {
  const seen = new Set();
  return list.filter(song => {
    const id = key(song);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

async function loadCatalog() {
  const response = await fetch("./hitster-hebrew-alist-888.json", { cache:"no-store" });
  if (!response.ok) throw new Error(`HITSTER 888 לא נטען (${response.status})`);
  const payload = await response.json();
  const hitster = Object.values(payload.eras || {}).flatMap(cards => cards.map(([title,artist,year]) => ({
    title, artist, year:Number(year), market:"IL", source:SOURCES.hitster, rank:null, hitster:true
  })));
  hitsterCount = hitster.length;
  if (hitsterCount !== 888) throw new Error(`ציפינו ל־888 שירי HITSTER, התקבלו ${hitsterCount}`);
  catalog = uniqueSongs([...hitster, ...CHART_EXTENSION]);
  $("catalog-count").textContent = `${hitsterCount}/888 HITSTER + ${catalog.length - hitsterCount} להיטי מצעדים`;
  $("catalog-note").textContent = `סה״כ ${catalog.length} שירים זמינים למשחק · ישראלי + בינלאומי`;
  track("music_editor_catalog_loaded", { hitster:hitsterCount, total:catalog.length, eras:ERA_OPTIONS.join(",") });
}

function distractorsFor(field, answer, pool, count=3) {
  const values = uniqueSongs(pool).map(song => song[field]).filter(Boolean).filter(value => norm(value) !== norm(answer));
  return shuffle([...new Set(values)]).slice(0, count);
}

function yearDistractors(song) {
  const d = decade(song.year);
  const candidates = selectedEra === "2026" || d === 2026
    ? [2023,2024,2025,2026]
    : [song.year - 3, song.year - 1, song.year + 1, song.year + 3].filter(y => y > 1959 && y <= 2026);
  return shuffle([...new Set(candidates.filter(y => y !== song.year))]).slice(0,3);
}

function buildQuestion(song) {
  const pool = filteredCatalog();
  const types = ["artist","year","title","market"];
  const type = types[level % types.length];
  if (type === "artist") {
    const options = shuffle([song.artist, ...distractorsFor("artist", song.artist, pool)]);
    return { q:`מי המבצע/ת של “${song.title}”?`, options, answer:song.artist, hint:`${song.year} · ${song.source}` };
  }
  if (type === "title") {
    const options = shuffle([song.title, ...distractorsFor("title", song.title, pool)]);
    return { q:`איזה שיר של ${song.artist} שייך לבחירה הזו?`, options, answer:song.title, hint:`שנת ${song.year} · ${song.source}` };
  }
  if (type === "market") {
    const correct = song.market === "IL" ? "מצעד ישראלי" : "מצעד בינלאומי";
    const options = shuffle([correct, "מצעד ישראלי", "מצעד בינלאומי", "לא מתוך מצעד"].filter((v,i,a)=>a.indexOf(v)===i));
    while (options.length < 4) options.push("בחירת מערכת ללא מצעד");
    return { q:`באיזה הקשר מצעדי נכנס “${song.title}” למאגר?`, options:shuffle(options), answer:correct, hint:song.source };
  }
  const options = shuffle([String(song.year), ...yearDistractors(song).map(String)]);
  return { q:`באיזו שנה משויך “${song.title}” של ${song.artist}?`, options, answer:String(song.year), hint:`תקופה: ${decade(song.year) === 2026 ? "2026" : decade(song.year) + "s"}` };
}

function pickSong() {
  const pool = filteredCatalog().filter(song => !used.has(key(song)));
  const source = pool.length ? pool : filteredCatalog();
  if (!pool.length) used.clear();
  const song = source[Math.floor(Math.random() * source.length)];
  used.add(key(song));
  return song;
}

function renderLadder() {
  const host = $("ladder");
  host.replaceChildren();
  SCORE.forEach((score,index) => {
    const row = document.createElement("div");
    row.className = `rung${index===level?" current":""}${index<level?" done":""}${[4,9,14].includes(index)?" safe":""}`;
    row.innerHTML = `<span>${index+1}</span><span>${score.toLocaleString("he-IL")}</span>`;
    host.append(row);
  });
}

function renderQuestion() {
  if (level >= SCORE.length) return finish(true);
  locked = false;
  const song = pickSong();
  const data = buildQuestion(song);
  current = { song, ...data };
  $("level").textContent = `שלב ${level+1}/15`;
  $("score").textContent = `${SCORE[level].toLocaleString("he-IL")} נקודות`;
  $("source").textContent = `${song.source}${song.rank ? ` · #${song.rank}` : ""}`;
  $("question").textContent = data.q;
  $("feedback").innerHTML = `בחרו תשובה. <strong>${selectedEra === "all" ? "כל התקופות" : selectedEra}</strong> פעיל.`;
  $("next").disabled = true;
  const host = $("answers"); host.replaceChildren();
  data.options.slice(0,4).forEach(value => {
    const button = document.createElement("button");
    button.className = "answer"; button.type = "button"; button.textContent = value;
    button.onclick = () => answer(button, value);
    host.append(button);
  });
  renderLadder();
}

function answer(button, value) {
  if (locked) return;
  locked = true;
  const correct = norm(value) === norm(current.answer);
  document.querySelectorAll(".answer").forEach(b => {
    b.disabled = true;
    if (norm(b.textContent) === norm(current.answer)) b.classList.add("correct");
  });
  if (!correct) button.classList.add("wrong");
  $("feedback").innerHTML = correct
    ? `<strong>נכון.</strong> ${current.song.title} · ${current.song.artist} · ${current.song.year}. עורך טוב יודע גם את ההקשר, לא רק את השם.`
    : `<strong>לא נכון.</strong> התשובה: ${current.answer}. ${current.song.title} · ${current.song.artist} · ${current.song.year}.`;
  track("music_editor_answer", { correct, level:level+1, title:current.song.title, artist:current.song.artist, year:current.song.year, source:current.song.source });
  if (!correct) return finish(false);
  $("next").disabled = false;
}

function finish(won) {
  const card = $("game-card");
  const safeScore = level <= 4 ? 0 : level <= 9 ? SCORE[4] : SCORE[9];
  const score = won ? SCORE[14] : safeScore;
  card.innerHTML = `<div class="finish"><h2>${won ? "🏆 כיסא העורך שלך" : "🎚️ המשמרת הסתיימה"}</h2><p>${won ? "הגעת ל־1,000,000 נקודות עריכה." : `נשארת עם ${score.toLocaleString("he-IL")} נקודות בטוחות.`}</p><p>המאגר הפעיל: ${hitsterCount}/888 שירי HITSTER + להיטי מצעדים ישראליים ובינלאומיים.</p><button class="restart" type="button" onclick="location.reload()">משחק חדש</button></div>`;
  track("music_editor_finished", { won, level:level+1, score });
}

function setupEraButtons() {
  document.querySelectorAll(".era").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll(".era").forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    selectedEra = button.dataset.era;
    used.clear();
    renderQuestion();
    track("music_editor_era_selected", { era:selectedEra });
  }));
}

function setupLifelines() {
  $("fifty").onclick = () => {
    if (lifelines.fifty || locked || !current) return;
    lifelines.fifty = true; $("fifty").disabled = true;
    const wrong = shuffle([...document.querySelectorAll(".answer")].filter(b => norm(b.textContent) !== norm(current.answer))).slice(0,2);
    wrong.forEach(b => { b.disabled = true; b.style.opacity = ".28"; });
  };
  $("hint").onclick = () => {
    if (lifelines.hint || locked || !current) return;
    lifelines.hint = true; $("hint").disabled = true;
    $("feedback").innerHTML = `<strong>רמז מקצועי:</strong> ${current.hint}`;
  };
  $("skip").onclick = () => {
    if (lifelines.skip || locked) return;
    lifelines.skip = true; $("skip").disabled = true; renderQuestion();
  };
  $("next").onclick = () => { if (!locked) return; level += 1; renderQuestion(); };
}

async function init() {
  setupEraButtons(); setupLifelines(); renderLadder();
  try {
    await loadCatalog();
    setupHourBuilder();
    renderQuestion();
    track("music_editor_opened", { hitster_target:888, requested_eras:ERA_OPTIONS.join(",") });
  } catch (error) {
    $("catalog-count").textContent = "⛔ מאגר HITSTER 888 לא נטען";
    $("catalog-note").textContent = String(error.message || error);
    $("question").textContent = "המשחק נעצר כדי לא להציג מאגר חלקי או מומצא.";
    $("answers").replaceChildren();
  }
}

init();
