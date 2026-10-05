"use strict";
(function(){
var groups=["ילדים","מבוגרים","ותיקים"], stage=0, current=null, revealed=false, scores=[0,0,0], used=new Set(), serial=0;
var seeds=[
["אווטאר: כשף האוויר האחרון",0],["פרוזן",0],["מלך האריות",0],["צעצוע של סיפור",0],["ספר הג׳ונגל",0],["בובספוג",0],
["Friends — חברים",1],["How I Met Your Mother — איך פגשתי את אמא",1],["משחקי הכס",1],["Breaking Bad — שובר שורות",1],["ריק ומורטי",1],["הארי פוטר",1],["שודדי הקאריביים",1],
["צלילי המוזיקה",2],["מרי פופינס",2],["קזבלנקה",2],["שיר אשיר בגשם",2],["כנר על הגג",2]];
var cards=seeds.map(function(s){return {id:++serial,title:s[0],group:s[1],url:null};});
var $=function(id){return document.getElementById(id);}, audio=$("audio");
function stop(){audio.pause();audio.currentTime=0;}
function status(s){$("status").textContent=s;}
function eligible(){return current && used.has(current.id) && Number($("respondent").value)===stage && $("respondent").value!=="";}
function readyCards(){return cards.filter(function(c){return c.group===stage&&c.url&&!used.has(c.id);});}
function render(){
$("turn").textContent="שלב "+(stage+1)+" — עכשיו תור ה"+groups[stage]+" בלבד";
$("counts").textContent="קלפים מוכנים בשלב: "+readyCards().length;
$("score").textContent=groups.map(function(g,i){return g+": "+scores[i];}).join(" · ");
$("draw").disabled=!!current||!readyCards().length;
$("replay").disabled=!current;$("stop").disabled=!current;$("reveal").disabled=!current||revealed;
$("correct").disabled=!eligible()||!revealed;$("miss").disabled=!current;
$("advance").disabled=stage===2||!!current;
$("advance").textContent=stage<2?"מעבר לשלב ה"+groups[stage+1]:"השלב האחרון";
$("answer").textContent=current&&revealed?current.title:"התשובה מוסתרת";
}
function catalog(){
$("catalog").replaceChildren();
cards.forEach(function(c){
var row=document.createElement("div");row.className="row";
var title=document.createElement("strong");title.textContent=c.title;
var select=document.createElement("select");select.setAttribute("aria-label","שלב עבור "+c.title);
groups.forEach(function(g,i){var o=document.createElement("option");o.value=i;o.textContent=g;select.appendChild(o);});select.value=c.group;
select.disabled=used.has(c.id)||current===c;select.onchange=function(){c.group=Number(select.value);render();};
var input=document.createElement("input");input.type="file";input.accept="audio/*";input.setAttribute("aria-label","שמע עבור "+c.title);input.disabled=used.has(c.id)||current===c;
var badge=document.createElement("span");badge.textContent=c.url?"שמע מוכן":"ממתין לשמע";
input.onchange=function(){var f=input.files[0];if(!f)return;if(c.url)URL.revokeObjectURL(c.url);c.url=URL.createObjectURL(f);badge.textContent="שמע מוכן";render();};
row.append(title,select,input,badge);$("catalog").appendChild(row);
});}
function play(){var id=current.id;audio.currentTime=0;audio.play().then(function(){if(current&&current.id===id){used.add(id);status("מנגן עד 30 שניות");render();}}).catch(function(){status("לא ניתן לנגן. נסו נגן שוב או בחרו קובץ אחר בהכנה.");});}
$("draw").onclick=function(){var pool=readyCards();if(current||!pool.length)return;current=pool[Math.floor(Math.random()*pool.length)];revealed=false;$("respondent").value="";audio.src=current.url;$("setup").open=false;render();play();};
$("replay").onclick=function(){if(current)play();};$("stop").onclick=stop;
$("reveal").onclick=function(){if(!current)return;revealed=true;render();};
function finish(){if(!current)return;used.add(current.id);stop();current=null;revealed=false;audio.removeAttribute("src");catalog();render();}
$("correct").onclick=function(){if(!eligible()||!revealed)return;scores[stage]++;finish();status("נקודה נוספה ל"+groups[stage]);};
$("miss").onclick=function(){finish();status("התור הסתיים ללא נקודה");};
$("respondent").onchange=render;
$("advance").onclick=function(){if(current||stage>=2)return;if(readyCards().length&&!confirm("נותרו שירים בשלב. לעבור לשלב הבא?"))return;stop();stage++;$("respondent").value="";render();status("רק "+groups[stage]+" יכולים לענות");};
$("reset").onclick=function(){if(!confirm("לאפס את הניקוד והיסטוריית השירים?"))return;stop();stage=0;current=null;revealed=false;scores=[0,0,0];used.clear();$("respondent").value="";catalog();render();status("המשחק אופס. מתחילים בילדים.");};
$("add").onsubmit=function(e){e.preventDefault();var title=$("title").value.trim();if(!title)return;if(cards.some(function(c){return c.title.toLowerCase()===title.toLowerCase();})){status("השם כבר במאגר");return;}cards.push({id:++serial,title:title,group:Number($("group").value),url:null});$("title").value="";catalog();render();};
audio.ontimeupdate=function(){if(audio.currentTime>=30)stop();};
audio.onended=function(){status("הקטע הסתיים");};
catalog();render();
}());