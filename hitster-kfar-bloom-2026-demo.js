"use strict";

const HEZEL_EXPECTED_TOTAL = 4549;
const HEZEL_EXPECTED_SNAPSHOT = "55b2c83a2519044d0bbc7ff1bc54537b138661f1e887b812b72fb54baa328e9c";
const PREVIEW_SECONDS = 30;
const TEAMS = [
  ["green", "ירוק · איילת ודודי"],
  ["blue", "תכלת · שרון ונווה"],
  ["gold", "זהב · נעמה ורז"],
  ["orange", "כתום · מעיין ומנואל"],
  ["silver", "כסף · עירית ונתן"],
];
const GAME_STORE = "hitster-tra-hezel-4549-v1";
const DB_NAME = "hitster-tra-internal-library-v1";
const DB_VERSION = 1;
const CARD_STORE = "cards";
const AUDIO_STORE = "audio";
const META_STORE = "meta";
const $ = (id) => document.getElementById(id);

const state = {
  cards: [],
  current: null,
  used: new Set(),
  timelines: Object.fromEntries(TEAMS.map(([id]) => [id, []])),
  previewTimer: null,
  currentObjectUrl: null,
  audioCount: 0,
};

function normalize(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase("he")
    .replace(/[״”]/g, '"')
    .replace(/[׳’]/g, "'")
    .replace(/[^a-z0-9\u0590-\u05ff]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function cardKey(card) { return card.id; }
function filenameKey(file) { return normalize(file.name.replace(/\.[^.]+$/, "")); }
function cardSearchKey(card) { return normalize(`${card.title} ${card.artist}`); }

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(CARD_STORE)) db.createObjectStore(CARD_STORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(AUDIO_STORE)) db.createObjectStore(AUDIO_STORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE, { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbGetAll(storeName) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}
async function dbGet(storeName, id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}
async function dbPutMany(storeName, rows) {
  if (!rows.length) return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    for (const row of rows) store.put(row);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
    tx.onabort = () => { db.close(); reject(tx.error); };
  });
}
async function dbClear(storeName) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const req = tx.objectStore(storeName).clear();
    req.onsuccess = () => undefined;
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => { db.close(); resolve(); };
  });
}

function readStoredZipEntry(arrayBuffer, targetName) {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  const decoder = new TextDecoder("utf-8");
  let offset = 0;
  while (offset + 30 <= bytes.length) {
    if (view.getUint32(offset, true) !== 0x04034b50) break;
    const flags = view.getUint16(offset + 6, true);
    const method = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const filenameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const filenameStart = offset + 30;
    const filenameEnd = filenameStart + filenameLength;
    const filename = decoder.decode(bytes.subarray(filenameStart, filenameEnd));
    const dataStart = filenameEnd + extraLength;
    if (flags & 0x08) throw new Error("Hezel ZIP uses unsupported data descriptors");
    if (filename === targetName) {
      if (method !== 0) throw new Error(`${targetName} is compressed; stored entry required`);
      return bytes.slice(dataStart, dataStart + compressedSize).buffer;
    }
    offset = dataStart + compressedSize;
  }
  throw new Error(`${targetName} not found in Hezel backup`);
}

function cardsFromHezelBackup(backup) {
  if (!backup || !Array.isArray(backup.songs)) throw new Error("קובץ Hezel לא מכיל רשימת שירים תקינה");
  return backup.songs.map((song, index) => {
    const attributes = song?.attributes || {};
    const playParams = attributes.playParams || {};
    const title = String(attributes.name || "").trim();
    const artist = String(attributes.artistName || "").trim();
    if (!title || !artist) throw new Error(`שיר ${index + 1} חסר שם או אמן`);
    return {
      id: String(song.id || playParams.musicKit_libraryID || `hezel-${index + 1}`),
      title,
      artist,
      album: String(attributes.albumName || "").trim(),
      catalogId: String(attributes.catalogID || playParams.catalogId || ""),
      trackNumber: Number.isInteger(attributes.trackNumber) ? attributes.trackNumber : null,
      libraryIndex: index + 1,
    };
  });
}

async function importHezel(file) {
  $("library-status").textContent = "קורא את גיבוי Hezel…";
  const buffer = await file.arrayBuffer();
  const jsonBuffer = readStoredZipEntry(buffer, "backup.json");
  const backup = JSON.parse(new TextDecoder("utf-8").decode(jsonBuffer));
  const cards = cardsFromHezelBackup(backup);
  if (cards.length !== HEZEL_EXPECTED_TOTAL) {
    throw new Error(`ציפיתי ל-${HEZEL_EXPECTED_TOTAL} שירים, נמצאו ${cards.length}`);
  }
  await dbClear(CARD_STORE);
  for (let i = 0; i < cards.length; i += 300) await dbPutMany(CARD_STORE, cards.slice(i, i + 300));
  await dbPutMany(META_STORE, [
    { key: "library", total: cards.length, snapshotID: backup.snapshotID || "", backupDate: backup.backupDate || null, importedAt: Date.now() },
  ]);
  state.cards = cards;
  state.used.clear();
  localStorage.removeItem(GAME_STORE);
  renderLibrary();
  renderCurrentEmpty();
  $("library-status").textContent = `✅ ${cards.length.toLocaleString("he-IL")} קלפים נטענו ונשמרו פנימית במכשיר`;
}

async function countAudio() {
  const rows = await dbGetAll(AUDIO_STORE);
  state.audioCount = rows.length;
  renderLibrary();
}

async function importAudio(files) {
  if (!state.cards.length) throw new Error("טענו קודם את ספריית Hezel");
  const cards = state.cards;
  const exact = new Map(cards.map((card) => [cardSearchKey(card), card]));
  const titleOnly = new Map();
  for (const card of cards) {
    const key = normalize(card.title);
    if (!titleOnly.has(key)) titleOnly.set(key, []);
    titleOnly.get(key).push(card);
  }
  const rows = [];
  let matched = 0;
  for (const file of files) {
    const fk = filenameKey(file);
    let card = exact.get(fk) || null;
    if (!card) {
      const candidates = titleOnly.get(fk) || [];
      if (candidates.length === 1) card = candidates[0];
    }
    if (!card) {
      card = cards.find((candidate) => {
        const title = normalize(candidate.title);
        const artist = normalize(candidate.artist);
        return fk.includes(title) && (!artist || fk.includes(artist));
      }) || null;
    }
    if (!card) continue;
    rows.push({ id: card.id, blob: file, name: file.name, type: file.type || "audio/mpeg", size: file.size, importedAt: Date.now() });
    matched += 1;
    if (rows.length >= 100) { await dbPutMany(AUDIO_STORE, rows.splice(0)); }
  }
  if (rows.length) await dbPutMany(AUDIO_STORE, rows);
  await countAudio();
  $("library-status").textContent = `🎧 ${matched} קובצי אודיו שויכו · ${state.audioCount}/${HEZEL_EXPECTED_TOTAL} זמינים מקומית`;
}

function saveGame() {
  localStorage.setItem(GAME_STORE, JSON.stringify({ used: [...state.used], timelines: state.timelines }));
}
function restoreGame() {
  try {
    const x = JSON.parse(localStorage.getItem(GAME_STORE) || "null");
    if (!x) return;
    state.used = new Set(Array.isArray(x.used) ? x.used : []);
    if (x.timelines && typeof x.timelines === "object") {
      for (const [id] of TEAMS) state.timelines[id] = Array.isArray(x.timelines[id]) ? x.timelines[id] : [];
    }
  } catch {}
}

function renderLibrary() {
  $("m-total").textContent = state.cards.length.toLocaleString("he-IL");
  $("m-audio").textContent = state.audioCount.toLocaleString("he-IL");
  $("quality-badge").textContent = state.cards.length === HEZEL_EXPECTED_TOTAL
    ? `✅ ${HEZEL_EXPECTED_TOTAL.toLocaleString("he-IL")}/${HEZEL_EXPECTED_TOTAL.toLocaleString("he-IL")} · ספרייה פנימית`
    : `📥 טענו Hezel · יעד ${HEZEL_EXPECTED_TOTAL.toLocaleString("he-IL")}`;
  $("draw").disabled = state.cards.length === 0;
  renderTimelines();
}
function renderTimelines() {
  const host = $("timelines");
  host.replaceChildren();
  for (const [id, label] of TEAMS) {
    const box = document.createElement("section");
    box.className = "timeline";
    const h = document.createElement("h3");
    h.textContent = label;
    const cards = document.createElement("div");
    cards.className = "cards";
    for (const item of state.timelines[id]) {
      const mini = document.createElement("div");
      mini.className = "mini";
      const t = document.createElement("strong");
      t.textContent = item.title;
      const a = document.createElement("span");
      a.textContent = item.artist;
      mini.append(t, a);
      cards.append(mini);
    }
    if (!cards.children.length) {
      const empty = document.createElement("span");
      empty.className = "muted";
      empty.textContent = "עדיין אין קלפים שנחשפו";
      cards.append(empty);
    }
    box.append(h, cards);
    host.append(box);
  }
}
function renderCurrentEmpty() {
  state.current = null;
  $("revealed").hidden = true;
  $("concealed").hidden = false;
  $("card-meta").textContent = state.cards.length ? `ספריית Hezel · ${state.cards.length.toLocaleString("he-IL")} קלפים` : "טענו ספריית Hezel כדי להתחיל";
  $("play").disabled = true;
  $("reveal").disabled = true;
  stopAudio();
}

function stopAudio() {
  clearTimeout(state.previewTimer);
  state.previewTimer = null;
  const audio = $("audio");
  audio.pause();
  try { audio.currentTime = 0; } catch {}
  audio.removeAttribute("src");
  if (state.currentObjectUrl) URL.revokeObjectURL(state.currentObjectUrl);
  state.currentObjectUrl = null;
  $("play").textContent = `▶ ${PREVIEW_SECONDS} שניות`;
}
async function prepareCurrentAudio() {
  stopAudio();
  if (!state.current) return false;
  const row = await dbGet(AUDIO_STORE, state.current.id);
  if (!row?.blob) return false;
  state.currentObjectUrl = URL.createObjectURL(row.blob);
  const audio = $("audio");
  audio.src = state.currentObjectUrl;
  audio.preload = "metadata";
  audio.playsInline = true;
  audio.load();
  return true;
}
async function startPreview() {
  if (!state.current) return;
  const audio = $("audio");
  if (!audio.src) {
    const ready = await prepareCurrentAudio();
    if (!ready) {
      $("status").textContent = "אין עדיין קובץ אודיו מקומי לקלף הזה.";
      return;
    }
  }
  try { audio.currentTime = 0; } catch {}
  try {
    await audio.play();
    $("play").textContent = "■ עצירה";
    $("status").textContent = `▶ מנגן מקומית ${PREVIEW_SECONDS} שניות`;
    state.previewTimer = setTimeout(stopAudio, PREVIEW_SECONDS * 1000);
  } catch {
    $("status").textContent = "הדפדפן חסם הפעלה. לחצו שוב על ▶.";
  }
}

function availableCards() {
  return state.cards.filter((card) => !state.used.has(cardKey(card)));
}
async function draw() {
  stopAudio();
  let pool = availableCards();
  if (!pool.length) {
    state.used.clear();
    pool = availableCards();
  }
  if (!pool.length) return;
  const card = pool[Math.floor(Math.random() * pool.length)];
  state.current = card;
  state.used.add(cardKey(card));
  saveGame();
  $("revealed").hidden = true;
  $("concealed").hidden = false;
  $("card-meta").textContent = `קלף ${state.used.size.toLocaleString("he-IL")}/${HEZEL_EXPECTED_TOTAL.toLocaleString("he-IL")} · ספרייה פנימית`;
  $("reveal").disabled = false;
  const hasAudio = await prepareCurrentAudio();
  $("play").disabled = !hasAudio;
  $("status").textContent = hasAudio ? "🎵 האודיו המקומי מוכן" : "🎴 הקלף מוכן · אודיו מקומי טרם יובא";
  if (hasAudio) void startPreview();
}
function reveal() {
  if (!state.current) return;
  stopAudio();
  $("title").textContent = state.current.title;
  $("artist").textContent = state.current.artist;
  $("album").textContent = state.current.album || "אלבום לא צוין";
  $("concealed").hidden = true;
  $("revealed").hidden = false;
  $("reveal").disabled = true;
  const team = $("team").value;
  const list = state.timelines[team];
  if (!list.some((x) => x.id === state.current.id)) list.push({ id: state.current.id, title: state.current.title, artist: state.current.artist });
  saveGame();
  renderTimelines();
  $("status").textContent = `נוסף לקבוצה ${TEAMS.find(([id]) => id === team)?.[1] || ""}`;
}
function newGame() {
  if (!confirm("להתחיל משחק חדש? הקלפים והקבוצות יתאפסו. הספרייה והאודיו המקומי יישארו.")) return;
  state.used.clear();
  state.timelines = Object.fromEntries(TEAMS.map(([id]) => [id, []]));
  localStorage.removeItem(GAME_STORE);
  renderCurrentEmpty();
  renderTimelines();
  $("status").textContent = "🎮 משחק חדש · ספריית 4,549 נשמרה";
}

async function enableOffline() {
  if (!("serviceWorker" in navigator)) return false;
  try {
    await navigator.serviceWorker.register("./sw.js", { scope: "./" });
    await navigator.serviceWorker.ready;
    return true;
  } catch { return false; }
}

async function init() {
  await enableOffline();
  try { state.cards = await dbGetAll(CARD_STORE); } catch { state.cards = []; }
  restoreGame();
  await countAudio().catch(() => { state.audioCount = 0; });
  renderLibrary();
  renderCurrentEmpty();
  $("draw").onclick = () => void draw();
  $("play").onclick = () => { const audio = $("audio"); if (!audio.paused) stopAudio(); else void startPreview(); };
  $("reveal").onclick = reveal;
  $("new-game").onclick = newGame;
  $("hezel-file").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try { await importHezel(file); }
    catch (error) { $("library-status").textContent = `⛔ ${error?.message || error}`; }
    finally { event.target.value = ""; }
  });
  $("audio-files").addEventListener("change", async (event) => {
    const files = [...(event.target.files || [])];
    if (!files.length) return;
    $("library-status").textContent = `משייך ${files.length} קובצי אודיו…`;
    try { await importAudio(files); }
    catch (error) { $("library-status").textContent = `⛔ ${error?.message || error}`; }
    finally { event.target.value = ""; }
  });
  if (state.cards.length === HEZEL_EXPECTED_TOTAL) {
    $("library-status").textContent = `✅ ${HEZEL_EXPECTED_TOTAL.toLocaleString("he-IL")} קלפים כבר שמורים במכשיר · ${state.audioCount.toLocaleString("he-IL")} עם אודיו`;
  }
}

init().catch((error) => {
  $("status").textContent = `⛔ ${error?.message || error}`;
});
