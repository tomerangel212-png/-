import { Chess } from "https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm";

const boardEl = document.querySelector("#board");
const statusEl = document.querySelector("#status");
const whiteClock = document.querySelector("#white-clock");
const blackClock = document.querySelector("#black-clock");
const undoButton = document.querySelector("#undo-move");
const botSelect = document.querySelector("#bot-select");
const botProfileEl = document.querySelector("#bot-profile");
const glyphs = {wk:"♔",wq:"♕",wr:"♖",wb:"♗",wn:"♘",wp:"♙",bk:"♚",bq:"♛",br:"♜",bb:"♝",bn:"♞",bp:"♟"};
const files = ["a","b","c","d","e","f","g","h"];
const pieceValue = {p:100,n:320,b:330,r:500,q:900,k:0};

const botProfiles = {
  local: {
    name:"שני שחקנים", strength:0, delay:0, depth:0, noise:0, blunderRate:0,
    description:"משחק מקומי ללא בוט — לבן ושחור על אותו מכשיר."
  },
  shaked: {
    name:"שקד", strength:20, delay:850, depth:0, noise:190, blunderRate:0.42,
    description:"צעיר ושאפתן בן 10, שלוש שנים בחוג. פתיחה מודרנית, מלכה פעילה מוקדם, משחק נועז ולעיתים מסתכן יותר מדי.",
    style:"modern-queen"
  },
  tomer: {
    name:"תומר", strength:40, delay:1050, depth:1, noise:80, blunderRate:0.20,
    description:"מוזיקאי שחושב על התמונה הרחבה. פתיחה מסורתית, פיתוח מסודר וחיבור בין סוסים לרצים.",
    style:"classical-minors"
  },
  shiki: {
    name:"שיקי", strength:60, delay:520, depth:1, noise:30, blunderRate:0.07,
    description:"רופא ומנהל מחלקה מנוסה, מהיר, היפראקטיבי וחד. מחפש יוזמה, קצב ולחץ על טעויות.",
    style:"initiative"
  },
  matan: {
    name:"מתן", strength:80, delay:900, depth:2, noise:7, blunderRate:0.015,
    description:"רופא, מנהל מחלקה ופותר חידות שחמט. שקול מאוד, משלב פתיחה מודרנית ומסורתית וחזק בטקטיקה, צריחים וסיומים.",
    style:"balanced-tactical"
  }
};

let chess = new Chess();
let selected = null;
let orientation = "w";
let seconds = {w:300,b:300};
let started = false;
let interval = null;
let botThinking = false;
let botTimer = null;

function track(name, properties={}) { if (window.posthog?.capture) window.posthog.capture(name, properties); }
function activeBot(){return botProfiles[botSelect?.value || "local"] || botProfiles.local;}
function isBotMode(){return activeBot().strength > 0;}
function isHumanTurn(){return !isBotMode() || chess.turn() === "w";}
function squareNames(){const ranks=orientation==="w"?[8,7,6,5,4,3,2,1]:[1,2,3,4,5,6,7,8];const orderedFiles=orientation==="w"?files:[...files].reverse();return ranks.flatMap(r=>orderedFiles.map(f=>`${f}${r}`));}
function format(sec){return `${String(Math.floor(sec/60)).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`;}
function colorName(color){return color==="w"?"לבן":"שחור";}
function opponent(color){return color==="w"?"b":"w";}
function renderClock(){["w","b"].forEach(color=>{const el=color==="w"?whiteClock:blackClock;el.querySelector("strong").textContent=format(seconds[color]);el.classList.toggle("active",!chess.isGameOver()&&chess.turn()===color);});}
function resultState(game=chess){
  const loser=game.turn();
  const winner=opponent(loser);
  if(game.isCheckmate()) return {over:true,reason:"checkmate",winner,loser,text:`מט! ${colorName(winner)} ניצח — ל${colorName(loser)} אין שום מהלך חוקי שמוציא את המלך משח.`};
  if(game.isStalemate()) return {over:true,reason:"stalemate",winner:null,loser:null,text:"פט — אין מהלך חוקי, אבל המלך אינו בשח. לפי חוקי השחמט זה תיקו."};
  if(game.isThreefoldRepetition()) return {over:true,reason:"threefold_repetition",winner:null,loser:null,text:"תיקו — חזרה משולשת על העמדה."};
  if(game.isInsufficientMaterial()) return {over:true,reason:"insufficient_material",winner:null,loser:null,text:"תיקו — אין מספיק חומר למט."};
  if(game.isDrawByFiftyMoves?.()) return {over:true,reason:"fifty_move",winner:null,loser:null,text:"תיקו — 50 מסעים לכל צד ללא מהלך רגלי או הכאה."};
  if(game.isDraw()) return {over:true,reason:"draw",winner:null,loser:null,text:"תיקו."};
  return {over:false,reason:null,winner:null,loser:null,text:null};
}
function status(){
  const result=resultState();
  if(result.over)return result.text;
  const turn=colorName(chess.turn());
  if(botThinking)return `${activeBot().name} חושב…`;
  if(isBotMode()&&chess.turn()==="b")return `תור ${activeBot().name} (שחור).`;
  return chess.isCheck()?`שח על ${turn}! מותר לבצע רק מהלך חוקי שמוציא את המלך משח.`:`תור ${turn}.`;
}
function legalMoves(square=selected){return square?chess.moves({square,verbose:true}):[];}
function strictLegalMove(from,to){return legalMoves(from).find(m=>m.to===to)||null;}
function render(){
  const moves=legalMoves();
  boardEl.replaceChildren();
  for(const sq of squareNames()){
    const piece=chess.get(sq);
    const button=document.createElement("button");
    button.type="button";
    button.className=`square ${((files.indexOf(sq[0])+Number(sq[1]))%2===0)?"dark":"light"}`;
    if(sq===selected)button.classList.add("selected");
    const target=moves.find(m=>m.to===sq);
    if(target)button.classList.add(target.captured?"capture":"legal");
    button.disabled=chess.isGameOver() || botThinking || !isHumanTurn();
    button.setAttribute("aria-label",piece?`${piece.color==="w"?"לבן":"שחור"} ${piece.type}, ${sq}`:`משבצת ${sq}`);
    if(piece){const icon=document.createElement("span");icon.className=`piece ${piece.color==="w"?"white":"black"}`;icon.textContent=glyphs[`${piece.color}${piece.type}`];button.append(icon);}
    button.addEventListener("click",()=>press(sq));
    boardEl.append(button);
  }
  statusEl.textContent=status();
  undoButton.disabled=chess.history().length===0 || botThinking;
  renderClock();
}
function promote(move){
  if(!move.promotion)return move;
  const raw=window.prompt("קידום רגלי: בחרו מלכה (Q), צריח (R), רץ (B) או סוס (N).", "Q");
  const value=String(raw||"q").trim().toLocaleLowerCase("he");
  const aliases={q:"q",מלכה:"q",r:"r",צריח:"r",b:"b",רץ:"b",n:"n",סוס:"n"};
  return {...move,promotion:aliases[value]||"q"};
}
function finishGameIfNeeded(){const result=resultState();if(!result.over)return false;started=false;if(interval){clearInterval(interval);interval=null;}if(botTimer){clearTimeout(botTimer);botTimer=null;}botThinking=false;track("chess_game_finished",{reason:result.reason,winner:result.winner?colorName(result.winner):"draw",loser:result.loser?colorName(result.loser):null,bot:isBotMode()?activeBot().name:"none"});return true;}

function press(square){
  if(chess.isGameOver()||botThinking||!isHumanTurn()){selected=null;render();return;}
  const piece=chess.get(square);
  if(selected){
    const move=strictLegalMove(selected,square);
    if(move){
      try{
        const done=chess.move(promote({from:selected,to:square,promotion:move.promotion}));
        selected=null;
        if(done){
          started=true;
          track("chess_move_played",{actor:"human",color:done.color,piece:done.piece,from:done.from,to:done.to,notation:done.san});
          finishGameIfNeeded();
          render();
          if(!chess.isGameOver())scheduleBotMove();
          return;
        }
      }catch(err){
        track("chess_illegal_move_blocked",{from:selected,to:square,error:String(err)});
        statusEl.textContent="מהלך לא חוקי נחסם — המלך אינו יכול להיכנס לשח, להישאר בשח או להכות כלי שמוגן בידי היריב.";
        selected=null;
        render();
        return;
      }
    }else{
      track("chess_illegal_move_blocked",{from:selected,to:square});
      statusEl.textContent="מהלך לא חוקי נחסם — המלך אינו יכול להיכנס לשח, להישאר בשח או להכות כלי שמוגן בידי היריב.";
      selected=null;
      render();
      return;
    }
  }
  if(piece?.color===chess.turn())selected=square;
  render();
}

function staticEval(game){
  if(game.isCheckmate()) return game.turn()==="b" ? -100000 : 100000;
  if(game.isDraw()) return 0;
  let score=0;
  const board=game.board();
  for(let row=0;row<8;row++){
    for(let col=0;col<8;col++){
      const p=board[row][col];
      if(!p)continue;
      const sign=p.color==="b"?1:-1;
      score += sign*pieceValue[p.type];
      const centerDistance=Math.abs(3.5-col)+Math.abs(3.5-row);
      if(p.type==="n"||p.type==="b") score += sign*Math.round((7-centerDistance)*3);
      if(p.type==="p") score += sign*Math.round((p.color==="b"?row:7-row)*2);
      if(p.type==="r"){
        let pawnsOnFile=0;
        for(let r=0;r<8;r++)if(board[r][col]?.type==="p")pawnsOnFile++;
        if(pawnsOnFile===0)score+=sign*18;
      }
    }
  }
  if(game.isCheck()) score += game.turn()==="w" ? 35 : -35;
  return score;
}

function openingStyleScore(game,move,profile){
  const ply=game.history().length;
  const early=ply<14;
  let s=0;
  const san=move.san||"";
  if(move.captured)s+=pieceValue[move.captured]*0.10;
  if(san.includes("+"))s+=20;
  if(san.includes("#"))s+=100000;
  if(san.includes("O-O"))s+=early?25:10;

  if(profile.style==="modern-queen"){
    if(early&&move.piece==="q")s+=65;
    if(move.piece==="p"&&["c","d","e","f"].includes(move.to[0]))s+=12;
    if(san.includes("+"))s+=18;
  }
  if(profile.style==="classical-minors"){
    if(early&&(move.piece==="n"||move.piece==="b"))s+=42;
    if(early&&move.piece==="q")s-=35;
    if(move.piece==="p"&&["d","e"].includes(move.to[0]))s+=20;
    if(san.includes("O-O"))s+=35;
  }
  if(profile.style==="initiative"){
    if(move.captured)s+=30;
    if(san.includes("+"))s+=45;
    if(move.to[1]&&Number(move.to[1])<=4)s+=8;
  }
  if(profile.style==="balanced-tactical"){
    if(move.captured)s+=pieceValue[move.captured]*0.08;
    if(san.includes("+"))s+=35;
    if(early&&move.piece==="q")s-=18;
    if(ply>20&&move.piece==="r")s+=28;
    if(san.includes("O-O"))s+=28;
  }
  return s;
}

function orderedMoves(game){
  return game.moves({verbose:true}).sort((a,b)=>{
    const av=(a.captured?pieceValue[a.captured]:0)+(a.san?.includes("+")?60:0)+(a.san?.includes("#")?100000:0);
    const bv=(b.captured?pieceValue[b.captured]:0)+(b.san?.includes("+")?60:0)+(b.san?.includes("#")?100000:0);
    return bv-av;
  });
}

function minimax(game,depth,alpha,beta,budget){
  budget.nodes++;
  if(depth<=0||game.isGameOver()||budget.nodes>=budget.max)return staticEval(game);
  const moves=orderedMoves(game);
  if(game.turn()==="b"){
    let best=-Infinity;
    for(const move of moves){
      game.move({from:move.from,to:move.to,promotion:move.promotion||"q"});
      best=Math.max(best,minimax(game,depth-1,alpha,beta,budget));
      game.undo();
      alpha=Math.max(alpha,best);
      if(beta<=alpha||budget.nodes>=budget.max)break;
    }
    return best;
  }
  let best=Infinity;
  for(const move of moves){
    game.move({from:move.from,to:move.to,promotion:move.promotion||"q"});
    best=Math.min(best,minimax(game,depth-1,alpha,beta,budget));
    game.undo();
    beta=Math.min(beta,best);
    if(beta<=alpha||budget.nodes>=budget.max)break;
  }
  return best;
}

function chooseBotMove(profile){
  const legal=orderedMoves(chess);
  if(!legal.length)return null;
  const budget={nodes:0,max:profile.strength>=80?9000:profile.strength>=60?3500:1200};
  const scored=[];
  for(const move of legal){
    const style=openingStyleScore(chess,move,profile);
    chess.move({from:move.from,to:move.to,promotion:move.promotion||"q"});
    let score=minimax(chess,profile.depth,-Infinity,Infinity,budget)+style;
    chess.undo();
    score += (Math.random()*2-1)*profile.noise;
    scored.push({move,score});
  }
  scored.sort((a,b)=>b.score-a.score);
  if(Math.random()<profile.blunderRate){
    const pool=Math.min(scored.length,profile.strength<=20?8:4);
    return scored[Math.floor(Math.random()*pool)].move;
  }
  return scored[0].move;
}

function scheduleBotMove(){
  if(!isBotMode()||chess.turn()!=="b"||chess.isGameOver())return;
  const profile=activeBot();
  botThinking=true;
  selected=null;
  render();
  if(botTimer)clearTimeout(botTimer);
  botTimer=setTimeout(()=>{
    const move=chooseBotMove(profile);
    if(!move){botThinking=false;finishGameIfNeeded();render();return;}
    const done=chess.move({from:move.from,to:move.to,promotion:move.promotion||"q"});
    botThinking=false;
    botTimer=null;
    if(done){
      started=true;
      track("chess_bot_move",{bot:profile.name,strength:profile.strength,piece:done.piece,from:done.from,to:done.to,notation:done.san});
    }
    finishGameIfNeeded();
    render();
  },profile.delay);
}

function updateBotProfile(){
  const profile=activeBot();
  if(!botProfileEl)return;
  botProfileEl.innerHTML=profile.strength
    ? `<strong>${profile.name} · ${profile.strength}/100</strong><span>${profile.description}</span>`
    : `<strong>${profile.name}</strong><span>${profile.description}</span>`;
}

function reset(){
  chess=new Chess();selected=null;seconds={w:300,b:300};started=false;botThinking=false;
  if(botTimer){clearTimeout(botTimer);botTimer=null;}
  clearInterval(interval);interval=setInterval(tick,1000);
  track("chess_game_started",{mode:isBotMode()?"vs_bot":"local_5_min",bot:isBotMode()?activeBot().name:"none",strength:activeBot().strength});
  updateBotProfile();
  render();
}
function tick(){if(!started||chess.isGameOver())return;const turn=chess.turn();seconds[turn]-=1;if(seconds[turn]<=0){seconds[turn]=0;started=false;clearInterval(interval);interval=null;statusEl.textContent=`הזמן של ${colorName(turn)} נגמר. ${colorName(opponent(turn))} ניצח.`;track("chess_game_finished",{reason:"timeout",winner:colorName(opponent(turn)),loser:colorName(turn),bot:isBotMode()?activeBot().name:"none"});}renderClock();}
function regressionCheck(){
  const tests=[];
  const addMove=(name,fen,from,to,expected)=>{const t=new Chess(fen);const ok=t.moves({square:from,verbose:true}).some(m=>m.to===to);tests.push({name,pass:ok===expected});};
  const addState=(name,fen,assertion)=>{const t=new Chess(fen);tests.push({name,pass:Boolean(assertion(t))});};
  addMove("king cannot move into rook check","4k3/8/8/8/8/8/r7/4K3 w - - 0 1","e1","e2",false);
  addMove("king in check may move only to a safe square","4k3/8/8/8/8/8/4r3/4K3 w - - 0 1","e1","d1",true);
  addMove("king cannot stay in check","4k3/8/8/8/8/8/4r3/4K3 w - - 0 1","e1","e2",false);
  addMove("king cannot capture protected piece","4k3/8/8/8/8/8/r3r3/4K3 w - - 0 1","e1","e2",false);
  addMove("kings cannot become adjacent","8/8/8/8/8/4k3/8/4K3 w - - 0 1","e1","e2",false);
  addMove("castle through check blocked","r3k2r/8/8/8/8/5r2/8/R3K2R w KQkq - 0 1","e1","g1",false);
  addMove("en passant available immediately","4k3/8/8/8/3pP3/8/8/4K3 w - d6 0 1","e5","d6",true);
  addMove("en passant expires after the immediate reply","4k3/8/8/8/3pP3/8/8/4K3 w - - 0 1","e5","d6",false);
  addState("promotion exposes queen rook bishop knight","k7/4P3/8/8/8/8/8/4K3 w - - 0 1",t=>["q","r","b","n"].every(piece=>t.moves({square:"e7",verbose:true}).some(m=>m.to==="e8"&&m.promotion===piece)));
  addState("checkmate means loss","7k/6Q1/5K2/8/8/8/8/8 b - - 0 1",t=>t.isCheck()&&t.isCheckmate()&&t.moves().length===0);
  addState("stalemate remains a draw","7k/5Q2/6K1/8/8/8/8/8 b - - 0 1",t=>!t.isCheck()&&t.isStalemate()&&t.moves().length===0);
  addState("fifty move rule remains a draw","4k3/8/8/8/8/8/8/4K3 w - - 100 51",t=>Boolean(t.isDrawByFiftyMoves?.()));
  track("chess_rules_regression",{passed:tests.filter(t=>t.pass).length,total:tests.length,failed:tests.filter(t=>!t.pass).map(t=>t.name)});
  return tests.every(t=>t.pass);
}

document.querySelector("#new-game").addEventListener("click",reset);
document.querySelector("#flip-board").addEventListener("click",()=>{orientation=orientation==="w"?"b":"w";render();});
undoButton.addEventListener("click",()=>{
  if(botThinking)return;
  let undone=false;
  if(isBotMode()&&chess.history().length){undone=Boolean(chess.undo());if(chess.history().length&&chess.turn()==="b")chess.undo();}
  else undone=Boolean(chess.undo());
  if(undone){selected=null;started=chess.history().length>0;if(!interval)interval=setInterval(tick,1000);track("chess_move_undone",{mode:isBotMode()?"vs_bot":"local"});render();}
});
botSelect?.addEventListener("change",()=>{track("chess_bot_selected",{bot:activeBot().name,strength:activeBot().strength});reset();});
interval=setInterval(tick,1000);
updateBotProfile();
regressionCheck();
track("chess_arcade_opened",{mode:isBotMode()?"vs_bot":"local",rules:"strict_legal_moves_checkmate_enforced",bot:activeBot().name});
render();