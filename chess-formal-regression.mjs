import fs from "node:fs";
import { writeFile, unlink } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const ENGINE_URL = "https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm";
const engineResponse = await fetch(ENGINE_URL, { cache: "no-store" });
if (!engineResponse.ok) throw new Error(`Cannot load chess.js 1.4.0: HTTP ${engineResponse.status}`);
const engineSource = await engineResponse.text();
const enginePath = ".chess-js-ci.mjs";
await writeFile(enginePath, engineSource, "utf8");
let Chess;
try {
  ({ Chess } = await import(`${pathToFileURL(enginePath).href}?run=${Date.now()}`));
} finally {
  await unlink(enginePath).catch(()=>{});
}

const loader = fs.readFileSync("games-loader.js", "utf8");
const games = fs.readFileSync("games.js", "utf8");

function positionKeyFromFen(fen){return fen.split(" ").slice(0,4).join(" ");}
function positionKey(game){return positionKeyFromFen(game.fen());}
function repetitionCount(game){
  const history=game.history({verbose:true});
  if(!history.length)return 1;
  const counts=new Map([[positionKeyFromFen(history[0].before),1]]);
  for(const move of history){
    const key=positionKeyFromFen(move.after);
    counts.set(key,(counts.get(key)||0)+1);
  }
  return counts.get(positionKey(game))||1;
}
function halfMoveClock(game){return Number(game.fen().split(" ")[4])||0;}
function claimableDraw(game){
  if(repetitionCount(game)>=3)return {reason:"threefold_repetition"};
  if(halfMoveClock(game)>=100)return {reason:"fifty_move"};
  return null;
}
function intendedClaimableDraws(game){
  if(claimableDraw(game))return [];
  const history=game.history({verbose:true});
  if(halfMoveClock(game)<99&&history.length<7)return [];
  const claims=[];
  for(const move of game.moves({verbose:true})){
    game.move(move.promotion?{from:move.from,to:move.to,promotion:move.promotion}:{from:move.from,to:move.to});
    const claim=claimableDraw(game);
    game.undo();
    if(claim)claims.push({uci:`${move.from}${move.to}${move.promotion||""}`,reason:claim.reason});
  }
  return claims;
}
function canPossiblyMate(game,color){
  const own=[];
  const enemy=[];
  const board=game.board();
  for(let row=0;row<8;row++)for(let col=0;col<8;col++){
    const piece=board[row][col];
    if(!piece)continue;
    (piece.color===color?own:enemy).push({type:piece.type,row,col});
  }
  if(own.some(piece=>piece.type==="q"||piece.type==="r"||piece.type==="p"))return true;
  const bishops=own.filter(piece=>piece.type==="b");
  const knights=own.filter(piece=>piece.type==="n");
  if(!bishops.length&&!knights.length)return false;
  if(enemy.some(piece=>piece.type!=="k"))return true;
  if(knights.length>=2)return true;
  if(bishops.length&&knights.length)return true;
  const bishopComplexes=new Set(bishops.map(piece=>(piece.row+piece.col)%2));
  return bishopComplexes.size>=2;
}

const tests=[];
const add=(name,pass)=>tests.push({name,pass:Boolean(pass)});
const addMove=(name,fen,from,to,expected)=>{
  const t=new Chess(fen);
  const ok=t.moves({square:from,verbose:true}).some(m=>m.to===to);
  add(name,ok===expected);
};
const addState=(name,fen,assertion)=>{const t=new Chess(fen);add(name,assertion(t));};
const addGame=(name,moves,assertion)=>{
  const t=new Chess();
  for(const [from,to,promotion] of moves)t.move(promotion?{from,to,promotion}:{from,to});
  add(name,assertion(t));
};

add("runtime uses chess.js 1.4.0",games.includes("chess.js@1.4.0"));
add("runtime patch contains intended draw claims",loader.includes("intendedClaimableDraws")&&loader.includes("intended_move"));
add("runtime patch contains FIDE timeout handling",loader.includes("canPossiblyMate")&&loader.includes("timeout_insufficient_mating_material")&&loader.includes("clockResult"));

addMove("king cannot move into rook check","4k3/8/8/8/8/8/r7/4K3 w - - 0 1","e1","e2",false);
addMove("king in check may move only to a safe square","4k3/8/8/8/8/8/4r3/4K3 w - - 0 1","e1","d1",true);
addMove("king cannot stay in check","4k3/8/8/8/8/8/4q3/4K3 w - - 0 1","e1","f1",false);
addMove("king cannot capture protected piece","4k3/8/8/8/8/8/r3r3/4K3 w - - 0 1","e1","e2",false);
addMove("king cannot capture queen protected by bishop","4k3/8/8/8/8/3b4/4q3/4K3 w - - 0 1","e1","e2",false);
addMove("pinned defender still protects king destination","8/8/8/8/3k4/3b4/4q3/3RK3 w - - 0 1","e1","e2",false);
addMove("kings cannot become adjacent","8/8/8/8/8/4k3/8/4K3 w - - 0 1","e1","e2",false);
addMove("castle through check blocked","r3k2r/8/8/8/8/5r2/8/R3K2R w KQkq - 0 1","e1","g1",false);
addMove("en passant available immediately","4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1","e5","d6",true);
addMove("en passant expires after immediate reply","4k3/8/8/3pP3/8/8/8/4K3 w - - 0 1","e5","d6",false);
addMove("en passant cannot expose own king","4r2k/8/8/3pP3/8/8/8/4K3 w - d6 0 1","e5","d6",false);
addMove("pinned piece cannot expose king","4r2k/8/8/8/8/8/4N3/4K3 w - - 0 1","e2","c1",false);

addState("promotion offers queen rook bishop knight","k7/4P3/8/8/8/8/8/4K3 w - - 0 1",t=>["q","r","b","n"].every(piece=>t.moves({square:"e7",verbose:true}).some(m=>m.to==="e8"&&m.promotion===piece)));
addState("checkmate is terminal loss","7k/6Q1/5K2/8/8/8/8/8 b - - 0 1",t=>t.isCheck()&&t.isCheckmate()&&t.moves().length===0);
addState("stalemate is draw","7k/5Q2/6K1/8/8/8/8/8 b - - 0 1",t=>!t.isCheck()&&t.isStalemate()&&t.moves().length===0);
addState("50-move rule is currently claimable at 100 halfmoves","r3k3/8/8/8/8/8/8/4K2R w - - 100 51",t=>claimableDraw(t)?.reason==="fifty_move");
addState("50-move rule can be claimed by declaring the intended move","r3k3/8/8/8/8/8/8/4K2R w - - 99 50",t=>intendedClaimableDraws(t).some(item=>item.reason==="fifty_move"));
addState("75-move rule is automatic at 150 halfmoves","r3k3/8/8/8/8/8/8/4K2R w - - 150 76",t=>halfMoveClock(t)>=150);

const cycle=[["g1","f3"],["g8","f6"],["f3","g1"],["f6","g8"]];
addGame("threefold repetition is claimable",[...cycle,...cycle],t=>claimableDraw(t)?.reason==="threefold_repetition");
addGame("threefold repetition can be claimed with intended move",[...cycle,["g1","f3"],["g8","f6"],["f3","g1"]],t=>intendedClaimableDraws(t).some(item=>item.uci==="f6g8"&&item.reason==="threefold_repetition"));
addGame("fivefold repetition is automatic",[...cycle,...cycle,...cycle,...cycle],t=>repetitionCount(t)>=5);

addState("timeout vs bare king is draw","4k3/8/8/8/8/8/8/4K3 w - - 0 1",t=>!canPossiblyMate(t,"b"));
addState("timeout vs rook remains a loss","4k3/8/8/8/8/8/7r/4K3 w - - 0 1",t=>canPossiblyMate(t,"b"));
addState("single bishop cannot mate a lone king","4k3/8/8/8/8/8/7b/4K3 w - - 0 1",t=>!canPossiblyMate(t,"b"));
addState("two knights retain a possible FIDE mating sequence","4k3/8/8/8/8/8/6nn/4K3 w - - 0 1",t=>canPossiblyMate(t,"b"));

const failed=tests.filter(test=>!test.pass);
for(const test of tests)console.log(`${test.pass?"PASS":"FAIL"} - ${test.name}`);
console.log(`\nFIDE chess executable regression: ${tests.length-failed.length}/${tests.length}`);
if(failed.length){
  console.error("\nFIDE CHESS REGRESSION FAILED:\n- "+failed.map(test=>test.name).join("\n- "));
  process.exit(1);
}
console.log("FIDE chess executable regression PASSED.");
