"use strict";

const ERA_RANGES = {
  "1980–1989": [1980, 1989],
  "1990–1999": [1990, 1999],
  "2000–2009": [2000, 2009],
  "2010–2020": [2010, 2020],
};
const TARGET_PER_ERA = 222;
const TARGET_TOTAL = 888;
const PREVIEW_SECONDS = 30;
const BLOCKED_ARTIST_PARTS = ["אייל גולן", "michael jackson", "eyal golan"];
const TEAMS = [
  ["green", "ירוק · איילת ודודי"], ["blue", "תכלת · שרון ונווה"], ["gold", "זהב · נעמה ורז"],
  ["orange", "כתום · מעיין ומנואל"], ["silver", "כסף · עירית ונתן"],
];
const STORE = "hitster-tra-hebrew-alist-888-v4";
const $ = id => document.getElementById(id);
const state = {
  data: null,
  payload: null,
  era: "1980–1989",
  current: null,
  nextPick: null,
  nextPickPromise: null,
  previewGeneration: 0,
  previewUnavailable: new Set(),
  used: new Set(),
  previewTimer: null,
  timelines: {},
};
TEAMS.forEach(([id]) => state.timelines[id] = []);

async function enableOffline() {
  if (!("serviceWorker" in navigator)) return false;
  try { await navigator.serviceWorker.register("./sw.js", { scope: "./" }); await navigator.serviceWorker.ready; return true; }
  catch { return false; }
}
function save() { localStorage.setItem(STORE, JSON.stringify({ used: [...state.used], timelines: state.timelines, era: state.era })); }
function restore() { try { const x=JSON.parse(localStorage.getItem(STORE)||"null"); if(!x)return; state.used=new Set(Array.isArray(x.used)?x.used:[]); if(x.timelines&&typeof x.timelines==="object")TEAMS.forEach(([id])=>state.timelines[id]=Array.isArray(x.timelines[id])?x.timelines[id]:[]); if(ERA_RANGES[x.era])state.era=x.era; } catch {} }
function norm(value) { return String(value || "").normalize("NFKC").trim().toLocaleLowerCase("he"); }
function key(card) { return `${norm(card[0])}|${norm(card[1])}|${card[2]}`; }
function hasHebrew(value) { return /[\u0590-\u05FF]/.test(String(value || "")); }
function hasLatin(value) { return /[A-Za-z]/.test(String(value || "")); }
function blockedArtist(artist) { const a=norm(artist); return BLOCKED_ARTIST_PARTS.some(part=>a.includes(norm(part))); }
function approvedSource(source) { return /^מצעד שנתי \d{4}$/.test(String(source || "")) || source === "גלגלצ מצעד שנתי 2020"; }
function validatePayload(payload) {
  const errors=[],duplicates=[],seen=new Set(); let total=0,validEras=0;
  if(!payload||typeof payload!=="object"||!payload.eras||!payload.provenance)return{ok:false,total:0,validEras:0,duplicates:[],errors:["קובץ A-list חסר או לא תקין"]};
  for(const [era,[lo,hi]] of Object.entries(ERA_RANGES)){const pool=payload.eras[era];if(!Array.isArray(pool)||pool.length!==TARGET_PER_ERA){errors.push(`${era}: expected ${TARGET_PER_ERA}`);continue;}let eraOk=true;for(const card of pool){total++;if(!Array.isArray(card)||card.length!==3||!card[0]||!card[1]||!Number.isInteger(card[2])||card[2]<lo||card[2]>hi){eraOk=false;errors.push(`${era}: invalid card`);continue;}if(!hasHebrew(card[0])||hasLatin(card[0])){eraOk=false;errors.push(`${card[0]}: title is not Hebrew-only`);}if(!hasHebrew(card[1])||hasLatin(card[1])){eraOk=false;errors.push(`${card[1]}: artist is not Hebrew-only`);}if(blockedArtist(card[1])){eraOk=false;errors.push(`${card[1]}: blocked artist`);}const id=key(card);if(seen.has(id))duplicates.push(id);seen.add(id);if(!approvedSource(payload.provenance[id]?.source)){eraOk=false;errors.push(`${card[0]}: missing annual-chart A-list source`);}}if(eraOk)validEras++;}
  if(total!==TARGET_TOTAL)errors.push(`expected ${TARGET_TOTAL}, got ${total}`);if(duplicates.length)errors.push(`${duplicates.length} duplicate cards`);return{ok:errors.length===0,total,validEras,duplicates,errors};
}
function renderEras(){const host=$("eras");host.replaceChildren();Object.keys(ERA_RANGES).forEach(era=>{const count=state.data?.[era]?.length||0;const b=document.createElement("button");b.type="button";b.className=`era-btn${era===state.era?" active":""}`;b.textContent=`${era} · ${count}`;b.onclick=()=>{state.era=era;invalidateNextPick();renderEras();save();$("card-meta").textContent=`נבחר ${era} · ${count} קלפים`;void primeNextPick();};host.append(b);});}
function renderTimelines(){const host=$("timelines");host.replaceChildren();TEAMS.forEach(([id,label])=>{const box=document.createElement("section");box.className="timeline";const h=document.createElement("h3");h.textContent=label;box.append(h);const cards=document.createElement("div");cards.className="cards";[...state.timelines[id]].sort((a,b)=>a[2]-b[2]||a[0].localeCompare(b[0],"he")).forEach(card=>{const mini=document.createElement("div");mini.className="mini";const y=document.createElement("strong");y.textContent=card[2];const t=document.createElement("span");t.textContent=card[0];const a=document.createElement("span");a.textContent=card[1];mini.append(y,t,a);cards.append(mini);});if(!cards.children.length){const empty=document.createElement("span");empty.className="muted";empty.textContent="עדיין אין קלפים שנחשפו";cards.append(empty);}box.append(cards);host.append(box);});}
function allCards(){return Object.entries(state.data).flatMap(([era,pool])=>pool.map(card=>({era,card})));}
function pool(){const source=$("mode").value==="all"?allCards():(state.data[state.era]||[]).map(card=>({era:state.era,card}));return source.filter(({card})=>!state.used.has(key(card))&&!state.previewUnavailable.has(key(card)));}
function stopAudio(){clearTimeout(state.previewTimer);state.previewTimer=null;const audio=$("audio");audio.pause();try{audio.currentTime=0;}catch{}$("play").textContent=`▶ ${PREVIEW_SECONDS} שניות`;}
function prepareAudio(previewUrl){const audio=$("audio");if(!previewUrl){audio.removeAttribute("src");audio.load();return;}if(audio.src!==previewUrl){audio.src=previewUrl;audio.preload="auto";audio.playsInline=true;audio.load();}}
async function resolvePreview(card){const term=encodeURIComponent(`${card[0]} ${card[1]}`);const response=await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&limit=5&country=IL`);if(!response.ok)throw new Error("preview search failed");const json=await response.json();const clean=s=>String(s||"").toLowerCase().replace(/[^a-z0-9א-ת]+/g," ").trim();const title=clean(card[0]),artist=clean(card[1]);const ranked=[...(json.results||[])].sort((a,b)=>{const score=x=>(clean(x.trackName).includes(title)||title.includes(clean(x.trackName))?3:0)+(clean(x.artistName).includes(artist)||artist.includes(clean(x.artistName))?2:0);return score(b)-score(a);});return ranked.find(x=>x.previewUrl)?.previewUrl||null;}
function trackAudio(event,properties={}){try{window.posthog?.capture?.(event,{...properties,preview_seconds:PREVIEW_SECONDS});}catch{}}
function invalidateNextPick(){state.previewGeneration+=1;state.nextPick=null;state.nextPickPromise=null;}
async function primeNextPick(){
  if(!state.data)return null;
  if(state.nextPick)return state.nextPick;
  if(state.nextPickPromise)return state.nextPickPromise;
  const generation=state.previewGeneration;
  $("draw").disabled=true;
  if(!state.current)$("status").textContent="🎧 מכין את השיר הבא…";
  state.nextPickPromise=(async()=>{
    for(let attempt=0;attempt<8;attempt+=1){
      const available=pool();
      if(!available.length)return null;
      const pick=available[Math.floor(Math.random()*available.length)];
      try{
        const preview=await resolvePreview(pick.card);
        if(generation!==state.previewGeneration)return null;
        if(preview)return{era:pick.era,card:pick.card,preview};
      }catch(error){trackAudio("hitster_audio_lookup_failed",{error_name:error?.name||"Error"});}
      state.previewUnavailable.add(key(pick.card));
    }
    return null;
  })();
  const ready=await state.nextPickPromise;
  if(generation!==state.previewGeneration)return null;
  state.nextPickPromise=null;
  state.nextPick=ready;
  $("draw").disabled=!ready;
  if(!state.current)$("status").textContent=ready?"🎵 מוכן · משכו קלף והאודיו יתחיל מיד":"לא נמצא כרגע שיר עם תצוגה מקדימה. נסו תקופה אחרת.";
  return ready;
}
function startPreview(source="manual"){
  if(!state.current?.preview)return false;
  const audio=$("audio");
  if(!audio.src)prepareAudio(state.current.preview);
  clearTimeout(state.previewTimer);
  try{audio.currentTime=0;}catch{}
  $("play").disabled=false;
  let attempt;
  try{attempt=audio.play();}
  catch(error){handlePreviewFailure(error,source);return false;}
  Promise.resolve(attempt).then(()=>{
    $("play").textContent="■ עצירה";
    state.previewTimer=setTimeout(stopAudio,PREVIEW_SECONDS*1000);
    $("status").textContent=`▶ מנגן ${PREVIEW_SECONDS} שניות`;
    trackAudio("hitster_audio_preview_started",{source});
  }).catch(error=>handlePreviewFailure(error,source));
  return true;
}
function handlePreviewFailure(error,source){
  $("play").textContent=`▶ ${PREVIEW_SECONDS} שניות`;
  $("play").disabled=false;
  trackAudio("hitster_audio_preview_failed",{source,error_name:error?.name||"Error",error_message:String(error?.message||"").slice(0,160)});
  if(error?.name==="NotAllowedError")$("status").textContent="Safari חסם את ההפעלה. לחצו על ▶ 30 שניות — ההשמעה תתחיל מיד.";
  else $("status").textContent="האודיו לא הצליח להתנגן. לחצו שוב על ▶ 30 שניות.";
}
function draw(){
  stopAudio();
  const pick=state.nextPick;
  if(!pick){$("status").textContent="🎧 השיר הבא עדיין בהכנה…";void primeNextPick();return;}
  state.nextPick=null;
  state.current=pick;
  state.used.add(key(pick.card));
  save();
  $("revealed").hidden=true;
  $("concealed").hidden=false;
  $("card-meta").textContent=`${pick.era} · קלף ${state.used.size}/${TARGET_TOTAL}`;
  $("reveal").disabled=false;
  $("play").disabled=false;
  prepareAudio(pick.preview);
  // Critical for iPhone/Safari: play() is invoked synchronously inside the tap handler.
  startPreview("draw");
  $("draw").disabled=true;
  void primeNextPick();
}
function play30(){if(!state.current?.preview)return;const audio=$("audio");if(!audio.paused){stopAudio();return;}startPreview("play_button");}
function reveal(){if(!state.current)return;stopAudio();const[title,artist,year]=state.current.card;$("year").textContent=year;$("title").textContent=title;$("artist").textContent=artist;$("concealed").hidden=true;$("revealed").hidden=false;$("reveal").disabled=true;const team=$("team").value;if(!state.timelines[team].some(c=>key(c)===key(state.current.card)))state.timelines[team].push(state.current.card);save();renderTimelines();$("status").textContent=`נוסף לציר הזמן של ${TEAMS.find(x=>x[0]===team)[1]}.`;}
function newGame(){if(!confirm("להתחיל משחק חדש? כל צירי הזמן והקלפים שנמשכו יתאפסו."))return;stopAudio();prepareAudio(null);state.used.clear();state.previewUnavailable.clear();invalidateNextPick();TEAMS.forEach(([id])=>state.timelines[id]=[]);state.current=null;localStorage.removeItem(STORE);$("revealed").hidden=true;$("concealed").hidden=false;$("card-meta").textContent=`נבחר ${state.era} · ${(state.data[state.era]||[]).length} קלפים`;$("status").textContent="🎮 משחק חדש התחיל · מכין את השיר הראשון…";$("play").disabled=true;$("reveal").disabled=true;renderTimelines();void primeNextPick();}
async function init(){const offlineReady=await enableOffline();const response=await fetch("./hitster-hebrew-alist-888.json");if(!response.ok)throw new Error("מאגר 888 A-list בעברית לא נטען");state.payload=await response.json();state.data=state.payload.eras;const report=validatePayload(state.payload);$("m-total").textContent=report.total;$("m-era").textContent=`${report.validEras}/4`;$("m-dupes").textContent=report.duplicates.length;const badge=$("quality-badge");badge.textContent=report.ok?(offlineReady?(navigator.onLine?"✅ 888/888 · 222×4 · עברית · A-list · Offline מוכן":"📴 888/888 · 222×4 · עברית · A-list"):"✅ 888/888 · 222×4 · עברית · A-list"):"⛔ A-list Gate נכשל";if(!report.ok){$("draw").disabled=true;$("status").textContent=report.errors[0]||"Quality gate failed";return;}restore();renderEras();renderTimelines();$("play").textContent=`▶ ${PREVIEW_SECONDS} שניות`;$("draw").onclick=draw;$("play").onclick=play30;$("reveal").onclick=reveal;$("new-game").onclick=newGame;$("mode").addEventListener("change",()=>{invalidateNextPick();void primeNextPick();});window.addEventListener("offline",()=>{if(report.ok)badge.textContent="📴 888/888 · 222×4 · עברית · A-list";});window.addEventListener("online",()=>{if(report.ok){badge.textContent="✅ 888/888 · 222×4 · עברית · A-list · Offline מוכן";invalidateNextPick();void primeNextPick();}});void primeNextPick();}
init().catch(error=>{$("quality-badge").textContent="⛔ המשחק לא נטען";$("status").textContent=String(error.message||error);$("draw").disabled=true;});
