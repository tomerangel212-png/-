import { Chess } from "https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm";

const boardEl = document.querySelector("#board");
const statusEl = document.querySelector("#status");
const whiteClock = document.querySelector("#white-clock");
const blackClock = document.querySelector("#black-clock");
const undoButton = document.querySelector("#undo-move");
const glyphs = {wk:"♔",wq:"♕",wr:"♖",wb:"♗",wn:"♘",wp:"♙",bk:"♚",bq:"♛",br:"♜",bb:"♝",bn:"♞",bp:"♟"};
const files = ["a","b","c","d","e","f","g","h"];
let chess = new Chess();
let selected = null;
let orientation = "w";
let seconds = {w:300,b:300};
let started = false;
let interval = null;

function track(name, properties={}) { if (window.posthog?.capture) window.posthog.capture(name, properties); }
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
  if(game.isDraw()) return {over:true,reason:"draw",winner:null,loser:null,text:"תיקו."};
  return {over:false,reason:null,winner:null,loser:null,text:null};
}
function status(){const result=resultState();if(result.over)return result.text;const turn=colorName(chess.turn());return chess.isCheck()?`שח על ${turn}! מותר לבצע רק מהלך חוקי שמוציא את המלך משח.`:`תור ${turn}.`;}
function legalMoves(square=selected){return square?chess.moves({square,verbose:true}):[];}
function strictLegalMove(from,to){return legalMoves(from).find(m=>m.to===to)||null;}
function render(){const moves=legalMoves();boardEl.replaceChildren();for(const sq of squareNames()){const piece=chess.get(sq);const button=document.createElement("button");button.type="button";button.className=`square ${((files.indexOf(sq[0])+Number(sq[1]))%2===0)?"dark":"light"}`;if(sq===selected)button.classList.add("selected");const target=moves.find(m=>m.to===sq);if(target)button.classList.add(target.captured?"capture":"legal");button.disabled=chess.isGameOver();button.setAttribute("aria-label",piece?`${piece.color==="w"?"לבן":"שחור"} ${piece.type}, ${sq}`:`משבצת ${sq}`);if(piece){const icon=document.createElement("span");icon.className=`piece ${piece.color==="w"?"white":"black"}`;icon.textContent=glyphs[`${piece.color}${piece.type}`];button.append(icon);}button.addEventListener("click",()=>press(sq));boardEl.append(button);}statusEl.textContent=status();undoButton.disabled=chess.history().length===0;renderClock();}
function promote(move){if(move.promotion)return move;const wants=window.confirm("הרגלי הגיע לסוף. לחצו אישור למלכה; ביטול לפרש.");return {...move,promotion:wants?"q":"n"};}
function finishGameIfNeeded(){const result=resultState();if(!result.over)return false;started=false;if(interval){clearInterval(interval);interval=null;}track("chess_game_finished",{reason:result.reason,winner:result.winner?colorName(result.winner):"draw",loser:result.loser?colorName(result.loser):null});return true;}
function press(square){
  if(chess.isGameOver()){selected=null;render();return;}
  const piece=chess.get(square);
  if(selected){
    const move=strictLegalMove(selected,square);
    if(move){
      try{
        const done=chess.move(promote({from:selected,to:square,promotion:move.promotion}));
        selected=null;
        if(done){
          started=true;
          track("chess_move_played",{color:done.color,piece:done.piece,from:done.from,to:done.to,notation:done.san});
          finishGameIfNeeded();
          render();
          return;
        }
      }catch(err){
        track("chess_illegal_move_blocked",{from:selected,to:square,error:String(err)});
        statusEl.textContent="מהלך לא חוקי נחסם — המלך אינו יכול להיכנס לשח או להישאר בשח.";
        selected=null;
        render();
        return;
      }
    }else{
      track("chess_illegal_move_blocked",{from:selected,to:square});
      statusEl.textContent="מהלך לא חוקי נחסם — המלך אינו יכול להיכנס לשח או להישאר בשח.";
      selected=null;
      render();
      return;
    }
  }
  if(piece?.color===chess.turn())selected=square;
  render();
}
function reset(){chess=new Chess();selected=null;seconds={w:300,b:300};started=false;clearInterval(interval);interval=setInterval(tick,1000);track("chess_game_started",{mode:"local_5_min"});render();}
function tick(){if(!started||chess.isGameOver())return;const turn=chess.turn();seconds[turn]-=1;if(seconds[turn]<=0){seconds[turn]=0;started=false;clearInterval(interval);interval=null;statusEl.textContent=`הזמן של ${colorName(turn)} נגמר. ${colorName(opponent(turn))} ניצח.`;track("chess_game_finished",{reason:"timeout",winner:colorName(opponent(turn)),loser:colorName(turn)});}renderClock();}
function regressionCheck(){
  const tests=[];
  const addMove=(name,fen,from,to,expected)=>{const t=new Chess(fen);const ok=t.moves({square:from,verbose:true}).some(m=>m.to===to);tests.push({name,pass:ok===expected});};
  const addState=(name,fen,assertion)=>{const t=new Chess(fen);tests.push({name,pass:Boolean(assertion(t))});};
  addMove("king cannot move into rook check","4k3/8/8/8/8/8/r7/4K3 w - - 0 1","e1","e2",false);
  addMove("king in check may move only to a safe square","4k3/8/8/8/8/8/4r3/4K3 w - - 0 1","e1","d1",true);
  addMove("king cannot stay in check","4k3/8/8/8/8/8/4r3/4K3 w - - 0 1","e1","e2",false);
  addMove("kings cannot become adjacent","8/8/8/8/8/4k3/8/4K3 w - - 0 1","e1","e2",false);
  addMove("castle through check blocked","r3k2r/8/8/8/8/5r2/8/R3K2R w KQkq - 0 1","e1","g1",false);
  addState("checkmate means loss","7k/6Q1/5K2/8/8/8/8/8 b - - 0 1",t=>t.isCheck()&&t.isCheckmate()&&t.moves().length===0);
  addState("stalemate remains a draw","7k/5Q2/6K1/8/8/8/8/8 b - - 0 1",t=>!t.isCheck()&&t.isStalemate()&&t.moves().length===0);
  track("chess_rules_regression",{passed:tests.filter(t=>t.pass).length,total:tests.length,failed:tests.filter(t=>!t.pass).map(t=>t.name)});
  return tests.every(t=>t.pass);
}

document.querySelector("#new-game").addEventListener("click",reset);
document.querySelector("#flip-board").addEventListener("click",()=>{orientation=orientation==="w"?"b":"w";render();});
undoButton.addEventListener("click",()=>{if(chess.undo()){selected=null;started=chess.history().length>0;if(!interval)interval=setInterval(tick,1000);track("chess_move_undone");render();}});
interval=setInterval(tick,1000);
regressionCheck();
track("chess_arcade_opened",{mode:"local",rules:"strict_legal_moves_checkmate_enforced"});
render();
