// Tests the executable replacement loader, not string-patch presence alone.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('./games-loader.js',import.meta.url),'utf8');
const runtime=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const languageSource=fs.readFileSync(new URL('./chess-languages.js',import.meta.url),'utf8');
const {COPY}=await import('data:text/javascript;base64,'+Buffer.from(languageSource).toString('base64'));
let passed=0;
const test=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
test('Five complete languages',()=>assert.deepEqual(Object.keys(COPY).sort(),['ar','en','fr','he','hi']));
const keys=Object.keys(COPY.en).sort();
for(const [lang,values]of Object.entries(COPY)){
  test(lang+' includes every translated key',()=>assert.deepEqual(Object.keys(values).sort(),keys));
  test(lang+' uses matching interpolation fields',()=>{for(const key of keys){assert.ok(typeof values[key]==='string'&&values[key].length>0);assert.deepEqual([...(values[key].match(/\{\w+\}/g)||[])].sort(),[...(COPY.en[key].match(/\{\w+\}/g)||[])].sort());}});
}
test('RTL is limited to Hebrew and Arabic',()=>{for(const lang of Object.keys(COPY))assert.equal(COPY[lang].dir,['he','ar'].includes(lang)?'rtl':'ltr');});
test('Runtime no longer evaluates string patches',()=>{assert.equal(source.includes('const patches ='),false);assert.equal(source.includes('await import(blobUrl)'),false);});
let calls=0;
const FakeChess=function(){};
const loaded=await runtime.loadChessEngine(async()=>{calls++;if(calls===1)throw new Error('CDN blocked');return {Chess:FakeChess};});
test('Second pinned source loads when first fails',()=>{assert.equal(calls,2);assert.equal(loaded,FakeChess);});
await assert.rejects(runtime.loadChessEngine(async()=>{throw new Error('offline');}));
passed++;console.log('PASS Both engine failures propagate to the retry screen');
if(process.argv.includes('--unit-only')){
  console.log(`${passed} unit checks passed. No chess engine or physical device was tested in this mode.`);
  process.exit(0);
}
const enginePath=process.env.TRA_CHESS_ENGINE_PATH;
if(!enginePath)throw new Error('Set TRA_CHESS_ENGINE_PATH to the pinned chess.js 1.4.0 ESM build. Use --unit-only only for explicit local unit testing.');
const {Chess}=await import(pathToFileURL(enginePath).href);
const moveCases=[
 ['King cannot enter check','4k3/8/8/8/8/8/r7/4K3 w - - 0 1','e1','e2',false],
 ['Protected queen cannot be taken by king','4k3/8/8/8/8/3b4/4q3/4K3 w - - 0 1','e1','e2',false],
 ['Kings cannot be adjacent','8/8/8/8/8/4k3/8/4K3 w - - 0 1','e1','e2',false],
 ['Cannot castle through check','r3k2r/8/8/8/8/5r2/8/R3K2R w KQkq - 0 1','e1','g1',false],
 ['En passant immediate reply','4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1','e5','d6',true],
 ['En passant cannot expose own king','4r2k/8/8/3pP3/8/8/8/4K3 w - d6 0 1','e5','d6',false]
];
for(const [name,fen,from,to,expected]of moveCases)test(name,()=>assert.equal(new Chess(fen).moves({square:from,verbose:true}).some(m=>m.to===to),expected));
test('Runtime checkmate winner',()=>assert.equal(runtime.resultState(new Chess('7k/6Q1/5K2/8/8/8/8/8 b - - 0 1')).winner,'w'));
test('Runtime stalemate is a draw',()=>assert.equal(runtime.resultState(new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')).reason,'stalemate'));
test('Runtime 50 moves requires a claim',()=>{const game=new Chess('r3k3/8/8/8/8/8/8/4K2R w - - 100 51');assert.equal(runtime.resultState(game).over,false);assert.equal(runtime.claimableDraw(game),'fifty_move');});
test('Runtime intended 50 move claim preserves position',()=>{const game=new Chess('r3k3/8/8/8/8/8/8/4K2R w - - 99 50'),before=game.fen();assert.ok(runtime.intendedClaimableDraws(game).some(c=>c.reason==='fifty_move'));assert.equal(game.fen(),before);});
test('Runtime automatic 75 move draw',()=>assert.equal(runtime.resultState(new Chess('r3k3/8/8/8/8/8/8/4K2R w - - 150 76')).reason,'seventy_five_move'));
const cycle=['Nf3','Nf6','Ng1','Ng8'];
test('Runtime repeated positions counted with history',()=>{const game=new Chess();for(const move of [...cycle,...cycle])game.move(move);assert.equal(runtime.repetitionCount(game),3);assert.equal(runtime.claimableDraw(game),'threefold_repetition');assert.equal(runtime.resultState(game).over,false);for(const move of [...cycle,...cycle])game.move(move);assert.equal(runtime.resultState(game).reason,'fivefold_repetition');});
test('All four promotions remain possible',()=>{const game=new Chess('k7/4P3/8/8/8/8/8/4K3 w - - 0 1');assert.deepEqual(game.moves({square:'e7',verbose:true}).filter(m=>m.to==='e8').map(m=>m.promotion).sort(),['b','n','q','r']);});
test('Timeout with bare king is a draw',()=>assert.equal(runtime.canPossiblyMate(new Chess('4k3/8/8/8/8/8/8/4K3 w - - 0 1'),'b'),false));
test('Timeout against rook can be a loss',()=>assert.equal(runtime.canPossiblyMate(new Chess('4k3/8/8/8/8/8/7r/4K3 w - - 0 1'),'b'),true));
console.log(`${passed} executable checks passed. Physical iPad, TV, remote, and screen-reader testing remains separate.`);
