'use strict';
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
(async()=>{
 const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname.slice(1)||'hitster-generations-catalog.html';if(!/^hitster-[a-z0-9.-]+$/.test(name)){res.writeHead(404).end();return;}try{const content=fs.readFileSync(path.join(__dirname,name));res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.json')?'application/json':name.endsWith('.css')?'text/css':'text/html');res.end(content);}catch(e){res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  // Mock remote media only: exercise real DOM interactions without claiming audibility.
  await page.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){Object.defineProperty(this,'paused',{configurable:true,value:false});this.dispatchEvent(new Event('playing'));return Promise.resolve();};HTMLMediaElement.prototype.pause=function(){Object.defineProperty(this,'paused',{configurable:true,value:true});};HTMLMediaElement.prototype.load=function(){};});
  await page.route(/.*\.itunes\.apple\.com\/.*/,r=>r.abort());
  await page.goto('http://127.0.0.1:'+server.address().port+'/hitster-generations-catalog.html');await page.locator('#start:enabled').waitFor();await page.click('#start');
  const snapshot=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('tra-hitster-three-generations-v2')));
  for(const stage of ['children','adults','elders'])for(let i=0;i<3;i++){
   await page.click('#draw');const before=await snapshot();assert.equal(before.state.current!==null,true);
   if(stage==='children'&&i===0){await page.reload();await page.locator('#resume:visible').waitFor();await page.click('#resume');assert.equal((await snapshot()).state.current,before.state.current);}
   await page.click('#play');await page.locator('#reveal:enabled').waitFor();await page.click('#reveal');
   await page.selectOption('#responder',stage==='children'?'adults':'children');await page.click('#correct');assert.equal((await snapshot()).state.current,before.state.current,'Other generation cannot score');
   await page.selectOption('#responder',stage);await page.click('#correct');const after=await snapshot();assert.equal(after.state.completedByStage[stage],i+1);assert.equal(after.state.current,null);
  }
  assert.equal(await page.locator('#summary').isVisible(),true);assert.equal((await snapshot()).state.used.length,9);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'No mobile horizontal overflow');
  await page.screenshot({path:'hitster-generations-mobile.png',fullPage:true});assert.deepEqual(errors,[]);
  console.log('PASS: mobile UI, resumed pending card, responder gate, all three transitions, final summary, no repeats, no overflow. Audio mocked.');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
