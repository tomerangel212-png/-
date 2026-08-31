"use strict";

(function () {
  var DATA_URL = "./hitster-alltime-888.json";
  var STORAGE_KEY = "hitster-tra-annual-888-v1";
  var AUDIO_CACHE_NAME = "hitster-tra-preview-audio-v1";
  var PREVIEW_SECONDS = 30;
  var START_STARS = 5;
  var MAX_STARS = 10;
  var WIN_CARDS = 18;
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
      ready: "מוכנים. התור של {team}. לחצו על „קלף חדש + נגן”.",
      resume: "המשחק נשמר. ממשיכים בדיוק מאיפה שעצרתם — קלפים שכבר נוגנו לא יחזרו.",
      offline: "📴 אופליין: זמינים רק קטעים שנשמרו בעבר במכשיר.",
      online: "🟢 מחובר: קטעים שיושמעו יישמרו לאופליין כשהדפדפן מאפשר זאת.",
      noCard: "לחצו על „קלף חדש + נגן” כדי להתחיל את התור.",
      cardReady: "הקלף מוכן. בחרו מיקום בציר, נגנו/זהו, ואז חשפו את השנה.",
      cached: "הקטע נשמר גם לאופליין במכשיר הזה.",
      onlineOnly: "הקטע מתנגן דרך האינטרנט; הדפדפן לא אפשר לשמור אותו לאופליין.",
      noPreview: "לא נמצא כרגע קטע תצוגה חוקי. נסו שוב בנגיעה על „נגנו 30 שניות”, או החליפו שיר תמורת ⭐.",
      blocked: "Safari/הדפדפן ביקש נגיעה נוספת. לחצו על „נגנו 30 שניות”.",
      played: "מנגן עד 30 שניות בתוך HITSTER.",
      stopped: "הסתיימו 30 שניות.",
      yearRevealedRight: "השנה נחשפה — המיקום שבחרתם נכון. אפשר להוסיף את הקלף לציר.",
      yearRevealedWrong: "השנה נחשפה — המיקום לא נכון. הקלף לא נכנס לציר; סיימו את התור.",
      solutionRevealed: "שם השיר והאמן נחשפו. חשיפת הפתרון לא מוסיפה קלף לציר.",
      inputNeeded: "הזינו גם את שם השיר וגם את שם האמן.",
      correct: "נכון — שיר ואמן מדויקים. קיבלתם ⭐ אחד.",
      correctCap: "נכון — שיר ואמן מדויקים. אתם כבר ב־10 ⭐.",
      wrong: "לא מדויק, ולכן לא נוסף כוכב.",
      oneAttempt: "הזיהוי כבר נבדק עבור הקלף הזה.",
      chooseSlotFirst: "בחרו מיקום בציר לפני חשיפת השנה.",
      addNeedCorrect: "אפשר להוסיף לציר רק אחרי חשיפת שנה ובמיקום נכון.",
      added: "הקלף נוסף לציר. עוברים לקבוצה הבאה.",
      turnEnded: "הקלף לא נכנס לציר. עוברים לקבוצה הבאה.",
      skipNeed: "צריך לפחות ⭐ אחד להחלפת שיר.",
      skipped: "⭐ אחד נוצל. השיר הוחלף והתור נשאר אצל אותה קבוצה.",
      freeNeed: "צריך לפחות ⭐⭐⭐ לכרטיס חינם.",
      free: "כרטיס חינם: ⭐⭐⭐ הוחלפו בקלף שנוסף אוטומטית לציר.",
      noMore: "כל 888 הקלפים כבר נוגנו במשחק הזה.",
      reset: "הכול אופס: 5 ⭐ לכל קבוצה, צירים ריקים וכל 888 הקלפים זמינים מחדש.",
      timelineReset: "ציר הזמן של הקבוצה אופס. שירים שכבר נוגנו עדיין לא יחזרו לחפיסה.",
      removed: "הקלף הוסר מהציר. הוא נשאר מסומן כשיר שכבר נוגן ולא יחזור לחפיסה.",
      source: "שנת מצעד",
      hidden: "הפתרון מוסתר",
      yearHidden: "•••",
      timelineEmpty: "עדיין אין קלפים בציר של הקבוצה הזאת.",
      beforeAll: "לפני הכול",
      before: "לפני",
      after: "אחרי",
      count: "קלפים",
      stars: "כוכבים",
      winner: "🏆 {team} ניצחו עם 18 קלפים!",
      turn: "תור",
      playLabel: "▶ נגנו 30 שניות",
      preparingLabel: "מכין שמע…",
      answerOpen: "בדקו שם שיר + אמן",
      answerClosed: "הזיהוי נבדק",
      removeConfirm: "האם אתה בטוח שאתה רוצה להסיר שיר זה מהציר?",
      resetTimelineConfirm: "לאפס את הציר של הקבוצה הזאת? השירים שכבר נוגנו לא יחזרו לחפיסה.",
      resetAllConfirm: "לאפס את כל המשחק? כל הצירים, הכוכבים והיסטוריית 888 הקלפים יימחקו.",
      noSaved: "אין משחק שמור עדיין. התחילו משחק חדש."
    },
    en: {
      loading: "Loading the 888-card deck…",
      ready: "Ready. It is {team}'s turn. Press “New card + play”.",
      resume: "Your game is saved. Continue exactly where you stopped; played songs will not repeat.",
      offline: "📴 Offline: only previews already saved on this device are available.",
      online: "🟢 Online: played previews are saved for offline use when the browser allows it.",
      noCard: "Press “New card + play” to start the turn.",
      cardReady: "Card ready. Choose a timeline slot, play/identify it, then reveal the year.",
      cached: "This preview is also saved for offline play on this device.",
      onlineOnly: "This preview is playing online; the browser did not allow offline storage.",
      noPreview: "No legal preview is available right now. Tap “Play 30 seconds” again, or replace the song for ⭐.",
      blocked: "Safari/the browser needs one more tap. Press “Play 30 seconds”.",
      played: "Playing up to 30 seconds inside HITSTER.",
      stopped: "30 seconds finished.",
      yearRevealedRight: "Year revealed — your chosen slot is correct. You may add the card to the timeline.",
      yearRevealedWrong: "Year revealed — the slot is wrong. The card does not enter the timeline; finish the turn.",
      solutionRevealed: "Song and artist revealed. Revealing the answer does not add the card to the timeline.",
      inputNeeded: "Enter both the song title and artist.",
      correct: "Correct song and artist — you earned ⭐ one star.",
      correctCap: "Correct song and artist — your team is already at 10 ⭐.",
      wrong: "Not exact, so no star was added.",
      oneAttempt: "Identification has already been checked for this card.",
      chooseSlotFirst: "Choose a timeline slot before revealing the year.",
      addNeedCorrect: "A card can enter the timeline only after the year is revealed and the chosen slot is correct.",
      added: "Card added to the timeline. Moving to the next team.",
      turnEnded: "Card did not enter the timeline. Moving to the next team.",
      skipNeed: "You need at least ⭐ one star to replace the song.",
      skipped: "⭐ spent. The song was replaced and the same team keeps the turn.",
      freeNeed: "You need at least ⭐⭐⭐ three stars for a free card.",
      free: "Free card: ⭐⭐⭐ were exchanged for an automatic timeline card.",
      noMore: "All 888 cards have already been played in this game.",
      reset: "Everything reset: 5 ⭐ per team, empty timelines, and all 888 cards available again.",
      timelineReset: "This team's timeline was reset. Already-played songs still will not return to the deck.",
      removed: "Card removed from the timeline. It remains marked as played and will not return to the deck.",
      source: "Chart year",
      hidden: "Answer hidden",
      yearHidden: "•••",
      timelineEmpty: "This team has no timeline cards yet.",
      beforeAll: "Before all cards",
      before: "Before",
      after: "After",
      count: "cards",
      stars: "stars",
      winner: "🏆 {team} wins with 18 cards!",
      turn: "Turn",
      playLabel: "▶ Play 30 seconds",
      preparingLabel: "Preparing audio…",
      answerOpen: "Check song + artist",
      answerClosed: "Identification checked",
      removeConfirm: "Are you sure you want to remove this song from the timeline?",
      resetTimelineConfirm: "Reset this team's timeline? Already-played songs will not return to the deck.",
      resetAllConfirm: "Reset the entire game? All timelines, stars and the 888-card play history will be erased.",
      noSaved: "There is no saved game yet. Start a new game."
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
  var clipTimer = null;

  function el(id) { return document.getElementById(id); }
  function setStatus(message) { if (el("status")) el("status").textContent = message; }
  function text(template, values) {
    return String(template || "").replace(/\{([^}]+)\}/g, function (_, key) { return values && key in values ? values[key] : ""; });
  }
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
      version: 2,
      activeTeamId: TEAM_DEFS[0].id,
      teams: TEAM_DEFS.map(function (team) { return { id: team.id, stars: START_STARS, timeline: [] }; }),
      used: [],
      current: null,
      currentYearRevealed: false,
      currentSolutionRevealed: false,
      currentAnswerChecked: false,
      currentAwarded: false,
      currentPlacementSlot: null,
      currentPlacementCorrect: null,
      winnerTeamId: null
    };
  }
  function teamName(id) {
    var definition = TEAM_DEFS.find(function (team) { return team.id === id; });
    return definition ? definition[language] : id;
  }
  function getTeam() { return state.teams.find(function (team) { return team.id === state.activeTeamId; }); }
  function cardFor(id) { return deckById[id] || null; }
  function hasProgress(candidate) {
    return Boolean(candidate && ((candidate.used && candidate.used.length) || candidate.current || (candidate.teams || []).some(function (team) { return team.timeline && team.timeline.length; })));
  }
  function sanitizeState(candidate) {
    if (!candidate || !Array.isArray(candidate.teams) || (candidate.version !== 1 && candidate.version !== 2)) return createInitialState();
    var valid = Object.create(null);
    deck.forEach(function (card) { valid[card.id] = true; });
    var restored = createInitialState();
    var usedAcrossTimelines = Object.create(null);
    restored.teams.forEach(function (team) {
      var old = candidate.teams.find(function (value) { return value && value.id === team.id; }) || {};
      var starValue = Number(old.stars);
      team.stars = Math.max(0, Math.min(MAX_STARS, Number.isFinite(starValue) ? starValue : START_STARS));
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
    if (candidate.version === 1) {
      restored.currentYearRevealed = Boolean(candidate.currentRevealed && restored.current);
      restored.currentSolutionRevealed = Boolean(candidate.currentRevealed && restored.current);
    } else {
      restored.currentYearRevealed = Boolean(candidate.currentYearRevealed && restored.current);
      restored.currentSolutionRevealed = Boolean(candidate.currentSolutionRevealed && restored.current);
      restored.currentPlacementSlot = Number.isInteger(candidate.currentPlacementSlot) ? candidate.currentPlacementSlot : null;
      restored.currentPlacementCorrect = typeof candidate.currentPlacementCorrect === "boolean" ? candidate.currentPlacementCorrect : null;
      restored.winnerTeamId = TEAM_DEFS.some(function (team) { return team.id === candidate.winnerTeamId; }) ? candidate.winnerTeamId : null;
    }
    restored.currentAnswerChecked = Boolean(candidate.currentAnswerChecked && restored.current);
    restored.currentAwarded = Boolean(candidate.currentAwarded && restored.current);
    if (restored.winnerTeamId) {
      var winner = restored.teams.find(function (team) { return team.id === restored.winnerTeamId; });
      if (!winner || winner.timeline.length < WIN_CARDS) restored.winnerTeamId = null;
    }
    return restored;
  }
  function restore() {
    try { state = sanitizeState(JSON.parse(localStorage.getItem(STORAGE_KEY))); }
    catch (error) { state = createInitialState(); }
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) {}
  }
  function clearClipTimer() {
    if (clipTimer) { clearTimeout(clipTimer); clipTimer = null; }
  }
  function stopAudio() {
    clearClipTimer();
    if (!audio) return;
    audio.pause();
    try { audio.currentTime = 0; } catch (error) {}
    audio.removeAttribute("src");
    audio.load();
    preparedCardId = null;
    if (previewObjectUrl) { URL.revokeObjectURL(previewObjectUrl); previewObjectUrl = null; }
  }
  function currentCard() { return state && state.current ? cardFor(state.current) : null; }
  function setConnectionStatus() {
    if (!el("connection")) return;
    el("connection").textContent = navigator.onLine ? t.online : t.offline;
    el("connection").className = navigator.onLine ? "connection online" : "connection offline";
  }
  function createNode(tag, className, value) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof value !== "undefined") node.textContent = value;
    return node;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function sortedTimeline(team) {
    return team.timeline.map(cardFor).filter(Boolean).sort(function (a, b) {
      return a.chartYear - b.chartYear || a.chartRank - b.chartRank;
    });
  }
  function isGameLocked() { return Boolean(state && state.winnerTeamId); }
  function canChooseStartingTeam() {
    return state.used.length === 0 && !state.current && state.teams.every(function (team) { return team.timeline.length === 0; });
  }
  function nextTeamId(currentId) {
    var index = TEAM_DEFS.findIndex(function (team) { return team.id === currentId; });
    return TEAM_DEFS[(index + 1 + TEAM_DEFS.length) % TEAM_DEFS.length].id;
  }
  function advanceTurn() {
    state.activeTeamId = nextTeamId(state.activeTeamId);
  }
  function renderTeams() {
    var host = el("teams");
    clear(host);
    state.teams.forEach(function (team) {
      var button = createNode("button", "team" + (team.id === state.activeTeamId ? " active" : ""), "");
      button.type = "button";
      button.disabled = !canChooseStartingTeam();
      button.setAttribute("aria-pressed", team.id === state.activeTeamId ? "true" : "false");
      button.append(
        createNode("strong", "", teamName(team.id)),
        createNode("span", "team-score", "⭐ " + team.stars + "/" + MAX_STARS + " · " + team.timeline.length + "/" + WIN_CARDS)
      );
      button.addEventListener("click", function () {
        if (!canChooseStartingTeam()) return;
        state.activeTeamId = team.id;
        el("team-select").value = team.id;
        persist();
        render();
      });
      host.append(button);
    });
  }
  function removeTimelineCard(cardId) {
    var team = getTeam();
    if (!window.confirm(t.removeConfirm)) return;
    team.timeline = team.timeline.filter(function (id) { return id !== cardId; });
    if (state.winnerTeamId === team.id && team.timeline.length < WIN_CARDS) state.winnerTeamId = null;
    persist();
    render();
    setStatus(t.removed);
    track("timeline_card_removed", { team_id: team.id, card_id: cardId, used_count: state.used.length });
  }
  function renderTimeline() {
    var team = getTeam(), host = el("timeline"), title = el("timeline-title");
    title.textContent = teamName(team.id) + " · " + t.stars + ": ⭐ " + team.stars + "/" + MAX_STARS + " · " + team.timeline.length + "/" + WIN_CARDS;
    clear(host);
    var cards = sortedTimeline(team);
    if (!cards.length) { host.append(createNode("p", "muted", t.timelineEmpty)); return; }
    cards.forEach(function (card, index) {
      var item = createNode("article", "timeline-card");
      var number = createNode("span", "card-number", String(index + 1));
      var remove = createNode("button", "timeline-remove", "−");
      remove.type = "button";
      remove.setAttribute("aria-label", language === "he" ? "הסר שיר מהציר" : "Remove song from timeline");
      remove.addEventListener("click", function () { removeTimelineCard(card.id); });
      item.append(number, createNode("strong", "year", String(card.chartYear)), createNode("span", "", card.title), createNode("small", "", card.artist), remove);
      host.append(item);
    });
  }
  function renderSlots(card) {
    var panel = el("placement-panel"), select = el("placement-select");
    clear(select);
    if (!card || state.currentYearRevealed) { panel.hidden = true; return; }
    panel.hidden = false;
    var cards = sortedTimeline(getTeam());
    var first = document.createElement("option");
    first.value = "0";
    first.textContent = cards.length ? t.before + " " + cards[0].chartYear : t.beforeAll;
    select.append(first);
    for (var index = 1; index < cards.length; index += 1) {
      var option = document.createElement("option");
      option.value = String(index);
      option.textContent = t.after + " " + cards[index - 1].chartYear + " · " + t.before + " " + cards[index].chartYear;
      select.append(option);
    }
    if (cards.length) {
      var last = document.createElement("option");
      last.value = String(cards.length);
      last.textContent = t.after + " " + cards[cards.length - 1].chartYear;
      select.append(last);
    }
    if (Number.isInteger(state.currentPlacementSlot) && state.currentPlacementSlot >= 0 && state.currentPlacementSlot < select.options.length) {
      select.value = String(state.currentPlacementSlot);
    }
  }
  function renderCard() {
    var card = currentCard();
    var hasCard = Boolean(card);
    var yearRevealed = Boolean(hasCard && state.currentYearRevealed);
    var solutionRevealed = Boolean(hasCard && state.currentSolutionRevealed);
    el("card-title").textContent = solutionRevealed ? card.title : t.hidden;
    el("card-artist").textContent = solutionRevealed ? card.artist : "•••";
    el("card-year").textContent = yearRevealed ? t.source + ": " + card.chartYear : t.yearHidden;
    el("card-source").textContent = solutionRevealed ? "Billboard year-end chart · #" + card.chartRank : "";
    el("card-phase").textContent = hasCard ? t.cardReady : (isGameLocked() ? text(t.winner, { team: teamName(state.winnerTeamId) }) : t.noCard);
    el("play-clip").disabled = !hasCard || preparing;
    el("play-clip").textContent = preparing ? t.preparingLabel : t.playLabel;
    el("reveal-year").disabled = !hasCard || yearRevealed;
    el("reveal-solution").disabled = !hasCard || solutionRevealed;
    el("answer-open").disabled = !hasCard || solutionRevealed || state.currentAnswerChecked;
    el("answer-open").textContent = state.currentAnswerChecked ? t.answerClosed : t.answerOpen;
    el("skip-card").disabled = !hasCard || yearRevealed || solutionRevealed;
    el("free-card").disabled = !hasCard || yearRevealed || solutionRevealed;
    el("next-card").disabled = hasCard || isGameLocked();
    el("team-select").disabled = !canChooseStartingTeam();
    el("add-to-timeline").hidden = !(hasCard && yearRevealed && state.currentPlacementCorrect === true);
    el("finish-turn").hidden = !(hasCard && yearRevealed && state.currentPlacementCorrect === false);
    if (!hasCard) el("answer-panel").hidden = true;
    renderSlots(card);
    if (el("winner-banner")) {
      el("winner-banner").hidden = !isGameLocked();
      el("winner-banner").textContent = isGameLocked() ? text(t.winner, { team: teamName(state.winnerTeamId) }) : "";
    }
  }
  function renderStartScreen() {
    var screen = el("start-screen");
    if (!screen) return;
    var continueButton = el("continue-game");
    var saved = hasProgress(state);
    continueButton.disabled = !saved;
    if (el("start-note")) el("start-note").textContent = saved ? t.resume : t.noSaved;
  }
  function render() {
    if (!state) return;
    el("team-select").value = state.activeTeamId;
    renderTeams();
    renderCard();
    renderTimeline();
    renderStartScreen();
    setConnectionStatus();
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
      identities[key] = true;
      years[card.chartYear] = (years[card.chartYear] || 0) + 1;
      if (/michael jackson|eyal golan|אייל גולן/i.test(card.artist)) throw new Error("Blocked artist found.");
    });
    for (var year = 1950; year <= 2023; year += 1) if (years[year] !== 12) throw new Error("Every chart year must have 12 cards.");
  }
  async function loadDeck() {
    setStatus(t.loading);
    var response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("Deck request failed with " + response.status);
    var payload = await response.json();
    validateDeck(payload);
    deck = payload.cards;
    deck.forEach(function (card) { deckById[card.id] = card; });
    restore();
    render();
    setStatus(hasProgress(state) ? t.resume : text(t.ready, { team: teamName(state.activeTeamId) }));
    track("hitster_annual_deck_loaded", { cards: deck.length, year_basis: payload.yearBasis, ruleset: "kfar-blum-18" });
  }
  function randomUnusedCard() {
    var used = Object.create(null);
    state.used.forEach(function (id) { used[id] = true; });
    var available = deck.filter(function (card) { return !used[card.id]; });
    return available.length ? available[Math.floor(Math.random() * available.length)] : null;
  }
  async function drawCard() {
    if (state.current || isGameLocked()) return;
    var card = randomUnusedCard();
    if (!card) { setStatus(t.noMore); return; }
    state.current = card.id;
    state.currentYearRevealed = false;
    state.currentSolutionRevealed = false;
    state.currentAnswerChecked = false;
    state.currentAwarded = false;
    state.currentPlacementSlot = 0;
    state.currentPlacementCorrect = null;
    state.used.push(card.id);
    stopAudio();
    persist();
    render();
    setStatus(t.cardReady);
    track("hitster_card_drawn", { card_id: card.id, chart_year: card.chartYear, used_count: state.used.length, team_id: state.activeTeamId });
    await playClip(true);
  }
  function currentPlacementIsCorrect(card, slot) {
    var cards = sortedTimeline(getTeam());
    var before = slot > 0 ? cards[slot - 1] : null;
    var after = slot < cards.length ? cards[slot] : null;
    return (!before || before.chartYear <= card.chartYear) && (!after || after.chartYear >= card.chartYear);
  }
  function revealYear() {
    var card = currentCard();
    if (!card || state.currentYearRevealed) return;
    var raw = el("placement-select").value;
    if (raw === "") { setStatus(t.chooseSlotFirst); return; }
    var slot = Number(raw);
    state.currentPlacementSlot = slot;
    state.currentPlacementCorrect = currentPlacementIsCorrect(card, slot);
    state.currentYearRevealed = true;
    persist();
    render();
    setStatus(state.currentPlacementCorrect ? t.yearRevealedRight : t.yearRevealedWrong);
    track("year_revealed", { card_id: card.id, chart_year: card.chartYear, correct_slot: state.currentPlacementCorrect, slot: slot, team_id: state.activeTeamId });
  }
  function revealSolution() {
    var card = currentCard();
    if (!card || state.currentSolutionRevealed) return;
    state.currentSolutionRevealed = true;
    el("answer-panel").hidden = true;
    persist();
    render();
    setStatus(t.solutionRevealed);
    track("answer_revealed", { card_id: card.id, chart_year: card.chartYear, year_already_revealed: state.currentYearRevealed });
  }
  function cardCacheKey(card) {
    return new Request(new URL("./__hitster_preview_cache__/" + encodeURIComponent(card.id), window.location.href).href);
  }
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
    var rightSet = Object.create(null);
    rightWords.forEach(function (word) { rightSet[word] = true; });
    return leftWords.filter(function (word) { return rightSet[word]; }).length / Math.max(leftWords.length, rightWords.length);
  }
  async function lookupPreviewInCountry(card, country) {
    var url = "https://itunes.apple.com/search?media=music&entity=song&limit=50&country=" + encodeURIComponent(country) + "&term=" + encodeURIComponent(card.title + " " + card.artist);
    var response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    var expectedTitle = normalize(card.title), expectedArtist = normalize(card.artist), best = null, bestScore = 0;
    var payload = await response.json(), candidates = Array.isArray(payload.results) ? payload.results : [];
    candidates.forEach(function (candidate) {
      if (!candidate || !candidate.previewUrl || !candidate.trackName || !candidate.artistName) return;
      var titleMatch = normalize(candidate.trackName) === expectedTitle ? 1 : overlapScore(candidate.trackName, expectedTitle);
      var artistMatch = normalize(candidate.artistName) === expectedArtist ? 1 : overlapScore(candidate.artistName, expectedArtist);
      var score = titleMatch * 72 + artistMatch * 28;
      if (titleMatch >= 0.62 && artistMatch >= 0.25 && score > bestScore) { best = candidate.previewUrl; bestScore = score; }
    });
    return best;
  }
  async function lookupPreview(card) {
    if (Object.prototype.hasOwnProperty.call(previewMemo, card.id)) return previewMemo[card.id];
    if (!navigator.onLine) return null;
    var countries = ["US", "GB", "IL"];
    for (var index = 0; index < countries.length; index += 1) {
      try {
        var found = await lookupPreviewInCountry(card, countries[index]);
        if (found) { previewMemo[card.id] = found; return found; }
      } catch (error) {}
    }
    previewMemo[card.id] = null;
    return null;
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
    var local = await cachedPreview(card);
    if (local) return local;
    var remote = await lookupPreview(card);
    if (!remote) return null;
    try { return await cacheRemotePreview(card, remote); }
    catch (error) { return { src: remote, cached: false }; }
  }
  function armClipTimer() {
    clearClipTimer();
    clipTimer = setTimeout(function () {
      if (!audio) return;
      audio.pause();
      try { audio.currentTime = 0; } catch (error) {}
      setStatus(t.stopped);
      clipTimer = null;
    }, PREVIEW_SECONDS * 1000);
  }
  async function playClip(fromDraw) {
    var card = currentCard();
    if (!card || preparing) return;
    if (preparedCardId !== card.id || !audio.getAttribute("src")) {
      preparing = true;
      render();
      try {
        var preview = await preparePreview(card);
        if (!preview || state.current !== card.id) { setStatus(t.noPreview); return; }
        if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = preview.cached && preview.src.indexOf("blob:") === 0 ? preview.src : null;
        audio.src = preview.src;
        audio.load();
        preparedCardId = card.id;
        setStatus(preview.cached ? t.cached : t.onlineOnly);
      } catch (error) {
        setStatus(navigator.onLine ? t.noPreview : t.offline);
        return;
      } finally {
        preparing = false;
        render();
      }
    }
    try {
      clearClipTimer();
      audio.currentTime = 0;
      await audio.play();
      armClipTimer();
      setStatus(t.played);
      track("song_preview_started", { card_id: card.id, chart_year: card.chartYear, seconds: PREVIEW_SECONDS, from_draw: Boolean(fromDraw), used_count: state.used.length });
    } catch (error) {
      setStatus(error && error.name === "NotAllowedError" ? t.blocked : t.noPreview);
    }
  }
  function checkAnswer(event) {
    event.preventDefault();
    var card = currentCard();
    if (!card || state.currentSolutionRevealed || state.currentAnswerChecked) { setStatus(t.oneAttempt); return; }
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
    el("answer-panel").hidden = true;
    persist();
    render();
  }
  function insertCurrentCorrectly() {
    var card = currentCard();
    if (!card) return;
    var team = getTeam();
    if (team.timeline.indexOf(card.id) === -1) team.timeline.push(card.id);
    team.timeline.sort(function (left, right) {
      var a = cardFor(left), b = cardFor(right);
      return a.chartYear - b.chartYear || a.chartRank - b.chartRank;
    });
  }
  function checkWinner() {
    var team = getTeam();
    if (team.timeline.length >= WIN_CARDS) {
      state.winnerTeamId = team.id;
      return true;
    }
    return false;
  }
  function finishCurrent(shouldAdvance) {
    state.current = null;
    state.currentYearRevealed = false;
    state.currentSolutionRevealed = false;
    state.currentAnswerChecked = false;
    state.currentAwarded = false;
    state.currentPlacementSlot = null;
    state.currentPlacementCorrect = null;
    stopAudio();
    if (shouldAdvance && !isGameLocked()) advanceTurn();
    persist();
    render();
  }
  function addToTimeline() {
    var card = currentCard();
    if (!card || !state.currentYearRevealed || state.currentPlacementCorrect !== true) { setStatus(t.addNeedCorrect); return; }
    var team = getTeam();
    insertCurrentCorrectly();
    var won = checkWinner();
    var teamId = team.id;
    var year = card.chartYear;
    finishCurrent(!won);
    setStatus(won ? text(t.winner, { team: teamName(teamId) }) : t.added);
    track("card_added_to_timeline", { team_id: teamId, chart_year: year, won: won, timeline_count: team.timeline.length });
  }
  function endWrongTurn() {
    var card = currentCard();
    if (!card || !state.currentYearRevealed || state.currentPlacementCorrect !== false) return;
    var teamId = state.activeTeamId;
    var year = card.chartYear;
    finishCurrent(true);
    setStatus(t.turnEnded);
    track("turn_finished_without_card", { team_id: teamId, chart_year: year });
  }
  async function skipCard() {
    var card = currentCard(), team = getTeam();
    if (!card || state.currentYearRevealed || state.currentSolutionRevealed) return;
    if (team.stars < 1) { setStatus(t.skipNeed); return; }
    var oldCardId = card.id;
    team.stars -= 1;
    finishCurrent(false);
    setStatus(t.skipped);
    track("star_spent", { action: "skip_replace_keep_turn", team_id: team.id, card_id: oldCardId, stars: team.stars });
    await drawCard();
  }
  function freeCard() {
    var card = currentCard(), team = getTeam();
    if (!card || state.currentYearRevealed || state.currentSolutionRevealed) return;
    if (team.stars < 3) { setStatus(t.freeNeed); return; }
    team.stars -= 3;
    insertCurrentCorrectly();
    var won = checkWinner();
    var teamId = team.id;
    var year = card.chartYear;
    finishCurrent(!won);
    setStatus(won ? text(t.winner, { team: teamName(teamId) }) : t.free);
    track("star_spent", { action: "free_card", team_id: teamId, chart_year: year, stars: team.stars, won: won });
  }
  function resetGame(skipConfirm) {
    if (!skipConfirm && !window.confirm(t.resetAllConfirm)) return false;
    stopAudio();
    state = createInitialState();
    persist();
    render();
    setStatus(t.reset);
    track("game_started", { reset: true, cards: deck.length, ruleset: "kfar-blum-18" });
    return true;
  }
  function resetTimeline() {
    var team = getTeam();
    if (!window.confirm(t.resetTimelineConfirm)) return;
    team.timeline = [];
    if (state.winnerTeamId === team.id) state.winnerTeamId = null;
    persist();
    render();
    setStatus(t.timelineReset);
    track("timeline_reset", { team_id: team.id, used_count: state.used.length });
  }
  function openAnswer() {
    if (!currentCard() || state.currentSolutionRevealed || state.currentAnswerChecked) return;
    el("answer-panel").hidden = false;
    el("answer-title").focus();
  }
  function hideStartScreen() {
    var screen = el("start-screen");
    if (screen) screen.hidden = true;
  }
  function continueGame() {
    if (!hasProgress(state)) { setStatus(t.noSaved); return; }
    hideStartScreen();
    setStatus(t.resume);
    track("game_resumed", { used_count: state.used.length, team_id: state.activeTeamId });
  }
  function resetFromStart() {
    if (!resetGame(false)) return;
    hideStartScreen();
  }

  el("team-select").addEventListener("change", function (event) {
    if (!canChooseStartingTeam()) { event.target.value = state.activeTeamId; return; }
    state.activeTeamId = event.target.value;
    persist();
    render();
  });
  el("new-game").addEventListener("click", function () { resetGame(false); });
  el("next-card").addEventListener("click", function () { drawCard(); });
  el("play-clip").addEventListener("click", function () { playClip(false); });
  el("reveal-year").addEventListener("click", revealYear);
  el("reveal-solution").addEventListener("click", revealSolution);
  el("answer-open").addEventListener("click", openAnswer);
  el("answer-form").addEventListener("submit", checkAnswer);
  el("answer-cancel").addEventListener("click", function () { el("answer-panel").hidden = true; });
  el("placement-select").addEventListener("change", function (event) {
    if (!state.currentYearRevealed) { state.currentPlacementSlot = Number(event.target.value); persist(); }
  });
  el("add-to-timeline").addEventListener("click", addToTimeline);
  el("finish-turn").addEventListener("click", endWrongTurn);
  el("skip-card").addEventListener("click", function () { skipCard(); });
  el("free-card").addEventListener("click", freeCard);
  el("reset-timeline").addEventListener("click", resetTimeline);
  el("continue-game").addEventListener("click", continueGame);
  el("reset-from-start").addEventListener("click", resetFromStart);
  audio.addEventListener("timeupdate", function () {
    if (audio.currentTime >= PREVIEW_SECONDS) {
      clearClipTimer();
      audio.pause();
      audio.currentTime = 0;
      setStatus(t.stopped);
    }
  });
  audio.addEventListener("ended", function () { clearClipTimer(); setStatus(t.stopped); });
  window.addEventListener("online", setConnectionStatus);
  window.addEventListener("offline", setConnectionStatus);
  if ("serviceWorker" in navigator) window.addEventListener("load", function () { navigator.serviceWorker.register("./sw.js").catch(function () {}); });
  loadDeck().catch(function () {
    setStatus(language === "he" ? "לא ניתן לטעון את חפיסת ה־888. בדקו חיבור או רעננו." : "The 888-card deck could not load. Check your connection or refresh.");
    setConnectionStatus();
  });
}());
