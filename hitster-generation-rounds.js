"use strict";
(function(root){
const GENERATION_STAGES = Object.freeze([
 Object.freeze({id:'children',label:'דרגה 1 · שירי ילדים',eligibleLabel:'ילדים בלבד'}),
 Object.freeze({id:'adults',label:'דרגה 2 · שירי מבוגרים',eligibleLabel:'מבוגרים בלבד'}),
 Object.freeze({id:'elders',label:'דרגה 3 · שירי ותיקים',eligibleLabel:'ותיקים בלבד'})
]);
const aliases={child:'children',children:'children',kids:'children','ילד':'children','ילדים':'children',adult:'adults',adults:'adults','מבוגר':'adults','מבוגרים':'adults',elder:'elders',elders:'elders',seniors:'elders','זקן':'elders','זקנים':'elders','ותיק':'elders','ותיקים':'elders'};
const normalizeAudience=v=>aliases[String(v||'').trim().toLowerCase()]||null;
const identity=c=>[c.title,c.artist].map(v=>String(v||'').normalize('NFKC').trim().toLowerCase()).join('|');
const cardKey=c=>String(c.id||identity(c));
function validateGenerationDeck(cards){
 const errors=[],keys=new Set(),songs=new Set();
 if(!Array.isArray(cards)||!cards.length)return {ok:false,errors:['Empty deck']};
 cards.forEach((c,i)=>{
  if(!c||!c.title||!c.artist||!Number.isInteger(c.year)||c.year<1900||c.year>new Date().getFullYear()||!normalizeAudience(c.audience)){errors.push('Invalid card '+i);return;}
  if(keys.has(cardKey(c))||songs.has(identity(c)))errors.push('Duplicate song '+i);
  keys.add(cardKey(c));songs.add(identity(c));
 });
 for(const s of GENERATION_STAGES)if(!cards.some(c=>c&&normalizeAudience(c.audience)===s.id))errors.push('Missing stage '+s.id);
 return {ok:!errors.length,errors};
}
function createGenerationRounds({cards,quotaPerStage=10,restoredState=null}={}){
 const v=validateGenerationDeck(cards);if(!v.ok)throw Error(v.errors.join('\n'));
 if(!Number.isInteger(quotaPerStage)||quotaPerStage<1||quotaPerStage>100)throw Error('Invalid quota');
 const byId=new Map(cards.map(c=>[cardKey(c),c]));
 const state={stageIndex:0,completedByStage:{children:0,adults:0,elders:0},used:new Set(),current:null,finished:false};
 if(restoredState&&typeof restoredState==='object'){
  const r=restoredState;
  state.stageIndex=Number.isInteger(r.stageIndex)?Math.max(0,Math.min(2,r.stageIndex)):0;
  for(const s of GENERATION_STAGES){const n=r.completedByStage&&r.completedByStage[s.id];state.completedByStage[s.id]=Number.isInteger(n)?Math.max(0,Math.min(quotaPerStage,n)):0;}
  state.used=new Set(Array.isArray(r.used)?r.used.filter(id=>byId.has(id)):[]);
  state.finished=state.stageIndex===2&&(r.finished===true||state.completedByStage.elders>=quotaPerStage);
  const c=byId.get(r.current);
  if(!state.finished&&c&&normalizeAudience(c.audience)===GENERATION_STAGES[state.stageIndex].id){state.current=cardKey(c);state.used.add(state.current);}
 }
 const currentStage=()=>GENERATION_STAGES[state.stageIndex];
 const isFinished=()=>state.finished;
 const canAnswer=a=>!isFinished()&&normalizeAudience(a)===currentStage().id;
 const currentCard=()=>byId.get(state.current)||null;
 const availableCards=()=>cards.filter(c=>normalizeAudience(c.audience)===currentStage().id&&!state.used.has(cardKey(c)));
 function draw(random=Math.random){
  if(isFinished())return {ok:false,reason:'game-finished'};
  if(currentCard())return {ok:false,reason:'answer-pending'};
  const pool=availableCards();if(!pool.length)return {ok:false,reason:'stage-deck-empty'};
  const n=Number(random());const card=pool[Math.min(pool.length-1,Math.max(0,Math.floor((Number.isFinite(n)?n:0)*pool.length)))];
  state.current=cardKey(card);state.used.add(state.current);return {ok:true,card,stage:currentStage()};
 }
 function advance(){if(state.stageIndex<2)state.stageIndex++;else state.finished=true;}
 function acceptAnswer({responderAudience,correct}={}){
  if(!canAnswer(responderAudience))return {ok:false,counted:false,reason:'wrong-generation'};
  if(!currentCard())return {ok:false,counted:false,reason:'no-card'};
  const stage=currentStage();state.current=null;
  if(correct===true)state.completedByStage[stage.id]++;
  const advanced=state.completedByStage[stage.id]>=quotaPerStage;
  if(advanced)advance();
  return {ok:true,counted:correct===true,stage,advanced,nextStage:currentStage(),finished:isFinished()};
 }
 function skipUnavailable(){if(!currentCard()||isFinished())return false;state.current=null;return true;}
 function finishEmptyStage(){if(isFinished()||currentCard()||availableCards().length)return false;advance();return true;}
 const serialize=()=>({version:2,stageIndex:state.stageIndex,completedByStage:{...state.completedByStage},used:[...state.used],current:state.current,finished:state.finished,quotaPerStage});
 return {currentStage,canAnswer,currentCard,availableCards,draw,acceptAnswer,isFinished,serialize,skipUnavailable,finishEmptyStage};
}
const api={GENERATION_STAGES,normalizeAudience,cardKey,validateGenerationDeck,createGenerationRounds};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.HitsterGenerationRounds=api;
})(typeof window!=='undefined'?window:null);
