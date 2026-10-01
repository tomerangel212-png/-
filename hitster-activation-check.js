'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('hitster-original.js', 'utf8');
function section(start, end) { const a=source.indexOf(start), b=source.indexOf(end,a); assert.ok(a>=0&&b>a); return source.slice(a,b); }
const flush = () => new Promise(resolve => setImmediate(resolve));
function player() {
  const card={id:'verified-song',chartYear:2020};
  let resolvePlay, rejectPlay, pauses=0, loads=0, starts=0;
  const nodes={};
  const ctx={
    requestedPlayback:null,pendingMediaActivation:{card,source:'https://audio.test/verified'},playerLoadGeneration:1,
    preparedCardId:null,preparing:true,nextReady:null,language:'he',PREVIEW_SECONDS:30,
    state:{current:null,used:[],currentYearRevealed:false},
    audio:{src:'https://audio.test/verified',paused:true,currentTime:0,
      play(){return new Promise((resolve,reject)=>{resolvePlay=()=>{this.paused=false;resolve();};rejectPlay=reject;});},
      pause(){pauses++;this.paused=true;},load(){loads++;},getAttribute(){return this.src;}},
    currentCard:()=>ctx.state.current?card:null,isGameLocked:()=>false,
    armClipTimer:()=>starts++,el:id=>nodes[id]||(nodes[id]={}),setStatus:()=>{},t:{blocked:'blocked',played:'playing'},
    track:()=>{},persist:()=>{},render:()=>{},primeNextCard:()=>{},clearClipTimer:()=>{},
    stopAudio:()=>{ctx.audio.pause();},prepareCurrentPreview:()=>{},recoverCurrentPreview:()=>{},
  };
  vm.createContext(ctx);
  vm.runInContext(section('  function drawCard(', '  function currentPlacementIsCorrect('),ctx);
  vm.runInContext(section('  function playbackStarted(', '  function checkAnswer('),ctx);
  return {ctx,card,metadata(){ctx.preparedCardId=card.id;ctx.pendingMediaActivation=null;ctx.preparing=false;ctx.nextReady={card};ctx.completeRequestedPlayback();},start(){resolvePlay();},reject(){rejectPlay(Object.assign(new Error('blocked'),{name:'NotAllowedError'}));},stats:()=>({pauses,loads,starts})};
}
(async()=>{
  for(const metadataFirst of [true,false]){
    const p=player();p.ctx.activatePendingAudio();
    if(metadataFirst){p.metadata();p.start();await flush();}else{p.start();await flush();p.metadata();}
    assert.equal(p.ctx.state.current,p.card.id);
    assert.deepEqual(Array.from(p.ctx.state.used),[p.card.id]);
    assert.equal(p.ctx.audio.paused,false,'activation tap must remain playing');
    assert.deepEqual(p.stats(),{pauses:0,loads:0,starts:1},'do not reload, pause or start the timer twice');
    p.ctx.completeRequestedPlayback();assert.equal(p.ctx.state.used.length,1);
    p.ctx.playClip(false);assert.equal(p.ctx.audio.paused,true,'ordinary play button still toggles stop');
  }
  const restored=player();restored.ctx.state.current=restored.card.id;
  restored.ctx.activatePendingAudio();restored.metadata();restored.start();await flush();
  assert.equal(restored.ctx.state.used.length,0,'resume must not consume another card');assert.equal(restored.stats().starts,1);
  const blocked=player();blocked.ctx.activatePendingAudio();blocked.reject();await flush();blocked.metadata();
  assert.equal(blocked.ctx.state.current,null,'blocked playback never draws a card');
  const stale=player();stale.ctx.activatePendingAudio();stale.ctx.playerLoadGeneration++;stale.start();await flush();stale.metadata();
  assert.equal(stale.ctx.state.current,null,'late playback must not affect reset/new source');
  const recovery={previewMemo:{},previewManifest:{song:{url:'https://audio.test/verified'}},navigator:{onLine:true},language:'he',
    lookupPreviewInCountry:async()=>{throw new Error('CORS unavailable');},track:()=>{},wait:async()=>{}};
  vm.createContext(recovery);vm.runInContext(section('  async function lookupPreview(', '  async function cacheRemotePreview('),recovery);
  assert.equal(await recovery.lookupPreview({id:'song'},{force:true}),'https://audio.test/verified');
  assert.equal(await recovery.lookupPreview({id:'missing'},{force:true}),null);
  recovery.navigator.onLine=false;recovery.window={TRAAudio:{bounded:async f=>f()}};
  recovery.cachedPreview=async()=>({src:'blob:offline',cached:true});recovery.cacheRemotePreview=()=>{throw Error('must stay offline');};
  vm.runInContext(section('  async function resolvePlayablePreview(', '  function loadPreviewIntoPlayer('),recovery);
  assert.equal((await recovery.resolvePlayablePreview({id:'song'},{force:true})).src,'blob:offline');
  console.log('Activation behavior OK: both media event orders, resume, blocked gesture, stale callback, verified URL and offline recovery.');
})().catch(e=>{console.error(e);process.exitCode=1;});
