// © 2026 Tomer Rafael Angel. All rights reserved.
// Real chess.js positions: isolate horizon evaluation at one normal ply, then
// exercise production-depth decisions, both colors, budgets, and state rollback.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const enginePath=process.env.TRA_CHESS_ENGINE_PATH;
if(!enginePath)throw new Error('Set TRA_CHESS_ENGINE_PATH to chess.js 1.4.0 dist/esm/chess.js');
const {Chess}=await import(pathToFileURL(enginePath).href);
const source=fs.readFileSync(new URL('./games-loader.js',import.meta.url),'utf8');
const {chooseAntMove}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
const traps=[
 ['White poisoned pawn','3r2k1/8/8/3p4/8/8/8/3Q2K1 w - - 0 1','Qxd5'],
 ['Black poisoned pawn','3q2k1/8/8/8/3P4/8/8/3R2K1 b - - 0 1','Qxd4'],
 ['White poisoned rook','3q2k1/8/8/3r4/8/8/8/3Q2K1 w - - 0 1','Qxd5'],
 ['Black poisoned rook','3q2k1/8/8/8/3R4/8/8/3Q2K1 b - - 0 1','Qxd4']
];
for(const [name,fen,bad]of traps)test(name+' sees the recapture at the horizon',()=>{
 const game=new Chess(fen),before=game.fen(),history=game.history();
 const options={now:()=>0,depth:1,maxNodes:4200};
 const plain=chooseAntMove(game,{...options,quiescence:false}),quiet=chooseAntMove(game,options);
 assert.equal(plain.move.san.replace(/[+#]/g,''),bad);assert.notEqual(quiet.move.san.replace(/[+#]/g,''),bad);
 assert.equal(quiet.completedDepth,1);assert.ok(quiet.nodes<=4200);
 assert.ok(game.moves().includes(quiet.move.san));assert.equal(game.fen(),before);assert.deepEqual(game.history(),history);
});
for(const [name,fen,check]of [
 ['Capture a hanging queen','6k1/8/8/3q4/8/8/8/3R2K1 w - - 0 1',m=>m.san==='Rxd5'],
 ['Mate in one','7k/5Q2/6K1/8/8/8/8/8 w - - 0 1',m=>m.san.endsWith('#')],
 ['Promote rather than wait','k7/4P3/8/8/8/8/8/4K3 w - - 0 1',m=>m.promotion==='q'],
 ['Answer rook check','6k1/5ppp/8/8/8/8/5PPP/4R1K1 b - - 0 1',m=>m.san==='Kf8']
])test(name+' at production depth',()=>{
 const game=new Chess(fen),before=game.fen();
 const result=chooseAntMove(game,{now:()=>0});assert.ok(check(result.move));assert.equal(game.fen(),before);
});
test('En passant remains legal and state is restored',()=>{
 const game=new Chess('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1'),before=game.fen();
 const result=chooseAntMove(game,{now:()=>0});assert.equal(result.move.san,'exd6');assert.equal(game.fen(),before);
});
test('Checkmate and stalemate have no move',()=>{
 for(const fen of ['7k/6Q1/5K2/8/8/8/8/8 b - - 0 1','7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'])assert.equal(chooseAntMove(new Chess(fen),{now:()=>0}).move,null);
});
test('Node exhaustion restores a game with history',()=>{
 const game=new Chess();game.move('e4');const fen=game.fen(),history=game.history();
 const result=chooseAntMove(game,{now:()=>0,maxNodes:1});assert.equal(result.nodes,1);assert.equal(result.aborted,true);
 assert.ok(game.moves().includes(result.move.san));assert.equal(game.fen(),fen);assert.deepEqual(game.history(),history);
});
test('Expired deadline returns a legal fallback without search',()=>{
 const game=new Chess(),result=chooseAntMove(game,{maxMs:0});assert.equal(result.nodes,0);assert.ok(game.moves().includes(result.move.san));
});
test('Unexpected failure restores the board before propagating',()=>{
 const game=new Chess(),fen=game.fen();let ticks=0;
 assert.throws(()=>chooseAntMove(game,{now:()=>{if(++ticks===5)throw new Error('clock failed');return 0;}}),/clock failed/);
 assert.equal(game.fen(),fen);assert.deepEqual(game.history(),[]);
});
test('Repeated searches are deterministic with fixed node budget',()=>{
 const fen=new Chess().fen(),a=chooseAntMove(new Chess(fen),{now:()=>0}),b=chooseAntMove(new Chess(fen),{now:()=>0});
 assert.equal(a.move.san,b.move.san);assert.equal(a.nodes,b.nodes);assert.equal(a.score,b.score);
});
console.log(`${passed} Ant checks passed. Four horizon cases are targeted regressions, not an Elo estimate.`);
