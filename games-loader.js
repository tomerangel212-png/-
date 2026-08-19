// TRA Chess runtime upgrade: canonical TRA ratings 1000–3000
// Loads the canonical games.js, applies the rating ladder, and strengthens Ant / Anti as the 3000-rated Chess Queen.

const response = await fetch("./games.js", { cache: "no-store" });
if (!response.ok) throw new Error(`Failed to load games.js: ${response.status}`);
let source = await response.text();

const patches = [
  {
    from: `    name:"שקד", strength:20, delay:850, depth:0, noise:190, blunderRate:0.42,`,
    to: `    name:"שקד", strength:20, elo:1000, delay:850, depth:0, noise:190, blunderRate:0.42,`
  },
  {
    from: `    name:"תומר", strength:40, delay:1050, depth:1, noise:80, blunderRate:0.20,`,
    to: `    name:"תומר", strength:40, elo:1500, delay:1050, depth:1, noise:80, blunderRate:0.20,`
  },
  {
    from: `    name:"שיקי", strength:60, delay:520, depth:1, noise:30, blunderRate:0.07,`,
    to: `    name:"שיקי", strength:85, elo:2500, delay:650, depth:2, noise:10, blunderRate:0.015,`
  },
  {
    from: `    name:"מתן", strength:80, delay:900, depth:2, noise:7, blunderRate:0.015,`,
    to: `    name:"מתן", strength:70, elo:2000, delay:850, depth:2, noise:25, blunderRate:0.05,`
  },
  {
    from: `    style:"balanced-tactical"\n  }\n};`,
    to: `    style:"balanced-tactical"\n  },\n  anti: {\n    name:"אנט / אנטי ♛", strength:100, elo:3000, delay:800, depth:4, noise:0, blunderRate:0,\n    description:"מלכת השחמט — דירוג TRA 3000. מלכת תגובת הנגד המושלמת: מזהה איום, סופגת לחץ כשצריך והופכת את מהלך היריב להזדמנות נגדית מדויקת.",\n    style:"perfect-counter"\n  }\n};`
  },
  {
    from: `  if(profile.style==="balanced-tactical"){\n    if(move.captured)s+=pieceValue[move.captured]*0.08;\n    if(san.includes("+"))s+=35;\n    if(early&&move.piece==="q")s-=18;\n    if(ply>20&&move.piece==="r")s+=28;\n    if(san.includes("O-O"))s+=28;\n  }\n  return s;\n}\n\nfunction orderedMoves`,
    to: `  if(profile.style==="balanced-tactical"){\n    if(move.captured)s+=pieceValue[move.captured]*0.08;\n    if(san.includes("+"))s+=35;\n    if(early&&move.piece==="q")s-=18;\n    if(ply>20&&move.piece==="r")s+=28;\n    if(san.includes("O-O"))s+=28;\n  }\n  if(profile.style==="perfect-counter"){\n    const history=game.history({verbose:true});\n    const last=history[history.length-1];\n    if(move.captured)s+=pieceValue[move.captured]*0.20+70;\n    if(san.includes("+"))s+=95;\n    if(san.includes("#"))s+=100000;\n    if(last&&move.to===last.to)s+=55;\n    if(last?.captured&&move.captured)s+=45;\n    if(san.includes("O-O"))s+=30;\n    if(early&&(move.piece==="n"||move.piece==="b"))s+=12;\n  }\n  return s;\n}\n\nfunction orderedMoves`
  },
  {
    from: `const budget={nodes:0,max:profile.strength>=80?9000:profile.strength>=60?3500:1200};`,
    to: `const budget={nodes:0,max:profile.strength>=100?60000:profile.strength>=85?16000:profile.strength>=70?8000:profile.strength>=40?3500:1200};`
  },
  {
    from: '  botProfileEl.innerHTML=profile.strength\n    ? `<strong>${profile.name} · ${profile.strength}/100</strong><span>${profile.description}</span>`\n    : `<strong>${profile.name}</strong><span>${profile.description}</span>`;',
    to: '  botProfileEl.innerHTML=profile.strength\n    ? `<strong>${profile.name} · TRA Rating ${profile.elo ?? profile.strength}</strong><span>${profile.description}</span>`\n    : `<strong>${profile.name}</strong><span>${profile.description}</span>`;'
  }
];

for (const patch of patches) {
  if (!source.includes(patch.from)) throw new Error("TRA Chess upgrade patch target not found");
  source = source.replace(patch.from, patch.to);
}

const ratingLabels = {
  shaked: "שקד · 1000",
  tomer: "תומר · 1500",
  matan: "מתן · 2000",
  shiki: "שיקי · 2500",
  anti: "♛ אנט / אנטי · 3000 · מלכת השחמט"
};
const botSelect = document.querySelector("#bot-select");
for (const [id,label] of Object.entries(ratingLabels)) {
  const option = botSelect?.querySelector(`option[value="${id}"]`);
  if (option) option.textContent = label;
}
const chessCard = document.querySelector('[data-game-number="7"] p');
if (chessCard) chessCard.textContent = "שחמט מול שקד 1000, תומר 1500, מתן 2000, שיקי 2500 ואנט/אנטי 3000 — מלכת השחמט.";

const blobUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
try {
  await import(blobUrl);
} finally {
  URL.revokeObjectURL(blobUrl);
}
