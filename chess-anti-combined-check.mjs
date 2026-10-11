// Combined Ant regressions; synthetic trees isolate search boundaries, real chess verifies integration.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const {Chess}=await import(pathToFileURL(process.env.TRA_CHESS_ENGINE_PATH).href);
const {chooseAntMove}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('games-loader.js')).toString('base64'));
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
// Each node uses black-positive material like the production evaluator.
function tree(nodes){let at='root';const stack=[],seen=[];return {
 turn:()=>nodes[at].turn||'b',isCheck:()=>!!nodes[at].check,
 isInsufficientMaterial:()=>false,isThreefoldRepetition:()=>!!nodes[at].claim,
 fen:()=>`8/8/8/8/8/8/8/8 b - - ${nodes[at].clock||0} 1`,
 board:()=>[[...Array(Math.abs(nodes[at].score||0)/100)].map(()=>({type:'p',color:nodes[at].score>0?'b':'w'}))],
 moves:()=> (nodes[at].edges||[]).map(([to,san,captured])=>({from:at,to,san,captured})),
 move:m=>{stack.push(at);at=m.to;seen.push(at);},undo:()=>{at=stack.pop();},
 restored:()=>at==='root'&&stack.length===0,seen
};}
const leaf=(score,turn='w')=>({score,turn,edges:[['end','a3']]});
const run=g=>{const r=chooseAntMove(g,{now:()=>0,depth:1,maxNodes:4200});assert.ok(g.restored());return r;};
test('Boundary check searches one legal evasion',()=>{
 const g=tree({root:{edges:[['a','Ra1']]},a:{turn:'w',check:true,edges:[['b','Kf2']]},b:{check:true,edges:[['c','Kf7']]},c:{turn:'w',check:true,edges:[['d','Kg2']]},d:leaf(-500),end:leaf(0)});
 run(g);assert.ok(g.seen.includes('d'));assert.ok(!g.seen.includes('end'));
});
test('Quiet checks are searched but only once per line',()=>{
 const g=tree({root:{edges:[['a','Ra1']]},a:{turn:'w',edges:[['b','Qh5+']]},b:{check:true,edges:[['c','Kg7']]},c:{turn:'w',edges:[['d','Qh7+']]},d:leaf(-500)});
 run(g);assert.ok(g.seen.includes('b'));assert.ok(g.seen.includes('c'));assert.ok(!g.seen.includes('d'));
});
for(const turn of ['w','b'])for(const kind of ['claim','clock'])test(`${turn} optional ${kind} draw keeps winning continuation`,()=>{
 const score=turn==='b'?500:-500;
 const g=tree({root:{turn:turn==='b'?'w':'b',edges:[['a','Ra1']]},a:{turn,score,[kind]:kind==='clock'?100:true,edges:[['b','Rxa2','p']]},b:leaf(score,turn==='b'?'w':'b')});
 assert.equal(run(g).score,score);
});
for(const turn of ['w','b'])test(`${turn} can claim instead of accepting a loss at leaf`,()=>{
 const score=turn==='b'?-500:500;
 const g=tree({root:{turn:turn==='b'?'w':'b',edges:[['a','Ra1']]},a:{turn,score,claim:true,edges:[['b','a3']]},b:leaf(score)});
 assert.equal(run(g).score,0);
});
test('Real repetition history remains intact after combined search',()=>{
 const g=new Chess();for(const m of ['Nf3','Nf6','Ng1','Ng8','Nf3','Nf6','Ng1','Ng8'])g.move(m);
 assert.ok(g.isThreefoldRepetition());const fen=g.fen(),history=g.history();
 const r=chooseAntMove(g,{now:()=>0});assert.ok(g.moves().includes(r.move.san));assert.ok(r.nodes<=4200);assert.equal(g.fen(),fen);assert.deepEqual(g.history(),history);assert.ok(g.isThreefoldRepetition());
});
console.log(`${passed} combined checks passed; no Elo claim.`);
