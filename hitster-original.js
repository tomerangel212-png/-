"use strict";

(function () {
  var DATA_URL = "./hitster-alltime-888.json";
  var STORAGE_KEY = "hitster-tra-annual-888-v1";
  var AUDIO_CACHE_NAME = "hitster-tra-preview-audio-v1";
  var PREVIEW_SECONDS = 30;
  var START_STARS = 5;
  var MAX_STARS = 12;
  var TEAM_DEFS = [
    { id: "ayelet-dudi", he: "איילת ודודי", en: "Ayelet & Dudi" },
    { id: "sharon-naveh", he: "שרון ונוה", en: "Sharon & Naveh" },
    { id: "naama-raz", he: "נעמה ורז", en: "Naama & Raz" },
    { id: "maayan-manuel", he: "מעיין ומנואל", en: "Maayan & Manuel" },
    { id: "irit-natan", he: "אירית ונתן", en: "Irit & Natan" }
  ];
  var COPY = {
    he: {
      loading: "טוען את חפיסת ה־888…",
      ready: "מוכנים. בחרו קבוצה והתחילו קלף חדש.",
      offline: "📴 אופליין: זמינים רק קטעים שנשמרו בעבר במכשיר.",
      online: "🟢 מחובר: קטעים שיושמעו יישמרו לאופליין כשהדפדפן מאפשר זאת.",
      noCard: "לחצו על „קלף חדש” כדי להתחיל.",
      cardReady: "הקלף מוכן. נגנו 30 שניות, זהו את השיר והאמן ואז הציגו פתרון.",
      play: "▶ נגנו 30 שניות",
      preparing: "מכין שמע…",
      cached: "הקטע נשמר גם לאופליין במכשיר הזה.",
      onlineOnly: "הקטע מתנגן דרך האינטרנט; הדפדפן לא אפשר לשמור אותו לאופליין.",
      noPreview: "לא נמצא קטע שמע חוקי זמין עבור הקלף הזה כרגע. אפשר לנסות שוב או לעבור קלף באמצעות כוכב.",
      blocked: "הדפדפן ביקש לחיצה נוספת לפני הניגון. לחצו שוב על „נגנו 30 שניות”.",
      played: "מנגן עד 30 שניות בתוך HITSTER.",
      stopped: "הסתיימו 30 שניות.",
      reveal: "הפתרון הוצג. השנה היא שנת מצעד, לא בהכרח שנת ההוצאה המקורית.",
      inputNeeded: "הזינו גם את שם השיר וגם את שם האמן.",
      correct: "נכון — שיר ואמן מדויקים. קיבלתם ⭐ אחד.",
      correctCap: "נכון — שיר ואמן מדויקים. אתם כבר ב־12 ⭐.",
      wrong: "לא מדויק, ולכן לא נוסף כוכב.",
      oneAttempt: "הזיהוי כבר נבדק עבור הקלף הזה.",
      placeFirst: "חשפו את הפתרון לפני מיקום הקלף בציר.",
      placedRight: "מיקום נכון בציר הזמן.",
      placedWrong: "המיקום לא היה מדויק; הקלף הוכנס למקומו הנכון בציר.",
      skipNeed: "צריך לפחות ⭐ אחד לדילוג.",
      skipped: "הקלף דולג תמורת ⭐ אחד.",
      freeNeed: "צריך לפחות ⭐⭐⭐ לכרטיס חינם.",
      free: "כרטיס חינם: ⭐⭐⭐ הוחלפו במיקום אוטומטי בציר.",
      noMore: "כל 888 הקלפים כבר שומשו במשחק הזה.",
      reset: "משחק חדש התחיל: לכל קבוצה 5 ⭐ וציר זמן נפרד.",
      source: "שנת מצעד",
      hidden: "הפתרון מוסתר",
      timelineEmpty: "עדיין אין קלפים בציר של הקבוצה הזאת.",
      beforeAll: "לפני הכול",
      before: "לפני",
      after: "אחרי",
      count: "קלפים",
      stars: "כוכבים",
      playLabel: "▶ נגנו 30 שניות",
      preparingLabel: "מכין שמע…",
      answerOpen: "בדקו שם שיר + אמן",
      answerClosed: "הזיהוי נבדק"
    },
    en: {
      loading: "Loading the 888-card deck…",
      ready: "Ready. Choose a team and draw a card.",
      offline: "📴 Offline: only previews already saved on this device are available.",
      online: "🟢 Online: played previews are saved for offline use when the browser allows it.",
      noCard: "Press “New card” to begin.",
      cardReady: "Card ready. Play 30 seconds, identify song and artist, then reveal.",
      play: "▶ Play 30 seconds",
      preparing: "Preparing audio…",
      cached: "This preview is saved for offline play on this device.",
      onlineOnly: "This preview is playing online; the browser did not allow offline storage.",
      noPreview: "No legal preview is available for this card right now. Try again or spend a star to skip.",
      blocked: "The browser needs one more tap before playback. Press “Play 30 seconds” again.",
      played: "Playing up to 30 seconds inside HITSTER.",
      stopped: "30 seconds finished.",
      reveal: "Answer revealed. This is a chart year, not necessarily the original release year.",
      inputNeeded: "Enter both the song title and artist.",
      correct: "Correct song and artist — you earned ⭐ one star.",
      correctCap: "Correct song and artist — your team is already at 12 ⭐.",
      wrong: "Not exact, so no star was added.",
      oneAttempt: "Identification has already been checked for this card.",
      placeFirst: "Reveal the answer before placing the card on the timeline.",
      placedRight: "Correct timeline placement.",
      placedWrong: "That placement was not exact; the card was placed correctly on the timeline.",
      skipNeed: "You need at least ⭐ one star to skip.",
      skipped: "Card skipped for ⭐ one star.",
      freeNeed: "You need at least ⭐⭐⭐ three stars for a free card.",
      free: "Free card: ⭐⭐⭐ were exchanged for automatic timeline placement.",
      noMore: "All 888 cards have already been used in this game.",
      reset: "New game: every team starts with 5 ⭐ and a separate timeline.",
      source: "Chart year",
      hidden: "Answer hidden",
      timelineEmpty: "This team has no timeline cards yet.",
      beforeAll: "Before all cards",
      before: "Before",
      after: "After",
      count: "cards",
      stars: "stars",
      playLabel: "▶ Play 30 seconds",
      preparingLabel: "Preparing audio…",
      answerOpen: "Check song + artist",
      answerClosed: "Identification checked"
    }
  };

  var language = document.documentElement.lang === "en" ? "en" : "he";
  var t = COPY[language];
  var deck = [];
  var deckById = Object.create(null);
  var state = null;
  var previewMemo = Object.create(null);
  var audio = document.getElementById("audio");
  var previewObjectUrl = null;
  var preparedCardId = null;
  var preparing = false;

  function el(id) { return document.getElementById(id); }
  function setStatus(message) { el("status").textContent = message; }
  function normalize(value) {
    return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase(language === "he" ? "he" : "en").replace(/&/g, " and ")
      .replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();
  }
  function track(eventName, properties) {
    try {
      if (window.posthog && typeof window.posthog.capture === "function") window.posthog.capture(eventName, properties || {});
    } catch (error) {}
  }
  function createInitialState() {
    return {
      version: 1,
      activeTeamId: TEAM_DEFS[0].id,
      teams: TEAM_DEFS.map(function (team) { return { id: team.id, stars: START_STARS, timeline: [] }; }),
      used: [], current: null, currentRevealed: false, currentAnswerChecked: false, currentAwarded: false
    };
  }
  function teamName(id) {
    var definition = TEAM_DEFS.find(function (team) { return team.id === id; });
    return definition ? definition[language] : id;
  }
  function getTeam() { return state.teams.find(function (team) { return team.id === state.activeTeamId; }); }
  function cardFor(id) { return deckById[id] || null; }
  function sanitizeState(candidate) {
    if (!candidate || candidate.version !== 1 || !Array.isArray(candidate.teams)) return createInitialState();
    var valid = Object.create(null);
    deck.forEach(function (card) { valid[card.id] = true; });
    var restored = createInitialState();
    var usedAcrossTimelines = Object.create(null);
    restored.teams.forEach(function (team) {
      var old = candidate.teams.find(function (value) { return value && value.id === team.id; }) || {};
      team.stars = Math.max(0, Math.min(MAX_STARS, Number(old.stars) || START_STARS));
      team.timeline = Array.isArray(old.timeline) ? old.timeline.filter(function (id) {
        if (!valid[id] || usedAcrossTimelines[id]) return false;
        usedAcrossTimelines[id] = true;
        return true;
      }) : [];
    });
    restored.used = Array.isArray(candidate.used) ? candidate.used.filter(function (id, index, array) {
      return valid[id] && array.indexOf(id) === index;
    }) : [];
    Object.keys(usedAcrossTimelines).forEach(function (id) {
      if (restored.used.indexOf(id) === -1) restored.used.push(id);
    });
    restored.activeTeamId = TEAM_DEFS.some(function (team) { return team.id === candidate.activeTeamId; }) ? candidate.activeTeamId : TEAM_DEFS[0].id;
    restored.current = valid[candidate.current] ? candidate.current : null;
    if (restored.current && restored.used.indexOf(restored.current) === -1) restored.used.push(restored.current);
    restored.currentRevealed = Boolean(candidate.currentRevealed && restored.current);
    restored.currentAnswerChecked = Boolean(candidate.currentAnswerChecked && restored.current);
    restored.currentAwarded = Boolean(candidate.currentAwarded && restored.current);
    return restored;
  }
  function restore() {
    try { state = sanitizeState(JSON.parse(localStorage.getItem(STORAGE_KEY))); }
    catch (error) { state = createInitialState(); }
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) {}
  }
  function stopAudio() {
    if (!audio) return;
    audio.pause(); audio.removeAttribute("src"); audio.load(); preparedCardId = null;
    if (previewObjectUrl) { URL.revokeObjectURL(previewObjectUrl); previewObjectUrl = null; }
  }
  function currentCard() { return state && state.current ? cardFor(state.current) : null; }
  function setConnectionStatus() {
    el("connection").textContent = navigator.onLine ? t.online : t.offline;
    el("connection").className = navigator.onLine ? "connection online" : "connection offline";
  }
  function createNode(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text !== "undefined") node.textContent = text;
    return node;
  }
  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }
  function sortedTimeline(team) {
    return team.timeline.map(cardFor).filter(Boolean).sort(function (a, b) {
      return a.chartYear - b.chartYear || a.chartRank - b.chartRank;
    });
  }
  function renderTeams() {
    var host = el("teams"); clear(host);
    state.teams.forEach(function (team) {
      var button = createNode("button", "team" + (team.id === state.activeTeamId ? " active" : ""), "");
      button.type = "button";
      button.setAttribute("aria-pressed", team.id === state.activeTeamId ? "true" : "false");
      button.append(createNode("strong", "", teamName(team.id)), createNode("span", "team-score", "⭐ " + team.stars + "/" + MAX_STARS + " · " + team.timeline.length + " " + t.count));
      button.addEventListener("click", function () { state.activeTeamId = team.id; el("team-select").value = team.id; persist(); render(); });
      host.append(button);
    });
  }
  function renderTimeline() {
    var team = getTeam(), host = el("timeline"), title = el("timeline-title");
    title.textContent = teamName(team.id) + " · " + t.stars + ": ⭐ " + team.stars + "/" + MAX_STARS;
    clear(host);
    var cards = sortedTimeline(team);
    if (!cards.length) { host.append(createNode("p", "muted", t.timelineEmpty)); return; }
    cards.forEach(function (card) {
      var item = createNode("article", "timeline-card");
      item.append(createNode("strong", "year", String(card.chartYear)), createNode("span", "", card.title), createNode("small", "", card.artist));
      host.append(item);
    });
  }
  function renderSlots(card) {
    var panel = el("placement-panel"), select = el("placement-select");
    clear(select);
    if (!card || !state.currentRevealed) { panel.hidden = true; return; }
    panel.hidden = false;
    var cards = sortedTimeline(getTeam());
    var first = document.createElement("option");
    first.value = "0"; first.textContent = cards.length ? t.before + " " + cards[0].chartYear : t.beforeAll; select.append(first);
    for (var index = 1; index < cards.length; index += 1) {
      var option = document.createElement("option");
      option.value = String(index); option.textContent = t.after + " " + cards[index - 1].chartYear + " · " + t.before + " " + cards[index].chartYear; select.append(option);
    }
    if (cards.length) {
      var last = document.createElement("option");
      last.value = String(cards.length); last.textContent = t.after + " " + cards[cards.length - 1].chartYear; select.append(last);
    }
  }
  function renderCard() {
    var card = currentCard(), hasCard = Boolean(card), revealed = Boolean(hasCard && state.currentRevealed);
    el("card-title").textContent = revealed ? card.title : t.hidden;
    el("card-artist").textContent = revealed ? card.artist : "•••";
    el("card-year").textContent = revealed ? t.source + ": " + card.chartYear : "•••";
    el("card-source").textContent = revealed ? "Billboard year-end chart · #" + card.chartRank : "";
    el("card-phase").textContent = hasCard ? (revealed ? t.reveal : t.cardReady) : t.noCard;
    el("play-clip").disabled = !hasCard || preparing; el("play-clip").textContent = preparing ? t.preparingLabel : t.playLabel;
    el("reveal").disabled = !hasCard || revealed;
    el("answer-open").disabled = !hasCard || revealed || state.currentAnswerChecked;
    el("answer-open").textContent = state.currentAnswerChecked ? t.answerClosed : t.answerOpen;
    el("skip-card").disabled = !hasCard || revealed; el("free-card").disabled = !hasCard || revealed; el("next-card").disabled = hasCard; el("placement-submit").disabled = !revealed;
    if (!hasCard) el("answer-panel").hidden = true;
    renderSlots(card);
  }
  function render() {
    if (!state) return;
    el("team-select").value = state.activeTeamId; renderTeams(); renderCard(); renderTimeline(); setConnectionStatus();
  }
  function validateDeck(payload) {
    if (!payload || payload.total !== 888 || !Array.isArray(payload.cards) || payload.cards.length !== 888) throw new Error("The annual deck must contain exactly 888 cards.");
    if (payload.yearBasis !== "chart-year") throw new Error("The deck is not labeled with chart-year basis.");
    var years = Object.create(null), identities = Object.create(null);
    payload.cards.forEach(function (card) {
      if (!card || !card.id || !card.title || !card.artist || !Number.isInteger(card.chartYear)) throw new Error("A card is incomplete.");
      if (card.chartYear < 1950 || card.chartYear > 2023) throw new Error("A card is outside the annual range.");
      var key = normalize(card.title) + "|" + normalize(card.artist);
      if (identities[key]) throw new Error("Duplicate song/artist identity.");
      identities[key] = true; years[card.chartYear] = (years[card.chartYear] || 0) + 1;
      if (/michael jackson|eyal golan|אייל גולן/i.test(card.artist)) throw new Error("Blocked artist found.");
    });
    for (var year = 1950; year <= 2023; year += 1) if (years[year] !== 12) throw new Error("Every chart year must have 12 cards.");
  }
  async function loadDeck() {
    setStatus(t.loading);
    var response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("Deck request failed with " + response.status);
    var payload = await response.json(); validateDeck(payload);
    deck = payload.cards; deck.forEach(function (card) { deckById[card.id] = card; });
    restore(); render(); setStatus(state.current ? t.cardReady : t.ready);
    track("hitster_annual_deck_loaded", { cards: deck.length, year_basis: payload.yearBasis });
  }
  function randomUnusedCard() {
    var used = Object.create(null); state.used.forEach(function (id) { used[id] = true; });
    var available = deck.filter(function (card) { return !used[card.id]; });
    return available.length ? available[Math.floor(Math.random() * available.length)] : null;
  }
  function drawCard() {
    if (state.current) return;
    var card = randomUnusedCard();
    if (!card) { setStatus(t.noMore); return; }
    state.current = card.id; state.currentRevealed = false; state.currentAnswerChecked = false; state.currentAwarded = false; state.used.push(card.id);
    stopAudio(); persist(); render(); setStatus(t.cardReady);
    track("hitster_card_drawn", { card_id: card.id, chart_year: card.chartYear, used_count: state.used.length });
  }
  function revealCard() {
    var card = currentCard(); if (!card) return;
    state.currentRevealed = true; el("answer-panel").hidden = true; persist(); render(); setStatus(t.reveal);
    track("answer_revealed", { card_id: card.id, chart_year: card.chartYear });
  }
  function cardCacheKey(card) { return new Request(new URL("./__hitster_preview_cache__/" + encodeURIComponent(card.id), window.location.href).href); }
  async function cachedPreview(card) {
    if (!("caches" in window)) return null;
    try {
      var cache = await caches.open(AUDIO_CACHE_NAME), response = await cache.match(cardCacheKey(card));
      if (!response) return null;
      return { src: URL.createObjectURL(await response.blob()), cached: true };
    } catch (error) { return null; }
  }
  function overlapScore(left, right) {
    var leftWords = normalize(left).split(" ").filter(Boolean), rightWords = normalize(right).split(" ").filter(Boolean);
    if (!leftWords.length || !rightWords.length) return 0;
    var rightSet = Object.create(null); rightWords.forEach(function (word) { rightSet[word] = true; });
    return leftWords.filter(function (word) { return rightSet[word]; }).length / Math.max(leftWords.length, rightWords.length);
  }
  async function lookupPreview(card) {
    if (previewMemo[card.id]) return previewMemo[card.id];
    if (!navigator.onLine) return null;
    var url = "https://itunes.apple.com/search?entity=song&limit=20&country=US&term=" + encodeURIComponent(card.title + " " + card.artist);
    var response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("Preview lookup failed.");
    var expectedTitle = normalize(card.title), expectedArtist = normalize(card.artist), best = null, bestScore = 0;
    var payload = await response.json(), candidates = Array.isArray(payload.results) ? payload.results : [];
    candidates.forEach(function (candidate) {
      if (!candidate || !candidate.previewUrl || !candidate.trackName || !candidate.artistName) return;
      var titleMatch = normalize(candidate.trackName) === expectedTitle ? 1 : overlapScore(candidate.trackName, expectedTitle);
      var artistMatch = normalize(candidate.artistName) === expectedArtist ? 1 : overlapScore(candidate.artistName, expectedArtist);
      var score = titleMatch * 70 + artistMatch * 30;
      if (titleMatch >= 0.65 && score > bestScore) { best = candidate.previewUrl; bestScore = score; }
    });
    previewMemo[card.id] = best || null; return previewMemo[card.id];
  }
  async function cacheRemotePreview(card, previewUrl) {
    var response = await fetch(previewUrl, { mode: "cors", cache: "force-cache" });
    if (!response.ok || response.type === "opaque") return { src: previewUrl, cached: false };
    var copy = response.clone();
    try {
      if ("caches" in window) { var cache = await caches.open(AUDIO_CACHE_NAME); await cache.put(cardCacheKey(card), copy); }
    } catch (error) { return { src: previewUrl, cached: false }; }
    return { src: URL.createObjectURL(await response.blob()), cached: true };
  }
  async function preparePreview(card) {
    var local = await cachedPreview(card); if (local) return local;
    var remote = await lookupPreview(card); if (!remote) return null;
    try { return await cacheRemotePreview(card, remote); } catch (error) { return { src: remote, cached: false }; }
  }
  async function playClip() {
    var card = currentCard(); if (!card || preparing) return;
    if (preparedCardId !== card.id || !audio.getAttribute("src")) {
      preparing = true; render();
      try {
        var preview = await preparePreview(card);
        if (!preview || state.current !== card.id) { setStatus(t.noPreview); return; }
        if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = preview.cached && preview.src.indexOf("blob:") === 0 ? preview.src : null;
        audio.src = preview.src; audio.load(); preparedCardId = card.id; setStatus(preview.cached ? t.cached : t.onlineOnly);
      } catch (error) { setStatus(navigator.onLine ? t.noPreview : t.offline); return; }
      finally { preparing = false; render(); }
    }
    try {
      audio.currentTime = 0; await audio.play(); setStatus(t.played);
      track("song_preview_started", { card_id: card.id, chart_year: card.chartYear, seconds: PREVIEW_SECONDS });
    } catch (error) { setStatus(error && error.name === "NotAllowedError" ? t.blocked : t.noPreview); }
  }
  function checkAnswer(event) {
    event.preventDefault();
    var card = currentCard();
    if (!card || state.currentRevealed || state.currentAnswerChecked) { setStatus(t.oneAttempt); return; }
    var enteredTitle = el("answer-title").value, enteredArtist = el("answer-artist").value;
    if (!String(enteredTitle).trim() || !String(enteredArtist).trim()) { setStatus(t.inputNeeded); return; }
    var exact = normalize(enteredTitle) === normalize(card.title) && normalize(enteredArtist) === normalize(card.artist);
    state.currentAnswerChecked = true;
    if (exact) {
      var team = getTeam();
      if (team.stars < MAX_STARS) { team.stars += 1; state.currentAwarded = true; setStatus(t.correct); }
      else setStatus(t.correctCap);
      track("score_awarded", { rule: "exact_song_and_artist", team_id: team.id, stars: team.stars });
    } else setStatus(t.wrong);
    el("answer-panel").hidden = true; persist(); render();
  }
  function insertCurrentCorrectly() {
    var card = currentCard(); if (!card) return;
    var team = getTeam();
    if (team.timeline.indexOf(card.id) === -1) team.timeline.push(card.id);
    team.timeline.sort(function (left, right) { var a = cardFor(left), b = cardFor(right); return a.chartYear - b.chartYear || a.chartRank - b.chartRank; });
  }
  function finishCurrent() {
    state.current = null; state.currentRevealed = false; state.currentAnswerChecked = false; state.currentAwarded = false; stopAudio(); persist(); render();
  }
  function placeCard() {
    var card = currentCard(); if (!card || !state.currentRevealed) { setStatus(t.placeFirst); return; }
    var team = getTeam(), cards = sortedTimeline(team), slot = Number(el("placement-select").value);
    var before = slot > 0 ? cards[slot - 1] : null, after = slot < cards.length ? cards[slot] : null;
    var right = (!before || before.chartYear <= card.chartYear) && (!after || after.chartYear >= card.chartYear);
    insertCurrentCorrectly(); finishCurrent(); setStatus(right ? t.placedRight : t.placedWrong);
    track("card_placed", { correct: right, team_id: team.id, chart_year: card.chartYear });
  }
  function skipCard() {
    var card = currentCard(), team = getTeam(); if (!card || state.currentRevealed) return;
    if (team.stars < 1) { setStatus(t.skipNeed); return; }
    team.stars -= 1; finishCurrent(); setStatus(t.skipped);
    track("star_spent", { action: "skip", team_id: team.id, chart_year: card.chartYear, stars: team.stars });
  }
  function freeCard() {
    var card = currentCard(), team = getTeam(); if (!card || state.currentRevealed) return;
    if (team.stars < 3) { setStatus(t.freeNeed); return; }
    team.stars -= 3; insertCurrentCorrectly(); finishCurrent(); setStatus(t.free);
    track("star_spent", { action: "free_card", team_id: team.id, chart_year: card.chartYear, stars: team.stars });
  }
  function resetGame() {
    var question = language === "he" ? "לאפס את כל הכוכבים, הצירים והקלפים ששומשו במכשיר הזה?" : "Reset all stars, timelines, and used cards on this device?";
    if (!window.confirm(question)) return;
    stopAudio(); state = createInitialState(); persist(); render(); setStatus(t.reset); track("game_started", { reset: true, cards: deck.length });
  }
  function openAnswer() {
    if (!currentCard() || state.currentRevealed || state.currentAnswerChecked) return;
    el("answer-panel").hidden = false; el("answer-title").focus();
  }
  el("team-select").addEventListener("change", function (event) { state.activeTeamId = event.target.value; persist(); render(); });
  el("new-game").addEventListener("click", resetGame); el("next-card").addEventListener("click", drawCard); el("play-clip").addEventListener("click", playClip); el("reveal").addEventListener("click", revealCard);
  el("answer-open").addEventListener("click", openAnswer); el("answer-form").addEventListener("submit", checkAnswer); el("answer-cancel").addEventListener("click", function () { el("answer-panel").hidden = true; });
  el("placement-submit").addEventListener("click", placeCard); el("skip-card").addEventListener("click", skipCard); el("free-card").addEventListener("click", freeCard);
  audio.addEventListener("timeupdate", function () { if (audio.currentTime >= PREVIEW_SECONDS) { audio.pause(); audio.currentTime = 0; setStatus(t.stopped); } });
  audio.addEventListener("ended", function () { setStatus(t.stopped); });
  window.addEventListener("online", setConnectionStatus); window.addEventListener("offline", setConnectionStatus);
  if ("serviceWorker" in navigator) window.addEventListener("load", function () { navigator.serviceWorker.register("./sw.js").catch(function () {}); });
  loadDeck().catch(function () {
    setStatus(language === "he" ? "לא ניתן לטעון את חפיסת ה־888. בדקו חיבור או רעננו." : "The 888-card deck could not load. Check your connection or refresh.");
    setConnectionStatus();
  });
}());

