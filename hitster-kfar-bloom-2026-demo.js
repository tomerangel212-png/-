"use strict";

const ERA_RANGES = {
  "1960–1969": [1960, 1969], "1970–1979": [1970, 1979], "1980–1989": [1980, 1989],
  "1990–1999": [1990, 1999], "2000–2009": [2000, 2009], "2010–2019": [2010, 2019], "2020–2026": [2020, 2026],
};
const TARGET_COUNTS = {
  "1960–1969": 64, "1970–1979": 64, "1980–1989": 64,
  "1990–1999": 63, "2000–2009": 63, "2010–2019": 63, "2020–2026": 63,
};
const TARGET_TOTAL = 444;
const BLOCKED_ARTISTS = new Set(["michael jackson", "אייל גולן", "eyal golan"]);
const TEAMS = [
  ["green","ירוק · איילת ודודי"],["blue","תכלת · שרון ונווה"],["gold","זהב · נעמה ורז"],
  ["orange","כתום · מעיין ומנואל"],["silver","כסף · עירית ונתן"],
];
const STORE = "hitster-tra-kfar-bloom-2026-demo-v2";
const $ = (id) => document.getElementById(id);
const state = { data:null, era:"1960–1969", current:null, used:new Set(), previewTimer:null, timelines:{} };
TEAMS.forEach(([id]) => state.timelines[id] = []);

async function enableOffline(){
  if(!("serviceWorker" in navigator)) return false;
  try{
    await navigator.serviceWorker.register("./sw.js",{scope:"./"});
    await navigator.serviceWorker.ready;
    return true;
  }catch{
    return false;
  }
}

function save(){
  localStorage.setItem(STORE, JSON.stringify({used:[...state.used], timelines:state.timelines, era:state.era}));
}
function restore(){
  try{
    const x=JSON.parse(localStorage.getItem(STORE)||"null");
    if(!x) return;
    state.used=new Set(Array.isArray(x.used)?x.used:[]);
    if(x.timelines && typeof x.timelines==="object") TEAMS.forEach(([id])=>state.timelines[id]=Array.isArray(x.timelines[id])?x.timelines[id]:[]);
    if(ERA_RANGES[x.era]) state.era=x.era;
  }catch{}
}
function key(card){return `${card[0]}|${card[1]}|${card[2]}`;}
function normalized(value){return String(value||"").trim().toLocaleLowerCase("he");}
function blocked(card){return BLOCKED_ARTISTS.has(normalized(card?.[1]));}
function validCardForEra(card,era){
  const range=ERA_RANGES[era];
  return Array.isArray(card)&&card.length===3&&Boolean(card[0])&&Boolean(card[1])&&Number.isInteger(card[2])&&card[2]>=range[0]&&card[2]<=range[1];
}
function mergeExpansion(base, expansion){
  const merged={};
  const seen=new Set();
  for(const era of Object.keys(ERA_RANGES)){
    merged[era]=[];
    const source=Array.isArray(base[era])?base[era]:[];
    for(const card of source){
      if(!validCardForEra(card,era)||blocked(card)) continue;
      const id=key(card).toLowerCase();
      if(seen.has(id)) continue;
      seen.add(id); merged[era].push(card);
    }
    const candidates=Array.isArray(expansion[era])?expansion[era]:[];
    for(const card of candidates){
      if(merged[era].length>=TARGET_COUNTS[era]) break;
      if(!validCardForEra(card,era)||blocked(card)) continue;
      const id=key(card).toLowerCase();
      if(seen.has(id)) continue;
      seen.add(id); merged[era].push(card);
    }
    if(merged[era].length!==TARGET_COUNTS[era]){
      throw new Error(`${era}: צריך ${TARGET_COUNTS[era]} קלפים, נמצאו ${merged[era].length}`);
    }
  }
  const total=Object.values(merged).reduce((sum,pool)=>sum+pool.length,0);
  if(total!==TARGET_TOTAL) throw new Error(`HITSTER deck must contain ${TARGET_TOTAL} cards, got ${total}`);
  return merged;
}
function validate(data){
  const duplicates=[]; const seen=new Set(); let total=0; let validEras=0; const errors=[];
  for(const [era,[lo,hi]] of Object.entries(ERA_RANGES)){
    const pool=data[era];
    if(!Array.isArray(pool) || pool.length!==TARGET_COUNTS[era]){errors.push(`${era}: expected ${TARGET_COUNTS[era]}, got ${pool?.length??0}`); continue;}
    let eraOk=true;
    for(const card of pool){
      total++;
      if(!Array.isArray(card)||card.length!==3||!card[0]||!card[1]||!Number.isInteger(card[2])||card[2]<lo||card[2]>hi){eraOk=false;errors.push(`${era}: invalid card ${JSON.stringify(card)}`);continue;}
      if(blocked(card)){eraOk=false;errors.push(`${era}: blocked artist ${card[1]}`);continue;}
      const k=key(card).toLowerCase(); if(seen.has(k)) duplicates.push(k); seen.add(k);
    }
    if(eraOk) validEras++;
  }
  return {ok:errors.length===0&&duplicates.length===0&&total===TARGET_TOTAL,total,validEras,duplicates,errors};
}
function renderEras(){
  const host=$("eras"); host.replaceChildren();
  Object.keys(ERA_RANGES).forEach(era=>{
    const count=state.data?.[era]?.length||TARGET_COUNTS[era];
    const b=document.createElement("button"); b.type="button"; b.className=`era-btn${era===state.era?" active":""}`; b.textContent=`${era} · ${count}`;
    b.onclick=()=>{state.era=era; renderEras(); save(); $("card-meta").textContent=`נבחר ${era} · ${count} קלפים`;}; host.append(b);
  });
}
function renderTimelines(){
  const host=$("timelines"); host.replaceChildren();
  TEAMS.forEach(([id,label])=>{
    const box=document.createElement("section"); box.className="timeline"; const h=document.createElement("h3"); h.textContent=label; box.append(h);
    const cards=document.createElement("div"); cards.className="cards";
    [...state.timelines[id]].sort((a,b)=>a[2]-b[2]||a[0].localeCompare(b[0])).forEach(card=>{
      const mini=document.createElement("div"); mini.className="mini";
      const y=document.createElement("strong"); y.textContent=card[2]; const t=document.createElement("span"); t.textContent=card[0]; const a=document.createElement("span"); a.textContent=card[1]; mini.append(y,t,a); cards.append(mini);
    });
    if(!cards.children.length){const empty=document.createElement("span"); empty.className="muted"; empty.textContent="עדיין אין קלפים שנחשפו"; cards.append(empty);}
    box.append(cards); host.append(box);
  });
}
function allCards(){return Object.entries(state.data).flatMap(([era,pool])=>pool.map(card=>({era,card})));}
function pool(){
  const mode=$("mode").value;
  const source=mode==="all"?allCards():state.data[state.era].map(card=>({era:state.era,card}));
  return source.filter(({card})=>!state.used.has(key(card)));
}
function stopAudio(){
  clearTimeout(state.previewTimer); state.previewTimer=null; const audio=$("audio"); audio.pause(); audio.currentTime=0; $("play").textContent="▶ 20 שניות";
}
async function resolvePreview(card){
  const term=encodeURIComponent(`${card[0]} ${card[1]}`);
  const url=`https://itunes.apple.com/search?term=${term}&entity=song&limit=5&country=IL`;
  const response=await fetch(url); if(!response.ok) throw new Error("preview search failed");
  const json=await response.json(); if(!json.results?.length) throw new Error("preview not found");
  const clean=s=>String(s||"").toLowerCase().replace(/[^a-z0-9א-ת]+/g," ").trim();
  const title=clean(card[0]); const artist=clean(card[1]);
  const ranked=[...json.results].sort((a,b)=>{
    const score=x=>(clean(x.trackName).includes(title)||title.includes(clean(x.trackName))?3:0)+(clean(x.artistName).includes(artist)||artist.includes(clean(x.artistName))?2:0);
    return score(b)-score(a);
  });
  return ranked.find(x=>x.previewUrl)?.previewUrl||null;
}
async function draw(){
  stopAudio(); const available=pool();
  if(!available.length){$("status").textContent="אין עוד קלפים בטווח הזה. אפשר לבחור תקופה אחרת או להתחיל משחק חדש.";return;}
  const pick=available[Math.floor(Math.random()*available.length)]; state.current={era:pick.era,card:pick.card,preview:null}; state.used.add(key(pick.card)); save();
  $("revealed").hidden=true; $("concealed").hidden=false; $("card-meta").textContent=`${pick.era} · קלף ${state.used.size}/${TARGET_TOTAL}`;
  $("reveal").disabled=false; $("play").disabled=true;
  $("status").textContent=navigator.onLine?"מחפש preview פנימי…":"📴 Offline · הקלף זמין; בודק אם ה־preview נשמר במכשיר…";
  try{
    state.current.preview=await resolvePreview(pick.card);
    $("play").disabled=!state.current.preview;
    $("status").textContent=state.current.preview?(navigator.onLine?"מוכן להשמעת 20 שניות בתוך הדמו":"📴 Offline · ה־preview השמור מוכן להשמעה"):"לא נמצא preview; אפשר לחשוף ולהמשיך.";
  }catch{
    $("status").textContent=navigator.onLine?"Preview לא זמין כרגע; הקלף עדיין תקין למשחק.":"📴 Offline · המשחק והקלף עובדים; לשיר הזה אין preview שמור במכשיר.";
  }
}
async function play20(){
  if(!state.current?.preview)return; const audio=$("audio");
  if(!audio.paused){stopAudio();return;}
  audio.src=state.current.preview; audio.currentTime=0; $("play").textContent="■ עצירה";
  try{await audio.play(); state.previewTimer=setTimeout(()=>{audio.pause();audio.currentTime=0;$("play").textContent="▶ 20 שניות";},20000);}catch{$("status").textContent=navigator.onLine?"הדפדפן חסם את ה-preview. לחצו שוב על 20 שניות.":"📴 ה־preview הזה עדיין לא נשמר ל־Offline.";}
}
function reveal(){
  if(!state.current)return; stopAudio(); const [title,artist,year]=state.current.card;
  $("year").textContent=year; $("title").textContent=title; $("artist").textContent=artist; $("concealed").hidden=true; $("revealed").hidden=false; $("reveal").disabled=true;
  const team=$("team").value; if(!state.timelines[team].some(c=>key(c)===key(state.current.card))) state.timelines[team].push(state.current.card);
  save(); renderTimelines(); $("status").textContent=`נוסף אוטומטית לציר הזמן של ${TEAMS.find(x=>x[0]===team)[1]}.`;
}
function newGame(){
  if(!confirm("להתחיל משחק חדש? כל צירי הזמן והקלפים שנמשכו יתאפסו."))return;
  stopAudio(); state.used.clear(); TEAMS.forEach(([id])=>state.timelines[id]=[]); state.current=null; localStorage.removeItem(STORE);
  $("revealed").hidden=true; $("concealed").hidden=false; $("card-meta").textContent=`נבחר ${state.era} · ${state.data[state.era].length} קלפים`; $("status").textContent="🎮 משחק חדש התחיל · צירי הזמן אופסו"; $("play").disabled=true; $("reveal").disabled=true; renderTimelines();
}

async function init(){
  const offlineReady=await enableOffline();
  const [baseResponse, expansionResponse]=await Promise.all([
    fetch("./hitster-kfar-bloom-2026-demo-data.json"),
    fetch("./hitster-expansion-444.json")
  ]);
  if(!baseResponse.ok) throw new Error("base dataset load failed");
  if(!expansionResponse.ok) throw new Error("expansion dataset load failed");
  const base=await baseResponse.json(); const expansion=await expansionResponse.json();
  state.data=mergeExpansion(base,expansion);
  const report=validate(state.data); $("m-total").textContent=report.total; $("m-era").textContent=`${report.validEras}/7`; $("m-dupes").textContent=report.duplicates.length;
  const badge=$("quality-badge");
  badge.textContent=report.ok?(offlineReady?(navigator.onLine?"✅ 444/444 · Offline מוכן":"📴 444/444 · Offline פעיל"):"✅ Demo Gate: 444/444 מבנית תקינים"):"⛔ Demo Gate נכשל";
  if(!report.ok){$("draw").disabled=true; $("status").textContent=report.errors[0]||"Quality gate failed";}
  restore(); renderEras(); renderTimelines();
  $("draw").onclick=draw; $("play").onclick=play20; $("reveal").onclick=reveal; $("new-game").onclick=newGame;
  window.addEventListener("offline",()=>{if(report.ok){badge.textContent="📴 444/444 · Offline פעיל";}});
  window.addEventListener("online",()=>{if(report.ok){badge.textContent="✅ 444/444 · Offline מוכן";}});
}
init().catch(error=>{$("quality-badge").textContent="⛔ הדמו לא נטען";$("status").textContent=String(error.message||error);$("draw").disabled=true;});
