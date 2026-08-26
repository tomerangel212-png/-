// TRA Chess 10/10 runtime layer — TRA 9.9
// Keeps chess.js as the legality source of truth, adds the canonical TRA rating ladder,
// Ant/Anti 3000, a lightweight review panel, PGN export and best-move hinting.

const response = await fetch("./games.js", { cache: "no-store" });
if (!response.ok) throw new Error(`Failed to load games.js: ${response.status}`);
let source = await response.text();

const patches = [
  {from:`    name:"שקד", strength:20, delay:850, depth:0, noise:190, blunderRate:0.42,`,to:`    name:"שקד", strength:20, elo:1000, delay:850, depth:0, noise:190, blunderRate:0.42,`},
  {from:`    name:"תומר", strength:40, delay:1050, depth:1, noise:80, blunderRate:0.20,`,to:`    name:"תומר", strength:40, elo:1500, delay:1050, depth:1, noise:80, blunderRate:0.20,`},
  {from:`    name:"שיקי", strength:60, delay:520, depth:1, noise:30, blunderRate:0.07,`,to:`    name:"שיקי", strength:85, elo:2500, delay:650, depth:2, noise:10, blunderRate:0.015,`},
  {from:`    name:"מתן", strength:80, delay:900, depth:2, noise:7, blunderRate:0.015,`,to:`    name:"מתן", strength:70, elo:2000, delay:850, depth:2, noise:25, blunderRate:0.05,`},
  {from:`    style:"balanced-tactical"\n  }\n};`,to:`    style:"balanced-tactical"\n  },\n  anti: {\n    name:"אנט / אנטי ♛", strength:100, elo:3000, delay:800, depth:4, noise:0, blunderRate:0,\n    description:"מלכת השחמט — דירוג TRA 3000. מלכת תגובת הנגד המושלמת: מזהה איום, סופגת לחץ כשצריך והופכת את מהלך היריב להזדמנות נגדית מדויקת.",\n    style:"perfect-counter"\n  }\n};`},
  {from:`  if(profile.style==="balanced-tactical"){\n    if(move.captured)s+=pieceValue[move.captured]*0.08;\n    if(san.includes("+"))s+=35;\n    if(early&&move.piece==="q")s-=18;\n    if(ply>20&&move.piece==="r")s+=28;\n    if(san.includes("O-O"))s+=28;\n  }\n  return s;`,to:`  if(profile.style==="balanced-tactical"){\n    if(move.captured)s+=pieceValue[move.captured]*0.08;\n    if(san.includes("+"))s+=35;\n    if(early&&move.piece==="q")s-=18;\n    if(ply>20&&move.piece==="r")s+=28;\n    if(san.includes("O-O"))s+=28;\n  }\n  if(profile.style==="perfect-counter"){\n    const history=game.history({verbose:true});\n    const last=history[history.length-1];\n    if(move.captured)s+=pieceValue[move.captured]*0.20+70;\n    if(san.includes("+"))s+=95;\n    if(san.includes("#"))s+=100000;\n    if(last&&move.to===last.to)s+=55;\n    if(last?.captured&&move.captured)s+=45;\n    if(san.includes("O-O"))s+=30;\n  }\n  return s;`},
  {from:`const budget={nodes:0,max:profile.strength>=80?9000:profile.strength>=60?3500:1200};`,to:`const budget={nodes:0,max:profile.strength>=100?60000:profile.strength>=85?16000:profile.strength>=70?8000:profile.strength>=40?3500:1200};`},
  {from:'  botProfileEl.innerHTML=profile.strength\n    ? `<strong>${profile.name} · ${profile.strength}/100</strong><span>${profile.description}</span>`\n    : `<strong>${profile.name}</strong><span>${profile.description}</span>`;',to:'  botProfileEl.innerHTML=profile.strength\n    ? `<strong>${profile.name} · TRA Rating ${profile.elo ?? profile.strength}</strong><span>${profile.description}</span>`\n    : `<strong>${profile.name}</strong><span>${profile.description}</span>`;'},
  {from:`    button.type="button";`,to:`    button.type="button";\n    button.dataset.square=sq;`},
  {from:`track("chess_arcade_opened",{mode:isBotMode()?"vs_bot":"local",rules:"strict_legal_moves_checkmate_enforced",bot:activeBot().name});\nrender();`,to:`track("chess_arcade_opened",{mode:isBotMode()?"vs_bot":"local",rules:"strict_legal_moves_checkmate_enforced",bot:activeBot().name});\nfunction suggestHumanMove(){\n  if(chess.turn()!=="w"||chess.isGameOver())return null;\n  let best=null;\n  for(const move of orderedMoves(chess)){\n    chess.move({from:move.from,to:move.to,promotion:move.promotion||"q"});\n    const score=staticEval(chess);\n    chess.undo();\n    if(!best||score<best.score)best={from:move.from,to:move.to,san:move.san,score};\n  }\n  return best;\n}\nwindow.TRA_CHESS_API={\n  fen:()=>chess.fen(),\n  pgn:()=>chess.pgn(),\n  history:()=>chess.history(),\n  review:()=>({fen:chess.fen(),pgn:chess.pgn(),moves:chess.history().length,turn:chess.turn(),check:chess.isCheck(),gameOver:chess.isGameOver(),evaluation:staticEval(chess)}),\n  suggest:suggestHumanMove\n};\nrender();`}
];

for (const patch of patches) {
  if (!source.includes(patch.from)) throw new Error(`TRA Chess 10/10 patch target not found: ${patch.from.slice(0,64)}`);
  source = source.replace(patch.from, patch.to);
}

const ratingLabels = {shaked:"שקד · 1000",tomer:"תומר · 1500",matan:"מתן · 2000",shiki:"שיקי · 2500",anti:"♛ אנט / אנטי · 3000 · מלכת השחמט"};
const botSelect = document.querySelector("#bot-select");
for (const [id,label] of Object.entries(ratingLabels)) { const option=botSelect?.querySelector(`option[value="${id}"]`); if(option) option.textContent=label; }
const chessCard=document.querySelector('[data-game-number="7"] p');
if(chessCard)chessCard.textContent="שחמט 10/10 מול שקד 1000, תומר 1500, מתן 2000, שיקי 2500 ואנט/אנטי 3000 — חוקיות מלאה, לחיצה או גרירה, Review ורמזים.";

const blobUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
try { await import(blobUrl); } finally { URL.revokeObjectURL(blobUrl); }

const shell=document.querySelector("#chess");
if(shell){
  const panel=document.createElement("section");
  panel.className="chess-review";
  panel.innerHTML=`<div class="section-kicker">TRA 9.9 · REVIEW</div><h3>ניתוח משחק</h3><div class="review-actions"><button id="chess-hint" type="button">💡 רמז למסע</button><button id="copy-pgn" type="button">📋 העתק PGN</button><button id="copy-fen" type="button">🧩 העתק FEN</button></div><div id="chess-review-text" class="review-text" aria-live="polite">הניתוח יתעדכן תוך כדי המשחק.</div>`;
  shell.append(panel);
  const reviewText=panel.querySelector("#chess-review-text");
  const api=()=>window.TRA_CHESS_API;
  const refresh=()=>{const r=api()?.review?.();if(!r)return;const evalText=r.evaluation===0?"מאוזן":r.evaluation>0?`יתרון שחור +${Math.abs(r.evaluation)}`:`יתרון לבן +${Math.abs(r.evaluation)}`;reviewText.textContent=`${r.moves} חצאי־מסעים · ${evalText}${r.check?" · שח":""}${r.gameOver?" · המשחק הסתיים":""}`;};
  panel.querySelector("#chess-hint").onclick=()=>{const hint=api()?.suggest?.();document.querySelectorAll(".square.hinted").forEach(el=>el.classList.remove("hinted"));if(!hint){reviewText.textContent="אין כרגע רמז זמין — ייתכן שזה תור הבוט או שהמשחק הסתיים.";return;}document.querySelector(`.square[data-square="${hint.from}"]`)?.classList.add("hinted");document.querySelector(`.square[data-square="${hint.to}"]`)?.classList.add("hinted");reviewText.textContent=`רמז: ${hint.from} → ${hint.to} (${hint.san}).`;};
  panel.querySelector("#copy-pgn").onclick=async()=>{const text=api()?.pgn?.()||"";try{await navigator.clipboard.writeText(text);reviewText.textContent="PGN הועתק.";}catch{reviewText.textContent=text||"אין PGN עדיין.";}};
  panel.querySelector("#copy-fen").onclick=async()=>{const text=api()?.fen?.()||"";try{await navigator.clipboard.writeText(text);reviewText.textContent="FEN הועתק.";}catch{reviewText.textContent=text;}};
  const observer=new MutationObserver(refresh);observer.observe(document.querySelector("#status"),{childList:true,subtree:true,characterData:true});refresh();
}

// Chess.com-style move interaction: keep click-to-move and also allow desktop drag-and-drop.
const board=document.querySelector("#board");
if(board){
  let dragFrom=null;
  const markDraggable=()=>board.querySelectorAll(".square .piece").forEach(piece=>{piece.draggable=true;piece.setAttribute("aria-grabbed","false");});
  markDraggable();
  new MutationObserver(markDraggable).observe(board,{childList:true,subtree:true});
  board.addEventListener("dragstart",event=>{
    const square=event.target.closest?.(".square");
    if(!square?.dataset.square){event.preventDefault();return;}
    dragFrom=square.dataset.square;
    event.target.setAttribute?.("aria-grabbed","true");
    try{event.dataTransfer.setData("text/plain",dragFrom);event.dataTransfer.effectAllowed="move";}catch{}
  });
  board.addEventListener("dragover",event=>{if(event.target.closest?.(".square"))event.preventDefault();});
  board.addEventListener("drop",event=>{
    const target=event.target.closest?.(".square");
    if(!target?.dataset.square||!dragFrom)return;
    event.preventDefault();
    const source=board.querySelector(`.square[data-square="${dragFrom}"]`);
    const destination=board.querySelector(`.square[data-square="${target.dataset.square}"]`);
    dragFrom=null;
    source?.click();
    destination?.click();
    window.posthog?.capture?.("chess_drag_move_attempted",{interaction:"drag_drop",reference:"chess.com"});
  });
  board.addEventListener("dragend",event=>{dragFrom=null;event.target.setAttribute?.("aria-grabbed","false");});
}
