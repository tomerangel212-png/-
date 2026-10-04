// © 2026 Tomer Rafael Angel. All rights reserved.
// Direct chess UI. No string patches, eval, generated modules, or fixed ELO claims.
// The pinned chess.js engine remains responsible for move legality.
export const BOT_PROFILES = {
  local:{name:"שני שחקנים",level:0,elo:0,depth:0,noise:0,style:"local"},
  shaked:{name:"שקד",level:1,elo:1000,depth:0,noise:150,style:"modern-queen"},
  tomer:{name:"תומר",level:2,elo:1500,depth:1,noise:55,style:"classical-minors"},
  matan:{name:"מתן",level:3,elo:2000,depth:1,noise:15,style:"balanced-tactical"},
  shiki:{name:"שיקי",level:4,elo:2500,depth:2,noise:5,style:"initiative"},
  anti:{name:"אנט / אנטי ♛",level:5,elo:3000,depth:2,noise:0,style:"perfect-counter"}
};
// Legacy elo fields are retained as internal identifiers, never displayed as measured ratings.
const NAMES = {
  he:{shaked:"שקד",tomer:"תומר",matan:"מתן",shiki:"שיקי",anti:"אנט / אנטי"},
  en:{shaked:"Shaked",tomer:"Tomer",matan:"Matan",shiki:"Shiki",anti:"Anet / Anti"},
  ar:{shaked:"شاكيد",tomer:"تومر",matan:"متان",shiki:"شيكي",anti:"أنت / أنتي"},
  fr:{shaked:"Shaked",tomer:"Tomer",matan:"Matan",shiki:"Shiki",anti:"Anet / Anti"},
  hi:{shaked:"शाकेद",tomer:"तोमेर",matan:"मतान",shiki:"शिकी",anti:"अनेत / आंटी"}
};
const GLYPHS={wk:"♔",wq:"♕",wr:"♖",wb:"♗",wn:"♘",wp:"♙",bk:"♚",bq:"♛",br:"♜",bb:"♝",bn:"♞",bp:"♟"};
const VALUE={p:100,n:320,b:330,r:500,q:900,k:0};
const FILES="abcdefgh";
const PREF_KEY="tra-chess-accessible-preferences-v1";
const OTHER=c=>c==="w"?"b":"w";
const moveInput=m=>m.promotion?{from:m.from,to:m.to,promotion:m.promotion}:{from:m.from,to:m.to};
const positionKey=fen=>fen.split(" ").slice(0,4).join(" ");
export function repetitionCount(game){
  const history=game.history({verbose:true});
  const counts=new Map();
  const add=fen=>{const key=positionKey(fen);counts.set(key,(counts.get(key)||0)+1);};
  if(history.length){add(history[0].before);for(const move of history)add(move.after);}else add(game.fen());
  return counts.get(positionKey(game.fen()))||1;
}
export function halfMoveClock(game){return Number(game.fen().split(" ")[4])||0;}
export function claimableDraw(game){
  if(repetitionCount(game)>=3)return "threefold_repetition";
  if(halfMoveClock(game)>=100)return "fifty_move";
  return null;
}
export function intendedClaimableDraws(game){
  if(claimableDraw(game))return [];
  if(halfMoveClock(game)<99&&game.history().length<7)return [];
  const found=[];
  for(const move of game.moves({verbose:true})){
    game.move(moveInput(move));
    let reason;
    try{reason=claimableDraw(game);}finally{game.undo();}
    if(reason)found.push({move,reason,uci:move.from+move.to+(move.promotion||"")});
  }
  return found;
}
export function canPossiblyMate(game,color){
  // Conservative material check, not a proof solver for every possible dead position.
  const own=[],enemy=[];
  game.board().forEach((row,r)=>row.forEach((piece,c)=>{if(piece)(piece.color===color?own:enemy).push({...piece,r,c});}));
  if(own.some(p=>["q","r","p"].includes(p.type)))return true;
  const bishops=own.filter(p=>p.type==="b"),knights=own.filter(p=>p.type==="n");
  if(!bishops.length&&!knights.length)return false;
  if(enemy.some(p=>p.type!=="k"))return true;
  if(knights.length>=2||(knights.length&&bishops.length))return true;
  return new Set(bishops.map(p=>(p.r+p.c)%2)).size>=2;
}
export function resultState(game,clockResult=null,claimedDrawReason=null){
  if(game.isCheckmate())return {over:true,reason:"checkmate",winner:OTHER(game.turn())};
  if(game.isStalemate())return {over:true,reason:"stalemate",winner:null};
  if(game.isInsufficientMaterial())return {over:true,reason:"insufficient_material",winner:null};
  if(clockResult)return clockResult;
  if(claimedDrawReason)return {over:true,reason:claimedDrawReason,winner:null};
  if(repetitionCount(game)>=5)return {over:true,reason:"fivefold_repetition",winner:null};
  if(halfMoveClock(game)>=150)return {over:true,reason:"seventy_five_move",winner:null};
  return {over:false,reason:null,winner:null};
}
export function materialEvaluation(game){
  if(game.isCheckmate())return game.turn()==="b"?-100000:100000;
  if(game.isStalemate()||game.isInsufficientMaterial())return 0;
  let score=0;
  game.board().forEach((row,r)=>row.forEach((piece,c)=>{
    if(!piece)return;
    const sign=piece.color==="b"?1:-1;
    const centrality=7-Math.abs(3.5-r)-Math.abs(3.5-c);
    score+=sign*(VALUE[piece.type]+(["b","n"].includes(piece.type)?3*centrality:0));
  }));
  return score;
}
function safePreferences(){try{return JSON.parse(localStorage.getItem(PREF_KEY)||"{}")||{};}catch{return {};}}
function writePreferences(value){try{localStorage.setItem(PREF_KEY,JSON.stringify(value));}catch{/* Gameplay does not depend on storage. */}}
function track(event,values={}){try{window.posthog?.capture?.(event,values);}catch{/* Telemetry must not stop a move. */}}
function node(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;}
function translated(copy,key,values={}){return String(copy[key]||key).replace(/\{(\w+)\}/g,(_,k)=>String(values[k]??""));}
function withTimeout(promise,ms){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error("Chess load timeout")),ms);})]).finally(()=>clearTimeout(timer));}
export async function loadChessEngine(importer=url=>import(url)){
  const sources=[
    "https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm",
    "https://unpkg.com/chess.js@1.4.0/dist/esm/chess.js"
  ];
  const failures=[];
  for(const src of sources){
    try{const module=await withTimeout(importer(src),10000);if(typeof module.Chess!=="function")throw new Error("Chess export missing");return module.Chess;}
    catch(error){failures.push(error);}
  }
  throw new Error("Both pinned chess.js sources failed",{cause:failures[failures.length-1]});
}
export function startChess(Chess,COPY,shell){
  const prefs=safePreferences();
  const requested=new URLSearchParams(location.search).get("lang");
  let language=COPY[requested]?requested:COPY[prefs.language]?prefs.language:"he";
  let display=["normal","large","tv"].includes(prefs.display)?prefs.display:"normal";
  let highContrast=Boolean(prefs.highContrast);
  let chess=new Chess(),selected=null,orientation="w",focusSquare="e2";
  let opponentId="local",clockMinutes=0,remaining={w:0,b:0},lastClockAt=null;
  let clockResult=null,claimedDrawReason=null,gameResult=resultState(chess);
  let botTimer=null,botThinking=false,epoch=0,dialogOpen=false,hintSquares=[];
  const clockHistory=[];
  const text=(key,values)=>translated(COPY[language],key,values);
  const colorName=color=>text(color==="w"?"white":"black");
  const botName=()=>NAMES[language][opponentId]||text("local");
  const $=id=>shell.querySelector("#"+id);
  const savePrefs=()=>writePreferences({language,display,highContrast});
  const isHumanTurn=()=>opponentId==="local"||chess.turn()==="w";
  shell.classList.add("tra-chess-accessible");
  shell.innerHTML=`
    <header class="chess-heading"><span class="chess-mark" aria-hidden="true">♟</span><div><h2 data-i18n="title"></h2><p data-i18n="intro"></p></div></header>
    <p class="family-note" data-i18n="family"></p>
    <div class="chess-settings">
      <label><span data-i18n="language"></span><select id="chess-language"></select></label>
      <label><span data-i18n="opponent"></span><select id="bot-select"></select></label>
      <label><span data-i18n="clock"></span><select id="chess-time"></select></label>
      <label><span data-i18n="display"></span><select id="chess-display"></select></label>
      <label class="contrast-control"><input id="chess-contrast" type="checkbox"><span data-i18n="contrast"></span></label>
    </div>
    <p id="bot-profile" class="small-note" data-i18n="botNote"></p>
    <div class="chess-play-layout"><div class="chess-board-area">
      <div class="clocks" aria-live="off"><div id="black-clock" class="clock black"><span data-i18n="black"></span><strong></strong></div><div id="white-clock" class="clock white"><span data-i18n="white"></span><strong></strong></div></div>
      <p id="status" class="chess-status" role="status" aria-live="polite" aria-atomic="true"></p>
      <div id="board" class="board" role="grid" aria-rowcount="8" aria-colcount="8" dir="ltr"></div>
      <p id="chess-keyboard" class="small-note" data-i18n="keyboard"></p>
      <p id="chess-piece-lesson" class="piece-lesson"></p>
    </div><div class="chess-side">
      <div class="chess-controls">
        <button id="new-game" type="button" class="primary" data-i18n="new"></button><button id="flip-board" type="button" data-i18n="flip"></button>
        <button id="undo-move" type="button" data-i18n="undo"></button><button id="claim-draw" type="button" data-i18n="draw"></button>
        <button id="chess-hint" type="button" data-i18n="hint"></button><button id="chess-help" type="button" data-i18n="help"></button>
        <button id="chess-fullscreen" type="button" data-i18n="fullscreen"></button>
      </div>
      <details class="chess-history"><summary data-i18n="history"></summary><ol id="chess-moves"></ol></details>
      <details class="chess-export"><summary data-i18n="export"></summary><div class="chess-controls"><button id="copy-pgn" type="button" data-i18n="copyPgn"></button><button id="copy-fen" type="button" data-i18n="copyFen"></button></div><textarea id="chess-copy-text" dir="ltr" hidden readonly></textarea></details>
      <p id="chess-feedback" role="status" aria-live="polite" aria-atomic="true"></p>
    </div></div>
    <footer class="chess-footer"><a href="games.html#all-games" data-i18n="back"></a><p data-i18n="copyright"></p></footer>
    <div id="chess-dialog-layer" class="chess-dialog-layer" hidden><section role="dialog" aria-modal="true" aria-labelledby="chess-dialog-title" class="chess-dialog"><h3 id="chess-dialog-title"></h3><div id="chess-dialog-body"></div><div id="chess-dialog-actions" class="chess-controls"></div></section></div>`;
  if(document.body.classList.contains("chess-page")){const old=shell.querySelector(".chess-heading h2");const heading=document.createElement("h1");heading.dataset.i18n="title";old.replaceWith(heading);}
  function feedback(key,values){$("chess-feedback").textContent=text(key,values);}
  function options(select,entries,current){select.replaceChildren();for(const [value,label]of entries){const opt=node("option",null,label);opt.value=value;select.append(opt);}select.value=String(current);}
  function translateUI(){
    shell.lang=language;shell.dir=COPY[language].dir;shell.setAttribute("aria-label",text("title"));
    if(document.body.classList.contains("chess-page")){document.documentElement.lang=language;document.documentElement.dir=shell.dir;document.title=text("title");}
    for(const el of shell.querySelectorAll("[data-i18n]"))el.textContent=text(el.dataset.i18n);
    options($("chess-language"),Object.entries(COPY).map(([key,item])=>[key,item.name]),language);
    for(const option of $("chess-language").options){option.lang=option.value;option.dir=COPY[option.value].dir;}
    options($("bot-select"),Object.entries(BOT_PROFILES).map(([key,p])=>[key,key==="local"?text("local"):text("botLevel",{name:NAMES[language][key],level:p.level})]),opponentId);
    options($("chess-time"),[[0,text("untimed")],...[5,10,15].map(n=>[n,text("minutes",{minutes:n})])],clockMinutes);
    options($("chess-display"),["normal","large","tv"].map(v=>[v,text(v)]),display);
    shell.dataset.display=display;shell.classList.toggle("high-contrast",highContrast);$("chess-contrast").checked=highContrast;
    $("board").setAttribute("aria-label",text("board"));$("board").setAttribute("aria-describedby","chess-keyboard");
    $("chess-copy-text").setAttribute("aria-label",text("export"));
    $("chess-fullscreen").textContent=text(document.fullscreenElement?"exitFullscreen":"fullscreen");
    $("chess-feedback").textContent="";
  }
  function squareNames(){const names=[];const ranks=orientation==="w"?[8,7,6,5,4,3,2,1]:[1,2,3,4,5,6,7,8];const files=orientation==="w"?[...FILES]:[...FILES].reverse();for(const r of ranks)for(const f of files)names.push(f+r);return names;}
  function status(){
    const r=gameResult;
    if(r.over){
      const key={checkmate:"checkmate",stalemate:"stalemate",insufficient_material:"insufficient",threefold_repetition:"repetition",fivefold_repetition:"repetition",fifty_move:"fifty",seventy_five_move:"seventyFive",timeout:"timeout",timeout_insufficient_mating_material:"timeoutDraw"}[r.reason];
      return text(key||"stalemate",{color:colorName(r.reason==="timeout"?r.loser:r.winner||chess.turn()),winner:colorName(r.winner||"w")});
    }
    if(botThinking)return text("thinking",{name:botName()});
    if(selected){const piece=chess.get(selected);return text("choose",{piece:text("piece_"+piece.type),square:selected});}
    return text(chess.isCheck()?"check":"turn",{color:colorName(chess.turn())});
  }
  function renderClock(){
    for(const color of ["w","b"]){
      const el=$(color==="w"?"white-clock":"black-clock");const seconds=Math.max(0,Math.ceil(remaining[color]/1000));
      el.querySelector("strong").textContent=clockMinutes?Math.floor(seconds/60)+":"+String(seconds%60).padStart(2,"0"):text("untimed");
      el.classList.toggle("active",!gameResult.over&&chess.turn()===color);
    }
  }
  function updateResult(){gameResult=resultState(chess,clockResult,claimedDrawReason);if(gameResult.over){botThinking=false;clearTimeout(botTimer);botTimer=null;lastClockAt=null;}}
  function settleClock(){
    if(!clockMinutes||lastClockAt===null||gameResult.over)return false;
    const now=performance.now(),color=chess.turn();remaining[color]=Math.max(0,remaining[color]-(now-lastClockAt));lastClockAt=now;
    if(remaining[color]>0)return false;
    const winner=OTHER(color);
    clockResult=canPossiblyMate(chess,winner)?{over:true,reason:"timeout",winner,loser:color}:{over:true,reason:"timeout_insufficient_mating_material",winner:null,loser:null};
    updateResult();render();return true;
  }
  function render(){
    const board=$("board"),active=document.activeElement,previous=board.contains(active)?active.dataset.square:null;
    if(previous)focusSquare=previous;
    const moves=selected?chess.moves({square:selected,verbose:true}):[];
    board.replaceChildren();const names=squareNames();
    for(let row=0;row<8;row++){
      const rowEl=node("div","chess-row");rowEl.setAttribute("role","row");rowEl.setAttribute("aria-rowindex",String(row+1));
      for(let col=0;col<8;col++){
        const sq=names[row*8+col],piece=chess.get(sq),target=moves.find(m=>m.to===sq);
        const button=node("button","square "+((FILES.indexOf(sq[0])+Number(sq[1]))%2===0?"dark":"light"));
        button.type="button";button.dataset.square=sq;button.setAttribute("role","gridcell");button.setAttribute("aria-colindex",String(col+1));
        button.tabIndex=sq===focusSquare?0:-1;button.setAttribute("aria-selected",String(selected===sq));
        if(selected===sq)button.classList.add("selected");if(target)button.classList.add(target.captured?"capture":"legal");if(hintSquares.includes(sq))button.classList.add("hinted");
        button.setAttribute("aria-disabled",String(gameResult.over||botThinking||dialogOpen||!isHumanTurn()));
        const label=[sq,piece?colorName(piece.color)+" "+text("piece_"+piece.type):text("empty"),selected===sq?text("selected"):"",target?text(target.captured?"capture":"legal"):""].filter(Boolean).join(", ");
        button.setAttribute("aria-label",label);
        if(piece){const icon=node("span","piece "+(piece.color==="w"?"white":"black"),GLYPHS[piece.color+piece.type]);icon.setAttribute("aria-hidden","true");icon.draggable=true;button.append(icon);}
        const coordinate=node("span","square-coordinate",sq);coordinate.setAttribute("aria-hidden","true");button.append(coordinate);
        button.addEventListener("click",()=>{focusSquare=sq;void press(sq);});rowEl.append(button);
      }
      board.append(rowEl);
    }
    $("status").textContent=status();
    $("undo-move").disabled=!chess.history().length||botThinking||dialogOpen||(gameResult.over&&clockMinutes>0);
    $("claim-draw").disabled=gameResult.over||botThinking||dialogOpen||!isHumanTurn();
    $("chess-hint").disabled=gameResult.over||botThinking||dialogOpen||!isHumanTurn();
    const lesson=$("chess-piece-lesson");const piece=selected&&chess.get(selected);
    lesson.textContent=piece?text("pieceLesson",{piece:text("piece_"+piece.type),description:text("move_"+piece.type)}):"";
    $("chess-moves").replaceChildren();
    const history=chess.history({verbose:true});
    if(!history.length)$("chess-moves").append(node("li",null,text("noMoves")));
    history.forEach(move=>$("chess-moves").append(node("li",null,text("moved",{color:colorName(move.color),piece:text("piece_"+move.piece),from:move.from,to:move.to}))));
    renderClock();if(previous)board.querySelector(`[data-square="${focusSquare}"]`)?.focus({preventScroll:true});
  }
  function showDialog(titleKey,entries,bodyTexts=[]){
    if(dialogOpen)return Promise.resolve(null);
    dialogOpen=true;const layer=$("chess-dialog-layer"),previous=document.activeElement;
    $("chess-dialog-title").textContent=text(titleKey);$("chess-dialog-body").replaceChildren();
    for(const message of bodyTexts)$("chess-dialog-body").append(node("p",null,message));
    const actions=$("chess-dialog-actions");actions.replaceChildren();layer.hidden=false;
    return new Promise(resolve=>{
      function finish(value){layer.hidden=true;dialogOpen=false;layer.removeEventListener("keydown",keys);layer.removeEventListener("click",outside);for(const el of shell.children)if(el!==layer){el.inert=false;el.removeAttribute("aria-hidden");}if(previous?.isConnected)previous.focus();resolve(value);}
      function keys(e){if(e.key==="Escape"){e.preventDefault();finish(null);}if(e.key==="Tab"){const buttons=[...actions.querySelectorAll("button")];const index=buttons.indexOf(document.activeElement);if(e.shiftKey&&index<=0){e.preventDefault();buttons[buttons.length-1].focus();}else if(!e.shiftKey&&index===buttons.length-1){e.preventDefault();buttons[0].focus();}}}
      function outside(e){if(e.target===layer)finish(null);}
      for(const [value,label]of [...entries,[null,text(entries.length?"cancel":"close")]]){const button=node("button",null,label);button.type="button";button.addEventListener("click",()=>finish(value));actions.append(button);}
      for(const el of shell.children)if(el!==layer){el.inert=true;el.setAttribute("aria-hidden","true");}
      layer.addEventListener("keydown",keys);layer.addEventListener("click",outside);actions.querySelector("button").focus();
    });
  }
  async function press(square){
    if(gameResult.over||botThinking||dialogOpen||!isHumanTurn()||settleClock())return;
    hintSquares=[];const piece=chess.get(square);
    if(selected===square){selected=null;render();return;}
    if(piece?.color===chess.turn()){selected=square;render();return;}
    if(!selected)return;
    const legal=chess.moves({square:selected,verbose:true}).filter(m=>m.to===square);
    if(!legal.length){feedback("illegal");return;}
    let move=legal[0];const currentEpoch=epoch;
    if(legal.some(m=>m.promotion)){
      const promotion=await showDialog("promotion",["q","r","b","n"].map(type=>[type,text("piece_"+type)]));
      if(!promotion||epoch!==currentEpoch||gameResult.over)return;
      move=legal.find(m=>m.promotion===promotion);if(!move)return;
    }
    if(settleClock())return;
    playMove(move);scheduleBotMove();
  }
  function playMove(move){
    const before={remaining:{...remaining}};
    try{const played=chess.move(moveInput(move));if(!played)return false;clockHistory.push(before);selected=null;hintSquares=[];lastClockAt=clockMinutes?performance.now():null;updateResult();render();track("chess_move_played",{from:played.from,to:played.to,piece:played.piece});return true;}
    catch(error){console.error("TRA chess rejected move",error);feedback("illegal");return false;}
  }
  function reset(){
    epoch++;clearTimeout(botTimer);botTimer=null;botThinking=false;chess=new Chess();selected=null;hintSquares=[];focusSquare="e2";
    clockResult=null;claimedDrawReason=null;clockHistory.length=0;remaining={w:clockMinutes*60000,b:clockMinutes*60000};lastClockAt=clockMinutes?performance.now():null;
    updateResult();$("chess-feedback").textContent="";$("chess-copy-text").hidden=true;translateUI();render();
  }
  async function resetWithConfirm(action=()=>{}){if(dialogOpen)return false;if(chess.history().length&&!await showDialog("resetQuestion",[[true,text("confirm")]]))return false;action();reset();return true;}
  function orderedMoves(game){return game.moves({verbose:true}).sort((a,b)=>(VALUE[b.captured]||0)-(VALUE[a.captured]||0));}
  function search(game,depth,alpha,beta,budget){
    budget.nodes++;if(depth===0||game.isCheckmate()||game.isStalemate()||game.isInsufficientMaterial()||budget.nodes>=budget.max||performance.now()>=budget.deadline)return materialEvaluation(game);
    const black=game.turn()==="b";let best=black?-Infinity:Infinity;
    for(const move of orderedMoves(game)){
      game.move(moveInput(move));let score;try{score=search(game,depth-1,alpha,beta,budget);}finally{game.undo();}
      best=black?Math.max(best,score):Math.min(best,score);if(black)alpha=Math.max(alpha,best);else beta=Math.min(beta,best);
      if(beta<=alpha||budget.nodes>=budget.max||performance.now()>=budget.deadline)break;
    }
    return Number.isFinite(best)?best:materialEvaluation(game);
  }
  function chooseMove(profile){
    const moves=orderedMoves(chess);if(!moves.length)return null;
    const black=chess.turn()==="b",budget={nodes:0,max:1200+profile.level*600,deadline:performance.now()+120};let best=null;
    for(const move of moves){
      chess.move(moveInput(move));let score;try{score=search(chess,profile.depth,-Infinity,Infinity,budget);}finally{chess.undo();}
      score+=(Math.random()*2-1)*profile.noise;
      if(!best||(black?score>best.score:score<best.score))best={move,score};
    }
    return best?.move||moves[0];
  }
  function suggestHumanMove(){if(!isHumanTurn()||gameResult.over||botThinking||dialogOpen)return null;return chooseMove({level:1,depth:1,noise:0});}
  function scheduleBotMove(){
    if(opponentId==="local"||chess.turn()!=="b"||gameResult.over)return;
    const reason=claimableDraw(chess);if(reason){claimedDrawReason=reason;updateResult();render();return;}
    const intended=intendedClaimableDraws(chess);if(intended.length){claimedDrawReason=intended[0].reason;updateResult();render();return;}
    botThinking=true;render();const generation=epoch;
    botTimer=setTimeout(()=>{botTimer=null;if(generation!==epoch||settleClock()||gameResult.over)return;const move=chooseMove(BOT_PROFILES[opponentId]);botThinking=false;if(generation!==epoch||settleClock()||gameResult.over)return;if(move)playMove(move);else render();},350);
  }
  async function claimDraw(){
    if(gameResult.over||!isHumanTurn()||botThinking||dialogOpen)return;
    let reason=claimableDraw(chess),intended_move=null;
    if(!reason){
      const claims=intendedClaimableDraws(chess);if(!claims.length){feedback("noClaim");return;}
      const generation=epoch;
      const index=await showDialog("intended",claims.map((item,i)=>[i,item.move.from+" → "+item.move.to+(item.move.promotion?" · "+text("piece_"+item.move.promotion):"")]));
      if(index===null||epoch!==generation||gameResult.over)return;reason=claims[index].reason;intended_move=claims[index].uci;
    }
    if(settleClock())return;
    claimedDrawReason=reason;updateResult();render();track("chess_draw_claimed",{reason,intended_move});
  }
  async function copyGame(kind){const value=kind==="pgn"?chess.pgn():chess.fen();try{await navigator.clipboard.writeText(value);feedback("copied");}catch{const area=$("chess-copy-text");area.hidden=false;area.value=value;area.focus();area.select();feedback("copyFailed");}}
  $("chess-language").addEventListener("change",e=>{if(!COPY[e.target.value])return;language=e.target.value;savePrefs();translateUI();render();});
  $("chess-display").addEventListener("change",e=>{display=e.target.value;savePrefs();translateUI();render();});
  $("chess-contrast").addEventListener("change",e=>{highContrast=e.target.checked;savePrefs();translateUI();render();});
  $("bot-select").addEventListener("change",async e=>{const value=e.target.value;if(!BOT_PROFILES[value])return;const changed=await resetWithConfirm(()=>{opponentId=value;});if(!changed)e.target.value=opponentId;});
  $("chess-time").addEventListener("change",async e=>{const value=Number(e.target.value);const changed=await resetWithConfirm(()=>{clockMinutes=[0,5,10,15].includes(value)?value:0;});if(!changed)e.target.value=String(clockMinutes);});
  $("new-game").addEventListener("click",()=>void resetWithConfirm());
  $("flip-board").addEventListener("click",()=>{orientation=OTHER(orientation);render();});
  $("undo-move").addEventListener("click",()=>{
    if(botThinking||dialogOpen||!chess.history().length)return;
    epoch++;let snapshot;do{chess.undo();snapshot=clockHistory.pop();}while(opponentId!=="local"&&chess.history().length&&chess.turn()==="b");
    if(snapshot)remaining={...snapshot.remaining};clockResult=null;claimedDrawReason=null;selected=null;hintSquares=[];lastClockAt=clockMinutes?performance.now():null;updateResult();render();
  });
  $("claim-draw").addEventListener("click",()=>void claimDraw());
  $("chess-hint").addEventListener("click",()=>{const move=suggestHumanMove();if(!move){feedback("noHint");return;}hintSquares=[move.from,move.to];render();feedback("hintResult",move);});
  $("chess-help").addEventListener("click",()=>void showDialog("help",[],[1,2,3,4,5].map(n=>text("help"+n))));
  $("copy-pgn").addEventListener("click",()=>void copyGame("pgn"));$("copy-fen").addEventListener("click",()=>void copyGame("fen"));
  $("chess-fullscreen").addEventListener("click",async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(shell.requestFullscreen)await shell.requestFullscreen();else throw new Error("Fullscreen unavailable");}catch{feedback("fullscreenFailed");}});
  document.addEventListener("fullscreenchange",()=>{$("chess-fullscreen").textContent=text(document.fullscreenElement?"exitFullscreen":"fullscreen");});
  $("board").addEventListener("focusin",e=>{const target=e.target.closest("[data-square]");if(!target)return;focusSquare=target.dataset.square;for(const b of $("board").querySelectorAll("[data-square]"))b.tabIndex=b===target?0:-1;});
  $("board").addEventListener("keydown",e=>{
    const target=e.target.closest("[data-square]");if(!target)return;
    if(e.key==="Escape"){e.preventDefault();selected=null;hintSquares=[];render();return;}
    const names=squareNames(),i=names.indexOf(target.dataset.square);let j=i;
    if(e.key==="ArrowRight")j=i%8<7?i+1:i;else if(e.key==="ArrowLeft")j=i%8>0?i-1:i;else if(e.key==="ArrowUp")j=i>=8?i-8:i;else if(e.key==="ArrowDown")j=i<56?i+8:i;else if(e.key==="Home")j=e.ctrlKey?0:Math.floor(i/8)*8;else if(e.key==="End")j=e.ctrlKey?63:Math.floor(i/8)*8+7;else return;
    if(display==="tv"&&j===i){e.preventDefault();$(["ArrowDown","ArrowRight"].includes(e.key)?"new-game":"chess-display").focus();return;}
    e.preventDefault();focusSquare=names[j];$("board").querySelector(`[data-square="${focusSquare}"]`).focus();
  });
  // Optional dragging supplements, never replaces, tap and keyboard controls.
  let dragFrom=null;
  $("board").addEventListener("dragstart",e=>{const square=e.target.closest("[data-square]");if(!square||!isHumanTurn()||gameResult.over||botThinking){e.preventDefault();return;}const piece=chess.get(square.dataset.square);if(piece?.color!==chess.turn()){e.preventDefault();return;}dragFrom=square.dataset.square;e.dataTransfer?.setData("text/plain",dragFrom);});
  $("board").addEventListener("dragover",e=>{if(dragFrom)e.preventDefault();});
  $("board").addEventListener("drop",e=>{const target=e.target.closest("[data-square]");if(!dragFrom||!target)return;e.preventDefault();selected=dragFrom;dragFrom=null;void press(target.dataset.square);});
  $("board").addEventListener("dragend",()=>{dragFrom=null;});
  // TV mode: directional navigation between controls, without intercepting native select menus.
  shell.addEventListener("keydown",e=>{
    if(display!=="tv"||dialogOpen||$("board").contains(e.target)||e.target.tagName==="SELECT"||!["ArrowDown","ArrowUp","ArrowLeft","ArrowRight"].includes(e.key))return;
    const controls=[...shell.querySelectorAll("button:not([disabled]),select,input,a,summary,[tabindex='0']")].filter(el=>el.offsetParent!==null&&(!$("board").contains(el)||el.tabIndex===0));
    const index=controls.indexOf(e.target);if(index<0)return;const next=index+(["ArrowDown","ArrowRight"].includes(e.key)?1:-1);if(next<0||next>=controls.length)return;e.preventDefault();controls[next].focus();
  });
  window.TRA_CHESS_API={
    fen:()=>chess.fen(),pgn:()=>chess.pgn(),history:()=>chess.history(),
    review:()=>({fen:chess.fen(),pgn:chess.pgn(),moves:chess.history().length,turn:chess.turn(),check:chess.isCheck(),gameOver:gameResult.over,evaluation:materialEvaluation(chess),language}),
    suggest:suggestHumanMove
  };
  translateUI();render();const heartbeat=setInterval(()=>{if(!settleClock())renderClock();},250);
  track("chess_accessible_opened",{language,display,rules:"standard_chess"});
  return {destroy(){clearInterval(heartbeat);clearTimeout(botTimer);epoch++;},review:window.TRA_CHESS_API.review};
}
async function boot(){
  const shell=document.querySelector("#chess");if(!shell)return;
  if(!document.querySelector('link[href*="chess-accessible.css"]')){const css=document.createElement("link");css.rel="stylesheet";css.href=new URL("./chess-accessible.css",import.meta.url).href;document.head.append(css);}
  let copy=null,language="he";
  try{
    const module=await withTimeout(import("./chess-languages.js"),10000);copy=module.COPY;
    const prefs=safePreferences(),query=new URLSearchParams(location.search).get("lang");language=copy[query]?query:copy[prefs.language]?prefs.language:"he";
    shell.lang=language;shell.dir=copy[language].dir;shell.classList.add("tra-chess-accessible");shell.replaceChildren(node("p","chess-status",copy[language].loading));
    const Chess=await loadChessEngine();startChess(Chess,copy,shell);
  }catch(error){
    console.error("TRA Chess startup failed",error);shell.replaceChildren();
    const msg=node("p","chess-status",copy?.[language]?.loadFailed||"לא ניתן לטעון את השחמט. בדקו את החיבור ונסו שוב. / Chess could not load. Please try again.");msg.setAttribute("role","alert");
    const retry=node("button","primary",copy?.[language]?.retry||"ניסיון נוסף / Retry");retry.type="button";retry.onclick=()=>location.reload();shell.append(msg,retry);
    track("chess_load_failed",{name:error.name,message:error.message});
  }
}
if(typeof document!=="undefined"&&document.querySelector("#chess"))void boot();
