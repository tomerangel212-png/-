import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const {Chess}=await import(pathToFileURL(process.env.TRA_CHESS_ENGINE_PATH).href);
const load=s=>import('data:text/javascript;base64,'+Buffer.from(s).toString('base64'));
const base='38b99483ea28029349c62a1696c9523359685dd2';
const before=await load(execFileSync('git',['show',base+':games-loader.js'],{encoding:'utf8'}));
const after=await load(fs.readFileSync('games-loader.js','utf8'));
const positions=JSON.parse(fs.readFileSync('chess-anti-benchmark.json','utf8')).rows.filter(r=>r.repetition===0);
const rows=[];
for(let repetition=0;repetition<3;repetition++)for(const p of positions){
 const row={name:p.name,fen:p.fen,repetition};
 for(const [name,engine] of repetition%2?[['after',after],['before',before]]:[['before',before],['after',after]]){
  const game=new Chess(p.fen),r=engine.chooseAntMove(game);
  assert.equal(game.fen(),p.fen);assert.deepEqual(game.history(),[]);assert.ok(game.moves().includes(r.move.san));assert.ok(r.nodes<=4200);
  row[name]={move:r.move.san,nodes:r.nodes,completedDepth:r.completedDepth,elapsedMs:r.elapsedMs};
 }rows.push(row);
}
console.log(JSON.stringify({base,positions:positions.length,repetitions:3,legalChoices:rows.length*2,maxMs:120,maxNodes:4200,quality:'Not independently evaluated; timing and legality only',rows},null,2));
