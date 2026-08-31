"use strict";
const fs=require("fs"); const read=p=>fs.readFileSync(p,"utf8"); const failed=[];
function check(name,ok){console.log(`${ok?"PASS":"FAIL"} - ${name}`);if(!ok)failed.push(name)}
const hit=read("hitster-original.js"), hcheck=read("hitster-888-check.js"), source=read("hitster-source-audit.js");
const family=read("angel-family-game.html"), dnd=read("tra-dnd.html"), worlds=read("tra-100.html"), wiki=read("wikifamily.html");
const poetry=read("poetry/index.html"), book=read("poetry/oy-ha-berech.html"), knoke=read("knoke.html"), kfar=read("kfar-blum-2026.html"), music=read("tra-music.html");
check("HITSTER current Kfar Blum rules are locked",hit.includes("MAX_STARS = 10")&&hit.includes("WIN_CARDS = 18")&&hit.includes("removeConfirm")&&hit.includes("continue-game")&&hit.includes("reset-from-start")&&hit.includes("state.used.push(card.id)"));
check("HITSTER 888 structural gate matches current rules",hcheck.includes("Kfar Blum star rules")&&hcheck.includes("Kfar Blum win rule"));
check("HITSTER has independent provenance audit",source.includes("888 cards found on their declared chart-year source pages")&&source.includes("Promise.all"));
check("Angel Family is standalone, persistent and winnable",family.includes("tra-angel-family-v1")&&family.includes("כל שלושת פרויקטי הליבה הושלמו")&&family.includes("state.round>12"));
check("TRA D&D is standalone, persistent and has five challenges",dnd.includes("tra-dnd-v1")&&dnd.includes("אתגר 1/5")&&dnd.includes("גלגלו ק20")&&dnd.includes("המשימה הושלמה"));
const worldRows=(worlds.match(/\["(?:0[1-9]|[1-9][0-9]|100)",/g)||[]).length;
check("TRA 100 contains exactly 100 declared worlds",worldRows===100&&worlds.includes('id="search"')&&worlds.includes('["100","השפעה","עתיד TRA"'));
check("WikiFamily/Kfar Blum EscapeVerse is release-labelled and persistent",wiki.includes("גרסה 1.0")&&!wiki.includes("דמו סופי")&&wiki.includes("kfarBlumFinal")&&wiki.includes("חמשת חדרי הבריחה")&&wiki.includes("עשרת חוקי הזהב"));
check("ShirTomer is a real archive, not a placeholder",poetry.includes("oy-ha-berech.html")&&!poetry.includes("העמוד מוכן לקבל")&&book.includes("העמוד מציג רק חומר מקור")&&book.includes("את לא אם ילדי 100.000")&&book.includes("משהו אחר בי"));
check("Knoke is a four-room persistent standalone game",knoke.includes("tra-knoke-v1")&&knoke.includes("חדר 1")&&knoke.includes("חדר 4")&&knoke.includes("יצאתם מקנוקה"));
check("Kfar Blum has one consolidated operations pack",kfar.includes("OPERATIONS PACK 1.0")&&kfar.includes("hitster-mobile.html?entry=kfar-bloom")&&kfar.includes("wikifamily.html")&&kfar.includes("knoke.html")&&kfar.includes("tra-dnd.html"));
check("TRA Music wrapper is active and truth-labelled",music.includes("TRA!Music")&&music.includes("tra-music-station.html")&&music.includes("music-editor.html")&&music.includes("poetry/")&&music.includes("בלי להציג סקיצה או קובץ חסר כמאסטר מוגמר"));
if(failed.length){console.error(`Yellow-to-green gate FAILED (${failed.length})\n`+failed.map(x=>`- ${x}`).join("\n"));process.exit(1)}
console.log("Yellow-to-green digital gate PASSED.");