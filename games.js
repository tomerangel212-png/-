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
function renderClock(){["w","b"].forEach(color=>{const el=color==="w"?whiteClock:blackClock;el.querySelector("strong").textContent=format(seconds[color]);el.classList.toggle("active",!chess.isGameOver()&&chess.turn()===color);});}
function status(){if(chess.isCheckmate()) return `מט! ${chess.turn()==="w"?"השחור":"הלבן"} ניצח.`;if(chess.isStalemate()||chess.isThreefoldRepetition()||chess.isInsufficientMaterial()||chess.isDraw()) return "תיקו — תשבי יבוא ויתרץ קושיות.";const turn=chess.turn()==="w"?"לבן":"שחור";return chess.isCheck()?`שח על ${turn}! רק מהלך חוקי שמוציא משח מותר.`:`תור ${turn}.`;}
function legalMoves(square=selected){return square?chess.moves({square,verbose:true}):[];}
function strictLegalMove(from,to){return legalMoves(from).find(m=>m.to===to)||null;}
function render(){const moves=legalMoves();boardEl.replaceChildren();for(const sq of squareNames()){const piece=chess.get(sq);const button=document.createElement("button");button.type="button";button.className=`square ${((files.indexOf(sq[0])+Number(sq[1]))%2===0)?"dark":"light"}`;if(sq===selected)button.classList.add("selected");const target=moves.find(m=>m.to===sq);if(target)button.classList.add(target.captured?"capture":"legal");button.setAttribute("aria-label",piece?`${piece.color==="w"?"לבן":"שחור"} ${piece.type}, ${sq}`:`משבצת ${sq}`);if(piece){const icon=document.createElement("span");icon.className=`piece ${piece.color==="w"?"white":"black"}`;icon.textContent=glyphs[`${piece.color}${piece.type}`];button.append(icon);}button.addEventListener("click",()=>press(sq));boardEl.append(button);}statusEl.textContent=status();undoButton.disabled=chess.history().length===0;renderClock();}
function promote(move){if(move.promotion)return move;const wants=window.confirm("הרגלי הגיע לסוף. לחצו אישור למלכה; ביטול לפרש.");return {...move,promotion:wants?"q":"n"};}
function press(square){const piece=chess.get(square);if(selected){const move=strictLegalMove(selected,square);if(move){try{const done=chess.move(promote({from:selected,to:square,promotion:move.promotion}));selected=null;if(done){started=true;track("chess_move_played",{color:done.color,piece:done.piece,from:done.from,to:done.to,notation:done.san});render();return;}}catch(err){track("chess_illegal_move_blocked",{from:selected,to:square,error:String(err)});statusEl.textContent="מהלך לא חוקי נחסם — המלך אינו יכול להיכנס או להישאר בשח.";selected=null;render();return;}}else{track("chess_illegal_move_blocked",{from:selected,to:square});statusEl.textContent="מהלך לא חוקי נחסם — המלך אינו יכול להיכנס או להישאר בשח.";selected=null;render();return;}}if(piece?.color===chess.turn())selected=square;render();}
function reset(){chess=new Chess();selected=null;seconds={w:300,b:300};started=false;clearInterval(interval);interval=setInterval(tick,1000);track("chess_game_started",{mode:"local_5_min"});render();}
function tick(){if(!started||chess.isGameOver())return;const turn=chess.turn();seconds[turn]-=1;if(seconds[turn]<=0){seconds[turn]=0;started=false;clearInterval(interval);interval=null;statusEl.textContent=`הזמן של ${turn==="w"?"לבן":"שחור"} נגמר. היריב ניצח.`;track("chess_game_finished",{reason:"timeout",winner:turn==="w"?"black":"white"});}renderClock();}
function regressionCheck(){const tests=[];const add=(name,fen,from,to,expected)=>{const t=new Chess(fen);const ok=t.moves({square:from,verbose:true}).some(m=>m.to===to);tests.push({name,pass:ok===expected});};add("king cannot move into rook check","4k3/8/8/8/8/8/r7/4K3 w - - 0 1","e1","e2",false);add("kings cannot become adjacent","8/8/8/8/8/4k3/8/4K3 w - - 0 1","e1","e2",false);add("castle through check blocked","r3k2r/8/8/8/8/5r2/8/R3K2R w KQkq - 0 1","e1","g1",false);track("chess_rules_regression",{passed:tests.filter(t=>t.pass).length,total:tests.length});return tests.every(t=>t.pass);}

document.querySelector("#new-game").addEventListener("click",reset);document.querySelector("#flip-board").addEventListener("click",()=>{orientation=orientation==="w"?"b":"w";render();});undoButton.addEventListener("click",()=>{if(chess.undo()){selected=null;started=chess.history().length>0;track("chess_move_undone");render();}});interval=setInterval(tick,1000);regressionCheck();track("chess_arcade_opened",{mode:"local",rules:"strict_legal_moves"});render();
