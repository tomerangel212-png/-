"use strict";
(function () {
  const core=window.TRAPersonal, $=id=>document.getElementById(id);
  const KEY="tra-personal-five-v1", SCORE_KEY="tra-listening-scores-v1";
  const seeds=[{title:"לו יהי",artist:""},{title:"Take on Me",artist:"a-ha"},{title:"כוח הכבידה",artist:"שגיב ברייטנר"},{title:"כולם גנבים",artist:"אושר כהן"},{title:"One Last Time",artist:"Ariana Grande"}];
  let snapshot={countries:{},seeds:[]}, stored={}, busy=false, history=[], scores={};
  try {stored=JSON.parse(localStorage.getItem(KEY)||"{}");scores=JSON.parse(localStorage.getItem(SCORE_KEY)||"{}");}catch(error){}
  const config=window.TRA_PERSONAL_CONFIG={cards:[],teams:Array.from({length:5},(_,i)=>({id:"team-"+(i+1),he:"קבוצה "+(i+1),en:"Team "+(i+1)})),listenScores:{}};
  config.teams.forEach(t=>config.listenScores[t.id]=Number.isFinite(scores[t.id])?scores[t.id]:0);
  $("nickname").value=typeof stored.name==="string"?stored.name:"תומר";
  const initial=Array.isArray(stored.songs)&&stored.songs.length===5?stored.songs:seeds;
  initial.forEach((s,i)=>{ $("song-"+i).value=s.title||"";$("artist-"+i).value=s.artist||""; });
  ["spotify","apple"].forEach(p=>$(p+"-url").value=typeof stored[p]==="string"?stored[p]:"");
  $("five-form").addEventListener("input",()=>{$("setup-error").textContent="";});
  const dataReady=fetch("./hitster-world-data.json?v=personal-v1",{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject()).then(data=>{
    snapshot=data;
    const names=typeof Intl.DisplayNames==="function"?new Intl.DisplayNames(["he"],{type:"region"}):null;
    const preferred=["il","eg","tr","gb"];
    const codes=Object.keys(data.countries||{}).sort((a,b)=>(preferred.indexOf(a)<0?99:preferred.indexOf(a))-(preferred.indexOf(b)<0?99:preferred.indexOf(b))||a.localeCompare(b));
    codes.forEach(code=>{const option=document.createElement("option");option.value=code;option.textContent=code==="gb"?"בריטניה (כולל לונדון)":names?names.of(code.toUpperCase()):code.toUpperCase();$("country").appendChild(option);});
    $("chart-status").textContent=codes.length?codes.length+" מצעדי מדינות זמינים · תמונת מצב מ־"+new Date(data.retrievedAt).toLocaleDateString("he-IL"):"מצעדי המדינות אינם זמינים כרגע. אפשר להתחיל עם חמשת השירים והחפיסה הקיימת.";
  }).catch(()=>{$("chart-status").textContent="לא ניתן לטעון כרגע את מצעדי המדינות."});
  function scriptJSON(url) {
    return new Promise((resolve,reject)=>{
      const key="traPersonal"+Date.now()+Math.random().toString(36).slice(2),script=document.createElement("script");
      const cleanup=()=>{clearTimeout(timer);script.remove();delete window[key];};
      const timer=setTimeout(()=>{cleanup();reject(new Error("timeout"));},7000);
      window[key]=data=>{cleanup();resolve(data);};
      script.onerror=()=>{cleanup();reject(new Error("network"));};
      script.src=url+"&callback="+key;document.head.appendChild(script);
    });
  }
  async function resolveSong(song) {
    const known=(snapshot.seeds||[]).find(s=>s.card&&core.normalize(s.request.title)===core.normalize(song.title)&&core.normalize(s.request.artist)===core.normalize(song.artist));
    if(known) return known.card;
    const data=await scriptJSON("https://itunes.apple.com/search?entity=song&media=music&limit=25&country=il&term="+encodeURIComponent(song.title+" "+song.artist));
    const match=core.matchSong(song,data.results||[]);
    return match?core.catalogCard(match):null;
  }
  function showMusicLinks(values) {
    ["spotify","apple"].forEach(p=>{const a=$(p+"-saved");a.hidden=!values[p];if(values[p]) a.href=values[p];});
  }
  $("five-form").addEventListener("submit",async event=>{
    event.preventDefault();if(busy)return;
    const songs=Array.from({length:5},(_,i)=>({title:$("song-"+i).value.trim(),artist:$("artist-"+i).value.trim()}));
    const error=core.validateSongs(songs);if(error){$("setup-error").textContent=error;return;}
    const values={name:$("nickname").value.trim().slice(0,50),songs};
    try {values.spotify=core.musicLink($("spotify-url").value,"spotify");values.apple=core.musicLink($("apple-url").value,"apple");}
    catch(error){$("setup-error").textContent=error.message;return;}
    busy=true;$("start-personal").disabled=true;$("setup-error").textContent="מכין את השירים…";
    await dataReady;
    try {
      const resolved=await Promise.all(songs.map(s=>resolveSong(s).catch(()=>null)));
      config.cards=resolved.filter(Boolean).map(c=>Object.assign({},c,{personal:true}));
      const missing=songs.filter((s,i)=>!resolved[i]).map(s=>s.title);
      const region=snapshot.countries?.[$("country").value];
      if(region) {
        try {
          const ids=region.tracks.map(r=>r.id).join(",");
          const data=await scriptJSON("https://itunes.apple.com/lookup?entity=song&country="+$("country").value+"&id="+encodeURIComponent(ids));
          (data.results||[]).forEach(item=>{const card=core.catalogCard(item);if(card&&!config.cards.some(c=>c.id===card.id))config.cards.push(card);});
        }catch(error){$("world-note").textContent="המצעד זמין לצפייה; לא ניתן היה להכין ממנו קטעי שמע."; }
        const source=document.createElement("a");source.href=region.source;source.target="_blank";source.rel="noopener noreferrer";source.textContent="מקור המצעד שנבחר";$("world-note").append(" ",source);
      }
      try{localStorage.setItem(KEY,JSON.stringify(values));}catch(error){$("personal-note").textContent="השמירה במכשיר אינה זמינה. ההגדרות תקפות למשחק הנוכחי. ";}
      $("personal-note").textContent+=(values.name?values.name+" · ":"")+"חמישה שירים נרשמו; "+resolved.filter(Boolean).length+" גרסאות זוהו בקטלוג."+ (missing.length?" עדיין לא זוהו: "+missing.join(" · ")+".":"");
      showMusicLinks(values);
      if(values.name) config.teams[0].he=values.name;
      for(const id of ["team-select","manager-team"]) {
        $(id).replaceChildren();
        config.teams.forEach(t=>{const o=document.createElement("option");o.value=t.id;o.textContent=t.he;$(id).appendChild(o);});
      }
      $("setup-modal").hidden=true;$("game-main").inert=false;$("game-main").removeAttribute("aria-hidden");
      renderScores();
      const script=document.createElement("script");script.src="hitster-original.js?v=fair-round-v1";
      script.onerror=()=>{$("personal-note").textContent+=" טעינת המשחק נכשלה. רעננו את הדף.";};
      document.body.appendChild(script);
      $("play-clip").focus();
    }finally{busy=false;$("start-personal").disabled=false;}
  });
  // One required dialog: trapping focus prevents bypassing the five-song setup.
  $("setup-modal").addEventListener("keydown",event=>{
    if(event.key==="Escape") event.preventDefault();
    if(event.key!=="Tab") return;
    const items=[...$("setup-modal").querySelectorAll("input,select,button,a[href]")].filter(n=>!n.disabled);
    const first=items[0],last=items[items.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  $("nickname").focus();
  function saveScores(){try{localStorage.setItem(SCORE_KEY,JSON.stringify(config.listenScores));}catch(error){}window.dispatchEvent(new Event("tra-listening-score"));renderScores();}
  function renderScores(){
    $("listening-scores").replaceChildren();
    config.teams.forEach(t=>{const p=document.createElement("p");p.textContent=t.he+": "+config.listenScores[t.id]+" נקודות הקשבה";$("listening-scores").appendChild(p);});
    $("undo-score").disabled=!history.length;
  }
  function change(amount){
    const id=$("manager-team").value,previous=config.listenScores[id];
    config.listenScores=core.scoreChange(config.listenScores,id,amount);
    history.push({id,previous});saveScores();
    $("manager-status").textContent=(amount>0?"נוספה נקודה על הקשבה: ":"הופחתה נקודה על הפרעה: ")+config.teams.find(t=>t.id===id).he;
  }
  $("reward-listening").addEventListener("click",()=>change(1));
  $("penalize-noise").addEventListener("click",()=>change(-1));
  $("undo-score").addEventListener("click",()=>{const last=history.pop();if(last){config.listenScores[last.id]=last.previous;saveScores();$("manager-status").textContent="שינוי הניקוד האחרון בוטל.";}});
  $("clear-scores").addEventListener("click",()=>{if(!confirm("לאפס רק את נקודות ההקשבה?"))return;config.teams.forEach(t=>config.listenScores[t.id]=0);history=[];saveScores();});
  $("edit-five").addEventListener("click",()=>location.reload());
  const lessons=[
    ["סוקרטס · שאלת בירור","מה גרם לכם לבחור דווקא בשנה הזאת? ציינו רמז אחד שאפשר לבדוק."],
    ["דייוויד יום · ראיות","האם הזיהוי נשען על ראיה מתוך השיר, או על הרגל וציפייה? מה עשוי לשנות את דעתכם?"],
    ["פיזיקה · תדר","תדר הוא מספר התנודות בשנייה, ביחידות הרץ. תדר גבוה יותר נתפס בדרך כלל כצליל גבוה יותר."],
    ["פיזיקה · עוצמה","דציבל הוא יחס לוגריתמי. עלייה של 10 דציבל בעוצמת קול פירושה פי 10 בעוצמה הפיזיקלית, לא בהכרח פי 10 בתחושת החוזק."],
    ["פיזיקה · גלי קול","קול הוא גל מכני ונזקק לתווך. הוא אינו מתקדם בריק."],
    ["חלקיקים תת־אטומיים","אטום כולל אלקטרונים וגרעין. פרוטונים וניוטרונים מורכבים מקווארקים; אלקטרונים נחשבים לחלקיקים יסודיים במודל הסטנדרטי."],
    ["קוונטים · מדידה","חיזוי תוצאות מדידה בתורת הקוונטים הוא הסתברותי. הדבר אינו אומר שמחשבות יכולות לשנות תוצאות של משחק מוזיקה."],
    ["ריבוי עולמות · לא מאומת","ריבוי עולמות הוא פירוש של מכניקת הקוונטים. רעיונות של יקומים רבים מופיעים גם בקוסמולוגיה; אלה רעיונות שונים, ואין אישור ניסויי ישיר לקיומם של יקומים כאלה."],
    ["אסטרולוגיה · נושא יצירתי","בחרו שיר שמזכיר לכם מזל בגלגל המזלות והסבירו את האסוציאציה. זו פעילות דמיון; המזל אינו קובע יכולת או ניקוד."]
  ];
  let lessonIndex=0;
  $("next-lesson").addEventListener("click",()=>{const lesson=lessons[lessonIndex++%lessons.length];$("lesson-title").textContent=lesson[0];$("lesson-text").textContent=lesson[1];});
}());
