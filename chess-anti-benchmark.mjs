// © 2026 Tomer Rafael Angel. All rights reserved.
// Reproducible comparison against the exact PR60 parent. No network or writes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync,spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {pathToFileURL} from 'node:url';
const baseRef='ad5c61d13b556f426144f746e3a5a5a27c15774b';
const {Chess}=await import(pathToFileURL(process.env.TRA_CHESS_ENGINE_PATH).href);
const load=s=>import('data:text/javascript;base64,'+Buffer.from(s).toString('base64'));
const runtime=await load(fs.readFileSync(new URL('./games-loader.js',import.meta.url),'utf8'));
const old=execFileSync('git',['show',baseRef+':games-loader.js'],{encoding:'utf8'});
const functions=old.slice(old.indexOf('  function orderedMoves(game)'),old.indexOf('  function suggestHumanMove()'));
const base=await load(old+'\nexport function baseline(chess,now){const performance={now};'+functions+';return chooseMove(BOT_PROFILES.anti);}');
const positions=[
 ['poisoned-pawn-white','3r2k1/8/8/3p4/8/8/8/3Q2K1 w - - 0 1'],
 ['poisoned-pawn-black','3q2k1/8/8/8/3P4/8/8/3R2K1 b - - 0 1'],
 ['hanging-queen','6k1/8/8/3q4/8/8/8/3R2K1 w - - 0 1'],
 ['mate-one','7k/5Q2/6K1/8/8/8/8/8 w - - 0 1'],
 ['rook-check','6k1/5ppp/8/8/8/8/5PPP/4R1K1 b - - 0 1'],
 ['promotion','k7/4P3/8/8/8/8/8/4K3 w - - 0 1'],
 ['opening',new Chess().fen()],
 ['italian','r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4'],
 ['kiwipete','r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1'],
 // Added after freezing the implementation; not used to tune the search.
 ['holdout-fools-mate','rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2'],
 ['holdout-black-opening',(()=>{const g=new Chess();g.move('e4');return g.fen();})()],
 ['holdout-ruy-lopez',(()=>{const g=new Chess();for(const m of ['e4','e5','Nf3','Nc6','Bb5','a6','Ba4','Nf6','O-O','Be7'])g.move(m);return g.fen();})()],
 ['holdout-rook-ending','6k1/5p2/8/8/8/8/5P2/R5K1 b - - 0 1']
];
const uci=m=>m.from+m.to+(m.promotion||'');
const rows=[];
for(let repetition=0;repetition<3;repetition++)for(const [name,fen]of positions){
 const game=new Chess(fen);let previous,next,oldMs;
 const runOld=()=>{const started=performance.now();previous=base.baseline(game,()=>performance.now());oldMs=performance.now()-started;};
 const runNew=()=>{next=runtime.chooseAntMove(game);};
 // Alternate order to reduce warmup/order bias.
 if(repetition%2){runNew();runOld();}else{runOld();runNew();}
 assert.equal(game.fen(),fen);assert.ok(game.moves().includes(previous.san));assert.ok(game.moves().includes(next.move.san));assert.ok(next.nodes<=4200);
 rows.push({repetition,name,fen,old:uci(previous),new:uci(next.move),oldMs,newMs:next.elapsedMs,nodes:next.nodes,completedDepth:next.completedDepth});
}
let oracle=null;
if(process.env.TRA_STOCKFISH_PATH){
 const engine=spawn(process.execPath,[process.env.TRA_STOCKFISH_PATH]);let listener,log=[];
 createInterface({input:engine.stdout}).on('line',line=>{log.push(line);listener?.(line);});
 const command=(text,until)=>new Promise((resolve,reject)=>{log=[];const timer=setTimeout(()=>{engine.kill();reject(new Error('Stockfish timeout'));},30000);listener=line=>{if(line.startsWith(until)){clearTimeout(timer);listener=null;resolve(log);}};engine.stdin.write(text+'\n');});
 try{
  await command('uci','uciok');await command('isready','readyok');const cache=new Map();
  async function evaluate(fen,move){
   const key=fen+' '+move;if(cache.has(key))return cache.get(key);
   await command('ucinewgame\nisready','readyok');
   const lines=await command('position fen '+fen+'\ngo depth 12 searchmoves '+move,'bestmove');
   const line=lines.filter(l=>l.startsWith('info depth')).at(-1),match=line.match(/score (cp|mate) (-?\d+)/);
   const value={type:match[1],value:Number(match[2]),bound:line.includes('lowerbound')?'lower':line.includes('upperbound')?'upper':null};cache.set(key,value);return value;
  }
  for(const row of rows){row.oldEvaluation=await evaluate(row.fen,row.old);row.newEvaluation=await evaluate(row.fen,row.new);}
  oracle={name:'Stockfish.js 17.1 lite single',depth:12,perspective:'side to move',purpose:'Independent small-sample move check, not an Elo estimate'};
 }finally{engine.stdin.write('quit\n');}
}
const summary={positions:positions.length,repetitions:3,legalChoices:rows.length*2,oldMaxMs:Math.max(...rows.map(r=>r.oldMs)),newMaxMs:Math.max(...rows.map(r=>r.newMs)),oldMeanMs:rows.reduce((s,r)=>s+r.oldMs,0)/rows.length,newMeanMs:rows.reduce((s,r)=>s+r.newMs,0)/rows.length};
console.log(JSON.stringify({baseRef,normalPlies:3,quiescencePlies:2,maxNodes:4200,targetMs:120,summary,oracle,rows},null,2));
