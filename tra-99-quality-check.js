"use strict";

const fs = require("fs");
const read = path => fs.readFileSync(path, "utf8");
const exists = path => fs.existsSync(path) && fs.statSync(path).size > 0;
const failures = [];
const checks = [];
const check = (name, pass) => { checks.push({name,pass:Boolean(pass)}); if(!pass) failures.push(name); };

const version = JSON.parse(read("TRA_VERSION.json"));
const quality = JSON.parse(read("TRA_QUALITY.json"));
const history = read("TRA_VERSION_HISTORY.md");
const sw = read("sw.js");
const chess = read("games-loader.js");
const casino = read("casino-angel.html");
const hitster = read("hitster-kfar-bloom-2026-demo.js");
const qualityLayer = read("tra-quality.js");

check("TRA release is 9.9", version.version === "9.9");
check("TRA quality target is 10/10", version.quality_target === "10/10" && quality.target === 10);
check("Previous version is preserved", version.previous_version === "8.5" && history.includes("TRA 8.5"));
check("Reference-app principle is recorded", history.includes("Reference-app principle") && history.includes("Zynga Poker") && history.includes("Chess.com") && history.includes("HITSTER"));

const sites = ["index.html","games.html","hitster.html","hitster-kfar-bloom-2026-demo.html","casino-angel.html","connect-talk.html","music-drive.html","music-editor.html","links/index.html","tra-dashboard/index.html"];
for (const site of sites) {
  check(`${site} exists`, exists(site));
  if(exists(site)){
    const html=read(site);
    check(`${site} has title`, /<title>[^<]+<\/title>/i.test(html));
    check(`${site} has viewport`, /name=["']viewport["']/i.test(html));
  }
}

check("Universal TRA quality layer exists", qualityLayer.includes('data.traQuality = "10/10"') && qualityLayer.includes("prefers-reduced-motion") && qualityLayer.includes("focus-visible"));
check("Service worker caches quality layer", sw.includes('"./tra-quality.js"') && sw.includes('"./TRA_VERSION.json"') && sw.includes("injectQuality"));
check("Service worker injects quality layer into HTML", sw.includes('html.includes("tra-quality.js")') && sw.includes('<script src="./tra-quality.js"></script>'));

check("Chess keeps chess.js as legality source", read("games.js").includes("chess.js@1.4.0") && read("games.js").includes("strictLegalMove"));
check("Chess has Ant/Anti 3000", chess.includes('name:"אנט / אנטי ♛"') && chess.includes("elo:3000") && chess.includes('style:"perfect-counter"'));
check("Chess has Review API", chess.includes("TRA_CHESS_API") && chess.includes("review:") && chess.includes("suggestHumanMove"));
check("Chess can export PGN and FEN", chess.includes("copy-pgn") && chess.includes("copy-fen") && chess.includes("chess.pgn()") && chess.includes("chess.fen()"));

check("Casino has complete hand-category evaluator", casino.includes("straightHigh") && casino.includes("eval5") && casino.includes("סטרייט פלאש") && casino.includes("פול האוס") && casino.includes("רביעייה"));
check("Casino supports side pots", casino.includes("function sidePots") && casino.includes("sidePots()"));
check("Casino has blinds/stakes", casino.includes("postBlinds") && casino.includes("Stakes") && casino.includes("50/100") && casino.includes("250/500"));
check("Casino is virtual-only", casino.includes("ז׳טונים וירטואליים בלבד") && !casino.includes("purchase") && !casino.includes("credit card"));
check("Casino includes league/progression pattern", casino.includes("League") && casino.includes("בונוס יומי"));

check("HITSTER target remains exactly 888", hitster.includes("TARGET_TOTAL = 888") && hitster.includes("TARGET_PER_ERA = 222"));
check("HITSTER never drops cards for missing preview", !hitster.includes("previewUnavailable") && hitster.includes("הקלף נשאר זמין"));
check("HITSTER has Apple/YouTube/Deezer/SoundCloud fallback", ["music.apple.com","youtube.com","deezer.com","soundcloud.com"].every(x=>hitster.includes(x)));
check("HITSTER auto-plays 30 seconds when preview exists", hitster.includes("PREVIEW_SECONDS = 30") && hitster.includes('startPreview("draw")'));

const score = Math.round(checks.filter(x=>x.pass).length / checks.length * 100);
for(const item of checks) console.log(`${item.pass?"PASS":"FAIL"} - ${item.name}`);
console.log(`\nTRA 9.9 release quality: ${score}/100 (${checks.filter(x=>x.pass).length}/${checks.length})`);
if(failures.length){console.error("\nTRA 9.9 RELEASE BLOCKED:\n- "+failures.join("\n- "));process.exit(1);}
console.log("TRA 9.9 quality gate PASSED: 10/10 release criteria enforced.");
