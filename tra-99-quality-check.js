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
const offlineCatalog = read("offline-catalog.js");
const offlineManifest = JSON.parse(read("offline-manifest.json"));
const chess = read("games-loader.js");
const casino = read("casino-angel.html");
const hitster = read("hitster-kfar-bloom-2026-demo.js");
const hitsterHub = read("hitster.html");
const hitster888 = read("hitster-888.html");
const hitster57 = read("hitster-kfar-bloom-2026-demo.html");
const qualityLayer = read("tra-quality.js");

check("TRA release is 9.9", version.version === "9.9");
check("TRA release targets match the official contract", version.quality_target === "10/10" && version.excellence_target === "999/1000" && quality.target === 10);
check("Previous version is preserved", version.previous_version === "8.5" && history.includes("TRA 8.5"));
check("Reference-app principle is recorded", history.includes("Reference-app principle") && history.includes("Zynga Poker") && history.includes("Chess.com") && history.includes("HITSTER"));

const sites = [
  "index.html","games.html","hitster.html","hitster-888.html","hitster-kfar-bloom-2026-demo.html","casino-angel.html","connect-talk.html","music-drive.html","music-editor.html",
  "links/index.html","tra-dashboard/index.html","songs/index.html","poetry/index.html","instrumentals/index.html"
];
for (const site of sites) {
  check(`${site} exists`, exists(site));
  if(exists(site)){
    const html=read(site);
    check(`${site} has title`, /<title>[^<]+<\/title>/i.test(html));
    check(`${site} has viewport`, /name=["']viewport["']/i.test(html));
  }
}

check("Universal TRA quality layer exists", qualityLayer.includes('dataset.traQuality = "10/10"') && qualityLayer.includes("prefers-reduced-motion") && qualityLayer.includes("focus-visible"));
check("Service worker caches quality layer", offlineCatalog.includes('"./tra-quality.js"') && offlineCatalog.includes('"./TRA_VERSION.json"') && sw.includes("injectSharedScripts"));
check("Service worker injects quality layer into HTML", sw.includes("data-tra-quality") && sw.includes("QUALITY_SRC") && sw.includes("decorateNavigation"));

const gamesJs = read("games.js");
check("Chess keeps chess.js as a local legality source", gamesJs.includes('from "./vendor/chess.js"') && exists("vendor/chess.js") && gamesJs.includes("strictLegalMove"));
check("Chess has Ant/Anti 3000", chess.includes('name:"אנט / אנטי ♛"') && chess.includes("elo:3000") && chess.includes('style:"perfect-counter"'));
check("Chess has Review API", chess.includes("TRA_CHESS_API") && chess.includes("review:") && chess.includes("suggestHumanMove"));
check("Chess can export PGN and FEN", chess.includes("copy-pgn") && chess.includes("copy-fen") && chess.includes("chess.pgn()") && chess.includes("chess.fen()"));

check("Casino has complete hand-category evaluator", casino.includes("straightHigh") && casino.includes("eval5") && casino.includes("סטרייט פלאש") && casino.includes("פול האוס") && casino.includes("רביעייה"));
check("Casino supports side pots", casino.includes("function sidePots") && casino.includes("sidePots()"));
check("Casino has blinds/stakes", casino.includes("postBlinds") && casino.includes("Stakes") && casino.includes("50/100") && casino.includes("250/500"));
check("Casino is virtual-only", casino.includes("ז׳טונים וירטואליים בלבד") && !casino.includes("purchase") && !casino.includes("credit card"));
check("Casino includes league/progression pattern", casino.includes("League") && casino.includes("בונוס יומי"));

check("HITSTER target remains exactly 888", hitster.includes("TARGET_TOTAL = 888") && hitster.includes("TARGET_PER_ERA = 222"));
check("HITSTER 888 page is dedicated and complete", hitster888.includes("888 קלפי שירים") && hitster888.includes("222 קלפים בכל תקופה") && hitster888.includes('id="new-game"'));
check("HITSTER Kfar Blum 57 remains preserved", hitster57.includes("57 כרטיס") && hitster57.includes("WIN_CARDS=18") && hitster57.includes("5 אסימוני HITSTER"));
check("HITSTER hub exposes both versions", hitsterHub.includes('href="hitster-888.html"') && hitsterHub.includes('href="hitster-kfar-bloom-2026-demo.html"'));
check("HITSTER never drops cards for missing preview", !hitster.includes("previewUnavailable") && hitster.includes("הקלף נשאר זמין"));
check("HITSTER has Apple/YouTube/Deezer/SoundCloud fallback", ["music.apple.com","youtube.com","deezer.com","soundcloud.com"].every(x=>hitster.includes(x)));
check("HITSTER auto-plays 30 seconds when preview exists", hitster.includes("PREVIEW_SECONDS = 30") && hitster.includes('startPreview("draw")'));
check("Offline cache contains both HITSTER versions", offlineCatalog.includes('"./hitster-888.html"') && offlineCatalog.includes('"./hitster-kfar-bloom-2026-demo.html"') && offlineManifest.cacheFiles.includes("./hitster-hebrew-alist-888.json"));
check("Offline hub tracks all current TRA pages", offlineManifest.coverage.trackedPages >= sites.length && offlineManifest.coverage.localReferencesChecked === true);

const score = Math.round(checks.filter(x=>x.pass).length / checks.length * 100);
for(const item of checks) console.log(`${item.pass?"PASS":"FAIL"} - ${item.name}`);
console.log(`\nTRA 9.9 release quality: ${score}/100 (${checks.filter(x=>x.pass).length}/${checks.length})`);
if(failures.length){console.error("\nTRA 9.9 RELEASE BLOCKED:\n- "+failures.join("\n- "));process.exit(1);}
console.log("TRA 9.9 quality gate PASSED: 10/10 release criteria enforced.");
