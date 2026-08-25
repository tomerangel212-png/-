"use strict";

const ERA_RANGES = {
  "1980–1989": [1980, 1989],
  "1990–1999": [1990, 1999],
  "2000–2009": [2000, 2009],
  "2010–2020": [2010, 2020],
};
const TARGET_PER_ERA = 222;
const TARGET_TOTAL = 888;
const PREVIEW_SECONDS = 30;
const AUDIO_PROBE_TIMEOUT_MS = 8_000;
const AUDIO_CACHE_STORE = "hitster-tra-internal-israeli-audio-v1";
const MAX_INTERNAL_LOOKUPS = 24;
const BLOCKED_ARTIST_PARTS = ["אייל גולן", "michael jackson", "eyal golan"];
const TEAMS = [
  ["green", "ירוק · איילת ודודי"], ["blue", "תכלת · שרון ונווה"], ["gold", "זהב · נעמה ורז"],
  ["orange", "כתום · מעיין ומנואל"], ["silver", "כסף · עירית ונתן"],
];
const STORE = "hitster-tra-hebrew-alist-888-v5-tra99";
const $ = id => document.getElementById(id);
const state = {
  data: null,
  payload: null,
  era: "1980–1989",
  current: null,
  nextPick: null,
  nextPickPromise: null,
  previewGeneration: 0,
  used: new Set(),
  unplayable: new Set(),
  previewCache: new Map(),
  previewTimer: null,
  timelines: {},
  startRequested: false,
  bootstrapError: null,
};
TEAMS.forEach(([id]) => state.timelines[id] = []);

async function enableOffline() {
  if (!("serviceWorker" in navigator)) return false;
  try { await navigator.serviceWorker.register("./sw.js", { scope: "./" }); await navigator.serviceWorker.ready; return true; }
  catch { return false; }
}
function save() {
  localStorage.setItem(STORE, JSON.stringify({ used: [...state.used], timelines: state.timelines, era: state.era }));
}
function restore() {
  try {
    const x = JSON.parse(localStorage.getItem(STORE) || "null");
    if (!x) return;
    state.used = new Set(Array.isArray(x.used) ? x.used : []);
    if (x.timelines && typeof x.timelines === "object") TEAMS.forEach(([id]) => state.timelines[id] = Array.isArray(x.timelines[id]) ? x.timelines[id] : []);
    if (ERA_RANGES[x.era]) state.era = x.era;
  } catch {}
}
function restoreAudioCache() {
  try {
    const entries = JSON.parse(localStorage.getItem(AUDIO_CACHE_STORE) || "[]");
    if (Array.isArray(entries)) state.previewCache = new Map(entries.filter(row => Array.isArray(row) && row.length === 2 && typeof row[1] === "string"));
  } catch { state.previewCache = new Map(); }
}
function persistAudioCache() {
  try {
    const entries = [...state.previewCache.entries()].slice(-900);
    localStorage.setItem(AUDIO_CACHE_STORE, JSON.stringify(entries));
  } catch {}
}
function norm(value) { return String(value || "").normalize("NFKC").trim().toLocaleLowerCase("he"); }
function key(card) { return `${norm(card[0])}|${norm(card[1])}|${card[2]}`; }
function hasHebrew(value) { return /[\u0590-\u05FF]/.test(String(value || "")); }
function hasLatin(value) { return /[A-Za-z]/.test(String(value || "")); }
function blockedArtist(artist) { const a = norm(artist); return BLOCKED_ARTIST_PARTS.some(part => a.includes(norm(part))); }
function approvedSource(source) { return /^מצעד שנתי \d{4}$/.test(String(source || "")) || source === "גלגלצ מצעד שנתי 2020"; }
function validatePayload(payload) {
  const errors = [], duplicates = [], seen = new Set(); let total = 0, validEras = 0;
  if (!payload || typeof payload !== "object" || !payload.eras || !payload.provenance) return { ok: false, total: 0, validEras: 0, duplicates: [], errors: ["קובץ A-list חסר או לא תקין"] };
  for (const [era, [lo, hi]] of Object.entries(ERA_RANGES)) {
    const cards = payload.eras[era];
    if (!Array.isArray(cards) || cards.length !== TARGET_PER_ERA) { errors.push(`${era}: expected ${TARGET_PER_ERA}`); continue; }
    let eraOk = true;
    for (const card of cards) {
      total++;
      if (!Array.isArray(card) || card.length !== 3 || !card[0] || !card[1] || !Number.isInteger(card[2]) || card[2] < lo || card[2] > hi) {
        eraOk = false; errors.push(`${era}: invalid card`); continue;
      }
      if (!hasHebrew(card[0]) || hasLatin(card[0])) { eraOk = false; errors.push(`${card[0]}: title is not Hebrew-only`); }
      if (!hasHebrew(card[1]) || hasLatin(card[1])) { eraOk = false; errors.push(`${card[1]}: artist is not Hebrew-only`); }
      if (blockedArtist(card[1])) { eraOk = false; errors.push(`${card[1]}: blocked artist`); }
      const id = key(card); if (seen.has(id)) duplicates.push(id); seen.add(id);
      if (!approvedSource(payload.provenance[id]?.source)) { eraOk = false; errors.push(`${card[0]}: missing annual-chart A-list source`); }
    }
    if (eraOk) validEras++;
  }
  if (total !== TARGET_TOTAL) errors.push(`expected ${TARGET_TOTAL}, got ${total}`);
  if (duplicates.length) errors.push(`${duplicates.length} duplicate cards`);
  return { ok: errors.length === 0, total, validEras, duplicates, errors };
}
function trackAudio(event, properties = {}) {
  try { window.posthog?.capture?.(event, { ...properties, preview_seconds: PREVIEW_SECONDS, tra_version: "9.9" }); } catch {}
}
function allCards() { return Object.entries(state.data).flatMap(([era, cards]) => cards.map(card => ({ era, card }))); }
function pool() {
  if (!state.data) return [];
  const source = $("mode").value === "all" ? allCards() : (state.data[state.era] || []).map(card => ({ era: state.era, card }));
  return source.filter(({ card }) => !state.used.has(key(card)));
}
function invalidateNextPick() {
  state.previewGeneration += 1;
  state.nextPick = null;
  state.nextPickPromise = null;
  state.unplayable.clear();
}

function renderEras() {
  const host = $("eras"); host.replaceChildren();
  Object.keys(ERA_RANGES).forEach(era => {
    const count = state.data?.[era]?.length || 0;
    const b = document.createElement("button");
    b.type = "button";
    b.className = `era-btn${era === state.era ? " active" : ""}`;
    b.textContent = `${era} · ${count}`;
    b.onclick = () => {
      state.era = era; invalidateNextPick(); renderEras(); save();
      $("card-meta").textContent = "מיקום סודי על ציר 80 השנים";
      void primeNextPick();
    };
    host.append(b);
  });
}
function renderTimelines() {
  const host = $("timelines"); host.replaceChildren();
  TEAMS.forEach(([id, label]) => {
    const box = document.createElement("section"); box.className = "timeline";
    const h = document.createElement("h3"); h.textContent = label; box.append(h);
    const cards = document.createElement("div"); cards.className = "cards";
    [...state.timelines[id]].sort((a, b) => a[2] - b[2] || a[0].localeCompare(b[0], "he")).forEach(card => {
      const mini = document.createElement("div"); mini.className = "mini";
      const y = document.createElement("strong"); y.textContent = card[2];
      const t = document.createElement("span"); t.textContent = card[0];
      const a = document.createElement("span"); a.textContent = card[1];
      mini.append(y, t, a); cards.append(mini);
    });
    if (!cards.children.length) {
      const empty = document.createElement("span"); empty.className = "muted"; empty.textContent = "עדיין אין קלפים שנחשפו"; cards.append(empty);
    }
    box.append(cards); host.append(box);
  });
}

function stopAudio() {
  clearTimeout(state.previewTimer); state.previewTimer = null;
  const audio = $("audio"); audio.pause(); try { audio.currentTime = 0; } catch {}
  $("play").textContent = `▶ ${PREVIEW_SECONDS} שניות`;
}
function prepareAudio(previewUrl) {
  const audio = $("audio");
  if (!previewUrl) { audio.removeAttribute("src"); audio.load(); return; }
  if (audio.src !== previewUrl) {
    audio.src = previewUrl;
    audio.preload = "metadata";
    audio.playsInline = true;
    audio.load();
  }
}
function verifyPreview(previewUrl) {
  return new Promise(resolve => {
    if (!previewUrl) { resolve(false); return; }
    const probe = new Audio();
    let settled = false;
    let timer = null;
    const finish = ok => {
      if (settled) return;
      settled = true;
      if (timer) window.clearTimeout(timer);
      probe.removeEventListener("canplay", onCanPlay);
      probe.removeEventListener("error", onError);
      probe.pause();
      probe.removeAttribute("src");
      try { probe.load(); } catch {}
      resolve(ok);
    };
    const onCanPlay = () => {
      const duration = Number(probe.duration);
      finish(!Number.isFinite(duration) || duration >= PREVIEW_SECONDS - 1);
    };
    const onError = () => finish(false);
    probe.preload = "metadata";
    probe.playsInline = true;
    probe.addEventListener("canplay", onCanPlay, { once: true });
    probe.addEventListener("error", onError, { once: true });
    timer = window.setTimeout(() => finish(false), AUDIO_PROBE_TIMEOUT_MS);
    probe.src = previewUrl;
    probe.load();
  });
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function clean(value) {
  return String(value || "").normalize("NFKC").toLowerCase().replace(/[^a-z0-9א-ת]+/g, " ").trim();
}
function scoreCandidate(card, item) {
  const title = clean(card[0]), artist = clean(card[1]);
  const tt = clean(item.trackName), aa = clean(item.artistName);
  let score = 0;
  if (tt === title) score += 8;
  else if (tt.includes(title) || title.includes(tt)) score += 4;
  if (aa === artist) score += 6;
  else if (aa.includes(artist) || artist.includes(aa)) score += 3;
  return score;
}
async function lookupPreview(card) {
  const term = encodeURIComponent(`${card[0]} ${card[1]}`);
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&limit=12&country=IL`, { cache: "no-store" });
      if (!response.ok) {
        const error = new Error(`preview search HTTP ${response.status}`);
        error.transient = response.status === 429 || response.status >= 500;
        throw error;
      }
      const json = await response.json();
      const ranked = [...(json.results || [])]
        .filter(item => item.previewUrl)
        .map(item => ({ item, score: scoreCandidate(card, item) }))
        .sort((a, b) => b.score - a.score);
      return ranked[0]?.score >= 9 ? ranked[0].item.previewUrl : null;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await delay(350 * (attempt + 1));
    }
  }
  throw lastError || new Error("preview search failed");
}
async function resolvePreview(card, { force = false } = {}) {
  const id = key(card);
  if (!force && state.previewCache.has(id)) return state.previewCache.get(id);
  const url = await lookupPreview(card);
  if (url) {
    state.previewCache.set(id, url);
    persistAudioCache();
  }
  return url;
}
async function resolvePlayablePreview(card, { force = false } = {}) {
  const id = key(card);
  let preview = await resolvePreview(card, { force });
  if (preview && await verifyPreview(preview)) return preview;
  state.previewCache.delete(id);
  persistAudioCache();
  if (force) return null;
  preview = await resolvePreview(card, { force: true });
  if (preview && await verifyPreview(preview)) return preview;
  state.previewCache.delete(id);
  persistAudioCache();
  return null;
}
async function findPlayablePick() {
  const available = pool().filter(({ card }) => !state.unplayable.has(key(card)));
  if (!available.length) return null;
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  let transientFailures = 0;
  for (const pick of shuffled.slice(0, Math.min(MAX_INTERNAL_LOOKUPS, shuffled.length))) {
    try {
      const preview = await resolvePlayablePreview(pick.card);
      if (preview) return { era: pick.era, card: pick.card, preview };
      state.unplayable.add(key(pick.card));
      trackAudio("hitster_internal_candidate_skipped", { title: pick.card[0], artist: pick.card[1], reason: "preview_not_playable" });
    } catch (error) {
      transientFailures++;
      trackAudio("hitster_audio_lookup_failed", { error_name: error?.name || "Error", error_message: String(error?.message || "").slice(0, 160) });
      if (transientFailures >= 3) break;
    }
  }
  return null;
}

async function primeNextPick() {
  if (!state.data) return null;
  if (state.nextPick) return state.nextPick;
  if (state.nextPickPromise) return state.nextPickPromise;
  const generation = state.previewGeneration;
  $("draw").disabled = true;
  if (!state.current) $("status").textContent = "🎧 מכין שיר מהספרייה הישראלית הפנימית…";
  const request = findPlayablePick();
  state.nextPickPromise = request;
  const ready = await request;
  if (state.nextPickPromise === request) state.nextPickPromise = null;
  if (generation !== state.previewGeneration) {
    return null;
  }
  state.nextPick = ready;
  $("draw").disabled = !ready;
  if (ready && !state.current) prepareAudio(ready.preview);
  if (!state.current) {
    $("status").textContent = ready
      ? "🎵 מוכן · ההשמעה נשארת בתוך HITSTER"
      : (navigator.onLine ? "לא נמצא כרגע שיר פנימי מוכן. נסו שוב בעוד רגע." : "📴 אין כרגע שיר חדש שמור להשמעה. התחברו לרשת כדי להכין שירים נוספים.");
  }
  return ready;
}

function handlePreviewFailure(error, source) {
  $("play").textContent = "↻ נסו אודיו";
  trackAudio("hitster_audio_preview_failed", {
    source,
    error_name: error?.name || "Error",
    error_message: String(error?.message || "").slice(0, 160),
  });
  if (error?.name === "NotAllowedError") {
    $("play").disabled = false;
    $("play").textContent = `▶ ${PREVIEW_SECONDS} שניות`;
    $("status").textContent = "Safari חסם הפעלה אוטומטית. לחצו על ▶ 30 שניות — ההשמעה נשארת בתוך HITSTER.";
    return;
  }
  if (!state.current) return;
  const id = key(state.current.card);
  state.current.preview = null;
  state.unplayable.add(id);
  state.previewCache.delete(id);
  persistAudioCache();
  prepareAudio(null);
  $("play").disabled = false;
  $("draw").disabled = !state.nextPick;
  $("status").textContent = "🎧 הקלף כבר התחיל. קטע השמע אינו זמין כרגע — אפשר לחשוף את השנה ולמשוך את הקלף הבא.";
  void primeNextPick();
}
function fetchPreviewForCurrent(source, { force = false } = {}) {
  const current = state.current;
  if (!current) return;
  $("play").disabled = true;
  $("play").textContent = "🎧 טוען…";
  void resolvePlayablePreview(current.card, { force }).then(preview => {
    if (!preview) throw new Error("preview unavailable");
    if (state.current !== current) return;
    current.preview = preview;
    prepareAudio(preview);
    $("play").disabled = false;
    startPreview(source);
  }).catch(error => {
    if (state.current === current) handlePreviewFailure(error, source);
  });
}
function handleAudioEnded() {
  if (!state.previewTimer) return;
  window.clearTimeout(state.previewTimer);
  state.previewTimer = null;
  $("play").textContent = `▶ ${PREVIEW_SECONDS} שניות`;
  $("status").textContent = "קטע השמע הסתיים. אפשר לחשוף את השנה או למשוך את הקלף המוכן הבא.";
}
function startPreview(source = "manual") {
  if (!state.current?.preview) return false;
  const audio = $("audio");
  if (!audio.src) prepareAudio(state.current.preview);
  clearTimeout(state.previewTimer);
  try { audio.currentTime = 0; } catch {}
  $("play").disabled = false;
  let attempt;
  try { attempt = audio.play(); } catch (error) { handlePreviewFailure(error, source); return false; }
  Promise.resolve(attempt).then(() => {
    $("play").textContent = "■ עצירה";
    state.previewTimer = setTimeout(stopAudio, PREVIEW_SECONDS * 1000);
    $("status").textContent = `▶ מנגן ${PREVIEW_SECONDS} שניות בתוך HITSTER`;
    trackAudio("hitster_audio_preview_started", { source, library: "internal-israeli" });
  }).catch(error => handlePreviewFailure(error, source));
  return true;
}

function draw() {
  stopAudio();
  const pick = state.nextPick;
  if (!pick) {
    $("draw").disabled = true;
    $("status").textContent = state.data
      ? "🎧 מכין שיר פנימי שנבדק להשמעה…"
      : "טוען את המשחק…";
    void primeNextPick();
    return;
  }
  state.nextPick = null;
  state.current = pick;
  state.used.add(key(pick.card));
  save();
  $("revealed").hidden = true;
  $("concealed").hidden = false;
  $("card-meta").textContent = `מיקום סודי על ציר 80 השנים · קלף ${state.used.size}/${TARGET_TOTAL}`;
  $("reveal").disabled = false;
  prepareAudio(pick.preview || null);
  $("play").disabled = !pick.preview;
  $("draw").disabled = true;
  startPreview("draw");
  void primeNextPick();
}
function play30() {
  if (!state.current) return;
  if (!state.current.preview) {
    $("status").textContent = "🎧 מכין מחדש את ההשמעה הפנימית…";
    fetchPreviewForCurrent("play_button", { force: true });
    return;
  }
  const audio = $("audio");
  if (!audio.paused) { stopAudio(); return; }
  startPreview("play_button");
}
function reveal() {
  if (!state.current) return;
  stopAudio();
  const [title, artist, year] = state.current.card;
  $("year").textContent = year; $("title").textContent = title; $("artist").textContent = artist;
  $("concealed").hidden = true; $("revealed").hidden = false; $("reveal").disabled = true;
  const team = $("team").value;
  if (!state.timelines[team].some(card => key(card) === key(state.current.card))) state.timelines[team].push(state.current.card);
  save(); renderTimelines();
  $("status").textContent = `נוסף לציר הזמן של ${TEAMS.find(row => row[0] === team)[1]}.`;
}
function newGame({ skipConfirm = false } = {}) {
  if (!state.data) {
    if (state.bootstrapError) {
      window.location.reload();
      return;
    }
    state.startRequested = true;
    $("new-game").disabled = true;
    $("new-game").textContent = "⏳ טוען משחק…";
    $("status").textContent = "טוען את 888 הקלפים…";
    return;
  }
  const hasProgress = Boolean(state.current || state.used.size || Object.values(state.timelines).some(cards => cards.length));
  if (hasProgress && !skipConfirm && !confirm("להתחיל משחק חדש? כל צירי הזמן והקלפים שנמשכו יתאפסו.")) return;
  stopAudio();
  prepareAudio(null);
  state.used.clear();
  state.unplayable.clear();
  state.previewGeneration += 1;
  state.nextPickPromise = null;
  TEAMS.forEach(([id]) => state.timelines[id] = []);
  state.current = null;
  localStorage.removeItem(STORE);
  $("revealed").hidden = true;
  $("concealed").hidden = false;
  $("card-meta").textContent = "מיקום סודי על ציר 80 השנים";
  $("status").textContent = "🎮 המשחק התחיל · מושך קלף עם אודיו מוכן…";
  $("play").textContent = `▶ ${PREVIEW_SECONDS} שניות`;
  $("play").disabled = true;
  $("reveal").disabled = true;
  $("draw").disabled = true;
  $("new-game").disabled = false;
  $("new-game").textContent = "↻ משחק חדש";
  renderTimelines();
  if (state.nextPick) {
    draw();
    return;
  }
  $("new-game").disabled = true;
  $("new-game").textContent = "⏳ מכין אודיו…";
  void primeNextPick().then(ready => {
    if (state.current) return;
    $("new-game").disabled = false;
    $("new-game").textContent = ready ? "▶ שחק עכשיו" : "↻ נסו אודיו";
  });
}

async function init() {
  const offlineReady = await enableOffline();
  const response = await fetch("./hitster-hebrew-alist-888.json");
  if (!response.ok) throw new Error("מאגר 888 A-list בעברית לא נטען");
  state.payload = await response.json();
  state.data = state.payload.eras;
  const report = validatePayload(state.payload);
  $("m-total").textContent = report.total; $("m-era").textContent = `${report.validEras}/4`; $("m-dupes").textContent = report.duplicates.length;
  const badge = $("quality-badge");
  badge.textContent = report.ok
    ? (offlineReady ? (navigator.onLine ? "✅ TRA 9.9 · 888/888 זמינים · 10/10" : "📴 TRA 9.9 · 888/888 זמינים") : "✅ TRA 9.9 · 888/888 זמינים · 10/10")
    : "⛔ A-list Gate נכשל";
  if (!report.ok) {
    $("draw").disabled = true; $("status").textContent = report.errors[0] || "Quality gate failed"; return;
  }
  restore();
  restoreAudioCache();
  renderEras();
  renderTimelines();
  $("play").textContent = `▶ ${PREVIEW_SECONDS} שניות`;
  $("draw").onclick = draw; $("play").onclick = play30; $("reveal").onclick = reveal; $("new-game").onclick = () => newGame();
  $("audio").addEventListener("ended", handleAudioEnded);
  $("new-game").disabled = true;
  $("new-game").textContent = "🎧 מכין אודיו…";
  $("mode").addEventListener("change", () => { invalidateNextPick(); void primeNextPick(); });
  window.addEventListener("offline", () => { if (report.ok) badge.textContent = "📴 TRA 9.9 · 888/888 זמינים"; });
  window.addEventListener("online", () => {
    if (report.ok) {
      badge.textContent = "✅ TRA 9.9 · 888/888 זמינים · 10/10";
      invalidateNextPick();
      void primeNextPick();
    }
  });
  if (state.startRequested) {
    state.startRequested = false;
    newGame({ skipConfirm: true });
  } else {
    $("draw").disabled = true;
    $("status").textContent = "🎧 מכין שיר פנימי שנבדק להשמעה…";
    void primeNextPick().then(ready => {
      if (state.current) return;
      $("new-game").disabled = false;
      $("new-game").textContent = ready ? "▶ שחק עכשיו" : "↻ נסו אודיו";
    });
  }
}

$("new-game").onclick = () => newGame();
init().catch(error => {
  state.bootstrapError = error;
  $("quality-badge").textContent = "⛔ המשחק לא נטען";
  $("status").textContent = String(error.message || error);
  $("draw").disabled = true;
  $("new-game").disabled = false;
  $("new-game").textContent = "↻ נסו שוב";
});
