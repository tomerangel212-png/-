"use strict";

(function () {
  var DATA_URL = "../../hitster-alltime-888.json";
  var STORAGE_KEY = "hitster-tra-annual-888-starter-v1";
  var AUDIO_CACHE_NAME = "hitster-tra-preview-audio-v2";
  var PREVIEW_SECONDS = 30;
  var PREVIEW_PROBE_TIMEOUT_MS = 12000;
  var MAX_PREVIEW_CANDIDATES = 8;
  var PREPARATION_BUDGET_MS = 25000;
  var previewManifest = Object.create(null);
  var previewFailures = Object.create(null);
  var nextPreparationRetry = null;
  var preparationRetries = 0;
  var pendingMediaActivation = null;
  var requestedPlayback = null;
  var preparationToken = 0;
  var START_STARS = 5;
  var MAX_STARS = 10;
  var WIN_CARDS = 10;
  var TEAM_DEFS = [
    { id: "ayelet-dudi", he: "איילת ודודי", en: "Ayelet & Dudi" },
    { id: "sharon-naveh", he: "שרון ונוה", en: "Sharon & Naveh" },
    { id: "naama-raz", he: "נעמה ורז", en: "Naama & Raz" },
    { id: "maayan-manuel", he: "מעיין ומנואל", en: "Maayan & Manuel" },
    { id: "irit-natan", he: "אירית ונתן", en: "Irit & Natan" }
  ];
  var COPY = {
    he: {
      loading: "טוען את חפיסת ה־300…",
      ready: "מוכנים. התור של {team}. לחצו על „קלף חדש + נגן”.",
      resume: "המשחק נשמר. ממשיכים בדיוק מאיפה שעצרתם — קלפים שכבר נוגנו לא יחזרו.",
      offline: "📴 אופליין: זמינים רק קטעים שנשמרו בעבר במכשיר.",
      online: "🟢 מחובר: קטעים שיושמעו יישמרו לאופליין כשהדפדפן מאפשר זאת.",
      noCard: "לחצו על „קלף חדש + נגן” כדי להתחיל את התור.",
      cardReady: "הקלף מוכן. בחרו מיקום בציר, נגנו/זהו, ואז חשפו את השנה.",
      cached: "הקטע נשמר גם לאופליין במכשיר הזה.",
      onlineOnly: "הקטע מתנגן דרך האינטרנט; הדפדפן לא אפשר לשמור אותו לאופליין.",
      preparing: "🎧 מכין את הנגן הפנימי לקלף הבא…",
      audioReady: "🎵 הקלף הבא מוכן — לחצו על „קלף חדש + נגן” ל־30 שניות.",
      retrying: "🎧 מכין מחדש קטע שמע תקין לאותו קלף…",
      retryReady: "🎵 קטע השמע מוכן מחדש. לחצו על „נגנו 30 שניות”.",
      noPreview: "לא נמצא כרגע קטע שמע תקין. הקלף לא נספר; מנסים קלף אחר.",
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
      noMore: "כל 300 הקלפים כבר נוגנו במשחק הזה.",
      reset: "משחק חדש: 5 ⭐ וקלף פתיחה גלוי לכל קבוצה. קלפי הפתיחה לא יוגרלו שוב.",
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
      winner: "🏆 {team} ניצחו עם {cards} קלפים!",
      turn: "תור",
      playLabel: "▶ נגנו 30 שניות",
      preparingLabel: "מכין שמע…",
      answerOpen: "בדקו שם שיר + אמן",
      answerClosed: "הזיהוי נבדק",
      removeConfirm: "האם אתה בטוח שאתה רוצה להסיר שיר זה מהציר?",
      resetTimelineConfirm: "לאפס את הציר של הקבוצה הזאת? השירים שכבר נוגנו לא יחזרו לחפיסה.",
      resetAllConfirm: "לאפס את כל המשחק? כל הצירים, הכוכבים והיסטוריית 300 הקלפים יימחקו.",
      noSaved: "אין משחק שמור עדיין. התחילו משחק חדש.",
      startNew: "התחילו משחק חדש"
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
      preparing: "🎧 Preparing the internal player for the next card…",
      audioReady: "🎵 The next card is ready — press “New card + play” for 30 seconds.",
      retrying: "🎧 Preparing a fresh playable preview for this card…",
      retryReady: "🎵 The preview is ready again. Press “Play 30 seconds”.",
      noPreview: "No playable preview is available right now. The card was not counted; trying another card.",
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
      reset: "New game: 5 stars and one face-up opening card per team. Opening cards will not be drawn again.",
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
      winner: "🏆 {team} wins with {cards} cards!",
      turn: "Turn",
      playLabel: "▶ Play 30 seconds",
      preparingLabel: "Preparing audio…",
      answerOpen: "Check song + artist",
      answerClosed: "Identification checked",
      removeConfirm: "Are you sure you want to remove this song from the timeline?",
      resetTimelineConfirm: "Reset this team's timeline? Already-played songs will not return to the deck.",
      resetAllConfirm: "Reset the entire game? All timelines, stars and the 888-card play history will be erased.",
      noSaved: "There is no saved game yet. Start a new game.",
      startNew: "Start a new game"
    }
  };

  var language = document.documentElement.lang === "en" ? "en" : "he";
  if (language === "he") {
    DATA_URL = "./hitster-israeli-annual.json";
    STORAGE_KEY = "hitster-tra-israeli-starter-v1";
  }
  var t = COPY[language];
  var deck = [];
  var deckById = Object.create(null);
  var state = null;
  var previewMemo = Object.create(null);
  var audio = document.getElementById("audio");
  if (audio) {
    audio.controls = true;
    audio.preload = "auto";
    audio.playsInline = true;
    audio.muted = false;
    audio.volume = 1;
    audio.classList.add("internal-audio");
    audio.style.width = "min(460px, 100%)";
    audio.style.marginTop = "12px";
  }
  var previewObjectUrl = null;
  var preparedCardId = null;
  var preparing = false;
  var clipTimer = null;
  var nextReady = null;
  var nextReadyPromise = null;
  var previewGeneration = 0;
  var playerLoadGeneration = 0;
  var recoveringCardId = null;

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
      window.TRAAudio.capture(eventName, properties || {});
    } catch (error) {}
  }
  function createInitialState(configuredTeams) {
    var teams = configuredTeams || TEAM_DEFS;
    return {
      version: 3,
      winTarget: WIN_CARDS,
      activeTeamId: teams[0].id,
      teams: teams.map(function (team) { return { id: team.id, name: team.name || team[language], stars: START_STARS, timeline: [] }; }),
      used: [],
      openingCards: [],
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
  function seedOpeningCards(target) {
    if (target.current || target.used.length || target.teams.some(function (team) { return team.timeline.length; })) return;
    var pool = shuffle(deck);
    if (pool.length < target.teams.length) throw new Error("Not enough opening cards for all teams.");
    target.openingCards = [];
    target.teams.forEach(function (team, index) {
      var id = pool[index].id;
      team.timeline.push(id);
      target.used.push(id);
      target.openingCards.push(id);
    });
  }
  function artistSuggestions(cards) {
    var seen = Object.create(null);
    var names = cards.map(function (card) { return card.artist; });
    if (language === "he") names = names.concat(["עומר אדם", "יעל נעים"]);
    return names.filter(function (name) {
      if (typeof name !== "string" || !name.trim()) return false;
      var key = normalize(name);
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    }).sort(function (a, b) { return a.localeCompare(b, language); });
  }
  function populateArtistSuggestions() {
    var list = el("artist-suggestions");
    if (!list) return;
    clear(list);
    artistSuggestions(deck).forEach(function (name) {
      var option = document.createElement("option");
      option.value = name;
      list.append(option);
    });
  }
  function teamName(id) {
    var team = state && state.teams.find(function (value) { return value.id === id; });
    if (team && team.name) return team.name;
    var definition = TEAM_DEFS.find(function (team) { return team.id === id; });
    return definition ? definition[language] : id;
  }
  function getTeam() { return state.teams.find(function (team) { return team.id === state.activeTeamId; }); }
  function cardFor(id) { return deckById[id] || null; }
  function hasProgress(candidate) {
    return Boolean(candidate && ((candidate.used && candidate.used.length) || candidate.current || (candidate.teams || []).some(function (team) { return team.timeline && team.timeline.length; })));
  }
  function sanitizeState(candidate) {
    if (!candidate || !Array.isArray(candidate.teams) || ![1, 2, 3].includes(candidate.version)) return createInitialState();
    var configuredTeams;
    if (candidate.version === 3) {
      if (candidate.teams.length < 2 || candidate.teams.length > 10) return createInitialState();
      var ids = Object.create(null);
      configuredTeams = candidate.teams.map(function (team, index) {
        if (!team || typeof team.id !== "string" || !team.id || ids[team.id]) return null;
        ids[team.id] = true;
        return { id: team.id, name: typeof team.name === "string" && team.name.trim() ? team.name.trim().slice(0, 50) : (language === "he" ? "קבוצה " : "Team ") + (index + 1) };
      });
      if (configuredTeams.some(function (team) { return !team; })) return createInitialState();
    }
    var valid = Object.create(null);
    deck.forEach(function (card) { valid[card.id] = true; });
    var restored = createInitialState(configuredTeams);
    restored.winTarget = candidate.winTarget === 15 ? 15 : WIN_CARDS;
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
    restored.openingCards = Array.isArray(candidate.openingCards) ? candidate.openingCards.filter(function (id, index, ids) {
      return valid[id] && restored.used.indexOf(id) !== -1 && ids.indexOf(id) === index;
    }) : [];
    restored.activeTeamId = restored.teams.some(function (team) { return team.id === candidate.activeTeamId; }) ? candidate.activeTeamId : restored.teams[0].id;
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
      restored.winnerTeamId = restored.teams.some(function (team) { return team.id === candidate.winnerTeamId; }) ? candidate.winnerTeamId : null;
    }
    restored.currentAnswerChecked = Boolean(candidate.currentAnswerChecked && restored.current);
    restored.currentAwarded = Boolean(candidate.currentAwarded && restored.current);
    if (restored.winnerTeamId) {
      var winner = restored.teams.find(function (team) { return team.id === restored.winnerTeamId; });
      if (!winner || winner.timeline.length < restored.winTarget) restored.winnerTeamId = null;
    }
    if (!restored.winnerTeamId) {
      var reachedTarget = restored.teams.find(function (team) { return team.timeline.length >= restored.winTarget; });
      if (reachedTarget) restored.winnerTeamId = reachedTarget.id;
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
  function releasePreview(preview) {
    if (!preview || !preview.cached || typeof preview.src !== "string" || preview.src.indexOf("blob:") !== 0) return;
    if (previewObjectUrl === preview.src) previewObjectUrl = null;
    try { URL.revokeObjectURL(preview.src); } catch (error) {}
  }
  function clearPlayerSource() {
    if (!audio) return;
    audio.pause();
    try { audio.currentTime = 0; } catch (error) {}
    pendingMediaActivation = null;
    requestedPlayback = null;
    audio.removeAttribute("src");
    try { audio.load(); } catch (error) {}
    preparedCardId = null;
    if (previewObjectUrl) { try { URL.revokeObjectURL(previewObjectUrl); } catch (error) {} previewObjectUrl = null; }
  }
  function stopAudio(options) {
    clearClipTimer();
    if (!audio) return;
    audio.pause();
    try { audio.currentTime = 0; } catch (error) {}
    if (!options || !options.keepSource) clearPlayerSource();
  }
  function clearNextReady() {
    if (nextPreparationRetry) { clearTimeout(nextPreparationRetry); nextPreparationRetry = null; }
    preparationRetries = 0;
    preparationToken += 1;
    preparing = false;
    previewGeneration += 1;
    playerLoadGeneration += 1;
    if (nextReady) releasePreview(nextReady.preview);
    nextReady = null;
    nextReadyPromise = null;
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
  function winningTarget() { return state && state.winTarget === 15 ? 15 : WIN_CARDS; }
  function victoryText(teamId) { return text(t.winner, { team: teamName(teamId), cards: winningTarget() }); }
  function isGameLocked() { return Boolean(state && state.winnerTeamId); }
  function canChooseStartingTeam() {
    var opening = state.openingCards || [];
    return !state.current && state.used.every(function (id) { return opening.indexOf(id) !== -1; });
  }
  function nextTeamId(currentId) {
    var index = state.teams.findIndex(function (team) { return team.id === currentId; });
    return state.teams[(index + 1 + state.teams.length) % state.teams.length].id;
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
        createNode("span", "team-score", "⭐ " + team.stars + "/" + MAX_STARS + " · " + team.timeline.length + "/" + winningTarget())
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
    if (state.winnerTeamId === team.id && team.timeline.length < winningTarget()) state.winnerTeamId = null;
    persist();
    render();
    setStatus(t.removed);
    track("timeline_card_removed", { team_id: team.id, card_id: cardId, used_count: state.used.length });
  }
  function renderTimeline() {
    var team = getTeam(), host = el("timeline"), title = el("timeline-title");
    title.textContent = teamName(team.id) + " · " + t.stars + ": ⭐ " + team.stars + "/" + MAX_STARS + " · " + team.timeline.length + "/" + winningTarget();
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
    el("card-source").textContent = solutionRevealed ? card.source + " · #" + card.chartRank : "";
    el("card-phase").textContent = hasCard ? t.cardReady : (isGameLocked() ? victoryText(state.winnerTeamId) : t.noCard);
    el("play-clip").hidden = !hasCard;
    el("play-clip").disabled = !hasCard || (preparing && !pendingMediaActivation);
    el("play-clip").textContent = preparing ? t.preparingLabel : t.playLabel;
    el("next-card").textContent = pendingMediaActivation ? (language === "he" ? "הפעל שמע" : "Activate audio") : !hasCard && preparing
      ? (language === "he" ? "מכין שמע…" : "Preparing audio…")
      : (language === "he" ? "קלף חדש + נגן" : "New card + play");
    el("reveal-year").disabled = !hasCard || yearRevealed;
    el("reveal-solution").disabled = !hasCard || solutionRevealed;
    el("answer-open").disabled = !hasCard || solutionRevealed || state.currentAnswerChecked;
    el("answer-open").textContent = state.currentAnswerChecked ? t.answerClosed : t.answerOpen;
    el("skip-card").disabled = !hasCard || yearRevealed || solutionRevealed;
    el("free-card").disabled = !hasCard || yearRevealed || solutionRevealed;
    el("next-card").disabled = hasCard || isGameLocked() || (preparing && !pendingMediaActivation);
    el("team-select").disabled = !canChooseStartingTeam();
    el("add-to-timeline").hidden = !(hasCard && yearRevealed && state.currentPlacementCorrect === true);
    el("finish-turn").hidden = !(hasCard && yearRevealed && state.currentPlacementCorrect === false);
    if (!hasCard) el("answer-panel").hidden = true;
    renderSlots(card);
    if (el("winner-banner")) {
      el("winner-banner").hidden = !isGameLocked();
      el("winner-banner").textContent = isGameLocked() ? victoryText(state.winnerTeamId) : "";
    }
  }
  function renderStartScreen() {
    var screen = el("start-screen");
    if (!screen) return;
    var continueButton = el("continue-game");
    var startButton = el("start-new-game");
    var resetButton = el("reset-from-start");
    if (!startButton && continueButton && continueButton.parentNode) {
      startButton = document.createElement("button");
      startButton.id = "start-new-game";
      startButton.className = "continue";
      startButton.type = "button";
      startButton.textContent = t.startNew;
      startButton.addEventListener("click", startNewGame);
      continueButton.parentNode.insertBefore(startButton, continueButton);
    }
    var saved = hasProgress(state);
    continueButton.disabled = !saved;
    continueButton.hidden = !saved;
    if (startButton) startButton.hidden = saved;
    if (resetButton) resetButton.hidden = !saved;
    if (el("start-note")) el("start-note").textContent = saved ? t.resume : t.noSaved;
  }
  function render() {
    if (!state) return;
    var select = el("team-select");
    clear(select);
    state.teams.forEach(function (team) {
      var option = createNode("option", "", teamName(team.id)); option.value = team.id; select.append(option);
    });
    el("team-select").value = state.activeTeamId;
    renderTeams();
    renderCard();
    renderTimeline();
    renderStartScreen();
    setConnectionStatus();
  }
  function validateDeck(payload) {
    var from = language === "he" ? 2002 : 1950;
    var to = language === "he" ? 2026 : 2023;
    var total = (to - from + 1) * 12;
    if (!payload || payload.total !== total || !Array.isArray(payload.cards) || payload.cards.length !== total) throw new Error("Invalid annual deck quota.");
    if (payload.yearBasis !== "chart-year" || !payload.range || payload.range.from !== from || payload.range.to !== to) throw new Error("Invalid chart-year range.");
    var years = Object.create(null), identities = Object.create(null), ids = Object.create(null);
    payload.cards.forEach(function (card) {
      if (!card || !card.id || !card.title || !card.artist || !Number.isInteger(card.chartYear) || !Number.isInteger(card.chartRank) || card.chartRank < 1 || card.yearBasis !== "chart-year" || !/^https:\/\//.test(card.sourceUrl)) throw new Error("A card is incomplete.");
      if (card.chartYear < from || card.chartYear > to) throw new Error("A card is outside the annual range.");
      if (language === "he" && (!/[א-ת]/.test(card.title) || /[a-z]/i.test(card.title) || card.chartPublisher !== "גלגלצ" || !/^israel-chart-/.test(card.id))) throw new Error("Non-Israeli chart card.");
      var key = normalize(card.title) + "|" + normalize(card.artist);
      if (identities[key] || ids[card.id]) throw new Error("Duplicate song/artist identity or card ID.");
      identities[key] = true; ids[card.id] = true;
      years[card.chartYear] = (years[card.chartYear] || 0) + 1;
      if (/michael jackson|eyal golan|אייל גולן|איל גולן/i.test(card.artist)) throw new Error("Blocked artist found.");
    });
    for (var year = from; year <= to; year += 1) if (years[year] !== 12) throw new Error("Every chart year must have 12 cards.");
  }
  async function loadDeck() {
    setStatus(t.loading);
    var payload = await window.TRAAudio.json(DATA_URL, { cache: "no-store" }, 10000);
    try { previewManifest = (await window.TRAAudio.json(language === "he" ? "./hitster-israeli-preview-manifest.json" : "./hitster-preview-manifest.json", { cache: "no-store" }, 3000)).previews || Object.create(null); } catch (error) {}
    validateDeck(payload);
    deck = payload.cards;
    deck.forEach(function (card) { deckById[card.id] = card; });
    populateArtistSuggestions();
    restore();
    render();
    setStatus(hasProgress(state) ? t.resume : text(t.ready, { team: teamName(state.activeTeamId) }));
    track("hitster_annual_deck_loaded", { cards: deck.length, year_basis: payload.yearBasis, ruleset: "kfar-blum-10" });
  }
  function unusedCards() {
    var used = Object.create(null);
    state.used.forEach(function (id) { used[id] = true; });
    return deck.filter(function (card) { return !used[card.id]; });
  }
  function shuffle(cards) {
    var items = cards.slice();
    for (var index = items.length - 1; index > 0; index -= 1) {
      var other = Math.floor(Math.random() * (index + 1));
      var swap = items[index]; items[index] = items[other]; items[other] = swap;
    }
    return items;
  }
  function drawCard(alreadyPlaying) {
    if (state.current || isGameLocked()) return;
    if (pendingMediaActivation) { activatePendingAudio(); return; }
    var ready = nextReady;
    if (!ready) {
      setStatus(t.preparing);
      void primeNextCard();
      return;
    }
    nextReady = null;
    var card = ready.card;
    state.current = card.id;
    state.currentYearRevealed = false;
    state.currentSolutionRevealed = false;
    state.currentAnswerChecked = false;
    state.currentAwarded = false;
    state.currentPlacementSlot = 0;
    state.currentPlacementCorrect = null;
    state.used.push(card.id);
    persist();
    render();
    setStatus(t.cardReady);
    track("hitster_card_drawn", { card_id: card.id, chart_year: card.chartYear, used_count: state.used.length, team_id: state.activeTeamId });
    playClip(true, alreadyPlaying);
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
      if (!response) response = await (await caches.open("hitster-tra-preview-audio-v1")).match(cardCacheKey(card));
      if (!response) return null;
      return { src: URL.createObjectURL(await response.blob()), cached: true };
    } catch (error) { return null; }
  }
  async function deleteCachedPreview(card) {
    if (!("caches" in window)) return;
    await Promise.all([AUDIO_CACHE_NAME, "hitster-tra-preview-audio-v1"].map(async function (name) {
      try { await window.TRAAudio.bounded(async function () { await (await caches.open(name)).delete(cardCacheKey(card)); }, 3000); } catch (error) {}
    }));
  }
  function overlapScore(left, right) {
    var leftWords = normalize(left).split(" ").filter(Boolean), rightWords = normalize(right).split(" ").filter(Boolean);
    if (!leftWords.length || !rightWords.length) return 0;
    var rightSet = Object.create(null);
    rightWords.forEach(function (word) { rightSet[word] = true; });
    return leftWords.filter(function (word) { return rightSet[word]; }).length / Math.max(leftWords.length, rightWords.length);
  }
  function fetchWithTimeout(url, options, timeout, consume) {
    return window.TRAAudio.request(url, options, timeout, consume);
  }
  function catalogTitle(value) {
    return normalize(String(value || "").replace(/\s*\((?:feat\.|Bonus Track|מארח את)[^)]*\)/gi, "").replace(/["״]/g, ""));
  }
  function previewTitleMatch(card, name) {
    return Math.max.apply(null, [card.lookupTitle || card.title, card.title].concat(card.titleAliases || []).map(function (title) {
      return catalogTitle(name) === catalogTitle(title) ? 1 : overlapScore(catalogTitle(name), catalogTitle(title));
    }));
  }
  function previewArtistMatch(card, name) {
    var names = [card.artist].concat(card.artistAliases || []);
    var actual = normalize(name).replace(/\band\b/g, " ").split(" ").filter(Boolean);
    var collaboration = / ו|בהשתתפות|ביחד|מארח| עם |,/.test(card.artist);
    return Math.max.apply(null, names.map(function (artist) {
      var expected = normalize(artist).replace(/\band\b/g, " ").split(" ").filter(Boolean);
      if (collaboration && expected.length && expected.every(function (word) { return actual.indexOf(word) !== -1; })) return 1;
      return overlapScore(actual.join(" "), expected.join(" "));
    }));
  }
  async function lookupPreviewInCountry(card, country) {
    var url = "https://itunes.apple.com/search?media=music&entity=song&limit=50&country=" + encodeURIComponent(country) + "&term=" + encodeURIComponent((card.lookupTitle || card.title) + " " + card.artist);
    var payload = await window.TRAAudio.json(url, { cache: "no-store" }, 4000);
    var best = null, bestScore = 0;
    var candidates = Array.isArray(payload.results) ? payload.results : [];
    candidates.forEach(function (candidate) {
      if (!candidate || !candidate.previewUrl || !candidate.trackName || !candidate.artistName || /karaoke|tribute|instrumental/i.test(candidate.artistName + " " + candidate.collectionName)) return;
      if (language === "he" && /karaoke|tribute|instrumental|remix|רמיקס|\blive\b|לייב|בהופעה|קריוקי/i.test(candidate.trackName + " " + candidate.collectionName)) return;
      var titleMatch = language === "he" ? previewTitleMatch(card, candidate.trackName) : overlapScore(candidate.trackName, card.title);
      var artistMatch = language === "he" ? previewArtistMatch(card, candidate.artistName) : overlapScore(candidate.artistName, card.artist);
      var score = titleMatch * 72 + artistMatch * 28;
      if (titleMatch >= (language === "he" ? 0.8 : 0.62) && artistMatch >= (language === "he" ? 0.5 : 0.25) && score > bestScore) { best = candidate.previewUrl; bestScore = score; }
    });
    return best;
  }
  function wait(milliseconds) { return new Promise(function (resolve) { setTimeout(resolve, milliseconds); }); }
  async function lookupPreview(card, options) {
    var force = Boolean(options && options.force);
    if (force) delete previewMemo[card.id];
    if (!force && typeof previewMemo[card.id] === "string") return previewMemo[card.id];
    if (!navigator.onLine) return null;
    if (!force && previewManifest[card.id]) return previewManifest[card.id].url;
    var countries = language === "he" ? ["IL", "US", "GB"] : ["US", "GB", "IL"];
    for (var pass = 0; pass < 2; pass += 1) {
      var results = await Promise.all(countries.map(function (country) {
        return lookupPreviewInCountry(card, country).catch(function (error) { track("song_preview_lookup_failed", { card_id: card.id, country: country, error_name: error.name }); return null; });
      }));
      var found = results.find(Boolean);
      if (found) { previewMemo[card.id] = found; return found; }
      if (pass === 0) await wait(350);
    }
    // A failed search (CORS, timeout or rate limit) must not discard the
    // verified source that was already available for this card.
    return previewManifest[card.id] ? previewManifest[card.id].url : null;
  }
  async function cacheRemotePreview(card, previewUrl) {
    try {
      var result = await fetchWithTimeout(previewUrl, { mode: "cors", cache: "force-cache" }, PREVIEW_PROBE_TIMEOUT_MS, async function (response) {
        var blob = await response.blob();
        if (!blob.size || !/audio|octet-stream/i.test(blob.type)) throw new Error("invalid audio body");
        return { response: new Response(blob, { headers: { "Content-Type": blob.type } }), blob: blob };
      });
      try {
        if ("caches" in window) { var cache = await caches.open(AUDIO_CACHE_NAME); await window.TRAAudio.bounded(function () { return cache.put(cardCacheKey(card), result.response); }, 4000); }
      } catch (error) { return { src: previewUrl, cached: false }; }
      return { src: URL.createObjectURL(result.blob), cached: true };
    } catch (error) {
      track("song_preview_cache_fallback", { card_id: card.id, error_name: error.name });
      return { src: previewUrl, cached: false };
    }
  }
  function hasThirtySecondDuration(media) {
    var duration = Number(media && media.duration);
    return Number.isFinite(duration) && duration >= PREVIEW_SECONDS - 1;
  }
  async function resolvePlayablePreview(card, options) {
    var force = Boolean(options && options.force);
    if (!force || !navigator.onLine) {
      var local = await window.TRAAudio.bounded(function () { return cachedPreview(card); }, 3000).catch(function () { return null; });
      if (local) return local;
    }
    var remote = await lookupPreview(card, { force: force });
    if (!remote) { track("song_preview_prepare_failed", { card_id: card.id, reason: "no_playable_preview" }); return null; }
    // Safari is more reliable when the actual <audio> element receives the
    // original preview URL directly. Caching is best-effort only and never
    // blocks a card from loading in the internal player.
    void cacheRemotePreview(card, remote).then(function (cached) { releasePreview(cached); });
    return { src: remote, cached: false };
  }
  function loadPreviewIntoPlayer(card, preview) {
    return new Promise(function (resolve, reject) {
      if (!audio || !preview || !preview.src) { reject(new Error("preview source unavailable")); return; }
      var token = ++playerLoadGeneration;
      var settled = false;
      var timer = null;
      function finish(error) {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        audio.removeEventListener("loadedmetadata", onCanPlay);
        audio.removeEventListener("durationchange", onCanPlay);
        audio.removeEventListener("error", onError);
        if (token === playerLoadGeneration) pendingMediaActivation = null;
        if (error) reject(error); else resolve(true);
      }
      function onCanPlay() {
        if (token !== playerLoadGeneration) { finish(new Error("stale audio preparation")); return; }
        if (!Number.isFinite(Number(audio.duration))) return;
        if (!hasThirtySecondDuration(audio)) { finish(new Error("preview is shorter than 30 seconds")); return; }
        preparedCardId = card.id;
        finish(null);
      }
      function onError() { finish(new Error("audio element could not load preview")); }
      clearClipTimer();
      clearPlayerSource();
      previewObjectUrl = preview.cached && preview.src.indexOf("blob:") === 0 ? preview.src : null;
      audio.preload = "auto";
      audio.playsInline = true;
      audio.controls = true;
      audio.muted = false;
      audio.volume = 1;
      audio.addEventListener("loadedmetadata", onCanPlay);
      audio.addEventListener("durationchange", onCanPlay);
      audio.addEventListener("error", onError, { once: true });
      pendingMediaActivation = { card: card, source: preview.src };
      timer = setTimeout(function () { finish(new Error("audio preparation timed out")); }, PREVIEW_PROBE_TIMEOUT_MS);
      audio.src = preview.src;
      render();
      audio.load();
      if (audio.readyState >= 1) onCanPlay();
    });
  }
  function forgetPreview(card) {
    if (!card) return;
    delete previewMemo[card.id];
    // A network/media failure is not evidence that a verified URL disappeared.
    // Keep the manifest so recovery can retry it without another search request.
    void deleteCachedPreview(card);
  }
  async function findAndLoadNextCard(generation) {
    var available = shuffle(unusedCards());
    var now = Date.now();
    var eligible = available.filter(function (card) { return !previewFailures[card.id] || previewFailures[card.id] <= now; });
    var candidates = eligible.filter(function (card) { return previewManifest[card.id]; }).concat(eligible.filter(function (card) { return !previewManifest[card.id]; })).slice(0, MAX_PREVIEW_CANDIDATES);
    for (var index = 0; index < candidates.length; index += 1) {
      if (generation !== previewGeneration || state.current || isGameLocked()) return null;
      var card = candidates[index];
      // Record attempts before awaiting: a cancelled slow request must not
      // monopolize the following batch either.
      previewFailures[card.id] = Date.now() + 30000;
      var preview = null;
      try {
        preview = await resolvePlayablePreview(card);
        if (generation !== previewGeneration || state.current || isGameLocked()) { releasePreview(preview); return null; }
        if (!preview) { previewFailures[card.id] = Date.now() + 30000; track("hitster_preview_candidate_skipped", { card_id: card.id, reason: "no_preview" }); continue; }
        await loadPreviewIntoPlayer(card, preview);
        if (generation !== previewGeneration || state.current || isGameLocked()) { releasePreview(preview); return null; }
        delete previewFailures[card.id];
        return { card: card, preview: preview };
      } catch (error) {
        releasePreview(preview);
        if (generation !== previewGeneration) return null;
        forgetPreview(card);
        previewFailures[card.id] = Date.now() + 30000;
        track("hitster_preview_candidate_skipped", { card_id: card.id, reason: "load_failed", error_name: error && error.name || "Error" });
      }
    }
    return null;
  }
  async function primeNextCard() {
    if (!state || state.current || isGameLocked()) return null;
    if (nextReady) return nextReady;
    if (nextReadyPromise) return nextReadyPromise;
    if (nextPreparationRetry) { clearTimeout(nextPreparationRetry); nextPreparationRetry = null; }
    if (!unusedCards().length) { setStatus(t.noMore); return null; }
    var generation = previewGeneration;
    var operationToken = ++preparationToken;
    preparing = true;
    render();
    setStatus(t.preparing);
    var request = window.TRAAudio.bounded(function () { return findAndLoadNextCard(generation); }, PREPARATION_BUDGET_MS, function () {
      if (operationToken !== preparationToken) return;
      previewGeneration += 1; playerLoadGeneration += 1; clearPlayerSource();
    });
    nextReadyPromise = request;
    try {
      var pick = await request;
      if (generation !== previewGeneration || state.current || isGameLocked()) {
        if (pick) releasePreview(pick.preview);
        return null;
      }
      nextReady = pick;
      if (pick) preparationRetries = 0;
      setStatus(pick ? t.audioReady : (language === "he" ? "טעינת השמע התעכבה. בודק קלפים נוספים; החפיסה לא נגמרה." : "Audio loading was delayed. Checking more cards; the deck is not exhausted."));
      return pick;
    } catch (error) {
      if (operationToken !== preparationToken) return null;
      track("song_preview_prepare_failed", { reason: "preparation_budget", error_name: error.name });
      setStatus(language === "he" ? "טעינת השמע התעכבה. מנסה קלפים נוספים בלי לספור קלף." : "Audio loading was delayed. Retrying more cards without counting a card.");
      return null;
    } finally {
      if (nextReadyPromise === request) nextReadyPromise = null;
      if (operationToken === preparationToken) {
        preparing = false; render();
        completeRequestedPlayback();
        if (!nextReady && !state.current && !isGameLocked() && unusedCards().length) {
          if (preparationRetries < 3) {
            preparationRetries += 1;
            var retryGeneration = previewGeneration;
            nextPreparationRetry = setTimeout(function () {
              nextPreparationRetry = null;
              if (retryGeneration === previewGeneration && !state.current) void primeNextCard();
            }, 1500);
          } else {
            preparationRetries = 0;
            setStatus(language === "he" ? "יש קלפים נוספים בחפיסה, אך השמע לא נטען כרגע. לחצו על קלף חדש כדי לנסות שוב." : "More cards remain, but audio is unavailable right now. Press New card to retry.");
          }
        }
      }
    }
  }
  function armClipTimer() {
    clearClipTimer();
    clipTimer = setTimeout(function () {
      if (!audio) return;
      audio.pause();
      try { audio.currentTime = 0; } catch (error) {}
      setStatus(t.stopped);
      if (el("play-clip")) el("play-clip").textContent = t.playLabel;
      clipTimer = null;
    }, PREVIEW_SECONDS * 1000);
  }
  async function prepareCurrentPreview(card, options) {
    if (!card || preparing) return false;
    var force = Boolean(options && options.force);
    var operationToken = ++preparationToken;
    var expired = false;
    preparing = true;
    render();
    setStatus(force ? t.retrying : t.preparing);
    try {
      var loaded = await window.TRAAudio.bounded(async function () {
        var preview = await resolvePlayablePreview(card, { force: force });
        if (expired || operationToken !== preparationToken || !preview || !state || state.current !== card.id) { releasePreview(preview); return false; }
        await loadPreviewIntoPlayer(card, preview);
        if (expired || operationToken !== preparationToken || !state || state.current !== card.id) { releasePreview(preview); return false; }
        return true;
      }, PREPARATION_BUDGET_MS, function () { expired = true; if (operationToken === preparationToken) { playerLoadGeneration += 1; clearPlayerSource(); } });
      if (operationToken !== preparationToken) return false;
      if (!loaded) { setStatus(t.noPreview); return false; }
      setStatus(force ? t.retryReady : t.audioReady);
      return true;
    } catch (error) {
      if (operationToken !== preparationToken) return false;
      forgetPreview(card);
      track("song_preview_prepare_failed", { card_id: card.id, reason: "current_preparation", error_name: error.name });
      setStatus(navigator.onLine ? t.noPreview : t.offline);
      return false;
    } finally {
      if (operationToken === preparationToken) { preparing = false; render(); completeRequestedPlayback(); }
    }
  }
  function recoverCurrentPreview(card, error) {
    if (!card || !state || state.current !== card.id) return;
    if (error && error.name === "NotAllowedError") { setStatus(t.blocked); return; }
    if (recoveringCardId === card.id) return;
    recoveringCardId = card.id;
    track("hitster_audio_preview_failed", { card_id: card.id, error_name: error && error.name || "Error" });
    forgetPreview(card);
    stopAudio();
    void prepareCurrentPreview(card, { force: true }).finally(function () { recoveringCardId = null; });
  }
  function playbackStarted(card, fromDraw) {
    armClipTimer();
    if (el("play-clip")) el("play-clip").textContent = language === "he" ? "■ עצרו" : "■ Stop";
    setStatus(t.played);
    track("song_preview_started", { card_id: card.id, chart_year: card.chartYear, seconds: PREVIEW_SECONDS, from_draw: Boolean(fromDraw), used_count: state.used.length });
  }
  function completeRequestedPlayback() {
    var intent = requestedPlayback;
    if (!intent || !intent.started || intent.token !== playerLoadGeneration || preparing || audio.paused) return;
    if (preparedCardId !== intent.cardId) return;
    var card = currentCard();
    if (card && card.id === intent.cardId) {
      requestedPlayback = null;
      playbackStarted(card, false);
    } else if (!card && nextReady && nextReady.card.id === intent.cardId) {
      requestedPlayback = null;
      drawCard(true);
    }
  }
  function activatePendingAudio() {
    if (!pendingMediaActivation || !audio.src) return;
    // Keep the user's actual play request alive while metadata finishes loading.
    // Calling load() here restarts the request; pausing on fulfilment loses the tap.
    var intent = { token: playerLoadGeneration, cardId: pendingMediaActivation.card.id, started: false };
    requestedPlayback = intent;
    var attempt;
    try { attempt = audio.play(); }
    catch (error) { requestedPlayback = null; setStatus(t.blocked); track("hitster_audio_activation_failed", { error_name: error.name }); return; }
    Promise.resolve(attempt).then(function () {
      if (intent.token !== playerLoadGeneration || requestedPlayback !== intent) return;
      intent.started = true;
      completeRequestedPlayback();
    }).catch(function (error) {
      if (requestedPlayback !== intent) return;
      requestedPlayback = null;
      setStatus(t.blocked);
      track("hitster_audio_activation_failed", { error_name: error.name });
    });
  }
  function playClip(fromDraw, alreadyPlaying) {
    var card = currentCard();
    if (pendingMediaActivation) { activatePendingAudio(); return; }
    if (!card || preparing) return;
    if (preparedCardId !== card.id || !audio.getAttribute("src")) {
      void prepareCurrentPreview(card);
      return;
    }
    if (alreadyPlaying && !audio.paused) { playbackStarted(card, fromDraw); return; }
    if (!audio.paused) {
      stopAudio({ keepSource: true });
      setStatus(t.stopped);
      if (el("play-clip")) el("play-clip").textContent = t.playLabel;
      return;
    }
    var attempt, playbackToken = playerLoadGeneration;
    try {
      clearClipTimer();
      audio.currentTime = 0;
      attempt = audio.play();
    } catch (error) {
      recoverCurrentPreview(card, error);
      return;
    }
    Promise.resolve(attempt).then(function () {
      if (playbackToken !== playerLoadGeneration || !state || state.current !== card.id) return;
      playbackStarted(card, fromDraw);
    }).catch(function (error) { recoverCurrentPreview(card, error); });
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
    if (team.timeline.length >= winningTarget()) {
      state.winnerTeamId = team.id;
      return true;
    }
    return false;
  }
  function continueToFifteen() {
    if (!state.winnerTeamId || winningTarget() !== 10) return;
    state.winTarget = 15;
    state.winnerTeamId = null;
    advanceTurn();
    persist(); render();
    setStatus(language === "he" ? "ממשיכים לשובר שוויון עד 15 קלפים. התור של " + teamName(state.activeTeamId) : "Continuing to 15 cards. Next team: " + teamName(state.activeTeamId));
    track("hitster_tiebreak_started", { target: 15, team_count: state.teams.length });
    void primeNextCard();
  }
  function showVictory() {
    if (!state.winnerTeamId) return;
    var dialog = el("victory-dialog");
    el("victory-title").textContent = victoryText(state.winnerTeamId);
    el("victory-continue").hidden = winningTarget() !== 10;
    if (typeof dialog.showModal === "function") { if (!dialog.open) dialog.showModal(); }
    else if (winningTarget() === 10) {
      if (window.confirm(victoryText(state.winnerTeamId) + (language === "he" ? "\nלהמשיך לשובר שוויון עד 15 קלפים?" : "\nContinue to a tiebreak at 15 cards?"))) continueToFifteen();
    } else window.alert(victoryText(state.winnerTeamId));
  }
  el("victory-continue").addEventListener("click", function () { el("victory-dialog").close(); continueToFifteen(); });
  el("victory-finish").addEventListener("click", function () { el("victory-dialog").close(); });
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
    if (!isGameLocked()) void primeNextCard();
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
    setStatus(won ? victoryText(teamId) : t.added);
    track("card_added_to_timeline", { team_id: teamId, chart_year: year, won: won, timeline_count: team.timeline.length });
    if (won) showVictory();
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
    await primeNextCard();
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
    setStatus(won ? victoryText(teamId) : t.free);
    track("star_spent", { action: "free_card", team_id: teamId, chart_year: year, stars: team.stars, won: won });
    if (won) showVictory();
  }
  function resetGame(skipConfirm, configuredTeams) {
    if (!skipConfirm && !window.confirm(t.resetAllConfirm)) return false;
    if (!skipConfirm) { beginTeamSetup(); return false; }
    clearNextReady();
    stopAudio();
    state = createInitialState(configuredTeams);
    seedOpeningCards(state);
    persist();
    render();
    setStatus(t.reset);
    track("game_started", { reset: true, cards: deck.length, ruleset: "kfar-blum-10" });
    void primeNextCard();
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
    if (isGameLocked()) { showVictory(); return; }
    var card = currentCard();
    if (card) void prepareCurrentPreview(card);
    else void primeNextCard();
  }
  function resetFromStart() {
    if (!resetGame(false)) return;
    hideStartScreen();
  }
  function startNewGame() {
    beginTeamSetup();
  }

  function beginTeamSetup() {
    stopAudio({ keepSource: true });
    el("start-screen").hidden = false;
    el("start-actions").hidden = true;
    el("setup-flow").hidden = false;
    el("setup-count-step").hidden = false;
    el("setup-names-step").hidden = true;
    el("setup-team-count").value = String(state.teams.length);
    el("setup-team-count").focus();
  }
  function showTeamNames() {
    var count = Number(el("setup-team-count").value);
    if (!Number.isInteger(count) || count < 2 || count > 10) return;
    var host = el("setup-team-names");
    var draftNames = Array.from(host.querySelectorAll("input")).map(function (input) { return input.value; });
    clear(host);
    for (var index = 0; index < count; index += 1) {
      var label = createNode("label", "setup-name", (language === "he" ? "קבוצה " : "Team ") + (index + 1));
      var input = document.createElement("input"); input.type = "text"; input.maxLength = 50;
      input.name = "team-name"; input.required = true;
      input.value = draftNames[index] || (language === "he" ? "קבוצה " : "Team ") + (index + 1);
      input.placeholder = language === "he" ? "למשל: המגניבים" : "For example: The Cool Ones";
      label.append(input); host.append(label);
    }
    el("setup-count-step").hidden = true; el("setup-names-step").hidden = false;
    host.querySelector("input").focus(); host.querySelector("input").select();
  }
  el("setup-count-next").addEventListener("click", showTeamNames);
  el("setup-back").addEventListener("click", function () { el("setup-names-step").hidden = true; el("setup-count-step").hidden = false; });
  el("setup-cancel").addEventListener("click", function () {
    el("setup-flow").hidden = true; el("start-actions").hidden = false; renderStartScreen();
  });
  el("setup-names-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var inputs = Array.from(el("setup-team-names").querySelectorAll("input"));
    var invalid = inputs.find(function (input) { return !input.value.trim(); });
    if (invalid) { invalid.focus(); return; }
    var teams = inputs.map(function (input, index) { return { id: "team-" + (index + 1), name: input.value.trim().slice(0, 50) }; });
    resetGame(true, teams);
    el("setup-flow").hidden = true; el("start-actions").hidden = false; hideStartScreen();
  });

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
  if (el("start-new-game")) el("start-new-game").addEventListener("click", startNewGame);
  audio.addEventListener("error", function () {
    var card = currentCard();
    if (!preparing && card && preparedCardId === card.id) { recoverCurrentPreview(card, new Error("audio element error")); return; }
    if (nextReady && preparedCardId === nextReady.card.id) {
      var failed = nextReady;
      nextReady = null;
      forgetPreview(failed.card);
      clearPlayerSource();
      void primeNextCard();
    }
  });
  audio.addEventListener("timeupdate", function () {
    if (audio.currentTime >= PREVIEW_SECONDS) {
      clearClipTimer();
      audio.pause();
      audio.currentTime = 0;
      setStatus(t.stopped);
      if (el("play-clip")) el("play-clip").textContent = t.playLabel;
    }
  });
  audio.addEventListener("ended", function () { clearClipTimer(); setStatus(t.stopped); if (el("play-clip")) el("play-clip").textContent = t.playLabel; });
  window.addEventListener("online", setConnectionStatus);
  window.addEventListener("offline", setConnectionStatus);
  if ("serviceWorker" in navigator) window.addEventListener("load", function () { navigator.serviceWorker.register("./sw.js").catch(function () {}); });
  loadDeck().catch(function () {
    setStatus(language === "he" ? "לא ניתן לטעון את החפיסה הישראלית. בדקו חיבור או רעננו." : "The 888-card deck could not load. Check your connection or refresh.");
    setConnectionStatus();
  });
}());
