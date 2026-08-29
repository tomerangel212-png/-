"use strict";

/*
 * Shared HITSTER 9.9 game contract.
 * Every live entry point lands on this runtime. A played card is global to
 * the saved game, never just to one team.
 */
const TARGET_TOTAL = 888;
const TARGET_WIN = 18;
const PREVIEW_SECONDS = 30;
const MAX_LOOKUPS = 24;
const AUDIO_PROBE_TIMEOUT_MS = 8_000;
const STAR_START = 5;
const STAR_MIN = 0;
const STAR_MAX = 12;
const STORE = "tra-hitster-kfar-blum-2026-v9.9";
const TEAMS = [
  ["green", "ירוק · איילת ודודי", "Green · Ayelet & Dudi"],
  ["blue", "תכלת · שרון ונווה", "Sky blue · Sharon & Naveh"],
  ["gold", "זהב · נעמה ורז", "Gold · Naama & Raz"],
  ["orange", "כתום · מעיין ומנואל", "Orange · Maayan & Manuel"],
  ["silver", "כסף · עירית ונתן", "Silver · Irit & Natan"],
];

const $ = id => document.getElementById(id);
const isEnglish = document.documentElement.lang === "en" || new URLSearchParams(location.search).get("lang") === "en";
const copy = {
  he: {
    turn: "התור", stars: "כוכבים", emptyTimeline: "ציר ריק",
    before: year => `לפני ${year}`, between: (left, right) => `בין ${left} ל-${right}`, after: year => `אחרי ${year}`,
    cardReady: "🎧 מכין קלף עם אודיו שנבדק…", cardReadyDone: "🎵 קלף מוכן — ההשמעה נשארת בתוך HITSTER.",
    noPreview: "לא נמצא כרגע Preview תואם. נסו שוב בעוד רגע.", playing: `▶ מנגן ${PREVIEW_SECONDS} שניות בתוך HITSTER`,
    autoplayBlocked: `Safari חסם הפעלה אוטומטית — לחצו שוב על ▶ ${PREVIEW_SECONDS} שניות.`,
    previewUnavailable: "קטע השמע לא זמין כרגע; אפשר למשוך קלף אחר.", hiddenMeta: count => `השנה מוסתרת · קלף ${count}/${TARGET_TOTAL}`,
    correct: label => `✅ מיקום נכון — הקלף נשאר בציר של ${label}.`, wrong: year => `❌ המיקום לא נכון — שנת השיר היא ${year}, ולכן הקלף נזרק.`,
    won: label => `🏆 ${label} הגיעו ל-${TARGET_WIN} קלפים וניצחו ב-HITSTER!`, nextTurn: label => ` התור הבא: ${label}.`,
    starAdded: "⭐ נוסף כוכב על זיהוי נכון של שם השיר והאמן.", starsMax: `מקסימום ${STAR_MAX} כוכבים לקבוצה.`,
    cardReplaced: "⭐ כוכב נוצל — הקלף הוחלף, והתור נשאר אצל אותה קבוצה.",
    freshStart: label => `🎮 משחק חדש מוכן — ${label} מתחילים.`, resumed: label => `▶ המשכנו מאותו מצב — התור של ${label}.`,
    unfinished: "הקלף הקודם נשמר. מכין אותו מחדש עם אודיו…", unfinishedNoAudio: "הקלף הקודם נשמר, אך האודיו שלו אינו זמין כרגע. אפשר לחשוף או להחליף אותו.",
    removed: "הקלף הוסר מן הציר בלבד; הוא נשאר משומש ולא יחזור לחפיסה.",
    removePrompt: (title, artist) => `האם אתה בטוח שאתה רוצה להסיר שיר זה מהציר?\n${title} · ${artist}`,
    noSaved: "אין משחק שמור עדיין — התחילו משחק חדש.",
  },
  en: {
    turn: "Turn", stars: "stars", emptyTimeline: "Empty timeline",
    before: year => `Before ${year}`, between: (left, right) => `Between ${left} and ${right}`, after: year => `After ${year}`,
    cardReady: "🎧 Preparing a verified in-browser preview…", cardReadyDone: "🎵 Card ready — playback stays inside HITSTER.",
    noPreview: "No matching playable preview is available right now. Please try again.", playing: `▶ Playing ${PREVIEW_SECONDS} seconds inside HITSTER`,
    autoplayBlocked: `Safari blocked autoplay — tap ▶ ${PREVIEW_SECONDS} seconds once more.`,
    previewUnavailable: "This preview is not available right now; draw another card.", hiddenMeta: count => `Year hidden · card ${count}/${TARGET_TOTAL}`,
    correct: label => `✅ Correct placement — the card stays on ${label}'s timeline.`, wrong: year => `❌ Incorrect placement — the song year is ${year}, so the card is discarded.`,
    won: label => `🏆 ${label} reached ${TARGET_WIN} cards and won HITSTER!`, nextTurn: label => ` Next turn: ${label}.`,
    starAdded: "⭐ One star was added for identifying the title and artist.", starsMax: `A team can hold at most ${STAR_MAX} stars.`,
    cardReplaced: "⭐ One star was used — the song changed and the same team keeps the turn.",
    freshStart: label => `🎮 New game ready — ${label} start.`, resumed: label => `▶ Continuing from the saved game — ${label}'s turn.`,
    unfinished: "The previous card was kept. Rechecking its in-browser preview…", unfinishedNoAudio: "The previous card was kept, but its preview is unavailable. Reveal it or replace it.",
    removed: "The card was removed only from the timeline; it remains used and cannot return to the deck.",
    removePrompt: (title, artist) => `Are you sure you want to remove this song from the timeline?\n${title} · ${artist}`,
    noSaved: "There is no saved game yet — start a new one.",
  },
};
const t = copy[isEnglish ? "en" : "he"];
const state = {
  cards: [], used: new Set(), current: null, next: null, timelines: {}, stars: {},
  turnIndex: 0, timer: null, audioCache: new Map(), primePromise: null, generation: 0,
  gameStarted: false, completedTeam: null, pendingCurrent: null, pendingRemoval: null,
};
TEAMS.forEach(([id]) => { state.timelines[id] = []; state.stars[id] = STAR_START; });

function activeTeam() { return TEAMS[state.turnIndex][0]; }
function teamLabel(id) {
  const team = TEAMS.find(([teamId]) => teamId === id);
  return team ? team[isEnglish ? 2 : 1] : "";
}
function activeTeamLabel() { return teamLabel(activeTeam()); }
function syncActiveTeam() {
  const select = $("team");
  if (select) { select.value = activeTeam(); select.disabled = true; }
  const display = $("active-team");
  if (display) display.textContent = `${t.turn}: ${activeTeamLabel()}`;
}
function advanceTurn() {
  state.turnIndex = (state.turnIndex + 1) % TEAMS.length;
  syncActiveTeam();
  return activeTeamLabel();
}
function norm(value) { return String(value || "").normalize("NFKC").trim().toLocaleLowerCase("he"); }
function cardKey(card) { return `${norm(card[0])}|${norm(card[1])}|${card[2]}`; }
function validCard(card) { return Array.isArray(card) && card.length === 3 && card[0] && card[1] && Number.isInteger(card[2]); }
function track(event, props = {}) {
  try { window.posthog?.capture?.(event, { ...props, game: "hitster", rules: "kfar_blum_2026_9_9", preview_seconds: PREVIEW_SECONDS }); } catch {}
}
function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}
function clean(value) { return norm(value).replace(/[^a-z0-9א-ת]+/g, " ").trim(); }
function scoreCandidate(card, item) {
  const title = clean(card[0]), artist = clean(card[1]);
  const candidateTitle = clean(item.trackName), candidateArtist = clean(item.artistName);
  let score = 0;
  if (candidateTitle === title) score += 8; else if (candidateTitle.includes(title) || title.includes(candidateTitle)) score += 4;
  if (candidateArtist === artist) score += 6; else if (candidateArtist.includes(artist) || artist.includes(candidateArtist)) score += 3;
  return score;
}
async function lookupPreview(card) {
  const id = cardKey(card);
  if (state.audioCache.has(id)) return state.audioCache.get(id);
  const term = encodeURIComponent(`${card[0]} ${card[1]}`);
  const response = await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&limit=12&country=IL`, { cache: "no-store" });
  if (!response.ok) throw new Error(`audio search ${response.status}`);
  const json = await response.json();
  const best = [...(json.results || [])].filter(item => item.previewUrl)
    .map(item => ({ item, score: scoreCandidate(card, item) })).sort((left, right) => right.score - left.score)[0];
  const previewUrl = best?.score >= 9 ? best.item.previewUrl : null;
  if (previewUrl) state.audioCache.set(id, previewUrl);
  return previewUrl;
}
function verifyPreview(previewUrl) {
  return new Promise(resolve => {
    if (!previewUrl) { resolve(false); return; }
    const probe = new Audio();
    let settled = false;
    const finish = ok => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      probe.pause();
      probe.removeAttribute("src");
      try { probe.load(); } catch {}
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), AUDIO_PROBE_TIMEOUT_MS);
    probe.preload = "metadata";
    probe.playsInline = true;
    probe.addEventListener("canplay", () => {
      const duration = Number(probe.duration);
      finish(!Number.isFinite(duration) || duration >= PREVIEW_SECONDS - 1);
    }, { once: true });
    probe.addEventListener("error", () => finish(false), { once: true });
    probe.src = previewUrl;
    probe.load();
  });
}
async function findPlayable() {
  const candidates = shuffle(state.cards.filter(card => !state.used.has(cardKey(card))));
  for (const card of candidates.slice(0, MAX_LOOKUPS)) {
    try {
      const preview = await lookupPreview(card);
      if (preview && await verifyPreview(preview)) return { card, preview };
    } catch {}
  }
  return null;
}
function saveGame() {
  if (!state.gameStarted) return;
  const record = {
    version: "9.9", used: [...state.used], timelines: state.timelines, stars: state.stars,
    turnIndex: state.turnIndex, current: state.current?.card || null,
    completedTeam: state.completedTeam, savedAt: new Date().toISOString(),
  };
  try { localStorage.setItem(STORE, JSON.stringify(record)); } catch {}
}
function restoreGame() {
  let saved;
  try { saved = JSON.parse(localStorage.getItem(STORE) || "null"); } catch { return false; }
  if (!saved || typeof saved !== "object") return false;
  const known = new Set(state.cards.map(cardKey));
  state.used = new Set(Array.isArray(saved.used) ? saved.used.filter(id => known.has(id)) : []);
  TEAMS.forEach(([id]) => {
    const timeline = Array.isArray(saved.timelines?.[id]) ? saved.timelines[id].filter(card => validCard(card) && known.has(cardKey(card))) : [];
    state.timelines[id] = timeline;
    timeline.forEach(card => state.used.add(cardKey(card)));
    const stars = Number(saved.stars?.[id]);
    state.stars[id] = Number.isFinite(stars) ? Math.max(STAR_MIN, Math.min(STAR_MAX, stars)) : STAR_START;
  });
  state.turnIndex = Number.isInteger(saved.turnIndex) ? Math.max(0, Math.min(TEAMS.length - 1, saved.turnIndex)) : 0;
  state.pendingCurrent = validCard(saved.current) && known.has(cardKey(saved.current)) ? saved.current : null;
  if (state.pendingCurrent) state.used.add(cardKey(state.pendingCurrent));
  state.completedTeam = TEAMS.some(([id]) => id === saved.completedTeam) ? saved.completedTeam : null;
  return true;
}
function clearSavedGame() { try { localStorage.removeItem(STORE); } catch {} }
function hasSavedGame() { try { return Boolean(localStorage.getItem(STORE)); } catch { return false; } }
function stopAudio() {
  clearTimeout(state.timer); state.timer = null;
  const audio = $("audio");
  audio.pause();
  try { audio.currentTime = 0; } catch {}
  $("play").textContent = `▶ ${PREVIEW_SECONDS} ${isEnglish ? "seconds" : "שניות"}`;
}
async function playCurrent(source = "manual") {
  if (!state.current?.preview) return;
  const audio = $("audio");
  if (audio.src !== state.current.preview) { audio.src = state.current.preview; audio.load(); }
  if (!audio.paused) { stopAudio(); return; }
  try {
    audio.currentTime = 0;
    await audio.play();
    $("play").textContent = isEnglish ? "■ Stop" : "■ עצירה";
    state.timer = setTimeout(stopAudio, PREVIEW_SECONDS * 1000);
    $("status").textContent = t.playing;
    track("song_preview_started", { source });
  } catch (error) {
    $("status").textContent = error?.name === "NotAllowedError" ? t.autoplayBlocked : t.previewUnavailable;
    $("play").textContent = `▶ ${PREVIEW_SECONDS} ${isEnglish ? "seconds" : "שניות"}`;
    track("hitster_audio_preview_failed", { name: error?.name || "Error" });
  }
}
function sortedTimeline(team) {
  return [...state.timelines[team]].sort((left, right) => left[2] - right[2] || left[0].localeCompare(right[0], "he"));
}
function renderPlacement() {
  const select = $("placement");
  if (!select) return;
  const timeline = sortedTimeline(activeTeam());
  select.replaceChildren();
  const labels = [];
  if (!timeline.length) labels.push(t.emptyTimeline);
  else {
    labels.push(t.before(timeline[0][2]));
    for (let index = 1; index < timeline.length; index++) labels.push(t.between(timeline[index - 1][2], timeline[index][2]));
    labels.push(t.after(timeline[timeline.length - 1][2]));
  }
  labels.forEach((label, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = label;
    select.append(option);
  });
  select.disabled = !state.current || Boolean(state.completedTeam);
}
function askToRemove(team, card) {
  state.pendingRemoval = { team, id: cardKey(card), card };
  const text = t.removePrompt(card[0], card[1]);
  const dialog = $("remove-dialog");
  const dialogText = $("remove-dialog-text");
  if (dialog && typeof dialog.showModal === "function") {
    dialogText.textContent = text;
    dialog.showModal();
    return;
  }
  if (window.confirm(text)) confirmRemove();
}
function confirmRemove() {
  const pending = state.pendingRemoval;
  state.pendingRemoval = null;
  const dialog = $("remove-dialog");
  if (dialog?.open) dialog.close();
  if (!pending) return;
  state.timelines[pending.team] = state.timelines[pending.team].filter(card => cardKey(card) !== pending.id);
  if (state.completedTeam === pending.team && state.timelines[pending.team].length < TARGET_WIN) state.completedTeam = null;
  saveGame();
  renderTimelines();
  $("status").textContent = t.removed;
  if (!state.completedTeam) {
    $("draw").disabled = !state.next;
    if (!state.next) void prime();
  }
  track("timeline_card_removed", { team: pending.team });
}
function renderTimelines() {
  const host = $("timelines");
  host.replaceChildren();
  TEAMS.forEach(([id]) => {
    const section = document.createElement("section");
    section.className = `timeline${id === activeTeam() ? " active" : ""}`;
    const cards = sortedTimeline(id);
    section.innerHTML = `<h3>${teamLabel(id)}</h3><div class="tokenline">⭐ ${state.stars[id]}/${STAR_MAX} ${t.stars} · ${cards.length}/${TARGET_WIN}</div>`;
    const row = document.createElement("div");
    row.className = "cards";
    cards.forEach(card => {
      const mini = document.createElement("article");
      mini.className = "mini";
      const year = document.createElement("strong"); year.textContent = card[2];
      const title = document.createElement("span"); title.textContent = card[0];
      const artist = document.createElement("span"); artist.textContent = card[1];
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove-card";
      remove.textContent = "−";
      remove.setAttribute("aria-label", isEnglish ? `Remove ${card[0]} from ${teamLabel(id)}'s timeline` : `הסירו את ${card[0]} מציר הזמן של ${teamLabel(id)}`);
      remove.onclick = () => askToRemove(id, card);
      mini.append(year, title, artist, remove);
      row.append(mini);
    });
    section.append(row);
    host.append(section);
  });
  syncActiveTeam();
  renderPlacement();
}
function correctPlacement(team, year, index) {
  const timeline = sortedTimeline(team);
  if (!timeline.length) return index === 0;
  const left = index > 0 ? timeline[index - 1][2] : -Infinity;
  const right = index < timeline.length ? timeline[index][2] : Infinity;
  return year >= left && year <= right;
}
function seedTimelines() {
  const starters = shuffle(state.cards).slice(0, TEAMS.length);
  TEAMS.forEach(([id], index) => {
    state.timelines[id] = starters[index] ? [starters[index]] : [];
    if (starters[index]) state.used.add(cardKey(starters[index]));
    state.stars[id] = STAR_START;
  });
}
async function prime() {
  if (!state.gameStarted || state.completedTeam) return null;
  if (state.next) return state.next;
  if (state.primePromise) return state.primePromise;
  const generation = state.generation;
  $("draw").disabled = true;
  if (!state.current) $("status").textContent = t.cardReady;
  const request = findPlayable();
  state.primePromise = request;
  const pick = await request;
  if (state.primePromise === request) state.primePromise = null;
  if (generation !== state.generation) return null;
  state.next = pick;
  $("draw").disabled = !pick || Boolean(state.current);
  if (!state.current) $("status").textContent = pick ? t.cardReadyDone : t.noPreview;
  return pick;
}
function showHiddenCard() {
  $("revealed").hidden = true;
  $("concealed").hidden = false;
  $("reveal").disabled = false;
  $("play").disabled = !state.current?.preview;
  $("name-credit").disabled = false;
  $("skip-star").disabled = state.stars[activeTeam()] <= STAR_MIN;
  renderPlacement();
}
function hideCurrentCard() {
  $("revealed").hidden = true;
  $("concealed").hidden = false;
  $("reveal").disabled = true;
  $("play").disabled = true;
  $("name-credit").disabled = true;
  $("skip-star").disabled = true;
  $("placement").disabled = true;
}
async function draw() {
  if (!state.gameStarted || state.completedTeam || state.current) return;
  stopAudio();
  if (!state.next) { await prime(); if (!state.next) return; }
  state.current = state.next;
  state.next = null;
  state.used.add(cardKey(state.current.card));
  saveGame();
  $("card-meta").textContent = t.hiddenMeta(state.used.size);
  showHiddenCard();
  void playCurrent("draw");
  void prime();
}
function reveal() {
  if (!state.current || state.completedTeam) return;
  stopAudio();
  const team = activeTeam();
  const index = Number($("placement").value);
  const [title, artist, year] = state.current.card;
  const correct = correctPlacement(team, year, index);
  $("year").textContent = year; $("title").textContent = title; $("artist").textContent = artist;
  $("concealed").hidden = true; $("revealed").hidden = false; $("reveal").disabled = true;
  $("placement").disabled = true; $("name-credit").disabled = true; $("skip-star").disabled = true;
  const label = teamLabel(team);
  if (correct) {
    state.timelines[team].push(state.current.card);
    $("status").textContent = t.correct(label);
    track("answer_revealed", { correct: true, team, year });
  } else {
    $("status").textContent = t.wrong(year);
    track("answer_revealed", { correct: false, team, year });
  }
  state.current = null;
  if (state.timelines[team].length >= TARGET_WIN) {
    state.completedTeam = team;
    $("status").textContent = t.won(label);
    $("draw").disabled = true;
    saveGame();
    renderTimelines();
    track("game_completed", { team, cards: state.timelines[team].length });
    return;
  }
  const nextLabel = advanceTurn();
  saveGame();
  renderTimelines();
  $("draw").disabled = !state.next;
  $("status").textContent += t.nextTurn(nextLabel);
}
function creditName() {
  if (!state.current || state.completedTeam) return;
  const team = activeTeam();
  if (state.stars[team] < STAR_MAX) {
    state.stars[team]++;
    $("status").textContent = t.starAdded;
  } else {
    $("status").textContent = t.starsMax;
  }
  $("name-credit").disabled = true;
  saveGame();
  renderTimelines();
}
async function skipWithStar() {
  const team = activeTeam();
  if (!state.current || state.completedTeam || state.stars[team] <= STAR_MIN) return;
  state.stars[team]--;
  stopAudio();
  state.current = null;
  saveGame();
  hideCurrentCard();
  renderTimelines();
  $("status").textContent = t.cardReplaced;
  await draw();
}
function setGameVisible(visible) {
  $("game-start").hidden = visible;
  $("game-controls").hidden = !visible;
  $("game-card").hidden = !visible;
  $("game-timelines").hidden = !visible;
  $("game-rules").hidden = !visible;
}
function resetGame({ autoplay = false } = {}) {
  stopAudio();
  state.generation++;
  state.used = new Set();
  state.current = null;
  state.next = null;
  state.primePromise = null;
  state.turnIndex = 0;
  state.completedTeam = null;
  state.pendingCurrent = null;
  state.gameStarted = true;
  clearSavedGame();
  seedTimelines();
  setGameVisible(true);
  hideCurrentCard();
  $("card-meta").textContent = isEnglish ? `Each team begins with one revealed card and ${STAR_START} stars.` : `כל קבוצה מתחילה עם קלף אחד ו-${STAR_START} כוכבים`;
  syncActiveTeam();
  renderTimelines();
  $("status").textContent = t.freshStart(activeTeamLabel());
  saveGame();
  track("game_started", { teams: TEAMS.length, target: TARGET_WIN, stars_start: STAR_START, source: "reset" });
  void prime().then(() => { if (autoplay) void draw(); });
}
async function restoreCurrentCard() {
  if (!state.pendingCurrent) return false;
  const card = state.pendingCurrent;
  state.pendingCurrent = null;
  state.current = { card, preview: null };
  $("card-meta").textContent = t.hiddenMeta(state.used.size);
  showHiddenCard();
  $("status").textContent = t.unfinished;
  try {
    const preview = await lookupPreview(card);
    if (preview && await verifyPreview(preview) && state.current?.card === card) {
      state.current.preview = preview;
      $("play").disabled = false;
      $("status").textContent = t.resumed(activeTeamLabel());
      return true;
    }
  } catch {}
  if (state.current?.card === card) {
    $("play").disabled = true;
    $("status").textContent = t.unfinishedNoAudio;
  }
  return false;
}
function continueGame({ autoplay = false } = {}) {
  if (!hasSavedGame()) {
    $("status").textContent = t.noSaved;
    return;
  }
  state.gameStarted = true;
  setGameVisible(true);
  syncActiveTeam();
  renderTimelines();
  if (state.completedTeam) {
    $("status").textContent = t.won(teamLabel(state.completedTeam));
    $("draw").disabled = true;
    return;
  }
  $("status").textContent = t.resumed(activeTeamLabel());
  void restoreCurrentCard().then(restoredCurrent => {
    if (restoredCurrent) {
      if (autoplay) void playCurrent("resume");
      return;
    }
    void prime().then(() => { if (autoplay) void draw(); });
  });
}
function showStartChoice() {
  state.gameStarted = false;
  setGameVisible(false);
  const canContinue = hasSavedGame();
  $("continue-game").disabled = !canContinue;
  const note = $("saved-game-note");
  if (note) note.textContent = canContinue
    ? (isEnglish ? "A saved Kfar Blum-style game is available on this device." : "נמצא משחק כפר־בלום שמור במכשיר הזה.")
    : (isEnglish ? "No saved game on this device yet." : "עדיין אין משחק שמור במכשיר הזה.");
}
async function init() {
  const response = await fetch("./hitster-hebrew-alist-888.json", { cache: "no-store" });
  if (!response.ok) throw new Error(isEnglish ? "The HITSTER 888 catalog could not be loaded" : "מאגר HITSTER 888 לא נטען");
  const payload = await response.json();
  state.cards = Object.values(payload.eras || {}).flat().filter(validCard);
  if (state.cards.length !== TARGET_TOTAL) throw new Error(isEnglish ? `Found ${state.cards.length} cards instead of ${TARGET_TOTAL}` : `נמצאו ${state.cards.length} קלפים במקום ${TARGET_TOTAL}`);
  $("quality-badge").textContent = isEnglish ? "🟡 888 cards loaded · preview checked before draw" : "🟡 888 קלפים נטענו · אודיו נבדק לפני משיכה";
  restoreGame();
  $("draw").onclick = draw;
  $("play").onclick = () => playCurrent("button");
  $("reveal").onclick = reveal;
  $("name-credit").onclick = creditName;
  $("skip-star").onclick = skipWithStar;
  $("continue-game").onclick = () => continueGame();
  $("reset-game").onclick = () => resetGame();
  $("confirm-remove").onclick = event => { event.preventDefault(); confirmRemove(); };
  $("cancel-remove").onclick = () => { state.pendingRemoval = null; };
  $("audio").addEventListener("ended", () => { clearTimeout(state.timer); state.timer = null; $("play").textContent = `▶ ${PREVIEW_SECONDS} ${isEnglish ? "seconds" : "שניות"}`; });
  const params = new URLSearchParams(location.search);
  const auto = params.get("autoplay") === "1" || params.get("entry") === "kfar-bloom";
  if (auto) {
    if (hasSavedGame()) continueGame({ autoplay: true });
    else resetGame({ autoplay: true });
  } else {
    showStartChoice();
  }
}
init().catch(error => {
  $("quality-badge").textContent = isEnglish ? "⛔ HITSTER did not load" : "⛔ HITSTER לא נטען";
  $("status").textContent = String(error.message || error);
  $("continue-game").disabled = true;
  $("reset-game").disabled = true;
});
