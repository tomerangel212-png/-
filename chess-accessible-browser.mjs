// Browser checks use the real, locally installed chess.js 1.4.0 engine.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const root=process.cwd();
const prefix=process.env.TRA_CHESS_TEST_PREFIX;
if(!prefix)throw new Error('TRA_CHESS_TEST_PREFIX is required');
const {chromium}=await import(pathToFileURL(path.join(prefix,'node_modules/playwright/index.mjs')).href);
const engine=fs.readFileSync(process.env.TRA_CHESS_ENGINE_PATH,'utf8');
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'}[path.extname(file)]||'text/plain';
  res.writeHead(200,{'Content-Type':type+'; charset=utf-8'});fs.createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch();
let count=0;
fs.mkdirSync('chess-test-artifacts',{recursive:true});
try{
  for(const [device,width,height]of [['phone-small',320,760],['phone',390,844],['ipad-size',768,1024],['laptop',1366,768],['tv-size',1920,1080]]){
    for(const language of ['he','en','ar','fr','hi']){
      const context=await browser.newContext({viewport:{width,height},hasTouch:device.startsWith('phone')||device==='ipad-size'});
      const page=await context.newPage(),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({status:200,contentType:'text/javascript',body:engine}));
      await page.goto(base+'/chess.html?lang='+language);
      await page.waitForSelector('[data-square="e2"]');
      assert.equal(await page.locator('[data-square]').count(),64);
      assert.equal(await page.locator('html').getAttribute('lang'),language);
      assert.equal(await page.locator('#board').getAttribute('dir'),'ltr');
      assert.equal(await page.locator('h1').count(),1);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),device+' '+language+' horizontal overflow');
      await page.locator('[data-square="e2"]').click();
      await page.locator('[data-square="e4"]').click();
      assert.equal(await page.evaluate(()=>TRA_CHESS_API.history().length),1);
      const fen=await page.evaluate(()=>TRA_CHESS_API.fen());
      await page.selectOption('#chess-language',language==='en'?'he':'en');
      assert.equal(await page.evaluate(()=>TRA_CHESS_API.fen()),fen);
      await page.selectOption('#chess-language',language);
      await page.locator('#undo-move').click();
      assert.equal(await page.evaluate(()=>TRA_CHESS_API.history().length),0);
      await page.locator('[data-square="e2"]').focus();await page.keyboard.press('ArrowUp');
      assert.equal(await page.evaluate(()=>document.activeElement.dataset.square),'e3');
      await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.querySelector('#board').contains(document.activeElement)),false);
      await page.locator('#chess-help').click();await page.keyboard.press('Escape');assert.equal(await page.locator('#chess-dialog-layer').isHidden(),true);
      await page.selectOption('#chess-display',device==='tv-size'?'tv':'large');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),device+' '+language+' large text overflow');
      if(device==='tv-size'){await page.locator('[data-square="h1"]').focus();await page.keyboard.press('ArrowDown');assert.equal(await page.evaluate(()=>document.activeElement.id),'new-game');}
      assert.deepEqual(errors,[]);
      if(language==='he'||device==='tv-size')await page.screenshot({path:'chess-test-artifacts/'+device+'-'+language+'.png',fullPage:true});
      console.log('PASS '+device+' '+language+' controls, layout, language, legal e4, undo, keyboard, dialog');count++;
      await context.close();
    }
  }
  const page=await browser.newPage();
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());await page.route('https://unpkg.com/**',route=>route.abort());
  await page.goto(base+'/chess.html');await page.waitForSelector('[role="alert"]');assert.equal(await page.getByRole('button',{name:'ניסיון נוסף'}).count(),1);
  console.log('PASS Network failure produces a retry button');
  console.log(`${count} viewport-language combinations passed with the real engine. These are browser simulations, not physical device or screen-reader certification.`);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
