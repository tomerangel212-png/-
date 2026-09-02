"use strict";

const ageModes = {
  family: {
    icon: "♧",
    title: "כולם משחקים יחד",
    copy: "אותה משימה, כמה דרכי השתתפות: דיבור, כתיבה, שירה, עמידה או ישיבה.",
    features: ["תפקיד משמעותי לכל גיל", "ללא הדחה וללא מבוכה כפויה", "ניקוד על שיתוף פעולה"],
  },
  kids: {
    icon: "✦",
    title: "קצר, ברור ובתנועה בטוחה",
    copy: "משימות פשוטות, המחשה חזותית, חלוקת תפקידים וזמן קצר לכל שלב.",
    features: ["גילי 3–17", "מבוגר מלווה בכל תחנה", "אין ריצה, טיפוס או נעילה"],
  },
  adults: {
    icon: "◎",
    title: "תוכן בוגר בלי מבוכה",
    copy: "מוזיקה ישראלית, שיחה בין־דורית, מחלוקת מכבדת ואתגרי חשיבה.",
    features: ["גילי 24–80", "שירה ודיבור הם בחירה", "חלופת ישיבה בכל תחנה"],
  },
};

const stations = {
  music: {
    number: "01",
    label: "במה מרכזית",
    name: "ציר הזמן הישראלי",
    goal: "מזהים ארבעה שירים וממקמים אותם על ציר זמן ישראלי רב־דורי.",
    steps: [
      "מניחים את קלף העוגן: „יעלה ויבוא”, גידי גוב, 1973.",
      "משמיעים 20 שניות מכל שיר ונותנים עד 60 שניות להחלטה.",
      "חושפים תשובות ומחשבים ניקוד.",
      "מסיימים במשפט: איזה שיר חיבר בין שני דורות?",
    ],
    kit: "רמקול · טלפון · 4 קלפים · דף ניקוד · טיימר",
  },
  social: {
    number: "02",
    label: "קשר",
    name: "ספיד־דייט חברתי",
    goal: "יוצרים היכרות בוגרת ומהירה בין דורות, בלי מבוכה כפויה.",
    steps: [
      "מתחלקים לעשרה זוגות, בעדיפות לפער גילאים.",
      "מקיימים ארבעה סבבים בני שלוש דקות.",
      "בסיום כל סבב כותבים מילה אחת משותפת.",
      "הקבוצה בוחרת מילה שמייצגת אותה.",
    ],
    kit: "10 זוגות כיסאות · 4 כרטיסי שאלה · טיימר",
  },
  debate: {
    number: "03",
    label: "הקשבה",
    name: "דיבייט TRA",
    goal: "מתרגלים מחלוקת מכבדת, טיעון ברור והצגה הוגנת של הצד השני.",
    steps: [
      "מתחלקים לשתי עמדות — גם אם זו אינה הדעה האישית.",
      "שתי דקות הכנה, דקה לכל צד ודקת תגובה.",
      "מחליפים צדדים בנושא השני.",
      "מסיימים במשפט הסכמה אחד.",
    ],
    kit: "כרטיסי נושא · בעד ונגד · דף הערכה · טיימר",
  },
  escape: {
    number: "04",
    label: "שיתוף פעולה",
    name: "אסקייפ רום · קוד 2124",
    goal: "פותרים ארבע חידות קצרות ומרכיבים קוד בן ארבע ספרות.",
    steps: [
      "מתחלקים לארבע חוליות של חמישה.",
      "כל חוליה פותרת מעטפה אחת במשך שש דקות.",
      "משתפים תשובות ומרכיבים קוד.",
      "מסבירים איך חילקנו תפקידים. אין בונוס על מהירות.",
    ],
    kit: "4 מעטפות · 4 עטים · כרטיס קוד · טיימר",
  },
  logic: {
    number: "05",
    label: "אתגר",
    name: "שחמט ופאזל קבוצתי",
    goal: "משלבים חשיבה חזותית, היגיון ושיתוף בין בעלי ניסיון למתחילים.",
    steps: [
      "מתחלקים לארבע חוליות של חמישה.",
      "שתי חוליות פותרות מט באחד ושתיים פותרות חידות היגיון.",
      "אחרי שבע דקות מחליפים משימה.",
      "כל חוליה מסבירה פתרון אחד במילים פשוטות.",
    ],
    kit: "2 דפי שחמט · 2 חידות היגיון · עטים · טיימר",
  },
};

const songs = [
  { title: "ירושלים של זהב", artist: "שולי נתן", year: 1967, era: "1960–1969", envelope: "ירוק", url: "https://music.apple.com/il/album/%D7%99%D7%A8%D7%95%D7%A9%D7%9C%D7%99%D7%9D-%D7%A9%D7%9C-%D7%96%D7%94%D7%91/1518476324?i=1518476345&l=he" },
  { title: "יעלה ויבוא", artist: "גידי גוב", year: 1973, era: "1970–1979", envelope: "עוגן", url: "https://music.apple.com/il/album/%D7%99%D7%A2%D7%9C%D7%94-%D7%95%D7%99%D7%91%D7%95%D7%90/1452873995?i=1452874005&l=he" },
  { title: "הללויה", artist: "גלי עטרי וחלב ודבש", year: 1979, era: "1970–1979", envelope: "תכלת", url: "https://music.apple.com/il/album/%D7%94%D7%9C%D7%9C%D7%95%D7%99%D7%94/1724997682?i=1724997885&l=he" },
  { title: "הפרח בגני", artist: "זוהר ארגוב", year: 1982, era: "1980–1989", envelope: "זהב", url: "https://music.apple.com/il/song/%D7%94%D7%A4%D7%A8%D7%97-%D7%91%D7%92%D7%A0%D7%99/878705889?l=he" },
  { title: "רכבת לילה לקהיר", artist: "משינה", year: 1989, era: "1980–1989", envelope: "כתום", url: "https://music.apple.com/il/album/%D7%A8%D7%9B%D7%91%D7%AA-%D7%9C%D7%99%D7%9C%D7%94-%D7%9C%D7%A7%D7%94%D7%99%D7%A8/201158532?i=201162146&l=he" },
  { title: "כאן", artist: "אורנה ומשה דץ", year: 1991, era: "1990–1999", envelope: "כסף", url: "https://music.apple.com/il/album/%D7%9B%D7%90%D7%9F/1585551857?i=1585551860&l=he" },
  { title: "בואי", artist: "הפרויקט של עידן רייכל", year: 2002, era: "2000–2009", envelope: "כסף", url: "https://music.apple.com/il/album/boee-radio-edit/778474051?i=778474133&l=he" },
  { title: "מחוזקים לעולם", artist: "אברהם טל", year: 2010, era: "2010–2019", envelope: "ירוק", url: "https://music.apple.com/il/album/%D7%9E%D7%97%D7%95%D7%96%D7%A7%D7%99%D7%9D-%D7%9C%D7%A2%D7%95%D7%9C%D7%9D/1572555727?i=1572555729&l=he" },
  { title: "תל אביב", artist: "עומר אדם ואריסה", year: 2013, era: "2010–2019", envelope: "תכלת", url: "https://music.apple.com/il/album/%D7%AA%D7%9C-%D7%90%D7%91%D7%99%D7%91/1447881362?i=1447881363&l=he" },
  { title: "סלסולים", artist: "סטטיק ובן אל תבורי", year: 2016, era: "2010–2019", envelope: "זהב", url: "https://music.apple.com/il/album/silsulim/1123663345?i=1123663405&l=he" },
  { title: "Toy", artist: "נטע ברזילי", year: 2018, era: "2010–2019", envelope: "כתום", url: "https://music.apple.com/il/album/toy-music-video-version/1393107600?i=1393107604&l=he" },
  { title: "שבט אחים ואחיות", artist: "שבט אחים ואחיות", year: 2019, era: "2010–2019", envelope: "כסף", url: "https://music.apple.com/il/album/%D7%A9%D7%91%D7%98-%D7%90%D7%97%D7%99%D7%9D-%D7%95%D7%90%D7%97%D7%99%D7%95%D7%AA/1459981257?i=1459981318&l=he" },
  { title: "בית משוגעים", artist: "רן דנקר", year: 2021, era: "2020–2026", envelope: "ירוק", url: "https://music.apple.com/il/album/%D7%91%D7%99%D7%AA-%D7%9E%D7%A9%D7%95%D7%92%D7%A2%D7%99%D7%9D/1554870143?i=1554870147&l=he" },
  { title: "אפס מאמץ", artist: "סטטיק, בן אל תבורי ונטע ברזילי", year: 2021, era: "2020–2026", envelope: "זהב", url: "https://music.apple.com/il/album/%D7%90%D7%A4%D7%A1-%D7%9E%D7%90%D7%9E%D7%A5/1573733396?i=1573733721&l=he" },
  { title: "יעלה ויבוא", artist: "עומר נצר וצאן ברזל מוזיקה", year: 2022, era: "2020–2026", envelope: "תכלת", url: "https://music.apple.com/il/album/%D7%99%D7%A2%D7%9C%D7%94-%D7%95%D7%99%D7%91%D7%95%D7%90/1600449912?i=1600449918&l=he" },
  { title: "סתלבט בקיבוץ", artist: "פול טראנק בהשתתפות ג׳ימבו ג׳יי", year: 2022, era: "2020–2026", envelope: "כתום", url: "https://music.apple.com/il/album/%D7%A1%D7%AA%D7%9C%D7%91%D7%98-%D7%91%D7%A7%D7%99%D7%91%D7%95%D7%A5-feat-%D7%92%D7%99%D7%9E%D7%91%D7%95-%D7%92%D7%99%D7%99/1604407387?i=1604407407&l=he" },
  { title: "תיק קטן", artist: "נס וסטילה", year: 2023, era: "2020–2026", envelope: "ירוק", url: "https://music.apple.com/il/album/%D7%AA%D7%99%D7%A7-%D7%A7%D7%98%D7%9F/1683388700?i=1683388703&l=he" },
  { title: "עטלף עיוור", artist: "חנן בן ארי", year: 2023, era: "2020–2026", envelope: "כסף", url: "https://music.apple.com/il/album/%D7%A2%D7%98%D7%9C%D7%A3-%D7%A2%D7%99%D7%95%D7%95%D7%A8/1690618220?i=1690618222&l=he" },
  { title: "Unicorn", artist: "נועה קירל", year: 2023, era: "2020–2026", envelope: "זהב", url: "https://music.apple.com/il/album/unicorn/1674396877?i=1674396878&l=he" },
  { title: "איך שהיא רוקדת", artist: "עדן חסון, אופק אדנק ואגם בוחבוט", year: 2026, era: "2020–2026", envelope: "תכלת", url: "https://music.apple.com/il/album/%D7%90%D7%99%D7%9A-%D7%A9%D7%94%D7%99%D7%90-%D7%A8%D7%95%D7%A7%D7%93%D7%AA/6768723548?i=6768723553" },
  { title: "מונולוג", artist: "סטילה ונס", year: 2026, era: "2020–2026", envelope: "כתום", url: "https://music.apple.com/il/album/%D7%9E%D7%95%D7%A0%D7%95%D7%9C%D7%95%D7%92/6788433335?i=6788433499&l=he" },
];

const teams = [
  { id: "green", name: "ירוק", color: "#7ab55c", leads: "איילת ודודי", route: ["מוזיקה", "ספיד־דייט", "דיבייט", "אסקייפ", "שחמט ופאזל"] },
  { id: "blue", name: "תכלת", color: "#52b9df", leads: "שרון ונווה", route: ["ספיד־דייט", "דיבייט", "אסקייפ", "שחמט ופאזל", "מוזיקה"] },
  { id: "gold", name: "זהב", color: "#e0b84a", leads: "נעמה ורז", route: ["דיבייט", "אסקייפ", "שחמט ופאזל", "מוזיקה", "ספיד־דייט"] },
  { id: "orange", name: "כתום", color: "#f28a0c", leads: "מעיין ומנואל", route: ["אסקייפ", "שחמט ופאזל", "מוזיקה", "ספיד־דייט", "דיבייט"] },
  { id: "silver", name: "כסף", color: "#b8c1c8", leads: "עירית ונתן", route: ["שחמט ופאזל", "מוזיקה", "ספיד־דייט", "דיבייט", "אסקייפ"] },
];

const scoreStations = ["מוזיקה", "קשר", "דיבייט", "אסקייפ", "חשיבה"];
const storageKeys = {
  deck: "tra-kfar-bloom-deck-v1",
  scores: "tra-kfar-bloom-scores-v1",
  timer: "tra-kfar-bloom-timer-v1",
};

function byId(id) {
  return document.getElementById(id);
}

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

let toastTimeout;
function showToast(message) {
  const toast = byId("toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function setupNavigation() {
  const body = document.body;
  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-button");
  const menuLinks = document.querySelectorAll(".main-nav a");

  menuButton.addEventListener("click", () => {
    const open = !body.classList.contains("menu-open");
    body.classList.toggle("menu-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
  });

  menuLinks.forEach((link) => link.addEventListener("click", () => {
    body.classList.remove("menu-open");
    menuButton.setAttribute("aria-expanded", "false");
  }));

  const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const observedSections = [...document.querySelectorAll("main section[id]")];
  const allNavLinks = [...document.querySelectorAll(".main-nav a, .mobile-nav a")];
  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    allNavLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`);
    });
  }, { rootMargin: "-25% 0px -60%", threshold: [0.01, 0.25, 0.5] });
  observedSections.forEach((section) => observer.observe(section));
}

function setupAgeModes() {
  const buttons = document.querySelectorAll(".age-button");
  const title = byId("age-result-title");
  const copy = byId("age-result-copy");
  const icon = document.querySelector(".age-icon");
  const list = byId("age-features");

  buttons.forEach((button) => button.addEventListener("click", () => {
    const selected = ageModes[button.dataset.age];
    buttons.forEach((candidate) => {
      const active = candidate === button;
      candidate.classList.toggle("is-active", active);
      candidate.setAttribute("aria-pressed", String(active));
    });
    icon.textContent = selected.icon;
    title.textContent = selected.title;
    copy.textContent = selected.copy;
    list.replaceChildren(...selected.features.map((feature) => {
      const item = document.createElement("li");
      item.textContent = feature;
      return item;
    }));
  }));
}

function setupStations() {
  const tabs = document.querySelectorAll(".station-tabs button");
  const detail = byId("station-detail");

  const renderStation = (key) => {
    const station = stations[key];
    byId("station-number").textContent = station.number;
    byId("station-label").textContent = station.label;
    byId("station-name").textContent = station.name;
    byId("station-goal").textContent = station.goal;
    byId("station-kit").textContent = station.kit;
    byId("station-steps").replaceChildren(...station.steps.map((step) => {
      const item = document.createElement("li");
      item.textContent = step;
      return item;
    }));
  };

  tabs.forEach((tab) => tab.addEventListener("click", () => {
    tabs.forEach((candidate) => candidate.setAttribute("aria-selected", String(candidate === tab)));
    renderStation(tab.dataset.station);
    if (window.innerWidth < 680) detail.focus({ preventScroll: true });
  }));
  renderStation("music");
}

function setupArcade() {
  const dialogs = document.querySelectorAll(".game-dialog");
  document.querySelectorAll("[data-open-game]").forEach((button) => {
    button.addEventListener("click", () => {
      const dialog = byId(button.dataset.openGame);
      if (dialog && typeof dialog.showModal === "function") dialog.showModal();
      if (dialog?.id === "chess-dialog") renderChessBoard();
      if (dialog?.id === "speed-dialog" && byId("speed-question").textContent.includes("התחלה")) nextSpeedQuestion();
    });
  });
  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog")?.close());
  });
  dialogs.forEach((dialog) => dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  }));

  const pieceGlyphs = {
    w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
    b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
  };
  const pieceNames = { k: "מלך", q: "מלכה", r: "צריח", b: "רץ", n: "פרש", p: "רגלי" };
  let chessTurn = "w";
  let chessSelected = null;
  let chessBoard = [];
  let formalChess = null;
  let formalChessError = null;
  const chessFiles = "abcdefgh";

  const initialChessBoard = () => [
    ["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
    ["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
    Array(8).fill(""),
    Array(8).fill(""),
    Array(8).fill(""),
    Array(8).fill(""),
    ["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp"],
    ["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"],
  ];
  const inBounds = (row, column) => row >= 0 && row < 8 && column >= 0 && column < 8;
  const pieceColor = (piece) => piece ? piece[0] : "";
  const pieceType = (piece) => piece ? piece[1] : "";
  const squareName = (row, column) => `${chessFiles[column]}${8 - row}`;
  const syncChessBoard = () => {
    if (!formalChess) return;
    chessBoard = Array.from({ length: 8 }, (_, row) => Array.from({ length: 8 }, (_, column) => {
      const piece = formalChess.get(squareName(row, column));
      return piece ? `${piece.color}${piece.type}` : "";
    }));
    chessTurn = formalChess.turn();
  };

  const isLegalMove = (rowA, columnA, rowB, columnB) => {
    if (!formalChess || !inBounds(rowA, columnA) || !inBounds(rowB, columnB) || (rowA === rowB && columnA === columnB)) return false;
    const from = squareName(rowA, columnA);
    const to = squareName(rowB, columnB);
    return formalChess.moves({ square: from, verbose: true }).some((move) => move.to === to);
  };

  const movesFrom = (row, column) => {
    const moves = new Set();
    for (let targetRow = 0; targetRow < 8; targetRow += 1) {
      for (let targetColumn = 0; targetColumn < 8; targetColumn += 1) {
        if (isLegalMove(row, column, targetRow, targetColumn)) moves.add(`${targetRow}-${targetColumn}`);
      }
    }
    return moves;
  };

  const choosePromotion = (moves) => {
    if (!moves.some((move) => move.promotion)) return null;
    const raw = window.prompt("קידום רגלי: בחרו מלכה (Q), צריח (R), רץ (B) או סוס (N).", "Q");
    if (raw === null) return undefined;
    const aliases = { q: "q", מלכה: "q", r: "r", צריח: "r", b: "b", רץ: "b", n: "n", סוס: "n" };
    return aliases[String(raw).trim().toLocaleLowerCase("he")] || "q";
  };

  const chessStatus = () => {
    if (!formalChess) return formalChessError || "טוען מנוע חוקי שחמט…";
    if (formalChess.isCheckmate()) return `מט! ${chessTurn === "w" ? "השחור" : "הלבן"} ניצח.`;
    if (formalChess.isStalemate()) return "פט — תיקו לפי חוקי השחמט.";
    if (formalChess.isInsufficientMaterial()) return "תיקו — אין מספיק חומר למט.";
    if (formalChess.isThreefoldRepetition()) return "תיקו — חזרה משולשת על העמדה.";
    if (formalChess.isDrawByFiftyMoves?.()) return "תיקו — 50 מסעים לכל צד ללא מהלך רגלי או הכאה.";
    if (formalChess.isCheck()) return `שח על ${chessTurn === "w" ? "הלבן" : "השחור"} — רק מהלך חוקי שמחלץ את המלך מותר.`;
    return `תור ${chessTurn === "w" ? "הלבן" : "השחור"}`;
  };

  const clickChessSquare = (row, column) => {
    if (!formalChess) {
      renderChessBoard();
      return;
    }
    if (formalChess.isGameOver()) {
      chessSelected = null;
      renderChessBoard();
      return;
    }
    const piece = chessBoard[row][column];
    if (chessSelected) {
      const [selectedRow, selectedColumn] = chessSelected;
      const from = squareName(selectedRow, selectedColumn);
      const to = squareName(row, column);
      const candidates = formalChess.moves({ square: from, verbose: true }).filter((move) => move.to === to);
      if (candidates.length) {
        const promotion = choosePromotion(candidates);
        if (promotion === undefined) {
          chessSelected = null;
          renderChessBoard("קידום הרגלי בוטל.");
          return;
        }
        const move = candidates.find((candidate) => !candidate.promotion || candidate.promotion === promotion);
        if (!move) {
          chessSelected = null;
          renderChessBoard("מהלך לא חוקי נחסם.");
          return;
        }
        formalChess.move(move.promotion ? { from: move.from, to: move.to, promotion: move.promotion } : { from: move.from, to: move.to });
        syncChessBoard();
        chessSelected = null;
        renderChessBoard();
        return;
      }
      chessSelected = null;
    }
    if (piece && pieceColor(piece) === chessTurn) chessSelected = [row, column];
    renderChessBoard();
  };

  function renderChessBoard(statusMessage = null) {
    if (!chessBoard.length) chessBoard = initialChessBoard();
    const board = byId("chess-board");
    if (!board) return;
    board.replaceChildren();
    const possibleMoves = formalChess && chessSelected ? movesFrom(...chessSelected) : new Set();
    for (let row = 0; row < 8; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        const square = document.createElement("button");
        square.type = "button";
        square.className = `chess-square ${(row + column) % 2 ? "dark" : "light"}`;
        if (chessSelected && chessSelected[0] === row && chessSelected[1] === column) square.classList.add("is-selected");
        if (possibleMoves.has(`${row}-${column}`)) square.classList.add("is-move");
        const piece = chessBoard[row][column];
        if (piece) {
          square.textContent = pieceGlyphs[pieceColor(piece)][pieceType(piece)];
          square.setAttribute("aria-label", `${pieceNames[pieceType(piece)]} ${pieceColor(piece) === "w" ? "לבן" : "שחור"}, שורה ${row + 1}, טור ${column + 1}`);
        } else {
          square.setAttribute("aria-label", `משבצת ריקה, שורה ${row + 1}, טור ${column + 1}`);
        }
        square.disabled = !formalChess || formalChess.isGameOver();
        square.addEventListener("click", () => clickChessSquare(row, column));
        board.append(square);
      }
    }
    const status = byId("chess-status");
    if (status) status.textContent = statusMessage || chessStatus();
  }

  const resetChess = () => {
    if (formalChess) {
      formalChess.reset();
      syncChessBoard();
    } else {
      chessBoard = initialChessBoard();
      chessTurn = "w";
    }
    chessSelected = null;
    renderChessBoard();
  };
  byId("reset-chess")?.addEventListener("click", resetChess);
  resetChess();
  if (byId("chess-board")) {
    import("https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm")
      .then(({ Chess }) => {
        formalChess = new Chess();
        formalChessError = null;
        resetChess();
      })
      .catch(() => {
        formalChessError = "מנוע חוקי השחמט לא נטען. אי אפשר לשחק עד שהוא זמין — כדי למנוע מהלכים לא חוקיים.";
        renderChessBoard();
      });
  }

  const speedQuestions = [
    "איזה שיר תמיד מעלה לך חיוך?",
    "מה הדבר הכי מצחיק שקרה לך בחופשה משפחתית?",
    "איזה מקום בארץ היית רוצה להראות לכולם?",
    "מה כישרון קטן שיש לך שאנשים לא תמיד יודעים עליו?",
    "איזה מאכל משפחתי אתה הכי אוהב?",
    "איזה זיכרון מכפר בלום היית רוצה לשמור?",
    "עם מי במשפחה היית יוצא למסע של שבוע — ולמה?",
    "מה למדת השנה על עצמך?",
    "איזה משחק חדש היית ממציא למשפחה?",
    "איזה שיר מייצג מבחינתך את ישראל?",
    "מה הדבר שהכי עוזר לך להרגיש בבית?",
    "איזו עצה טובה קיבלת מאדם מבוגר ממך?",
    "מה היית רוצה ללמוד ממישהו צעיר ממך?",
    "אם הייתה למשפחה להקה — איזה תפקיד היה לך?",
    "איזה דבר קטן יכול להפוך יום רגיל ליום טוב?",
  ];
  let speedSeconds = 60;
  let speedInterval = null;
  let lastQuestion = -1;
  const renderSpeedTime = () => { byId("speed-timer").textContent = String(speedSeconds); };

  function nextSpeedQuestion() {
    let index = Math.floor(Math.random() * speedQuestions.length);
    if (speedQuestions.length > 1 && index === lastQuestion) index = (index + 1) % speedQuestions.length;
    lastQuestion = index;
    byId("speed-question").textContent = speedQuestions[index];
  }

  const stopSpeed = () => {
    clearInterval(speedInterval);
    speedInterval = null;
    byId("start-speed").textContent = speedSeconds === 60 ? "התחלת 60 שניות" : "המשך";
  };

  byId("start-speed").addEventListener("click", () => {
    if (speedInterval) {
      stopSpeed();
      return;
    }
    if (speedSeconds <= 0) speedSeconds = 60;
    byId("start-speed").textContent = "השהיה";
    speedInterval = setInterval(() => {
      speedSeconds -= 1;
      renderSpeedTime();
      if (speedSeconds <= 0) {
        stopSpeed();
        byId("speed-question").textContent = "הזמן נגמר — מחליפים זוג ומקבלים שאלה חדשה.";
        showToast("60 שניות הסתיימו");
      }
    }, 1000);
  });
  byId("next-speed-question").addEventListener("click", nextSpeedQuestion);
  byId("reset-speed").addEventListener("click", () => {
    stopSpeed();
    speedSeconds = 60;
    renderSpeedTime();
    nextSpeedQuestion();
  });
}

function validDeck(value) {
  return Array.isArray(value) && value.every((index) => Number.isInteger(index) && index >= 0 && index < songs.length);
}

function setupHitster() {
  const allIndexes = songs.map((_, index) => index);
  const stored = safeParse(localStorage.getItem(storageKeys.deck), null);
  let remaining = validDeck(stored) ? [...new Set(stored)] : allIndexes;
  let currentSong = null;
  let currentIndex = null;
  let revealed = false;

  const drawButton = byId("draw-song");
  const revealButton = byId("reveal-song");
  const year = byId("song-year");
  const title = byId("song-title");
  const artist = byId("song-artist");
  const status = byId("song-status");
  const cardNumber = byId("song-number");
  const era = byId("song-era");
  const link = byId("apple-link");
  const record = byId("record");

  const saveDeck = () => {
    localStorage.setItem(storageKeys.deck, JSON.stringify(remaining));
    byId("remaining-count").textContent = String(remaining.length);
  };

  const renderEraBars = () => {
    const order = ["1960–1969", "1970–1979", "1980–1989", "1990–1999", "2000–2009", "2010–2019", "2020–2026"];
    const counts = order.map((label) => songs.filter((song) => song.era === label).length);
    const max = Math.max(...counts);
    byId("era-bars").replaceChildren(...order.map((label, index) => {
      const row = document.createElement("div");
      row.className = "era-row";
      const name = document.createElement("span");
      name.textContent = label;
      const track = document.createElement("span");
      track.className = "era-track";
      const fill = document.createElement("i");
      fill.style.width = `${(counts[index] / max) * 100}%`;
      track.append(fill);
      const value = document.createElement("strong");
      value.textContent = String(counts[index]);
      row.append(name, track, value);
      return row;
    }));
  };

  const conceal = () => {
    revealed = false;
    year.textContent = "?";
    year.classList.remove("is-revealed");
    title.textContent = "השיר מוכן להשמעה";
    artist.textContent = "פתחו את הקישור, האזינו והחליטו יחד";
    status.textContent = `מעטפת ${currentSong.envelope} · מקמו לפני או אחרי הקלפים שכבר נחשפו`;
    revealButton.disabled = false;
  };

  const drawSong = () => {
    if (!remaining.length) {
      showToast("החפיסה הסתיימה — אפשר לאפס ולהתחיל מחדש");
      return;
    }
    const randomPosition = Math.floor(Math.random() * remaining.length);
    currentIndex = remaining.splice(randomPosition, 1)[0];
    currentSong = songs[currentIndex];
    saveDeck();
    cardNumber.textContent = `קלף ${String(songs.length - remaining.length).padStart(2, "0")} / ${songs.length}`;
    era.textContent = currentSong.era;
    link.href = currentSong.url;
    link.classList.remove("is-disabled");
    link.setAttribute("aria-disabled", "false");
    conceal();
    record.classList.remove("is-spinning");
    void record.offsetWidth;
    record.classList.add("is-spinning");
    drawButton.textContent = remaining.length ? "משכו קלף נוסף" : "החפיסה הסתיימה";
  };

  const revealSong = () => {
    if (!currentSong) return;
    revealed = true;
    year.textContent = String(currentSong.year);
    year.classList.add("is-revealed");
    title.textContent = currentSong.title;
    artist.textContent = currentSong.artist;
    status.textContent = `${currentSong.era} · מעטפת ${currentSong.envelope}`;
    revealButton.disabled = true;
  };

  drawButton.addEventListener("click", drawSong);
  revealButton.addEventListener("click", revealSong);
  link.addEventListener("click", (event) => {
    if (!currentSong) event.preventDefault();
  });
  byId("reset-deck").addEventListener("click", () => {
    if (!window.confirm("לאפס את כל 21 הקלפים ולהתחיל חפיסה חדשה?")) return;
    remaining = [...allIndexes];
    currentSong = null;
    currentIndex = null;
    revealed = false;
    saveDeck();
    year.textContent = "?";
    year.classList.remove("is-revealed");
    title.textContent = "ציר הזמן הישראלי";
    artist.textContent = "השיר והמבצע יופיעו כאן";
    status.textContent = "הקלף מוכן. משכו שיר ראשון.";
    cardNumber.textContent = "קלף 01 / 21";
    era.textContent = "1960–1969";
    revealButton.disabled = true;
    drawButton.textContent = "משכו קלף";
    link.href = "#hitster";
    link.classList.add("is-disabled");
    link.setAttribute("aria-disabled", "true");
    showToast("החפיסה אופסה");
  });

  saveDeck();
  renderEraBars();
}

function setupScoreboard() {
  const stored = safeParse(localStorage.getItem(storageKeys.scores), {});
  const scores = {};
  teams.forEach((team) => {
    const candidate = Array.isArray(stored[team.id]) ? stored[team.id] : [];
    scores[team.id] = scoreStations.map((_, index) => {
      const value = candidate[index];
      return Number.isFinite(value) && value >= 0 && value <= 20 ? value : null;
    });
  });

  const board = byId("scoreboard");
  const header = document.createElement("div");
  header.className = "score-row header";
  header.append(document.createElement("span"));
  scoreStations.forEach((station) => {
    const label = document.createElement("span");
    label.textContent = station;
    header.append(label);
  });
  const totalLabel = document.createElement("span");
  totalLabel.textContent = "סה״כ";
  header.append(totalLabel);
  board.append(header);

  const save = () => localStorage.setItem(storageKeys.scores, JSON.stringify(scores));

  teams.forEach((team) => {
    const row = document.createElement("div");
    row.className = "score-row";
    const name = document.createElement("span");
    name.className = "team-name";
    name.style.setProperty("--team-color", team.color);
    const dot = document.createElement("i");
    dot.className = "team-dot";
    const text = document.createElement("span");
    text.textContent = team.name;
    name.append(dot, text);
    row.append(name);

    const total = document.createElement("output");
    total.className = "score-total";
    total.setAttribute("aria-label", `סך הניקוד של קבוצה ${team.name}`);

    const updateTotal = () => {
      const values = scores[team.id];
      const filled = values.filter((value) => value !== null);
      const sum = filled.reduce((accumulator, value) => accumulator + value, 0);
      total.textContent = filled.length ? String(sum) : "—";
      total.classList.remove("green", "yellow", "red");
      if (filled.length === scoreStations.length) {
        total.classList.add(sum >= 80 ? "green" : sum >= 60 ? "yellow" : "red");
      }
    };

    scoreStations.forEach((station, stationIndex) => {
      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.max = "20";
      input.inputMode = "numeric";
      input.value = scores[team.id][stationIndex] ?? "";
      input.setAttribute("aria-label", `${station}, קבוצה ${team.name}, 0 עד 20`);
      input.addEventListener("input", () => {
        if (input.value === "") {
          scores[team.id][stationIndex] = null;
        } else {
          const value = Math.max(0, Math.min(20, Number(input.value)));
          input.value = String(value);
          scores[team.id][stationIndex] = value;
        }
        updateTotal();
        save();
      });
      row.append(input);
    });
    row.append(total);
    board.append(row);
    updateTotal();
  });

  byId("reset-scores").addEventListener("click", () => {
    if (!window.confirm("לאפס את כל הניקוד בחמ״ל?")) return;
    teams.forEach((team) => { scores[team.id] = scoreStations.map(() => null); });
    localStorage.removeItem(storageKeys.scores);
    board.querySelectorAll("input").forEach((input) => { input.value = ""; });
    board.querySelectorAll(".score-total").forEach((output) => {
      output.textContent = "—";
      output.classList.remove("green", "yellow", "red");
    });
    showToast("הניקוד אופס");
  });
}

function setupRotation() {
  const chips = byId("team-chips");
  const route = byId("rotation-route");

  const render = (team) => {
    chips.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.team === team.id);
    });
    route.replaceChildren(...team.route.map((station, index) => {
      const item = document.createElement("li");
      const round = document.createElement("span");
      round.textContent = `סבב ${index + 1}`;
      item.append(round, document.createTextNode(station));
      return item;
    }));
  };

  teams.forEach((team, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `team-chip${index === 0 ? " is-active" : ""}`;
    button.dataset.team = team.id;
    button.style.setProperty("--team-color", team.color);
    button.textContent = team.name;
    button.title = `מובילים: ${team.leads}`;
    button.addEventListener("click", () => render(team));
    chips.append(button);
  });
  render(teams[0]);
}

function setupTimer() {
  const totalSeconds = 2 * 60 * 60;
  const stored = safeParse(localStorage.getItem(storageKeys.timer), {});
  let remaining = Number.isFinite(stored.remaining) ? Math.max(0, Math.min(totalSeconds, stored.remaining)) : totalSeconds;
  let running = Boolean(stored.running);
  let startedAt = Number.isFinite(stored.startedAt) ? stored.startedAt : null;
  let interval = null;

  if (running && startedAt) {
    remaining = Math.max(0, remaining - Math.floor((Date.now() - startedAt) / 1000));
    startedAt = Date.now();
    if (remaining === 0) running = false;
  }

  const display = byId("timer-display");
  const progress = byId("timer-progress");
  const toggle = byId("timer-toggle");

  const save = () => localStorage.setItem(storageKeys.timer, JSON.stringify({ remaining, running, startedAt }));

  const render = () => {
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;
    display.textContent = [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
    progress.style.width = `${((totalSeconds - remaining) / totalSeconds) * 100}%`;
    toggle.textContent = running ? "השהיה" : remaining === 0 ? "הסתיים" : "התחלה";
    toggle.disabled = remaining === 0;
  };

  const tick = () => {
    if (!running) return;
    remaining = Math.max(0, remaining - 1);
    if (remaining === 0) {
      running = false;
      clearInterval(interval);
      interval = null;
      showToast("שעתיים הושלמו — מסיימים יחד");
    }
    render();
    save();
  };

  const startInterval = () => {
    clearInterval(interval);
    interval = setInterval(tick, 1000);
  };

  toggle.addEventListener("click", () => {
    if (!remaining) return;
    running = !running;
    startedAt = running ? Date.now() : null;
    if (running) startInterval();
    else {
      clearInterval(interval);
      interval = null;
    }
    render();
    save();
  });

  byId("timer-reset").addEventListener("click", () => {
    if (!window.confirm("לאפס את שעון האירוע לשעתיים?")) return;
    remaining = totalSeconds;
    running = false;
    startedAt = null;
    clearInterval(interval);
    interval = null;
    render();
    save();
    showToast("השעון אופס");
  });

  if (running) startInterval();
  render();
  save();
}

function setupServiceWorker() {
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
}

setupNavigation();
setupAgeModes();
setupArcade();
setupStations();
setupHitster();
setupScoreboard();
setupRotation();
setupTimer();
setupServiceWorker();
