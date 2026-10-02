"use strict";

const quickPanel = document.querySelector("#quick-panel");
const quickTitle = document.querySelector("#quick-title");
const quickRules = document.querySelector("#quick-rules");
const quickChallenge = document.querySelector("#quick-challenge");
const quickNext = document.querySelector("#quick-next");
const quickClose = document.querySelector("#quick-close");
const quickDone = document.querySelector("#quick-done");
let activeQuickGame = null;
let activeQuickEntry = null;

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
    rules: "מצאו במהירות את הסמל היחיד שמופיע בשתי השורות.",
    challenges: [
      "שורה א: ♟️ 🎵 ⭐ 🌿 🏀 | שורה ב: 🎭 🌊 🎵 🔑 🐉",
      "שורה א: 🍎 🎹 🧩 🚗 ☀️ | שורה ב: 🌙 ♟️ 🚪 🍎 🎤",
      "שורה א: 🐉 🎲 🎨 🏆 🌳 | שורה ב: 🎧 🏆 🕯️ 📚 ⚽"
    ]
  },
  alchemy: {
    title: "⚗️ אלכימאי קטן — תומרון",
    rules: "בחרו שני רכיבים או נסו חידת שילוב. בכל גילוי תראו את סוג התהליך ואת התנאים הדרושים. זהו מודל לימודי מפושט, לא סימולציה של כל הכימיה ולא הוראות לניסוי.",
    challenges: [
  {
    "id": "mud",
    "a": "מים",
    "b": "אדמה",
    "prompt": "מים + אדמה",
    "answer": "בוץ",
    "kind": "תערובת",
    "conditions": "ערבוב",
    "explanation": "חלקיקי האדמה מתפזרים במים. זו תערובת, לא חומר טהור חדש.",
    "equation": ""
  },
  {
    "id": "freeze",
    "a": "מים",
    "b": "קור",
    "prompt": "מים + קור",
    "answer": "קרח",
    "kind": "שינוי פיזיקלי",
    "conditions": "קירור לנקודת הקיפאון",
    "explanation": "מים טהורים קופאים בסביבות 0°C בלחץ אטמוספרי רגיל; המולקולות נשארות H₂O.",
    "equation": "H₂O(l) → H₂O(s)"
  },
  {
    "id": "steam",
    "a": "מים",
    "b": "חום",
    "prompt": "מים + חום",
    "answer": "אדי מים",
    "kind": "שינוי פיזיקלי",
    "conditions": "חימום ואידוי",
    "explanation": "אידוי קורה גם לפני רתיחה. אדי מים הם גז בלתי נראה; הערפל הלבן הוא טיפות נוזל זעירות.",
    "equation": "H₂O(l) → H₂O(g)"
  },
  {
    "id": "melt",
    "a": "קרח",
    "b": "חום",
    "prompt": "קרח + חום",
    "answer": "מים",
    "kind": "שינוי פיזיקלי",
    "conditions": "התכה",
    "explanation": "שינוי מצב צבירה אינו יוצר חומר כימי חדש.",
    "equation": "H₂O(s) → H₂O(l)"
  },
  {
    "id": "condense",
    "a": "אדי מים",
    "b": "קור",
    "prompt": "אדי מים + קור",
    "answer": "מים",
    "kind": "שינוי פיזיקלי",
    "conditions": "קירור עד התעבות",
    "explanation": "מולקולות המים עוברות מגז לנוזל. במערכת סגורה המסה נשמרת.",
    "equation": "H₂O(g) → H₂O(l)"
  },
  {
    "id": "dust",
    "a": "אדמה",
    "b": "אוויר",
    "prompt": "אדמה + אוויר",
    "answer": "אבק",
    "kind": "תערובת",
    "conditions": "רוח המרימה חלקיקים יבשים",
    "explanation": "אבק הוא חלקיקים מרחפים, לא תוצר של תגובה בין האדמה לאוויר.",
    "equation": ""
  },
  {
    "id": "cloud",
    "a": "אדי מים",
    "b": "אוויר קר",
    "prompt": "אדי מים + אוויר קר",
    "answer": "ענן",
    "kind": "שינוי פיזיקלי",
    "conditions": "התעבות על גרעיני התעבות",
    "explanation": "עננים מכילים טיפות מים זעירות ולעיתים גבישי קרח; ענן אינו אדי מים בלבד.",
    "equation": ""
  },
  {
    "id": "rain",
    "a": "ענן",
    "b": "התלכדות טיפות",
    "prompt": "ענן + התלכדות טיפות",
    "answer": "גשם",
    "kind": "שינוי פיזיקלי",
    "conditions": "גדילת הטיפות עד שהן נופלות",
    "explanation": "הטיפות גדלות ויורדות בכוח הכבידה; זה תהליך פיזיקלי.",
    "equation": ""
  },
  {
    "id": "glass",
    "a": "חול סיליקה",
    "b": "חום",
    "prompt": "חול סיליקה + חום",
    "answer": "זכוכית",
    "kind": "עיבוד חומר",
    "conditions": "התכה בכבשן וקירור ללא התגבשות",
    "explanation": "זהו קיצור של תהליך ייצור: זכוכית נפוצה עשויה מסיליקה, סודה וסיד. להבה רגילה וחול כלשהו אינם מספיקים.",
    "equation": ""
  },
  {
    "id": "bronze",
    "a": "נחושת",
    "b": "בדיל",
    "prompt": "נחושת + בדיל",
    "answer": "ארד",
    "kind": "סגסוגת",
    "conditions": "התכה משותפת וקירור",
    "explanation": "ארד (ברונזה) הוא סגסוגת של נחושת ובדיל; היחס ביניהם משפיע על תכונותיו. הוא אינו יסוד חדש.",
    "equation": ""
  },
  {
    "id": "brass",
    "a": "נחושת",
    "b": "אבץ",
    "prompt": "נחושת + אבץ",
    "answer": "פליז",
    "kind": "סגסוגת",
    "conditions": "התכה משותפת וקירור",
    "explanation": "פליז הוא סגסוגת נחושת ואבץ, ואילו ארד מבוסס על נחושת ובדיל.",
    "equation": ""
  },
  {
    "id": "copper",
    "a": "תחמוצת נחושת",
    "b": "פחמן",
    "prompt": "תחמוצת נחושת + פחמן",
    "answer": "נחושת",
    "kind": "תגובה כימית",
    "conditions": "חיזור בחימום; מודל מפושט",
    "explanation": "הפחמן מסייע בהוצאת החמצן מן התחמוצת. גם פחמן דו־חמצני נוצר, כך שהאטומים נשמרים.",
    "equation": "2CuO + C → 2Cu + CO₂"
  },
  {
    "id": "tin",
    "a": "תחמוצת בדיל",
    "b": "פחמן",
    "prompt": "תחמוצת בדיל + פחמן",
    "answer": "בדיל",
    "kind": "תגובה כימית",
    "conditions": "חיזור בחימום; מודל מפושט",
    "explanation": "בדיל הוא יסוד מתכתי שסמלו Sn. המשוואה מציגה מאזן כולל מפושט של הפקת בדיל.",
    "equation": "SnO₂ + C → Sn + CO₂"
  },
  {
    "id": "metal",
    "a": "עפרת מתכת",
    "b": "תהליך הפקה",
    "prompt": "עפרת מתכת + תהליך הפקה",
    "answer": "מתכת",
    "kind": "עיבוד חומר",
    "conditions": "הפרדה וחיזור המתאימים לעפרה",
    "explanation": "מתכת היא משפחת חומרים. אין מתכון אוניברסלי: לא כל אבן מכילה עפרה, וחימום לבדו אינו מפיק כל מתכת.",
    "equation": ""
  },
  {
    "id": "molten",
    "a": "מתכת",
    "b": "חום",
    "prompt": "מתכת + חום",
    "answer": "מתכת מותכת",
    "kind": "שינוי פיזיקלי",
    "conditions": "חימום מעל נקודת ההתכה של המתכת",
    "explanation": "ברזל, נחושת ובדיל ניתכים בטמפרטורות שונות. בהתכה הרכב המתכת אינו משתנה.",
    "equation": ""
  },
  {
    "id": "wire",
    "a": "נחושת",
    "b": "משיכה",
    "prompt": "נחושת + משיכה",
    "answer": "חוט נחושת",
    "kind": "עיבוד חומר",
    "conditions": "עיצוב מכני של מתכת משיכה",
    "explanation": "נחושת מוליכה חשמל וניתנת למשיכה לחוטים; לא נוצר יסוד חדש.",
    "equation": ""
  },
  {
    "id": "oxide",
    "a": "נחושת",
    "b": "חמצן",
    "prompt": "נחושת + חמצן",
    "answer": "תחמוצת נחושת",
    "kind": "תגובה כימית",
    "conditions": "חימום בתנאים מתאימים",
    "explanation": "בחמצון זה נחושת מתחברת לחמצן. התוצר המתואר הוא תחמוצת נחושת(II).",
    "equation": "2Cu + O₂ → 2CuO"
  },
  {
    "id": "water",
    "a": "מימן",
    "b": "חמצן",
    "prompt": "מימן + חמצן",
    "answer": "מים",
    "kind": "תגובה כימית",
    "conditions": "אנרגיית שפעול; תגובה פולטת אנרגיה",
    "explanation": "שני חומרים מגיבים ליצירת תרכובת. המקדמים שומרים על מספר האטומים מכל יסוד.",
    "equation": "2H₂ + O₂ → 2H₂O"
  },
  {
    "id": "electrolysis",
    "a": "מים",
    "b": "חשמל",
    "prompt": "מים + חשמל",
    "answer": "מימן וחמצן",
    "kind": "תגובה כימית",
    "conditions": "אלקטרוליזה בתא מתאים",
    "explanation": "פירוק מים צורך אנרגיה ומצריך אלקטרודות ומוליכות מתאימות; זו אינה רתיחה.",
    "equation": "2H₂O → 2H₂ + O₂"
  },
  {
    "id": "molecule",
    "a": "אטומים",
    "b": "קשר קוולנטי",
    "prompt": "אטומים + קשר קוולנטי",
    "answer": "מולקולה",
    "kind": "מבנה וסיווג",
    "conditions": "קשרים היוצרים יחידה נפרדת וניטרלית",
    "explanation": "מולקולה היא יחידה ניטרלית של יותר מאטום אחד. לא כל חומר בנוי ממולקולות נפרדות: במלח יש סריג יוני.",
    "equation": ""
  },
  {
    "id": "monomer",
    "a": "אתן",
    "b": "יכולת פילמור",
    "prompt": "אתן + יכולת פילמור",
    "answer": "מונומר",
    "kind": "מבנה וסיווג",
    "conditions": "זיהוי מולקולה שיכולה להשתתף בפילמור",
    "explanation": "אתן הוא דוגמה למונומר. מונומר הוא חומר שמולקולותיו מסוגלות להשתלב בבניית מקרומולקולות. זה סיווג, לא תגובת יצירה.",
    "equation": ""
  },
  {
    "id": "polymer",
    "a": "מונומר",
    "b": "פילמור",
    "prompt": "מונומר + פילמור",
    "answer": "פולימר",
    "kind": "תגובה כימית",
    "conditions": "מונומרים רבים ותנאי תגובה מתאימים",
    "explanation": "בפילמור מולקולות קטנות מתחברות למקרומולקולות. שני מונומרים בלבד אינם בהכרח פולימר, ולא כל מולקולה מתאימה.",
    "equation": ""
  },
  {
    "id": "polyethylene",
    "a": "אתן",
    "b": "פילמור",
    "prompt": "אתן + פילמור",
    "answer": "פוליאתילן",
    "kind": "תגובה כימית",
    "conditions": "מולקולות אתן רבות ותנאים מתאימים",
    "explanation": "בפילמור הוספה של אתן מתקבלת שרשרת פוליאתילן. האטומים נשמרים והקשרים משתנים.",
    "equation": "n CH₂=CH₂ → (–CH₂–CH₂–)ₙ"
  },
  {
    "id": "fibres",
    "a": "צמח כותנה",
    "b": "הפרדת סיבים",
    "prompt": "צמח כותנה + הפרדת סיבים",
    "answer": "סיבי כותנה",
    "kind": "עיבוד חומר",
    "conditions": "איסוף והפרדת הסיבים",
    "explanation": "סיבי כותנה עשירים בתאית, פולימר טבעי הבנוי מיחידות שמקורן בגלוקוז.",
    "equation": ""
  },
  {
    "id": "yarn",
    "a": "סיבי כותנה",
    "b": "טוויה",
    "prompt": "סיבי כותנה + טוויה",
    "answer": "חוט",
    "kind": "עיבוד חומר",
    "conditions": "פיתול וחיבור סיבים",
    "explanation": "טוויה מחברת סיבים לחוט; זה עיבוד פיזיקלי.",
    "equation": ""
  },
  {
    "id": "cloth",
    "a": "חוט",
    "b": "אריגה",
    "prompt": "חוט + אריגה",
    "answer": "בד",
    "kind": "עיבוד חומר",
    "conditions": "שזירת חוטים",
    "explanation": "בד הוא מבנה של סיבים וחוטים, לא יסוד או מולקולה אחת. אריגה היא דרך אחת לייצר בד.",
    "equation": ""
  },
  {
    "id": "light",
    "a": "חשמל",
    "b": "נורת לד",
    "prompt": "חשמל + נורת לד",
    "answer": "אור",
    "kind": "המרת אנרגיה",
    "conditions": "נורה המחוברת למקור חשמל מתאים",
    "explanation": "בנורת לד אנרגיה חשמלית מומרת לאור ולחום. אור הוא קרינה אלקטרומגנטית, לא חומר.",
    "equation": ""
  },
  {
    "id": "plant",
    "a": "זרע",
    "b": "מים",
    "prompt": "זרע + מים",
    "answer": "צמח",
    "kind": "תהליך ביולוגי",
    "conditions": "זרע חי, חמצן, טמפרטורה מתאימה ובהמשך תנאי גידול",
    "explanation": "מים מסייעים לנביטה של זרע שכבר חי. אדמה ומים לבדם אינם יוצרים חיים.",
    "equation": ""
  },
  {
    "id": "photosynthesis",
    "a": "צמח",
    "b": "אור",
    "prompt": "צמח + אור",
    "answer": "סוכר וחמצן",
    "kind": "תהליך ביולוגי",
    "conditions": "פוטוסינתזה בנוכחות מים ופחמן דו־חמצני",
    "explanation": "בצמח בעל כלורופיל, אנרגיית אור מאפשרת בניית סוכרים. מוצג מאזן כולל מפושט.",
    "equation": "6CO₂ + 6H₂O + אור → C₆H₁₂O₆ + 6O₂"
  },
  {
    "id": "life",
    "a": "תא חי",
    "b": "חומרי הזנה",
    "prompt": "תא חי + חומרי הזנה",
    "answer": "חיים",
    "kind": "תהליך ביולוגי",
    "conditions": "תנאים מתאימים לסוג התא",
    "explanation": "זהו שימור פעילות של חיים קיימים, לא יצירת חיים מחומר דומם. אין כאן מתכון מדעי מוכח למוצא החיים.",
    "equation": ""
  },
  {
    "id": "fantasy",
    "a": "מים",
    "b": "קסם",
    "prompt": "מים + קסם",
    "answer": "חיים",
    "kind": "דמיון בלבד",
    "conditions": "שילוב סיפורי",
    "explanation": "זהו שילוב אלכימי דמיוני בלבד. קסם אינו מנגנון כימי, ומים אינם הופכים לחיים כך.",
    "equation": ""
  },
  {
    "id": "solution",
    "a": "מלח",
    "b": "מים",
    "prompt": "מלח + מים",
    "answer": "תמיסת מלח",
    "kind": "תערובת",
    "conditions": "המסה עד גבול המסיסות",
    "explanation": "מלח מתפזר במים כיונים. הוספת מלח מעבר לרוויה משאירה מוצק; המסה הכוללת נשמרת.",
    "equation": "NaCl(s) → Na⁺(aq) + Cl⁻(aq)"
  },
  {
    "id": "separation",
    "a": "תמיסת מלח",
    "b": "אידוי",
    "prompt": "תמיסת מלח + אידוי",
    "answer": "גבישי מלח",
    "kind": "הפרדת תערובת",
    "conditions": "אידוי מספיק מים עד התגבשות",
    "explanation": "המלח לא נעלם כשהומס: אפשר להפרידו מהמים. המים עוברים לאוויר כאדים.",
    "equation": ""
  },
  {
    "id": "neutralize",
    "a": "חומצה",
    "b": "בסיס",
    "prompt": "חומצה + בסיס",
    "answer": "מלח ומים",
    "kind": "תגובה כימית",
    "conditions": "דוגמת ניטרול של HCl ו־NaOH במים",
    "explanation": "הדוגמה עוסקת בחומצה ובסיס מסוימים. ה־pH הסופי תלוי בסוגים, בריכוזים ובכמויות; לא תמיד מתקבל pH 7.",
    "equation": "HCl + NaOH → NaCl + H₂O"
  },
  {
    "id": "catalyst",
    "a": "תגובה",
    "b": "זרז",
    "prompt": "תגובה + זרז",
    "answer": "תגובה מהירה יותר",
    "kind": "עיקרון כימי",
    "conditions": "זרז המתאים לתגובה",
    "explanation": "זרז מספק מסלול בעל אנרגיית שפעול נמוכה יותר ואינו נצרך בתגובה הכוללת; אינו משנה את קבוע שיווי המשקל.",
    "equation": ""
  },
  {
    "id": "equilibrium",
    "a": "שיווי משקל",
    "b": "שינוי ריכוז",
    "prompt": "שיווי משקל + שינוי ריכוז",
    "answer": "הסטת שיווי משקל",
    "kind": "עיקרון כימי",
    "conditions": "תגובה הפיכה בשיווי משקל",
    "explanation": "הוספת מגיב עשויה להטות את המערכת לכיוון הצורך אותו. בטמפרטורה קבועה קבוע שיווי המשקל אינו משתנה.",
    "equation": ""
  },
  {
    "id": "mass",
    "a": "תגובה",
    "b": "מערכת סגורה",
    "prompt": "תגובה + מערכת סגורה",
    "answer": "שימור מסה",
    "kind": "עיקרון כימי",
    "conditions": "כל החומרים, כולל גזים, נשארים במערכת",
    "explanation": "בתגובה כימית האטומים מסתדרים מחדש. המסה הכוללת לפני ואחרי התגובה נשמרת בקירוב הכימי הרגיל.",
    "equation": ""
  },
  {
    "id": "combustion",
    "a": "עץ",
    "b": "חמצן",
    "prompt": "עץ + חמצן",
    "answer": "חום ואור",
    "kind": "תגובה כימית",
    "conditions": "הצתה וחמצן בכמות מספקת",
    "explanation": "שרפה ממירה אנרגיה כימית לחום ולאור. נוצרים גם גזים ואפר; המסה אינה נעלמת. התוצרים תלויים בתנאי השרפה.",
    "equation": ""
  }
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
  if (activeQuickGame === "alchemy") { renderAlchemy(); return; }
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
  quickNext.hidden = false;
  quickDone.hidden = false;
  quickDone.disabled = false;
  quickNext.textContent = "משימה חדשה";
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

quickNext?.addEventListener("click", renderChallenge);
quickClose?.addEventListener("click", closeQuickGame);
quickDone?.addEventListener("click", () => {
  if (activeQuickGame === "alchemy" && activeQuickEntry?.answer) {
    revealAlchemy(activeQuickEntry);
    track("tra_alchemy_answer_revealed", { combination: activeQuickEntry.prompt, answer: activeQuickEntry.answer });
    return;
  }
  closeQuickGame();
});

track("tra_games_hub_opened", { game_count: 17, flagship: "HITSTER TRA" });


// Chemistry content is intentionally separate from the other quick games.
const ALCHEMY_KEY = "tra-alchemy-chemistry-v1";
let alchemyMode = "quiz";
let alchemyRound = [];
let alchemyDiscovered = new Set();
let alchemyStorageOK = true;
try {
  const saved = JSON.parse(localStorage.getItem(ALCHEMY_KEY) || "[]");
  if (Array.isArray(saved)) alchemyDiscovered = new Set(saved.filter(id => games.alchemy.challenges.some(r => r.id === id)));
} catch (_) { alchemyStorageOK = false; }

function alchemyElement(tag, text, parent) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (parent) parent.append(element);
  return element;
}
function alchemyButton(text, parent, action) {
  const button = alchemyElement("button", text, parent);
  button.type = "button";
  button.addEventListener("click", action);
  return button;
}
function alchemyStats() {
  const stats = document.querySelector("#alchemy-stats");
  if (stats) stats.textContent = `גיליתם ${alchemyDiscovered.size} מתוך ${games.alchemy.challenges.length} שילובים · ${alchemyStorageOK ? "הגילויים נשמרים במכשיר הזה" : "השמירה אינה זמינה; הגילויים נשמרים רק עד סגירת הדף"}`;
}
function alchemyBook() {
  const book = document.querySelector("#alchemy-book-list");
  if (!book) return;
  book.replaceChildren();
  for (const recipe of games.alchemy.challenges.filter(r => alchemyDiscovered.has(r.id))) {
    alchemyElement("li", `${recipe.prompt} ← ${recipe.answer} · ${recipe.kind}`, book);
  }
  if (!alchemyDiscovered.size) alchemyElement("li", "הגילוי הראשון שלכם יופיע כאן.", book);
}
function revealAlchemy(recipe) {
  const result = document.querySelector("#alchemy-result");
  if (!result) return;
  result.replaceChildren();
  alchemyElement("strong", `${recipe.prompt} = ${recipe.answer}`, result);
  alchemyElement("p", `${recipe.kind} · ${recipe.conditions}`, result);
  alchemyElement("p", recipe.explanation, result);
  if (recipe.equation) {
    const equation = alchemyElement("p", recipe.equation, result);
    equation.dir = "ltr";
    equation.className = "alchemy-equation";
  }
  alchemyDiscovered.add(recipe.id);
  try { localStorage.setItem(ALCHEMY_KEY, JSON.stringify([...alchemyDiscovered])); alchemyStorageOK = true; }
  catch (_) { alchemyStorageOK = false; }
  alchemyStats();
  alchemyBook();
  if (alchemyMode === "quiz") quickDone.disabled = true;
}
function renderAlchemy() {
  if (!document.querySelector("#alchemy-style")) {
    const style = alchemyElement("style", undefined, document.head);
    style.id = "alchemy-style";
    style.textContent = `
      #quick-challenge:has(.alchemy-controls){font-weight:400}
      .alchemy-controls{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
      .alchemy-controls button,.alchemy-lab button,.alchemy-book button{border:1px solid #587466;border-radius:10px;background:#fff;color:#18352c;padding:10px 14px;min-height:44px;font:inherit;cursor:pointer}
      .alchemy-controls button[aria-pressed="true"]{background:#18352c;color:white}
      .alchemy-lab{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .alchemy-lab label{display:grid;gap:6px;min-width:0}
      .alchemy-lab select,.alchemy-lab input{width:100%;min-width:0;padding:10px;border:1px solid #587466;border-radius:8px;background:white;color:#18352c;font-size:1rem;min-height:44px}
      .alchemy-lab button{grid-column:1/-1;background:#18352c;color:white}
      #alchemy-result{margin-top:16px;line-height:1.65;overflow-wrap:anywhere}
      #alchemy-result strong{font-size:1.2rem}
      #alchemy-result p{margin:8px 0;font-weight:400}
      #alchemy-stats{font-size:.875rem;font-weight:400}
      .alchemy-book{margin-top:18px;font-size:1rem;font-weight:400}
      .alchemy-book summary{cursor:pointer;min-height:44px;display:list-item;padding:8px 0}
      .alchemy-book li{margin-bottom:8px}
      .alchemy-equation{overflow-wrap:anywhere;background:#edf3ef;padding:10px;border-radius:8px;text-align:center}
      @media(max-width:430px){.alchemy-lab{grid-template-columns:1fr}.quick-panel{padding:16px}}
    `;
  }
  quickChallenge.replaceChildren();
  quickDone.disabled = false;
  quickDone.textContent = "הצג תשובה";
  quickNext.textContent = "חידה הבאה";
  quickNext.hidden = alchemyMode !== "quiz";
  quickDone.hidden = alchemyMode !== "quiz";
  const controls = alchemyElement("div", undefined, quickChallenge);
  controls.className = "alchemy-controls";
  [["quiz", "חידת שילוב"], ["lab", "חיבור חופשי"], ["atoms", "אטומים ויונים"]].forEach(([mode, text]) => {
    const button = alchemyButton(text, controls, () => { alchemyMode = mode; renderAlchemy(); });
    button.setAttribute("aria-pressed", String(alchemyMode === mode));
  });
  const stats = alchemyElement("p", "", quickChallenge);
  stats.id = "alchemy-stats";
  if (alchemyMode === "quiz") {
    if (!alchemyRound.length) {
      alchemyRound = games.alchemy.challenges.slice();
      for (let i = alchemyRound.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [alchemyRound[i], alchemyRound[j]] = [alchemyRound[j], alchemyRound[i]];
      }
      if (alchemyRound[alchemyRound.length - 1] === activeQuickEntry) alchemyRound.reverse();
    }
    activeQuickEntry = alchemyRound.pop();
    alchemyElement("h3", `${activeQuickEntry.prompt} = ?`, quickChallenge);
    alchemyElement("p", `סוג: ${activeQuickEntry.kind}. תנאים: ${activeQuickEntry.conditions}.`, quickChallenge);
  } else if (alchemyMode === "atoms") {
    activeQuickEntry = null;
    renderAlchemyAtoms(quickChallenge);
  } else {
    activeQuickEntry = null;
    const form = alchemyElement("form", undefined, quickChallenge);
    form.className = "alchemy-lab";
    const ingredients = [...new Set(games.alchemy.challenges.flatMap(r => [r.a, r.b, r.answer]))].sort((a,b) => a.localeCompare(b, "he"));
    const selects = ["רכיב ראשון", "רכיב שני"].map((label, index) => {
      const field = alchemyElement("label", label, form);
      const select = alchemyElement("select", undefined, field);
      select.id = `alchemy-ingredient-${index}`;
      ingredients.forEach(name => { const option = alchemyElement("option", name, select); option.value = name; });
      select.value = index ? "בדיל" : "נחושת";
      return select;
    });
    const combine = alchemyElement("button", "חברו וגלו", form);
    combine.type = "submit";
    form.addEventListener("submit", event => {
      event.preventDefault();
      const [a,b] = selects.map(select => select.value);
      const recipe = games.alchemy.challenges.find(r => (r.a === a && r.b === b) || (r.a === b && r.b === a));
      if (recipe) revealAlchemy(recipe);
      else document.querySelector("#alchemy-result").textContent = "לשילוב הזה עוד אין כרטיס במשחק. אין פירוש הדבר שאין תגובה במציאות — התוצאה תלויה בחומרים ובתנאים.";
    });
  }
  const result = alchemyElement("div", "", quickChallenge);
  result.id = "alchemy-result";
  result.setAttribute("role", "status");
  const book = alchemyElement("details", undefined, quickChallenge);
  book.className = "alchemy-book";
  alchemyElement("summary", "ספר הגילויים שלי", book);
  const list = alchemyElement("ul", undefined, book);
  list.id = "alchemy-book-list";
  alchemyButton("איפוס גילויים", book, () => {
    if (!window.confirm("למחוק את כל גילויי האלכימאי במכשיר הזה?")) return;
    alchemyDiscovered.clear();
    try { localStorage.removeItem(ALCHEMY_KEY); alchemyStorageOK = true; } catch (_) { alchemyStorageOK = false; }
    alchemyRound = [];
    renderAlchemy();
  });
  const notes = alchemyElement("details", undefined, quickChallenge);
  notes.className = "alchemy-book";
  alchemyElement("summary", "עקרונות הכימיה ומקורות", notes);
  alchemyElement("p", "יסוד, תרכובת ותערובת הם דברים שונים. בתגובה כימית האטומים והמטען נשמרים והקשרים משתנים. מצב הצבירה, הריכוז, הטמפרטורה, הלחץ והזרז עשויים להשפיע על התהליך. השילובים מציגים עקרונות מרכזיים ודוגמאות מפושטות; כרטיסי מבנה וסיווג אינם תגובות כימיות.", notes);
  alchemyElement("p", "זכוכית ובד הם חומרים; נחושת ובדיל הם יסודות מתכתיים; ארד הוא סגסוגת; אור הוא אנרגיה; חיים הם תופעה ביולוגית. מונומר משתתף בפילמור, ופולימר מורכב ממקרומולקולות.", notes);
  for (const [title, url] of [
    ["OpenStax — פרוטונים, איזוטופים ומטען", "https://openstax.org/books/chemistry-atoms-first-2e/pages/2-3-atomic-structure-and-symbolism"],
    ["IUPAC — מונומר", "https://goldbook.iupac.org/terms/view/M04019"],
    ["IUPAC — פילמור", "https://goldbook.iupac.org/terms/view/P04740"],
    ["Corning — זכוכית סודה־סיד", "https://allaboutglass.cmog.org/definition/soda-lime-glass"],
    ["RSC — סגסוגות נחושת ובדיל", "https://pubs.rsc.org/en/content/articlelanding/1888/ct/ct8885300167"],
    ["OpenStax — שיווי משקל וזרזים", "https://openstax.org/books/chemistry-2e/pages/13-3-shifting-equilibria-le-chateliers-principle"]
  ]) {
    const paragraph = alchemyElement("p", undefined, notes);
    const link = alchemyElement("a", title, paragraph);
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
  alchemyElement("p", "© כל הזכויות שמורות לתומר רפאל אנג׳ל", quickChallenge).style.fontSize = ".875rem";
  alchemyStats();
  alchemyBook();
}

function renderAlchemyAtoms(parent) {
  alchemyElement("h3", "מה משתנה כשמשנים את החלקיקים?", parent);
  alchemyElement("p", "מספר הפרוטונים קובע את היסוד. שינוי במספר הנויטרונים משנה את האיזוטופ. שינוי במספר האלקטרונים משנה את המטען. אלה אינם ההבדלים בין מונומר לפולימר.", parent);
  alchemyElement("p", "מונומר = יחידת בניין קטנה היכולה להשתתף בפילמור. פולימר = חומר המורכב ממקרומולקולות בעלות יחידות רבות שמקורן במונומרים.", parent);
  for (const [name, symbol, protons, neutrons, electrons] of [
    ["הליום", "He", 2, 3, ""], ["ליתיום", "Li", 3, 4, "12"]
  ]) {
    const card = alchemyElement("section", undefined, parent);
    alchemyElement("h4", `${name}־${protons + neutrons} · ${symbol}`, card);
    alchemyElement("p", `${protons} פרוטונים + ${neutrons} נויטרונים = מספר מסה ${protons + neutrons}`, card);
    const field = alchemyElement("div", undefined, card);
    field.className = "alchemy-lab";
    const label = alchemyElement("label", "מספר אלקטרונים", field);
    const input = alchemyElement("input", undefined, label);
    input.type = "number";
    input.min = "0";
    input.max = "20";
    input.step = "1";
    input.inputMode = "numeric";
    input.placeholder = "לא צוין";
    input.value = electrons;
    input.id = `alchemy-electrons-${symbol}`;
    const output = alchemyElement("p", "", card);
    output.setAttribute("role", "status");
    const update = () => {
      if (input.value === "") { output.textContent = "מספר האלקטרונים לא צוין, לכן המטען אינו ידוע."; return; }
      const count = Number(input.value);
      if (!Number.isInteger(count) || count < 0 || count > 20) { output.textContent = "הזינו מספר שלם בין 0 ל־20."; return; }
      const charge = protons - count;
      const chargeText = charge > 0 ? `+${charge}` : String(charge).replace("-", "−");
      output.textContent = `מטען מחושב: ${chargeText} ביחידות מטען יסודי. ` + (charge === 0 ? "מספר הפרוטונים שווה למספר האלקטרונים: ניטרלי חשמלית." : "מספר הפרוטונים פחות מספר האלקטרונים קובע את המטען.");
      if (symbol === "Li" && count === 12) output.textContent += " 3 פחות 12 הם −9. זהו חישוב בלבד, לא יון ליתיום מבודד יציב שאפשר לבנות.";
      else if (symbol === "Li" && count === 2) output.textContent += " זהו Li⁺, יון הליתיום השכיח בתרכובות.";
    };
    input.addEventListener("input", update);
    update();
    alchemyElement("p", symbol === "He" ? "גרעין הליום־5 אינו יציב ומתפרק במהירות. איזון המטען באמצעות אלקטרונים אינו מייצב את הגרעין." : "גרעין ליתיום־7 יציב. יציבות הגרעין אינה מבטיחה שמספר אלקטרונים שרירותי יוכל להיקשר אליו.", card);
  }
  alchemyElement("p", "זהו מחשבון הרכב ומטען, לא חיזוי של קיום או יציבות אטומים. שינוי במספר הפרוטונים הוא שינוי גרעיני, ולא תגובה כימית רגילה.", parent);
  const source = alchemyElement("a", "מקור לנתוני הליום־5: TUNL", parent);
  source.href = "https://nucldata.tunl.duke.edu/nucldata/ourpubs/05_2002.pdf";
  source.target = "_blank";
  source.rel = "noopener noreferrer";
}

// A direct link opens the existing hub's alchemy panel.
if (window.location.hash === "#alchemy") openQuickGame("alchemy");
