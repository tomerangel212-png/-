"use strict";

const ERA_RANGES = {
  "1960–1969": [1960, 1969], "1970–1979": [1970, 1979], "1980–1989": [1980, 1989],
  "1990–1999": [1990, 1999], "2000–2009": [2000, 2009], "2010–2019": [2010, 2019], "2020–2026": [2020, 2026],
};
const TEAMS = [
  ["green","ירוק · איילת ודודי"],["blue","תכלת · שרון ונווה"],["gold","זהב · נעמה ורז"],
  ["orange","כתום · מעיין ומנואל"],["silver","כסף · עירית ונתן"],
];
const STORE = "hitster-tra-kfar-bloom-2026-demo-v1";
const $ = (id) => document.getElementById(id);
const state = { data:null, era:"1960–1969", current:null, used:new Set(), previewTimer:null, timelines:{} };
TEAMS.forEach(([id]) => state.timelines[id] = []);

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
function validate(data){
  const duplicates=[]; const seen=new Set(); let total=0; let validEras=0; const errors=[];
  for(const [era,[lo,hi]] of Object.entries(ERA_RANGES)){
    const pool=data[era];
    if(!Array.isArray(pool) || pool.length!==50){errors.push(`${era}: expected 50, got ${pool?.length??0}`); continue;}
    let eraOk=true;
    for(const card of pool){
      total++;
      if(!Array.isArray(card)||card.length!==3||!card[0]||!card[1]||!Number.isInteger(card[2])||card[2]<lo||card[2]>hi){eraOk=false;errors.push(`${era}: invalid card ${JSON.stringify(card)}`);continue;}
      const k=key(card).toLowerCase(); if(seen.has(k)) duplicates.push(k); seen.add(k);
    }
    if(eraOk) validEras++;
  }
  return {ok:errors.length===0&&duplicates.length===0&&total===350,total,validEras,duplicates,errors};
}
function renderEras(){
  const host=$("eras"); host.replaceChildren();
  Object.keys(ERA_RANGES).forEach(era=>{
    const b=document.createElement("button"); b.type="button"; b.className=`era-btn${era===state.era?" active":""}`; b.textContent=`${era} · 50`;
    b.onclick=()=>{state.era=era; renderEras(); save(); $("card-meta").textContent=`נבחר ${era} · 50 קלפים`;}; host.append(b);
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
  const normalized=s=>String(s||"").toLowerCase().replace(/[^a-z0-9א-ת]+/g," ").trim();
  const title=normalized(card[0]); const artist=normalized(card[1]);
  const ranked=[...json.results].sort((a,b)=>{
    const score=x=>(normalized(x.trackName).includes(title)||title.includes(normalized(x.trackName))?3:0)+(normalized(x.artistName).includes(artist)||artist.includes(normalized(x.artistName))?2:0);
    return score(b)-score(a);
  });
  return ranked.find(x=>x.previewUrl)?.previewUrl||null;
}
async function draw(){
  stopAudio(); const available=pool();
  if(!available.length){$("status").textContent="אין עוד קלפים בטווח הזה. אפשר לבחור תקופה אחרת או לאפס.";return;}
  const pick=available[Math.floor(Math.random()*available.length)]; state.current={era:pick.era,card:pick.card,preview:null}; state.used.add(key(pick.card)); save();
  $("revealed").hidden=true; $("concealed").hidden=false; $("card-meta").textContent=`${pick.era} · קלף ${state.used.size}/350`;
  $("reveal").disabled=false; $("play").disabled=true; $("status").textContent="מחפש preview פנימי…";
  try{state.current.preview=await resolvePreview(pick.card); $("play").disabled=!state.current.preview; $("status").textContent=state.current.preview?"מוכן להשמעת 20 שניות בתוך הדמו":"לא נמצא preview; אפשר לחשוף ולהמשיך.";}
  catch{$("status").textContent="Preview לא זמין כרגע; הקלף עדיין תקין למשחק.";}
}
async function play20(){
  if(!state.current?.preview)return; const audio=$("audio");
  if(!audio.paused){stopAudio();return;}
  audio.src=state.current.preview; audio.currentTime=0; $("play").textContent="■ עצירה";
  try{await audio.play(); state.previewTimer=setTimeout(()=>{audio.pause();audio.currentTime=0;$("play").textContent="▶ 20 שניות";},20000);}catch{$("status").textContent="הדפדפן חסם את ה-preview. לחצו שוב על 20 שניות.";}
}
function reveal(){
  if(!state.current)return; stopAudio(); const [title,artist,year]=state.current.card;
  $("year").textContent=year; $("title").textContent=title; $("artist").textContent=artist; $("concealed").hidden=true; $("revealed").hidden=false; $("reveal").disabled=true;
  const team=$("team").value; if(!state.timelines[team].some(c=>key(c)===key(state.current.card))) state.timelines[team].push(state.current.card);
  save(); renderTimelines(); $("status").textContent=`נוסף אוטומטית לציר הזמן של ${TEAMS.find(x=>x[0]===team)[1]}.`;
}
function reset(){
  if(!confirm("לאפס את הדמו, החפיסה וכל צירי הזמן?"))return; stopAudio(); state.used.clear(); TEAMS.forEach(([id])=>state.timelines[id]=[]); state.current=null; localStorage.removeItem(STORE);
  $("revealed").hidden=true; $("concealed").hidden=false; $("card-meta").textContent=`נבחר ${state.era} · 50 קלפים`; $("status").textContent="הדמו אופס"; $("play").disabled=true; $("reveal").disabled=true; renderTimelines();
}

async function init(){
  const response=await fetch("./hitster-kfar-bloom-2026-demo-data.json",{cache:"no-store"}); if(!response.ok) throw new Error("dataset load failed"); state.data=await response.json();
  const report=validate(state.data); $("m-total").textContent=report.total; $("m-era").textContent=`${report.validEras}/7`; $("m-dupes").textContent=report.duplicates.length;
  const badge=$("quality-badge"); badge.textContent=report.ok?"✅ Demo Gate: 350/350 מבנית תקינים":"⛔ Demo Gate נכשל"; if(!report.ok){$("draw").disabled=true; $("status").textContent=report.errors[0]||"Quality gate failed";}
  restore(); renderEras(); renderTimelines();
  $("draw").onclick=draw; $("play").onclick=play20; $("reveal").onclick=reveal; $("reset").onclick=reset;
}
init().catch(error=>{$("quality-badge").textContent="⛔ הדמו לא נטען";$("status").textContent=String(error.message||error);$("draw").disabled=true;});
