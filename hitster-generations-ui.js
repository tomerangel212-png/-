"use strict";
(function(){
 const $=id=>document.getElementById(id),core=window.HitsterGenerationRounds,KEY='tra-hitster-three-generations-v2';
 let cards=[],game=null,saved=null,revealed=false,played=false,timer=null;
 const audio=$('audio');
 const note=t=>{$('status').textContent=t;};
 function save(){if(!game)return;try{localStorage.setItem(KEY,JSON.stringify({state:game.serialize(),revealed,played}));saved={state:game.serialize(),revealed,played};}catch(e){$('storage-note').textContent='השמירה במכשיר חסומה. המשחק יעבוד, אך ההתקדמות תאבד בסגירת הדף.';}}
 function stop(){clearTimeout(timer);timer=null;audio.pause();}
 function clearAudio(){stop();audio.removeAttribute('src');audio.load();}
 function safeURL(value,media=false){try{const u=new URL(value);return u.protocol==='https:'&&(media?u.hostname.endsWith('.itunes.apple.com'):u.hostname==='music.apple.com')?u.href:'';}catch(e){return '';}}
 function loadCurrent(){clearAudio();const card=game.currentCard();if(card)audio.src=safeURL(card.previewUrl,true);$('responder').value='';}
 function render(){
  const s=game?game.serialize():null,stage=game?game.currentStage():core.GENERATION_STAGES[0],card=game&&game.currentCard();
  $('stages').replaceChildren();
  core.GENERATION_STAGES.forEach((x,i)=>{const li=document.createElement('li');li.textContent=x.label;li.className=s&&(s.finished||i<s.stageIndex)?'done':x.id===stage.id?'active':'';if(li.className==='active')li.setAttribute('aria-current','step');$('stages').append(li);});
  if(!game)return;
  const finished=game.isFinished();$('game').hidden=finished;$('summary').hidden=!finished;
  $('stage-title').textContent=stage.label;$('eligible').textContent='עכשיו עונים: '+stage.eligibleLabel;
  $('progress').textContent=s.completedByStage[stage.id]+' / '+s.quotaPerStage+' תשובות נכונות · '+game.availableCards().length+' שירים נוספים';
  $('draw').disabled=!!card||finished||!game.availableCards().length;
  $('play').disabled=!card||finished;$('stop').disabled=!card||audio.paused;$('play').textContent=audio.paused?'▶ נגן / המשך':'❚❚ השהה';
  $('reveal').disabled=!card||!played||revealed;$('solution').hidden=!card||!revealed;$('judge').hidden=!card||!revealed;
  $('empty').hidden=finished||!!card||!!game.availableCards().length;
  if(card&&revealed){$('song').textContent=card.title;$('artist').textContent=card.artist;$('year').textContent='שנת הגרסה בקטלוג: '+card.year;$('source').href=safeURL(card.sourceUrl);}
  if(finished){clearAudio();$('scores').replaceChildren();core.GENERATION_STAGES.forEach(x=>{const p=document.createElement('p');p.textContent=x.label+': '+s.completedByStage[x.id]+' תשובות נכונות';$('scores').append(p);});note('סיימנו — ילדים, מבוגרים וותיקים קיבלו תור.');}
 }
 function begin(resume){
  if(!resume&&saved&&!window.confirm('להתחיל משחק חדש ולמחוק את ההתקדמות של מצב שלושה דורות?'))return;
  const quota=resume?saved.state.quotaPerStage:Number($('quota').value);
  try{game=core.createGenerationRounds({cards,quotaPerStage:quota,restoredState:resume?saved.state:null});}catch(e){note('המשחק השמור אינו תקין. בחרו משחק חדש.');return;}
  revealed=!!(resume&&saved.revealed&&game.currentCard());played=!!(resume&&saved.played&&game.currentCard());
  $('setup').hidden=true;loadCurrent();save();render();if(!game.isFinished())note('המנחה מוודא שרק '+game.currentStage().eligibleLabel+' עונים.');
 }
 $('start').addEventListener('click',()=>begin(false));$('resume').addEventListener('click',()=>begin(true));
 $('draw').addEventListener('click',()=>{const result=game.draw();if(!result.ok)return;revealed=false;played=false;$('unavailable').hidden=true;loadCurrent();save();render();note('הקלף מוכן. לחצו נגן, ואז ענו בקול.');});
 $('play').addEventListener('click',()=>{
  if(!game||!game.currentCard())return;
  if(!audio.paused){stop();render();return;}
  if(audio.currentTime>=30)audio.currentTime=0;
  // play stays inside the actual user gesture, including iOS Safari.
  audio.play().then(()=>{played=true;save();render();note('רק '+game.currentStage().eligibleLabel+' עונים.');}).catch(()=>{$('unavailable').hidden=false;note('הקטע לא התחיל. נסו נגן שוב, או החליפו ללא ניקוד.');render();});
 });
 audio.addEventListener('playing',()=>{clearTimeout(timer);timer=setTimeout(()=>{stop();audio.currentTime=0;render();},Math.max(0,30-audio.currentTime)*1000);});
 audio.addEventListener('timeupdate',()=>{if(audio.currentTime>=30){stop();audio.currentTime=0;render();}});
 audio.addEventListener('ended',()=>{stop();render();});audio.addEventListener('error',()=>{if(game&&game.currentCard()){$('unavailable').hidden=false;note('קטע השמע אינו זמין. אפשר להחליף ללא ניקוד.');}});
 $('stop').addEventListener('click',()=>{stop();audio.currentTime=0;render();});
 $('reveal').addEventListener('click',()=>{if(!played||!game.currentCard())return;stop();revealed=true;save();render();note('המנחה בודק את התשובה שכבר נאמרה ואת דור המשיב.');});
 function judge(correct){
  if(!revealed)return;
  const result=game.acceptAnswer({responderAudience:$('responder').value,correct});
  if(!result.ok){note('התשובה לא נספרה. בדרגה זו רשאים לענות '+game.currentStage().eligibleLabel+' בלבד.');return;}
  clearAudio();revealed=false;played=false;$('unavailable').hidden=true;$('responder').value='';save();render();
  if(!game.isFinished())note(result.advanced?'עוברים ל'+game.currentStage().label+' — '+game.currentStage().eligibleLabel+' עונים.':correct?'נכון! נקודה לדור הפעיל.':'לא נוספה נקודה. ממשיכים לשיר הבא באותה דרגה.');
 }
 $('correct').addEventListener('click',()=>judge(true));$('wrong').addEventListener('click',()=>judge(false));
 $('unavailable').addEventListener('click',()=>{if(!game.skipUnavailable())return;clearAudio();played=false;revealed=false;$('unavailable').hidden=true;save();render();note('השיר הוחלף ללא ניקוד ולא יופיע שוב במשחק הזה.');});
 $('empty').addEventListener('click',()=>{if(!window.confirm('לא נשארו שירים בדרגה הזו. להמשיך עם הניקוד שנצבר?'))return;if(game.finishEmptyStage()){save();render();}});
 function setup(){clearAudio();$('game').hidden=true;$('summary').hidden=true;$('setup').hidden=false;$('resume').hidden=!saved;note('בחרו משחק חדש או המשיכו את המשחק השמור.');}
 $('reset').addEventListener('click',setup);$('again').addEventListener('click',setup);
 render();
 fetch('hitster-generations-data.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('HTTP');return r.json();}).then(d=>{
  if(!core.validateGenerationDeck(d.cards).ok)throw Error('Invalid deck');
  cards=d.cards;
  try{saved=JSON.parse(localStorage.getItem(KEY)||'null');if(!saved||!saved.state)saved=null;}catch(e){$('storage-note').textContent='אין משחק שמור זמין. אפשר להתחיל משחק חדש.';}
  $('start').disabled=false;$('resume').hidden=!saved;note(cards.length+' שירים מוכנים בשלוש דרגות.');
 }).catch(()=>note('לא ניתן לטעון את מאגר השירים. בדקו חיבור ורעננו.'));
})();
