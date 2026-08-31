"use strict";

const fs = require("fs");
const read = path => fs.readFileSync(path, "utf8");
const gamesHtml = read("games.html");
const gamesJs = read("games.js");
const gamesHubJs = read("games-hub.js");
const gamesCss = read("games.css");
const mainHtml = read("index.html");
const linksHtml = read("links/index.html");
const hitsterHub = read("hitster.html");
const hitsterMobile = read("hitster-mobile.html");
const hitster888 = read("hitster-888.html");
const hitsterEnglish = read("hitster-888-en.html");
const hitsterKfar = read("hitster-kfar-bloom-2026-demo.html");
const musicEditor = read("music-editor.html");
const whatCountry = read("what-country.html");

const gameNumbers = [...gamesHtml.matchAll(/data-game-number="(\d+)"/g)].map(match => Number(match[1]));
const expectedNumbers = Array.from({length:17},(_,index)=>index+1);
const countryCodes = [...whatCountry.matchAll(/"code":"([A-Z]{2})"/g)].map(match=>match[1]);
const countryNames = [...whatCountry.matchAll(/"name":"([^"]+)"/g)].map(match=>match[1]);
const checks = [
  {name:"TRA Games is a 17-game hub",pass:gameNumbers.length===17&&expectedNumbers.every(n=>gameNumbers.includes(n))&&gamesHtml.includes('id="all-games"')},
  {name:"HITSTER is flagship, not the only destination",pass:gamesHtml.includes("⭐ משחק הדגל")&&gamesHtml.includes("HITSTER TRA · 888")&&gamesHtml.includes('data-game-number="16"')&&gamesHtml.includes("מי רוצה להיות עורך מוזיקלי?")},
  {name:"What Country is game 17 with all 195 unique countries",pass:gamesHtml.includes('data-game-number="17"')&&gamesHtml.includes('href="what-country.html"')&&gamesHtml.includes("מה המדינה?")&&countryCodes.length===195&&new Set(countryCodes).size===195&&countryNames.length===195&&new Set(countryNames).size===195&&whatCountry.includes("choicesFor")&&whatCountry.includes("deck=shuffle(COUNTRIES)")},
  {name:"HITSTER hub exposes one verified 888 deck through mobile Hebrew, English and Kfar Blum routes",pass:
    gamesHtml.includes('href="hitster.html"')&&
    hitsterHub.includes("888 קלפי A-list")&&
    hitsterHub.includes('href="hitster-mobile.html"')&&
    hitsterHub.includes('href="hitster-mobile.html?lang=en"')&&
    hitsterHub.includes('href="hitster-mobile.html?entry=kfar-bloom"')&&
    !/57 כרטיס|1,000 כרטיס|350 הקלפים|444 קלפי/.test(hitsterHub)&&
    hitsterMobile.includes('allow="autoplay"')&&
    hitsterMobile.includes('id="game"')&&
    hitsterMobile.includes('params.get("entry")')&&
    !hitsterMobile.includes("next.click()")&&
    !hitsterMobile.includes("play.click()")&&
    hitster888.includes("חוקי כפר בלום")&&
    hitster888.includes('id="continue-game"')&&
    hitster888.includes("18 קלפים")&&
    hitsterEnglish.includes("KFAR BLUM RULES")&&hitsterEnglish.includes('src="hitster-original.js')&&
    hitsterKfar.includes('location.replace("hitster-mobile.html?entry=kfar-bloom")')},
  {name:"Every game card has a play control",pass:(gamesHtml.match(/class="launch(?: [^"]*)?"/g)||[]).length>=17},
  {name:"Quick Play is wired for games without standalone pages",pass:gamesHtml.includes("games-hub.js")&&gamesHubJs.includes("tra_games_hub_opened")&&gamesHubJs.includes("openQuickGame")&&gamesHubJs.includes("quick-play")&&gamesHubJs.includes("game_count: 17")},
  {name:"Music Editor game is standalone and has 15 stages",pass:gamesHtml.includes('href="music-editor.html"')&&musicEditor.includes("מי רוצה להיות עורך מוזיקלי?")&&musicEditor.includes("15 החלטות מקצועיות")&&musicEditor.includes("1000000")&&musicEditor.includes("50:50")},
  {name:"Family Musical Journey is exposed in main links",pass:linksHtml.includes("נסיעה מוזיקלית משפחתית")&&linksHtml.includes('href="../music-drive.html"')},
  {name:"TRA Chess entry point exists",pass:gamesHtml.includes('id="chess"')&&gamesHtml.includes("TRA Chess")&&gamesCss.includes(".board")},
  {name:"All four TRA bots are selectable",pass:["shaked","tomer","shiki","matan"].every(id=>gamesHtml.includes(`value="${id}"`))},
  {name:"Bot strengths are locked to 20/40/60/80",pass:/shaked[\s\S]*?strength:20/.test(gamesJs)&&/tomer[\s\S]*?strength:40/.test(gamesJs)&&/shiki[\s\S]*?strength:60/.test(gamesJs)&&/matan[\s\S]*?strength:80/.test(gamesJs)},
  {name:"Bots have distinct personality styles",pass:gamesJs.includes('style:"modern-queen"')&&gamesJs.includes('style:"classical-minors"')&&gamesJs.includes('style:"initiative"')&&gamesJs.includes('style:"balanced-tactical"')},
  {name:"Chess legality is delegated to chess.js",pass:gamesJs.includes("chess.js@1.4.0")&&gamesJs.includes("strictLegalMove")&&gamesJs.includes("chess.moves({square")},
  {name:"Checkmate and stalemate are handled separately",pass:gamesJs.includes("isCheckmate()")&&gamesJs.includes("isStalemate()")&&gamesJs.includes("stalemate remains a draw")},
  {name:"Illegal king movement regression tests exist",pass:gamesJs.includes("king cannot move into rook check")&&gamesJs.includes("king cannot stay in check")&&gamesJs.includes("king cannot capture protected piece")&&gamesJs.includes("kings cannot become adjacent")&&gamesJs.includes("castle through check blocked")},
  {name:"Special chess rules are regression-tested",pass:gamesJs.includes("en passant available immediately")&&gamesJs.includes("en passant expires after the immediate reply")&&gamesJs.includes("promotion exposes queen rook bishop knight")&&gamesJs.includes("fifty move rule remains a draw")},
  {name:"Promotion offers all four legal pieces",pass:gamesJs.includes("מלכה (Q)")&&gamesJs.includes("צריח (R)")&&gamesJs.includes("רץ (B)")&&gamesJs.includes("סוס (N)")&&gamesJs.includes("promotionChoiceRequired")&&gamesJs.includes('piece.color==="w"&&to[1]==="8"')&&gamesJs.includes('piece.color==="b"&&to[1]==="1"')&&gamesJs.includes('מלכה:"q"')&&gamesJs.includes('צריח:"r"')&&gamesJs.includes('רץ:"b"')&&gamesJs.includes('סוס:"n"')},
  {name:"Bot move engine and telemetry are wired",pass:gamesJs.includes("scheduleBotMove")&&gamesJs.includes("chooseBotMove")&&gamesJs.includes('track("chess_bot_move"')&&gamesJs.includes('track("chess_bot_selected"')},
  {name:"Main TRA page exposes games and chess",pass:mainHtml.includes('./games.html#chess')&&mainHtml.includes("TRA Chess")&&mainHtml.includes("כל 17 המשחקים")},
  {name:"TRA Links sends Games to the hub, not HITSTER",pass:linksHtml.includes('<div class="title">TRA Games</div>')&&linksHtml.includes('href="../games.html"')&&linksHtml.includes('href="../games.html#chess"')}
];

const failed=checks.filter(check=>!check.pass);
const score=Math.round((checks.length-failed.length)/checks.length*100);
for(const check of checks)console.log(`${check.pass?"PASS":"FAIL"} - ${check.name}`);
console.log(`\nTRA Games quality score: ${score}/100 (${checks.length-failed.length}/${checks.length})`);
if(failed.length){console.error("\nTRA Games quality gate FAILED.");process.exit(1);}
console.log("TRA Games quality gate PASSED: 100/100.");
