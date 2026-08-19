"use strict";

const quickPanel = document.querySelector("#quick-panel");
const quickTitle = document.querySelector("#quick-title");
const quickRules = document.querySelector("#quick-rules");
const quickChallenge = document.querySelector("#quick-challenge");
const quickNext = document.querySelector("#quick-next");
const quickClose = document.querySelector("#quick-close");
const quickDone = document.querySelector("#quick-done");
let activeQuickGame = null;

const pick = (items) => items[Math.floor(Math.random() * items.length)];
const track = (name, properties = {}) => {
  if (window.posthog?.capture) window.posthog.capture(name, properties);
};

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
    rules: "עונים בתור. אין תשובה נכונה; המטרה היא לנסח תשובה קצרה, ספציפית ומכבדת.",
    challenges: [
      "מסורת מול חופש: איזה דבר היית שומר ואיזה דבר היית משנה?",
      "ביטחון מול הרפתקה: מתי כדאי לבחור בכל אחד מהם?",
      "משפחה מול עצמאות: איך שומרים על שניהם בלי לבטל אחד מהם?",
      "שקט מול אנרגיה: מה כל אחד מהם נותן לך?"
    ]
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
    rules: "מצאו במהירות את הסמל היחיד שמופיע בשתי השורות.",
    challenges: [
      "שורה א: ♟️ 🎵 ⭐ 🌿 🏀 | שורה ב: 🎭 🌊 🎵 🔑 🐉",
      "שורה א: 🍎 🎹 🧩 🚗 ☀️ | שורה ב: 🌙 ♟️ 🚪 🍎 🎤",
      "שורה א: 🐉 🎲 🎨 🏆 🌳 | שורה ב: 🎧 🏆 🕯️ 📚 ⚽"
    ]
  },
  alchemy: {
    title: "⚗️ אלכימאי קטן — תומרון",
    rules: "נסו לנחש מה נוצר מחיבור שני היסודות. המציאו גם שילוב חדש משלכם.",
    challenges: [
      "מים + קור = ?",
      "אש + עץ = ?",
      "מוזיקה + קהילה = ?",
      "אור + צמח = ?",
      "סיפור + משחק = ?"
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

function renderChallenge() {
  if (!activeQuickGame) return;
  const game = games[activeQuickGame];
  const entry = pick(game.challenges);
  quickChallenge.textContent = typeof entry === "function" ? entry() : entry;
  track("tra_quick_game_challenge", { game: activeQuickGame });
}

function openQuickGame(id) {
  const game = games[id];
  if (!game || !quickPanel) return;
  activeQuickGame = id;
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
  document.querySelector("#all-games")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.querySelectorAll(".quick-play").forEach((button) => {
  button.addEventListener("click", () => openQuickGame(button.dataset.game));
});

document.querySelectorAll("a.launch").forEach((link) => {
  link.addEventListener("click", () => track("tra_game_opened", { href: link.getAttribute("href"), mode: "full" }));
});

quickNext?.addEventListener("click", renderChallenge);
quickClose?.addEventListener("click", closeQuickGame);
quickDone?.addEventListener("click", closeQuickGame);

track("tra_games_hub_opened", { game_count: 15, flagship: "HITSTER TRA" });
