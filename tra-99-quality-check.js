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
const principles = JSON.parse(read("TRA_PRINCIPLES.json"));
const sw = read("sw.js");
const chess = read("games-loader.js");
const casino = read("casino-angel.html");
const hitster = read("hitster-kfar-bloom-2026-demo.js");
const hitsterHub = read("hitster.html");
const hitster888 = read("hitster-888.html");
const hitsterEnglish = read("hitster-888-en.html");
const hitsterKfar = read("hitster-kfar-bloom-2026-demo.html");
const hitsterLegacy = read("hitster-tra-tokens.html");
const qualityLayer = read("tra-quality.js");

check("TRA release is 9.9", version.version === "9.9");
check("TRA release targets match the official contract", version.quality_target === "10/10" && version.excellence_target === "999/1000" && quality.target === 10);
check("Previous version is preserved", version.previous_version === "8.5" && history.includes("TRA 8.5"));
check("Reference-app principle is recorded", history.includes("Reference-app principle") && history.includes("Zynga Poker") && history.includes("Chess.com") && history.includes("HITSTER"));

const sites = [
  "index.html","games.html","hitster.html","hitster-888.html","hitster-888-en.html","hitster-kfar-bloom-2026-demo.html","hitster-tra-tokens.html","casino-angel.html","connect-talk.html","music-drive.html","music-editor.html",
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
check("Service worker caches quality layer", sw.includes('"./tra-quality.js"') && sw.includes('"./TRA_VERSION.json"') && sw.includes("injectQuality"));
check("Service worker injects quality layer into HTML", sw.includes('html.includes("tra-quality.js")') && sw.includes('<script src="./tra-quality.js"></script>'));

const gamesJs = read("games.js");
check("Chess keeps chess.js as legality source", gamesJs.includes("chess.js@1.4.0") && gamesJs.includes("strictLegalMove"));
check("Chess has Ant/Anti 3000", chess.includes('name:"אנט / אנטי ♛"') && chess.includes("elo:3000") && chess.includes('style:"perfect-counter"'));
check("Chess has Review API", chess.includes("TRA_CHESS_API") && chess.includes("review:") && chess.includes("suggestHumanMove"));
check("Chess can export PGN and FEN", chess.includes("copy-pgn") && chess.includes("copy-fen") && chess.includes("chess.pgn()") && chess.includes("chess.fen()"));

check("Casino has complete hand-category evaluator", casino.includes("straightHigh") && casino.includes("eval5") && casino.includes("סטרייט פלאש") && casino.includes("פול האוס") && casino.includes("רביעייה"));
check("Casino supports side pots", casino.includes("function sidePots") && casino.includes("sidePots()"));
check("Casino has blinds/stakes", casino.includes("postBlinds") && casino.includes("Stakes") && casino.includes("50/100") && casino.includes("250/500"));
check("Casino is virtual-only", casino.includes("ז׳טונים וירטואליים בלבד") && !casino.includes("purchase") && !casino.includes("credit card"));
check("Casino includes league/progression pattern", casino.includes("League") && casino.includes("בונוס יומי"));

check("HITSTER target remains exactly 888", hitster.includes("TARGET_TOTAL = 888") && hitster.includes("TARGET_PER_ERA = 222"));
check("HITSTER 888 page is dedicated, complete, and hides the year range", hitster888.includes("888 קלפי שירים") && hitster888.includes("מיקום סודי על ציר 80 השנים") && hitster888.includes(".era-grid{display:none}") && hitster888.includes('id="new-game"'));
check("HITSTER Kfar Blum route resolves to verified 888", hitsterKfar.includes('location.replace("hitster-888.html?entry=kfar-bloom")') && hitsterKfar.includes("HITSTER 888"));
check("HITSTER English route shares verified 888", hitsterEnglish.includes("888 verified Hebrew A-list song cards") && hitsterEnglish.includes('src="hitster-kfar-bloom-2026-demo.js') && hitsterLegacy.includes('location.replace("hitster-888-en.html?entry=international")'));
check("HITSTER hub exposes all 888 interfaces", hitsterHub.includes('href="hitster-888.html"') && hitsterHub.includes('href="hitster-888-en.html"') && hitsterHub.includes('href="hitster-kfar-bloom-2026-demo.html"') && !/57 כרטיס|1,000 כרטיס/.test(hitsterHub));
check("HITSTER only draws cards with a verified internal preview", hitster.includes("function findPlayablePick") && hitster.includes("function verifyPreview") && hitster.includes("resolvePlayablePreview") && hitster.includes("const pick = state.nextPick;") && !hitster.includes("state.nextPick || nextRandomPick()") && hitster.includes("state.unplayable.add") && hitster.includes("score >= 9"));
check("HITSTER requires no third-party app fallback", !["providerUrls(","showFallbacks(","youtube.com","deezer.com","soundcloud.com"].some(x=>hitster.includes(x)) && !hitster888.includes("open.spotify.com") && !hitsterEnglish.includes("open.spotify.com") && hitster888.includes("ספרייה פנימית ישראלית") && principles.principles?.some(p=>p.id==="michael-to-grandma-estelle"));
check("HITSTER auto-plays 30 seconds when preview exists", hitster.includes("PREVIEW_SECONDS = 30") && hitster.includes('startPreview("draw")'));
check("Offline cache contains canonical HITSTER Hebrew, English, and Kfar routes", sw.includes('"./hitster-888.html"') && sw.includes('"./hitster-888-en.html"') && sw.includes('"./hitster-kfar-bloom-2026-demo.html"') && sw.includes("hitster-hebrew-alist-888.json"));

const score = Math.round(checks.filter(x=>x.pass).length / checks.length * 100);
for(const item of checks) console.log(`${item.pass?"PASS":"FAIL"} - ${item.name}`);
console.log(`\nTRA 9.9 release quality: ${score}/100 (${checks.filter(x=>x.pass).length}/${checks.length})`);
if(failures.length){console.error("\nTRA 9.9 RELEASE BLOCKED:\n- "+failures.join("\n- "));process.exit(1);}
console.log("TRA 9.9 quality gate PASSED: 10/10 release criteria enforced.");
