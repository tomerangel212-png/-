"use strict";

const TARGET_TOTAL = 888;
const TARGET_WIN = 10;
const PREVIEW_SECONDS = 30;
const MAX_LOOKUPS = 24;
const TEAMS = [
  ["green", "ירוק · איילת ודודי"],
  ["blue", "תכלת · שרון ונווה"],
  ["gold", "זהב · נעמה ורז"],
  ["orange", "כתום · מעיין ומנואל"],
  ["silver", "כסף · עירית ונתן"],
];
const $ = id => document.getElementById(id);
const state = { cards: [], used: new Set(), current: null, next: null, timelines: {}, tokens: {}, timer: null, audioCache: new Map() };
TEAMS.forEach(([id]) => { state.timelines[id] = []; state.tokens[id] = 2; });

function norm(v){ return String(v||"").normalize("NFKC").trim().toLocaleLowerCase("he"); }
function cardKey(card){ return `${norm(card[0])}|${norm(card[1])}|${card[2]}`; }
function track(event, props={}){ try{ window.posthog?.capture?.(event,{...props,game:"hitster",rules:"original_timeline",preview_seconds:PREVIEW_SECONDS}); }catch{} }
function shuffle(items){ const a=[...items]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function clean(v){ return norm(v).replace(/[^a-z0-9א-ת]+/g," ").trim(); }
function scoreCandidate(card,item){
  const title=clean(card[0]),artist=clean(card[1]),tt=clean(item.trackName),aa=clean(item.artistName);
  let s=0;
  if(tt===title)s+=8; else if(tt.includes(title)||title.includes(tt))s+=4;
  if(aa===artist)s+=6; else if(aa.includes(artist)||artist.includes(aa))s+=3;
  return s;
}
async function lookupPreview(card){
  const id=cardKey(card); if(state.audioCache.has(id))return state.audioCache.get(id);
  const term=encodeURIComponent(`${card[0]} ${card[1]}`);
  const response=await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&limit=12&country=IL`,{cache:"no-store"});
  if(!response.ok)throw new Error(`audio search ${response.status}`);
  const json=await response.json();
  const best=[...(json.results||[])].filter(x=>x.previewUrl).map(item=>({item,score:scoreCandidate(card,item)})).sort((a,b)=>b.score-a.score)[0];
  const url=best?.score>=9?best.item.previewUrl:null;
  if(url)state.audioCache.set(id,url);
  return url;
}
async function findPlayable(){
  const pool=shuffle(state.cards.filter(card=>!state.used.has(cardKey(card))));
  for(const card of pool.slice(0,MAX_LOOKUPS)){
    try{ const preview=await lookupPreview(card); if(preview)return {card,preview}; }catch{}
  }
  return null;
}
function stopAudio(){
  clearTimeout(state.timer); state.timer=null;
  const a=$("audio"); a.pause(); try{a.currentTime=0;}catch{}
  $("play").textContent=`▶ ${PREVIEW_SECONDS} שניות`;
}
async function playCurrent(source="manual"){
  if(!state.current?.preview)return;
  const a=$("audio");
  if(a.src!==state.current.preview){a.src=state.current.preview;a.load();}
  if(!a.paused){stopAudio();return;}
  try{a.currentTime=0;await a.play();$("play").textContent="■ עצירה";state.timer=setTimeout(stopAudio,PREVIEW_SECONDS*1000);$("status").textContent=`▶ מנגן ${PREVIEW_SECONDS} שניות בתוך HITSTER`;track("song_preview_started",{source});}
  catch(error){$("status").textContent=error?.name==="NotAllowedError"?"Safari חסם הפעלה אוטומטית — לחצו שוב על ▶ 30 שניות.":"קטע השמע לא זמין כרגע; אפשר למשוך קלף אחר.";$("play").textContent=`▶ ${PREVIEW_SECONDS} שניות`;track("hitster_audio_preview_failed",{name:error?.name||"Error"});}
}
function sortedTimeline(team){ return [...state.timelines[team]].sort((a,b)=>a[2]-b[2]||a[0].localeCompare(b[0],"he")); }
function renderPlacement(){
  const team=$("team").value,timeline=sortedTimeline(team),select=$("placement"); select.replaceChildren();
  const labels=[];
  if(!timeline.length)labels.push("ציר ריק");
  else{
    labels.push(`לפני ${timeline[0][2]}`);
    for(let i=1;i<timeline.length;i++)labels.push(`בין ${timeline[i-1][2]} ל-${timeline[i][2]}`);
    labels.push(`אחרי ${timeline[timeline.length-1][2]}`);
  }
  labels.forEach((label,index)=>{const o=document.createElement("option");o.value=String(index);o.textContent=label;select.append(o);});
  select.disabled=!state.current;
}
function renderTimelines(){
  const host=$("timelines");host.replaceChildren();
  TEAMS.forEach(([id,label])=>{
    const section=document.createElement("section");section.className="timeline";
    const cards=sortedTimeline(id);
    section.innerHTML=`<h3>${label}</h3><div class="tokenline">🪙 ${state.tokens[id]} HITSTER · ${cards.length}/${TARGET_WIN}</div>`;
    const row=document.createElement("div");row.className="cards";
    cards.forEach(card=>{const mini=document.createElement("div");mini.className="mini";mini.innerHTML=`<strong>${card[2]}</strong><span>${card[0]}</span><span>${card[1]}</span>`;row.append(mini);});
    section.append(row);host.append(section);
  });
  renderPlacement();
}
function correctPlacement(team,year,index){
  const timeline=sortedTimeline(team); if(!timeline.length)return index===0;
  const left=index>0?timeline[index-1][2]:-Infinity;
  const right=index<timeline.length?timeline[index][2]:Infinity;
  return year>=left&&year<=right;
}
function seedTimelines(){
  const starters=shuffle(state.cards).slice(0,TEAMS.length);
  TEAMS.forEach(([id],i)=>{state.timelines[id]=[starters[i]];state.used.add(cardKey(starters[i]));state.tokens[id]=2;});
}
async function prime(){
  if(state.next)return state.next;
  $("draw").disabled=true;$("status").textContent="🎧 מכין קלף עם אודיו…";
  state.next=await findPlayable();
  $("draw").disabled=!state.next;
  $("status").textContent=state.next?"🎵 קלף מוכן":"לא נמצא כרגע Preview תואם. נסו שוב בעוד רגע.";
  return state.next;
}
function showHidden(){
  $("revealed").hidden=true;$("concealed").hidden=false;$("reveal").disabled=false;$("play").disabled=false;$("placement").disabled=false;$("name-credit").disabled=false;$("skip-token").disabled=state.tokens[$("team").value]<=0;
  renderPlacement();
}
async function draw(){
  stopAudio(); if(!state.next){await prime();if(!state.next)return;}
  state.current=state.next;state.next=null;state.used.add(cardKey(state.current.card));
  $("card-meta").textContent=`השנה מוסתרת · קלף ${state.used.size}/${TARGET_TOTAL}`;showHidden();void playCurrent("draw");void prime();
}
function reveal(){
  if(!state.current)return; stopAudio();
  const team=$("team").value,index=Number($("placement").value),[title,artist,year]=state.current.card;
  const correct=correctPlacement(team,year,index);
  $("year").textContent=year;$("title").textContent=title;$("artist").textContent=artist;$("concealed").hidden=true;$("revealed").hidden=false;$("reveal").disabled=true;$("placement").disabled=true;$("name-credit").disabled=true;$("skip-token").disabled=true;
  if(correct){state.timelines[team].push(state.current.card);$("status").textContent=`✅ מיקום נכון — הקלף נשאר בציר של ${TEAMS.find(x=>x[0]===team)[1]}.`;track("answer_revealed",{correct:true,team,year});}
  else{$("status").textContent=`❌ המיקום לא נכון — שנת השיר היא ${year}, ולכן הקלף נזרק.`;track("answer_revealed",{correct:false,team,year});}
  state.current=null;renderTimelines();
  if(state.timelines[team].length>=TARGET_WIN){$("status").textContent=`🏆 ${TEAMS.find(x=>x[0]===team)[1]} הגיעו ל-${TARGET_WIN} קלפים וניצחו ב-HITSTER!`;$("draw").disabled=true;track("game_completed",{team,cards:state.timelines[team].length});}
}
function creditName(){
  if(!state.current)return;const team=$("team").value;if(state.tokens[team]<5){state.tokens[team]++;$("status").textContent="🪙 נוספה אסימון HITSTER על זיהוי שם השיר והאמן.";}else{$("status").textContent="מקסימום 5 אסימונים לקבוצה.";}$("name-credit").disabled=true;renderTimelines();
}
async function skipWithToken(){
  const team=$("team").value;if(!state.current||state.tokens[team]<=0)return;state.tokens[team]--;stopAudio();state.current=null;$("revealed").hidden=true;$("concealed").hidden=false;$("reveal").disabled=true;$("play").disabled=true;$("placement").disabled=true;renderTimelines();$("status").textContent="🪙 אסימון נוצל — הקלף הוחלף.";await draw();
}
function newGame(){
  stopAudio();state.used.clear();state.current=null;state.next=null;seedTimelines();$("revealed").hidden=true;$("concealed").hidden=false;$("card-meta").textContent="כל קבוצה מתחילה עם קלף אחד ו-2 אסימונים";$("play").disabled=true;$("reveal").disabled=true;$("name-credit").disabled=true;$("skip-token").disabled=true;renderTimelines();$("status").textContent="🎮 HITSTER Original מוכן — המטרה: 10 קלפים בסדר כרונולוגי.";track("game_started",{teams:TEAMS.length,target:TARGET_WIN});void prime();
}
async function init(){
  const response=await fetch("./hitster-hebrew-alist-888.json",{cache:"no-store"});if(!response.ok)throw new Error("מאגר HITSTER 888 לא נטען");
  const payload=await response.json();state.cards=Object.values(payload.eras||{}).flat();if(state.cards.length!==TARGET_TOTAL)throw new Error(`נמצאו ${state.cards.length} קלפים במקום ${TARGET_TOTAL}`);
  $("quality-badge").textContent="✅ 888/888 · HITSTER Original timeline";
  $("draw").onclick=draw;$("play").onclick=()=>playCurrent("button");$("reveal").onclick=reveal;$("new-game").onclick=newGame;$("name-credit").onclick=creditName;$("skip-token").onclick=skipWithToken;$("team").onchange=renderPlacement;
  $("audio").addEventListener("ended",()=>{clearTimeout(state.timer);state.timer=null;$("play").textContent=`▶ ${PREVIEW_SECONDS} שניות`;});
  newGame();
}
init().catch(error=>{$("quality-badge").textContent="⛔ HITSTER לא נטען";$("status").textContent=String(error.message||error);$("draw").disabled=true;});
