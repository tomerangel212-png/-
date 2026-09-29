"use strict";

const quickPanel = document.querySelector("#quick-panel");
const quickTitle = document.querySelector("#quick-title");
const quickRules = document.querySelector("#quick-rules");
const quickChallenge = document.querySelector("#quick-challenge");
const quickNext = document.querySelector("#quick-next");
const quickClose = document.querySelector("#quick-close");
const quickDone = document.querySelector("#quick-done");
const quickControls = document.querySelector("#quick-controls");
const gameCore = window.TRA_GAMES_CORE;
let activeQuickGame = null;
let activeQuickEntry = null;
let doubleState = { deck: [], round: 0, score: 0, feedback: "" };
const ALCHEMY_KEY = "tra-alchemy-v1";

const pick = (items) => items[Math.floor(Math.random() * items.length)];
const lastChallengeByGame = {};
const pickDifferent = (gameId, items) => {
  if (!items?.length) return "";
  if (items.length === 1) return items[0];
  let entry = pick(items);
  let guard = 0;
  while (entry === lastChallengeByGame[gameId] && guard < 12) {
    entry = pick(items);
    guard += 1;
  }
  lastChallengeByGame[gameId] = entry;
  return entry;
};
const track = (name, properties = {}) => {
  if (window.posthog?.capture) window.posthog.capture(name, properties);
};

const sharedConversationQuestions = Array.isArray(window.TRA_CONVERSATION_QUESTIONS) && window.TRA_CONVERSATION_QUESTIONS.length
  ? window.TRA_CONVERSATION_QUESTIONS
  : [
      "מישהו קרוב אליך שהופך אותך לאדם יותר טוב",
      "מה מרגיע אותך",
      "שיר אהוב",
      "מקום אהוב בארץ"
    ];

const games = {
  codename: {
    title: "🕵️ שם קוד TRA",
    rules: "בחרו קפטן. הקפטן נותן רמז של מילה אחת ומספר; הקבוצה צריכה לנחש כמה שיותר מילים קשורות בלי לומר אותן במפורש.",
    challenges: [
      "מילים: שמש · פסנתר · ירושלים · ירוק · משפחה · רכבת · כוכב · ים. תנו רמז אחד שמחבר לפחות שתיים.",
      "מילים: קצב · מלך · תפוח · במה · גשר · נחל · ספר · זהב. תנו רמז אחד שמחבר לפחות שתיים.",
      "מילים: לילה · כדורסל · שיר · חדר · חופש · רופא · עץ · שחמט. תנו רמז אחד שמחבר לפחות שתיים."
    ]
  },
  goodword: {
    title: "💬 מילה טובה",
    rules: "כדור השאלה עובר בין המשתתפים. מי שמקבל אותו עונה על השאלה שעלתה. אין תשובה נכונה; המטרה היא תשובה אישית, ספציפית ומכבדת.",
    challenges: sharedConversationQuestions
  },
  speeddate: {
    title: "⏱️ ספיד־דייט",
    rules: "90 שניות לכל זוג. כל אחד עונה, ואז מתחלפים. בסיום מחליפים שותף.",
    challenges: [
      "איזה שיר מחזיר אותך מיד למקום או לתקופה בחיים?",
      "מה מיומנות שמישהו מדור אחר לימד אותך?",
      "מה השתנה בין הדורות לטובה, ומה חשוב לא לאבד?",
      "איזה דבר קטן היית רוצה להעביר הלאה?"
    ]
  },
  debate: {
    title: "⚖️ דיבייט TRA",
    rules: "שני צדדים. דקה להכנה, דקה לכל צד, ואז כל צד מסכם את טיעון הצד השני בצורה שהצד השני מאשר.",
    challenges: [
      "נוסטלגיה מול מוזיקה חדשה — מה חשוב יותר באירוע משפחתי?",
      "מילים מול מנגינה — מה הופך שיר לבלתי נשכח?",
      "משחק אישי מול משחק קבוצתי — מה יוצר חוויה טובה יותר?",
      "טלפונים במשחקי חברה — כלי מועיל או הפרעה?"
    ]
  },
  escape: {
    title: "🔐 אסקייפ רום · קוד 2124",
    rules: "פתרו ארבע חידות. חברו את ארבע הספרות לפי הסדר כדי לפתוח את הקוד.",
    challenges: [
      "חידה 1/4: לפניכם השנים 1967, 1979, 1982, 1991, 2002, 2026. כמה מהן מאוחרות משנת 2000?",
      "חידה 2/4: במילה TRA, כמה פעמים מופיעה האות A?",
      "חידה 3/4: כמה עשורים מלאים מפרידים בין 2002 ל־2022?",
      "חידה 4/4: 20 משתתפים מתחלקים לחוליות של 5. כמה חוליות נוצרות?"
    ]
  },
  puzzle: {
    title: "🧩 פאזל והיגיון",
    rules: "פתרו בלי לחפש. אחרי תשובה, עברו למשימה חדשה והשוו דרך חשיבה.",
    challenges: [
      "השלימו את הסדרה: 1, 1, 2, 3, 5, ?",
      "מסדרים את 1 עד 9 בריבוע קסם 3×3. איזה מספר חייב להיות במרכז?",
      "יש שלושה מתגים בחדר אחד ונורה בחדר אחר. מותר להיכנס לחדר הנורה פעם אחת בלבד. איך מגלים איזה מתג מפעיל אותה?",
      "מה כבד יותר: קילוגרם ברזל או קילוגרם נוצות?"
    ]
  },
  double: {
    title: "👀 דאבל TRA",
    rules: "בשני הקלפים יש סמל משותף אחד. לחצו עליו באחד הקלפים. בחפיסה יש 57 קלפים ו־8 סמלים בכל קלף.",
    challenges: []
  },
  alchemy: {
    title: "⚗️ אלכימאי קטן — תומרון",
    rules: "נסו לנחש מה נוצר מחיבור שני היסודות, ואז לחצו על ״הצג תשובה״ כדי לחשוף את התוצאה.",
    challenges: [
      { prompt: "מים + אדמה", answer: "בוץ" },
      { prompt: "מים + קור", answer: "קרח" },
      { prompt: "אש + מים", answer: "אדים" },
      { prompt: "אש + עץ", answer: "מדורה" },
      { prompt: "אדמה + אש", answer: "לבה" },
      { prompt: "אדמה + אוויר", answer: "אבק" },
      { prompt: "אוויר + מים", answer: "ענן" },
      { prompt: "ענן + מים", answer: "גשם" },
      { prompt: "גשם + אדמה", answer: "צמח" },
      { prompt: "צמח + זמן", answer: "עץ" },
      { prompt: "אש + אבן", answer: "מתכת" },
      { prompt: "חול + אש", answer: "זכוכית" },
      { prompt: "מים + אור", answer: "קשת" },
      { prompt: "אדמה + זרע", answer: "צמח" },
      { prompt: "שלג + חום", answer: "מים" },
      { prompt: "אוויר + תוף", answer: "מוזיקה" }
    ]
  },
  knoke: {
    title: "🚪 חופש בקנוקה",
    rules: "מתקדמים מחדר 1 עד חדר 4. כל חדר קשה יותר. פתרתם? עברו למשימה הבאה.",
    challenges: [
      "חדר 1: מי בעלה של סבתא טוני?",
      "חדר 2: הצמח לא פורח. מה צריך להזיז או לשנות כדי שיקבל שמש?",
      "חדר 3: מצאו את החוק שמסדר ארבעה מספרי חדרים מהקטן לגדול בלי לגעת במספר פעמיים.",
      "חדר 4: שלבו רמז משפחתי, רמז מקום ורמז זמן למילת פתיחה אחת."
    ]
  },
  dnd: {
    title: "🐉 TRA Dungeons & Dragons",
    rules: "בחרו דמות, קראו את הסיטואציה וגלגלו ק20 וירטואלי. 1–5 כישלון, 6–14 הצלחה חלקית, 15–20 הצלחה.",
    challenges: [
      () => `אתם מגיעים לצומת עם שלושה שבילים. בחרו: ידע, אומץ או שיתוף פעולה. גלגול ק20: ${1 + Math.floor(Math.random() * 20)}.`,
      () => `דמות מהקבוצה איבדה רמז חשוב. החליטו מי מוביל את החיפוש ולמה. גלגול ק20: ${1 + Math.floor(Math.random() * 20)}.`,
      () => `הקבוצה חלוקה בין שתי דרכי פעולה. נסחו החלטה משותפת ואז גלגלו. ק20: ${1 + Math.floor(Math.random() * 20)}.`
    ]
  }
};

const normalizeAlchemy = value => String(value || "").normalize("NFKC").toLocaleLowerCase("he").replace(/[\u0591-\u05C7]/g, "").replace(/[־–—-]/g, " ").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
let alchemyStorage;
try { alchemyStorage = window.localStorage; } catch (error) { alchemyStorage = { getItem: () => null, setItem: () => { throw error; } }; }
let alchemyState = gameCore
  ? gameCore.loadAlchemyState(alchemyStorage, ALCHEMY_KEY, games.alchemy.challenges.length)
  : { version: 1, score: 0, guesses: 0, currentIndex: 0, discoveries: {} };

function saveAlchemy() {
  if (gameCore) gameCore.saveAlchemyState(alchemyStorage, ALCHEMY_KEY, alchemyState, games.alchemy.challenges.length);
}

function clearQuickControls() {
  if (!quickControls) return;
  while (quickControls.firstChild) quickControls.removeChild(quickControls.firstChild);
}

function appendButton(label, className, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  if (className) button.className = className;
  button.addEventListener("click", action);
  return button;
}

function shuffled(items) {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function renderDouble() {
  if (!gameCore || !quickControls) return;
  if (!doubleState.deck.length) doubleState = { deck: shuffled(gameCore.createDobbleDeck()), round: 0, score: 0, feedback: "", displayRound: -1, displayCards: [] };
  const first = doubleState.deck[doubleState.round % 57];
  const second = doubleState.deck[(doubleState.round + 1) % 57];
  const common = first.find(symbol => second.includes(symbol));
  if (doubleState.displayRound !== doubleState.round) {
    doubleState.displayRound = doubleState.round;
    doubleState.displayCards = [shuffled(first), shuffled(second)];
  }
  while (quickChallenge.firstChild) quickChallenge.removeChild(quickChallenge.firstChild);
  const cards = document.createElement("div");
  cards.className = "double-cards";
  doubleState.displayCards.forEach((card, index) => {
    const face = document.createElement("section");
    face.className = "double-card";
    face.setAttribute("aria-label", index === 0 ? "קלף א" : "קלף ב");
    card.forEach(symbolId => {
      const symbol = document.createElement("button");
      symbol.type = "button";
      symbol.className = "double-symbol";
      symbol.textContent = gameCore.SYMBOLS[symbolId];
      symbol.setAttribute("aria-label", `בחרו סמל ${gameCore.SYMBOLS[symbolId]}`);
      symbol.addEventListener("click", () => {
        if (symbolId === common) {
          doubleState.score += 1;
          doubleState.round += 1;
          doubleState.feedback = `✅ נכון! ${gameCore.SYMBOLS[common]} הוא הסמל המשותף.`;
          track("tra_dobble_match", { score: doubleState.score, round: doubleState.round });
          renderDouble();
        } else {
          doubleState.feedback = "לא זה. חפשו את הסמל שמופיע בשני הקלפים.";
          renderDouble();
        }
      });
      face.append(symbol);
    });
    cards.append(face);
  });
  quickChallenge.append(cards);
  clearQuickControls();
  const score = document.createElement("p");
  score.className = "quick-feedback";
  score.setAttribute("role", "status");
  score.textContent = `ניקוד: ${doubleState.score} · סבב ${doubleState.round + 1}/57${doubleState.feedback ? ` · ${doubleState.feedback}` : ""}`;
  quickControls.append(score);
}

function currentAlchemyIndex() {
  const count = games.alchemy.challenges.length;
  return findAlchemyIndex(alchemyState.currentIndex);
}

function findAlchemyIndex(start) {
  const count = games.alchemy.challenges.length;
  for (let offset = 0; offset < count; offset += 1) {
    const index = (start + offset) % count;
    if (!alchemyState.discoveries[String(index)]) return index;
  }
  return -1;
}

function renderAlchemyBook() {
  const details = document.createElement("details");
  details.className = "alchemy-book";
  const summary = document.createElement("summary");
  summary.textContent = `ספר התגליות · ${Object.keys(alchemyState.discoveries).length}/${games.alchemy.challenges.length}`;
  details.append(summary);
  const list = document.createElement("ul");
  games.alchemy.challenges.forEach((entry, index) => {
    const found = alchemyState.discoveries[String(index)];
    if (!found) return;
    const item = document.createElement("li");
    item.textContent = `${found.prompt} = ${found.answer}${found.method === "guess" ? " · ניחוש נכון" : " · נחשף"}`;
    list.append(item);
  });
  if (!list.childElementCount) {
    const item = document.createElement("li");
    item.textContent = "עדיין לא התגלו שילובים.";
    list.append(item);
  }
  details.append(list);
  return details;
}

function renderAlchemy() {
  const index = currentAlchemyIndex();
  if (index < 0) {
    activeQuickEntry = null;
    quickChallenge.textContent = "כל השילובים התגלו! אפשר לייצא את הספר או לאפס ולהתחיל מחדש.";
    if (quickDone) quickDone.hidden = true;
  } else {
    alchemyState.currentIndex = index;
    activeQuickEntry = games.alchemy.challenges[index];
    quickChallenge.textContent = `${activeQuickEntry.prompt} = ?`;
    if (quickDone) { quickDone.hidden = false; quickDone.textContent = "חשפו תשובה"; }
  }
  saveAlchemy();
  clearQuickControls();
  const summary = document.createElement("p");
  summary.className = "quick-feedback";
  summary.textContent = `ניקוד: ${alchemyState.score} · ניסיונות: ${alchemyState.guesses} · התקדמות נשמרת במכשיר`;
  quickControls.append(summary);
  if (activeQuickEntry) {
    const form = document.createElement("form");
    form.className = "alchemy-guess";
    const input = document.createElement("input");
    input.type = "text";
    input.autocomplete = "off";
    input.placeholder = "מה נוצר?";
    input.setAttribute("aria-label", "ניחוש התוצאה");
    const result = document.createElement("span");
    result.className = "quick-feedback";
    result.setAttribute("role", "status");
    const found = alchemyState.discoveries[String(alchemyState.currentIndex)];
    if (found) {
      result.textContent = `✅ ${found.prompt} = ${found.answer}`;
      input.disabled = true;
    }
    form.append(input, appendButton("בדקו ניחוש", "primary", () => {}));
    form.addEventListener("submit", event => {
      event.preventDefault();
      if (!activeQuickEntry || alchemyState.discoveries[String(alchemyState.currentIndex)]) return;
      alchemyState.guesses += 1;
      if (normalizeAlchemy(input.value) === normalizeAlchemy(activeQuickEntry.answer)) {
        const solvedIndex = alchemyState.currentIndex;
        alchemyState.score += 1;
        alchemyState.discoveries[String(solvedIndex)] = { prompt: activeQuickEntry.prompt, answer: activeQuickEntry.answer, method: "guess" };
        result.textContent = `✅ נכון! ${activeQuickEntry.prompt} = ${activeQuickEntry.answer}`;
        input.disabled = true;
        track("tra_alchemy_answer_guessed", { combination: activeQuickEntry.prompt, score: alchemyState.score });
      } else result.textContent = "עוד לא. נסו שוב, או חשפו את התשובה.";
      saveAlchemy();
      renderAlchemyProgress(summary);
      renderAlchemyBookInto(book);
    });
    form.querySelector("button").type = "submit";
    quickControls.append(form, result);
  }
  const book = renderAlchemyBook();
  quickControls.append(book);
  quickControls.append(
    appendButton("ייצאו ספר תגליות", "", exportAlchemy),
    appendButton("איפוס התקדמות", "", resetAlchemy)
  );
}

function renderAlchemyProgress(target) {
  target.textContent = `ניקוד: ${alchemyState.score} · ניסיונות: ${alchemyState.guesses} · התקדמות נשמרת במכשיר`;
}

function renderAlchemyBookInto(target) {
  const fresh = renderAlchemyBook();
  target.replaceWith(fresh);
}

function exportAlchemy() {
  const content = JSON.stringify({ title: "TRA Alchemy discoveries", exportedAt: new Date().toISOString(), score: alchemyState.score, guesses: alchemyState.guesses, discoveries: alchemyState.discoveries }, null, 2);
  const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "tra-alchemy-discoveries.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function resetAlchemy() {
  if (!window.confirm("לאפס את הניקוד ואת ספר התגליות של אלכימאי קטן?")) return;
  alchemyState = gameCore ? gameCore.createAlchemyState() : { version: 1, score: 0, guesses: 0, currentIndex: 0, discoveries: {} };
  saveAlchemy();
  renderChallenge();
}

function renderChallenge() {
  if (!activeQuickGame) return;
  const game = games[activeQuickGame];
  if (activeQuickGame === "double") {
    quickRules.textContent = game.rules;
    if (quickDone) { quickDone.hidden = false; quickDone.textContent = "סיימנו"; }
    renderDouble();
    return;
  }
  if (activeQuickGame === "alchemy") {
    quickRules.textContent = game.rules;
    if (quickNext) quickNext.textContent = "השילוב הבא";
    renderAlchemy();
    return;
  }
  if (quickNext) quickNext.textContent = "משימה חדשה";
  if (quickDone) quickDone.hidden = false;
  clearQuickControls();
  const entry = pickDifferent(activeQuickGame, game.challenges);
  activeQuickEntry = entry;

  if (typeof entry === "function") {
    quickChallenge.textContent = entry();
  } else if (entry && typeof entry === "object" && "prompt" in entry) {
    quickChallenge.textContent = `${entry.prompt} = ?`;
  } else {
    quickChallenge.textContent = entry;
  }

  if (quickDone) {
    quickDone.textContent = activeQuickGame === "alchemy" ? "הצג תשובה" : "סיימנו";
  }

  track("tra_quick_game_challenge", {
    game: activeQuickGame,
    pool_size: game.challenges.length
  });
}

function openQuickGame(id) {
  const game = games[id];
  if (!game || !quickPanel) return;
  activeQuickGame = id;
  activeQuickEntry = null;
  if (id === "double") doubleState = { deck: shuffled(gameCore.createDobbleDeck()), round: 0, score: 0, feedback: "", displayRound: -1, displayCards: [] };
  if (id === "alchemy") alchemyState.currentIndex = currentAlchemyIndex();
  quickTitle.textContent = game.title;
  quickRules.textContent = game.rules;
  quickPanel.hidden = false;
  renderChallenge();
  quickPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  track("tra_game_opened", { game: id, mode: "quick_play" });
}

function closeQuickGame() {
  if (!quickPanel) return;
  quickPanel.hidden = true;
  activeQuickGame = null;
  activeQuickEntry = null;
  if (quickDone) quickDone.textContent = "סיימנו";
  document.querySelector("#all-games")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.querySelectorAll(".quick-play").forEach((button) => {
  button.addEventListener("click", () => openQuickGame(button.dataset.game));
});

document.querySelectorAll("a.launch").forEach((link) => {
  link.addEventListener("click", () => track("tra_game_opened", { href: link.getAttribute("href"), mode: "full" }));
});

quickNext?.addEventListener("click", () => {
  if (activeQuickGame === "double") {
    doubleState.round = (doubleState.round + 1) % 57;
    doubleState.feedback = "דילגתם לקלפים הבאים.";
    renderDouble();
    return;
  }
  if (activeQuickGame === "alchemy") {
    const next = findAlchemyIndex((alchemyState.currentIndex + 1) % games.alchemy.challenges.length);
    if (next < 0) { renderAlchemy(); return; }
    alchemyState.currentIndex = next;
    saveAlchemy();
  }
  renderChallenge();
});
quickClose?.addEventListener("click", closeQuickGame);
quickDone?.addEventListener("click", () => {
  if (activeQuickGame === "alchemy" && activeQuickEntry?.answer) {
    const entry = activeQuickEntry;
    const solvedIndex = alchemyState.currentIndex;
    alchemyState.discoveries[String(solvedIndex)] = { prompt: entry.prompt, answer: entry.answer, method: "reveal" };
    saveAlchemy();
    quickChallenge.textContent = `${entry.prompt} = ${entry.answer}`;
    quickDone.hidden = true;
    const progress = quickControls.querySelector(".quick-feedback");
    if (progress) renderAlchemyProgress(progress);
    const book = quickControls.querySelector(".alchemy-book");
    if (book) renderAlchemyBookInto(book);
    const input = quickControls.querySelector(".alchemy-guess input");
    const result = quickControls.querySelector(".alchemy-guess + .quick-feedback");
    if (input) input.disabled = true;
    if (result) result.textContent = `נחשף: ${entry.answer}`;
    track("tra_alchemy_answer_revealed", { combination: entry.prompt, answer: entry.answer });
    return;
  }
  closeQuickGame();
});

track("tra_games_hub_opened", { game_count: 17, flagship: "HITSTER TRA" });
