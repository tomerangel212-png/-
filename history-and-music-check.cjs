const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.TRA_CHESS_TEST_PREFIX+'/node_modules/jsdom');
(async()=>{
 const dom=new JSDOM(fs.readFileSync('history-and-music-catalog.html','utf8'),{url:'https://example.test/history-and-music-catalog.html',runScripts:'outside-only'}),w=dom.window,d=w.document;
 w.fetch=async file=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(file,'utf8'))});
 let revoked=0;w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>revoked++;
 w.HTMLMediaElement.prototype.pause=function(){};w.HTMLMediaElement.prototype.load=function(){};
 w.eval(fs.readFileSync('history-and-music.js','utf8'));await new Promise(r=>setTimeout(r,0));
 assert.equal(d.querySelectorAll('#music-results article').length,24);
 d.querySelector('#more-music').click();assert.equal(d.querySelectorAll('#music-results article').length,48);
 d.querySelector('#music-search').value='does-not-exist-212';d.querySelector('#music-search').dispatchEvent(new w.Event('input'));assert.equal(d.querySelectorAll('#music-results article').length,0);
 assert.equal(d.querySelectorAll('#history-results li').length,30);d.querySelector('#more-history').click();assert.equal(d.querySelectorAll('#history-results li').length,60);
 d.querySelector('#open-player').click();assert.equal(d.querySelector('iframe').getAttribute('src'),'hitster-mobile.html');
 const input=d.querySelector('#local-file');Object.defineProperty(input,'files',{value:[new w.File(['audio'],'test.wav')]});input.dispatchEvent(new w.Event('change'));assert.equal(d.querySelector('iframe'),null);
 const cached=new w.Event('pagehide');Object.defineProperty(cached,'persisted',{value:true});w.dispatchEvent(cached);assert.equal(revoked,0,'Back/forward cache must retain the playable blob URL');
 w.dispatchEvent(new w.Event('pagehide'));assert.equal(revoked,1);
 dom.window.close();console.log('PASS catalog load, search, pagination, player isolation, and cached navigation audio URL');
})().catch(e=>{console.error(e);process.exitCode=1});
