// Real engine + jsdom integration, not a real-browser/device test.
import fs from 'node:fs';import assert from 'node:assert/strict';import path from 'node:path';import {pathToFileURL} from 'node:url';
const prefix=process.env.TRA_CHESS_TEST_PREFIX;
if(!prefix)throw new Error('Set TRA_CHESS_TEST_PREFIX to a prefix containing chess.js@1.4.0 and jsdom@26.1.0');
const {JSDOM}=await import(pathToFileURL(path.join(prefix,'node_modules/jsdom/lib/api.js')).href);
const {Chess}=await import(pathToFileURL(path.join(prefix,'node_modules/chess.js/dist/esm/chess.js')).href);
const load=file=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(new URL(file,import.meta.url),'utf8')).toString('base64'));
const runtime=await load('./games-loader.js'),{COPY}=await load('./chess-languages.js');
const dom=new JSDOM(fs.readFileSync(new URL('./chess.html',import.meta.url),'utf8'),{url:'https://example.test/chess.html?lang=he',pretendToBeVisual:true});
for(const key of ['window','document','location','localStorage'])globalThis[key]=dom.window[key];
let app;
try{
 app=runtime.startChess(Chess,COPY,document.querySelector('#chess'));
 const select=document.querySelector('#bot-select');select.value='anti';select.dispatchEvent(new window.Event('change',{bubbles:true}));
 await new Promise(r=>setTimeout(r,0));
 document.querySelector('[data-square=e2]').click();document.querySelector('[data-square=e4]').click();
 const deadline=Date.now()+3000;while(window.TRA_CHESS_API.history().length<2&&Date.now()<deadline)await new Promise(r=>setTimeout(r,25));
 assert.equal(window.TRA_CHESS_API.history().length,2);assert.equal(window.TRA_CHESS_API.review().turn,'w');
 const moves=window.TRA_CHESS_API.history();const game=new Chess();for(const move of moves)assert.ok(game.move(move));
 assert.equal(window.TRA_CHESS_API.fen(),game.fen());
 console.log('PASS Hebrew Ant selection, human e4, legal automatic reply, and return to human turn: '+moves.join(' '));
}finally{app?.destroy();dom.window.close();}
