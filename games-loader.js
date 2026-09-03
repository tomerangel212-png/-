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
  {from:`let claimedDrawReason = null;`,to:`let claimedDrawReason = null;\nlet clockResult = null;`},
  {from:`function claimableDraw(game=chess){\n  const repetition=repetitionCount(game);\n  const halfmoves=halfMoveClock(game);\n  if(repetition>=3)return {reason:"threefold_repetition",text:"חזרה משולשת על אותה עמדה"};\n  if(halfmoves>=100)return {reason:"fifty_move",text:"50 מסעים לכל צד ללא מהלך רגלי או הכאה"};\n  return null;\n}`,to:`function claimableDraw(game=chess){\n  const repetition=repetitionCount(game);\n  const halfmoves=halfMoveClock(game);\n  if(repetition>=3)return {reason:"threefold_repetition",text:"חזרה משולשת על אותה עמדה"};\n  if(halfmoves>=100)return {reason:"fifty_move",text:"50 מסעים לכל צד ללא מהלך רגלי או הכאה"};\n  return null;\n}\nfunction intendedClaimableDraws(game=chess){\n  if(claimableDraw(game))return [];\n  const history=game.history({verbose:true});\n  if(halfMoveClock(game)<99&&history.length<7)return [];\n  const claims=[];\n  for(const move of game.moves({verbose:true})){\n    game.move(move.promotion?{from:move.from,to:move.to,promotion:move.promotion}:{from:move.from,to:move.to});\n    const claim=claimableDraw(game);\n    game.undo();\n    if(claim)claims.push({uci:\`${move.from}${move.to}${move.promotion||""}\`,san:move.san,reason:claim.reason,text:claim.text});\n  }\n  return claims;\n}\nfunction canPossiblyMate(game,color){\n  const own=[];\n  const enemy=[];\n  const board=game.board();\n  for(let row=0;row<8;row++)for(let col=0;col<8;col++){\n    const piece=board[row][col];\n    if(!piece)continue;\n    (piece.color===color?own:enemy).push({type:piece.type,row,col});\n  }\n  if(own.some(piece=>piece.type==="q"||piece.type==="r"||piece.type==="p"))return true;\n  const bishops=own.filter(piece=>piece.type==="b");\n  const knights=own.filter(piece=>piece.type==="n");\n  if(!bishops.length&&!knights.length)return false;\n  if(enemy.some(piece=>piece.type!=="k"))return true;\n  if(knights.length>=2)return true;\n  if(bishops.length&&knights.length)return true;\n  const bishopComplexes=new Set(bishops.map(piece=>(piece.row+piece.col)%2));\n  return bishopComplexes.size>=2;\n}`},
  {from:`  if(game.isInsufficientMaterial()) return {over:true,reason:"insufficient_material",winner:null,loser:null,text:"תיקו — אין מספיק חומר למט."};\n  if(game===chess&&claimedDrawReason){const text=claimedDrawReason==="threefold_repetition"?"תיקו — חזרה משולשת על העמדה נדרשה כדין.":"תיקו — כלל 50 המסעים נדרש כדין.";return {over:true,reason:claimedDrawReason,winner:null,loser:null,text};}\n  if(repetitionCount(game)>=5) return {over:true,reason:"fivefold_repetition",winner:null,loser:null,text:"תיקו — אותה עמדה הופיעה חמש פעמים."};\n  if(halfMoveClock(game)>=150) return {over:true,reason:"seventy_five_move",winner:null,loser:null,text:"תיקו — 75 מסעים לכל צד ללא מהלך רגלי או הכאה."};\n  const claim=claimableDraw(game);\n  return {over:false,reason:null,winner:null,loser:null,text:null,claimable:claim};`,to:`  if(game.isInsufficientMaterial()) return {over:true,reason:"insufficient_material",winner:null,loser:null,text:"תיקו — אין מספיק חומר למט."};\n  if(game===chess&&clockResult)return clockResult;\n  if(game===chess&&claimedDrawReason){const text=claimedDrawReason==="threefold_repetition"?"תיקו — חזרה משולשת על העמדה נדרשה כדין.":"תיקו — כלל 50 המסעים נדרש כדין.";return {over:true,reason:claimedDrawReason,winner:null,loser:null,text};}\n  if(repetitionCount(game)>=5) return {over:true,reason:"fivefold_repetition",winner:null,loser:null,text:"תיקו — אותה עמדה הופיעה חמש פעמים."};\n  if(halfMoveClock(game)>=150) return {over:true,reason:"seventy_five_move",winner:null,loser:null,text:"תיקו — 75 מסעים לכל צד ללא מהלך רגלי או הכאה."};\n  const claim=claimableDraw(game);\n  const intended=claim?[]:intendedClaimableDraws(game);\n  return {over:false,reason:null,winner:null,loser:null,text:null,claimable:claim,intendedClaims:intended};`},
  {from:`  if(result.claimable)return \`תור ${turn}. אפשר לדרוש תיקו — ${result.claimable.text}.\`;`,to:`  if(result.claimable)return \`תור ${turn}. אפשר לדרוש תיקו — ${result.claimable.text}.\`;\n  if(result.intendedClaims?.length)return \`תור ${turn}. אפשר לדרוש תיקו לפני מסע שמייצר ${result.intendedClaims[0].text}.\`;`},
  {from:`  if(claimDrawButton)claimDrawButton.disabled=!result.claimable || botThinking || !isHumanTurn();`,to:`  if(claimDrawButton)claimDrawButton.disabled=(!result.claimable&&!result.intendedClaims?.length)||botThinking||!isHumanTurn();`},
  {from:`function claimDraw(){\n  const result=resultState();\n  if(result.over||!result.claimable)return;\n  claimedDrawReason=result.claimable.reason;\n  track("chess_draw_claimed",{reason:claimedDrawReason,by:colorName(chess.turn())});\n  finishGameIfNeeded();\n  render();\n}`,to:`function claimDraw(preferredIntendedUci=null){\n  const result=resultState();\n  if(result.over)return;\n  let claim=result.claimable;\n  let intendedMove=null;\n  if(!claim&&result.intendedClaims?.length){\n    let chosen=null;\n    if(preferredIntendedUci)chosen=result.intendedClaims.find(item=>item.uci===preferredIntendedUci)||null;\n    if(!chosen&&isBotMode()&&chess.turn()==="b")chosen=result.intendedClaims[0];\n    if(!chosen){\n      const options=result.intendedClaims.map(item=>item.uci).join(", ");\n      const raw=window.prompt(\`דרישת תיקו לפני המסע: הקלידו את המסע המיועד (לדוגמה g1f3). אפשרויות חוקיות: ${options}\`,result.intendedClaims[0].uci);\n      if(raw===null)return;\n      const uci=String(raw).trim().toLowerCase().replace(/[^a-h1-8qrbn]/g,"");\n      chosen=result.intendedClaims.find(item=>item.uci===uci)||null;\n      if(!chosen){statusEl.textContent="דרישת התיקו לא אושרה — המסע שצוין אינו יוצר זכות תיקו.";return;}\n    }\n    claim={reason:chosen.reason,text:chosen.text};\n    intendedMove=chosen.uci;\n  }\n  if(!claim)return;\n  claimedDrawReason=claim.reason;\n  track("chess_draw_claimed",{reason:claimedDrawReason,by:colorName(chess.turn()),...(intendedMove?{intended_move:intendedMove}:{})});\n  finishGameIfNeeded();\n  render();\n}`},
  {from:`  if(result.claimable){claimDraw();return;}`,to:`  if(result.claimable||result.intendedClaims?.length){claimDraw(result.intendedClaims?.[0]?.uci||null);return;}`},
  {from:`  chess=new Chess();selected=null;seconds={w:300,b:300};started=false;botThinking=false;claimedDrawReason=null;`,to:`  chess=new Chess();selected=null;seconds={w:300,b:300};started=false;botThinking=false;claimedDrawReason=null;clockResult=null;`},
  {from:`function tick(){if(!started||resultState().over)return;const turn=chess.turn();seconds[turn]-=1;if(seconds[turn]<=0){seconds[turn]=0;started=false;clearInterval(interval);interval=null;statusEl.textContent=\`הזמן של ${colorName(turn)} נגמר. ${colorName(opponent(turn))} ניצח.\`;track("chess_game_finished",{reason:"timeout",winner:colorName(opponent(turn)),loser:colorName(turn),bot:isBotMode()?activeBot().name:"none"});}renderClock();}`,to:`function tick(){if(!started||resultState().over)return;const turn=chess.turn();seconds[turn]-=1;if(seconds[turn]<=0){seconds[turn]=0;started=false;clearInterval(interval);interval=null;const winner=opponent(turn);const canMate=canPossiblyMate(chess,winner);clockResult=canMate?{over:true,reason:"timeout",winner,loser:turn,text:\`הזמן של ${colorName(turn)} נגמר. ${colorName(winner)} ניצח.\`}:{over:true,reason:"timeout_insufficient_mating_material",winner:null,loser:null,text:\`הזמן של ${colorName(turn)} נגמר, אבל ל${colorName(winner)} אין אפשרות חוקית להגיע למט — תיקו.\`};track("chess_game_finished",{reason:clockResult.reason,winner:clockResult.winner?colorName(clockResult.winner):"draw",loser:clockResult.loser?colorName(clockResult.loser):null,bot:isBotMode()?activeBot().name:"none"});render();return;}renderClock();}`},
  {from:`  addState("fifty move rule is claimable","r3k3/8/8/8/8/8/8/4K2R w - - 100 51",t=>{const result=resultState(t);return !result.over&&result.claimable?.reason==="fifty_move";});`,to:`  addState("fifty move rule is claimable","r3k3/8/8/8/8/8/8/4K2R w - - 100 51",t=>{const result=resultState(t);return !result.over&&result.claimable?.reason==="fifty_move";});\n  addState("fifty move claim may be declared with an intended legal move","r3k3/8/8/8/8/8/8/4K2R w - - 99 50",t=>intendedClaimableDraws(t).some(item=>item.reason==="fifty_move"));\n  addState("timeout is draw when opponent has only a king","4k3/8/8/8/8/8/8/4K3 w - - 0 1",t=>!canPossiblyMate(t,"b"));\n  addState("timeout remains a loss when opponent can possibly mate","4k3/8/8/8/8/8/7r/4K3 w - - 0 1",t=>canPossiblyMate(t,"b"));`},
  {from:`track("chess_arcade_opened",{mode:isBotMode()?"vs_bot":"local",rules:"strict_legal_moves_checkmate_enforced",bot:activeBot().name});\nrender();`,to:`track("chess_arcade_opened",{mode:isBotMode()?"vs_bot":"local",rules:"strict_legal_moves_checkmate_enforced",bot:activeBot().name});\nfunction suggestHumanMove(){\n  if(chess.turn()!=="w"||resultState().over)return null;\n  let best=null;\n  for(const move of orderedMoves(chess)){\n    chess.move({from:move.from,to:move.to,promotion:move.promotion||"q"});\n    const score=staticEval(chess);\n    chess.undo();\n    if(!best||score<best.score)best={from:move.from,to:move.to,san:move.san,score};\n  }\n  return best;\n}\nwindow.TRA_CHESS_API={\n  fen:()=>chess.fen(),\n  pgn:()=>chess.pgn(),\n  history:()=>chess.history(),\n  review:()=>({fen:chess.fen(),pgn:chess.pgn(),moves:chess.history().length,turn:chess.turn(),check:chess.isCheck(),gameOver:resultState().over,evaluation:staticEval(chess)}),\n  suggest:suggestHumanMove\n};\nrender();`}
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
