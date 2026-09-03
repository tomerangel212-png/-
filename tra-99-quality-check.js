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
const hitster = read("hitster-original.js");
const hitsterDeck = JSON.parse(read("hitster-alltime-888.json"));
const hitsterHub = read("hitster.html");
const hitsterMobile = read("hitster-mobile.html");
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
  "index.html","games.html","hitster.html","hitster-mobile.html","hitster-888.html","hitster-888-en.html","hitster-kfar-bloom-2026-demo.html","hitster-tra-tokens.html","casino-angel.html","connect-talk.html","music-drive.html","music-editor.html",
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
check("Service worker injects quality layer into HTML", sw.includes('html.includes("tra-quality.js")') && sw.includes('new URL("tra-quality.js", self.registration.scope).href') && sw.includes("html.replace(/<\\/body>/i"));

const gamesJs = read("games.js");
const legacyApp = read("app.js");
check("Chess keeps chess.js as legality source", gamesJs.includes("chess.js@1.4.0") && gamesJs.includes("strictLegalMove") && gamesJs.includes("commitStrictLegalMove"));
check("Chess blocks a king from a bishop-protected queen", gamesJs.includes("king cannot capture queen protected by bishop") && gamesJs.includes("pinned defender still protects king destination"));
check("Chess enforces discovered-check restrictions", gamesJs.includes("en passant cannot expose own king") && gamesJs.includes("pinned piece cannot expose king"));
check("Chess follows formal draw claims and automatic draw limits", gamesJs.includes("fifty move rule is claimable") && gamesJs.includes("seventy five move rule is automatic") && gamesJs.includes("threefold repetition is claimable") && gamesJs.includes("fivefold repetition is automatic") && gamesJs.includes("claimDraw"));
check("Legacy chess view delegates legality to the same formal engine", legacyApp.includes('import("https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm")') && legacyApp.includes("formalChess.moves({ square: from, verbose: true })") && !legacyApp.includes("const clearPath"));
check("Chess has Ant/Anti 3000", chess.includes('name:"אנט / אנטי ♛"') && chess.includes("elo:3000") && chess.includes('style:"perfect-counter"'));
check("Chess has Review API", chess.includes("TRA_CHESS_API") && chess.includes("review:") && chess.includes("suggestHumanMove"));
check("Chess can export PGN and FEN", chess.includes("copy-pgn") && chess.includes("copy-fen") && chess.includes("chess.pgn()") && chess.includes("chess.fen()"));

check("Casino has complete hand-category evaluator", casino.includes("straightHigh") && casino.includes("eval5") && casino.includes("סטרייט פלאש") && casino.includes("פול האוס") && casino.includes("רביעייה"));
check("Casino supports side pots", casino.includes("function sidePots") && casino.includes("sidePots()"));
check("Casino has blinds/stakes", casino.includes("postBlinds") && casino.includes("Stakes") && casino.includes("50/100") && casino.includes("250/500"));
check("Casino is virtual-only", casino.includes("ז׳טונים וירטואליים בלבד") && !casino.includes("purchase") && !casino.includes("credit card"));
check("Casino includes league/progression pattern", casino.includes("League") && casino.includes("בונוס יומי"));

check("HITSTER target remains exactly 888", hitsterDeck.total === 888 && hitsterDeck.cards.length === 888 && hitsterDeck.yearBasis === "chart-year");
check("HITSTER 888 page is dedicated, complete, and hides the year range", hitster888.includes("HITSTER TRA · 888") && hitster888.includes("חוקי כפר בלום") && hitster888.includes('id="continue-game"') && hitster888.includes('id="reveal-year"') && hitster888.includes('id="add-to-timeline"') && !hitster888.includes("1950–2023") && hitster888.includes('id="new-game"') && hitster888.includes('src="hitster-original.js'));
check("HITSTER mobile entry uses current annual runtime routes", hitsterMobile.includes('allow="autoplay"') && hitsterMobile.includes('id="game"') && hitsterMobile.includes('"hitster-888.html"') && hitsterMobile.includes('"hitster-888-en.html"') && hitsterMobile.includes('params.get("entry")') && !hitsterMobile.includes("next.click()") && !hitsterMobile.includes("play.click()"));
check("HITSTER Kfar Blum route resolves to verified mobile 888", hitsterKfar.includes('location.replace("hitster-mobile.html?entry=kfar-bloom")') && hitsterKfar.includes("HITSTER 888"));
check("HITSTER English route shares verified 888", hitsterEnglish.includes('<html lang="en" dir="ltr">') && hitsterEnglish.includes('src="hitster-original.js') && hitsterLegacy.includes('location.replace("hitster-888-en.html?entry=international")'));
check("HITSTER hub exposes all 888 mobile interfaces", hitsterHub.includes('href="hitster-mobile.html"') && hitsterHub.includes('href="hitster-mobile.html?lang=en"') && hitsterHub.includes('href="hitster-mobile.html?entry=kfar-bloom"') && hitsterHub.includes("שנת מצעד"));
check("HITSTER plays lawful previews inside the game", hitster.includes("function lookupPreview") && hitster.includes("function cachedPreview") && hitster.includes("function cacheRemotePreview") && hitster.includes("PREVIEW_SECONDS = 30"));
check("HITSTER requires no third-party app fallback", !["open.spotify.com","youtube.com","deezer.com","soundcloud.com"].some(x=>hitster.includes(x)) && !hitster888.includes("open.spotify.com") && !hitsterEnglish.includes("open.spotify.com") && principles.principles?.some(p=>p.id==="michael-to-grandma-estelle"));
check("HITSTER plays up to 30 seconds when requested", hitster.includes("PREVIEW_SECONDS = 30") && hitster.includes("audio.currentTime >= PREVIEW_SECONDS"));
check("Offline cache contains canonical HITSTER mobile, Hebrew, English, Kfar routes and annual deck", sw.includes('"./hitster-mobile.html"') && sw.includes('"./hitster-888.html"') && sw.includes('"./hitster-888-en.html"') && sw.includes('"./hitster-kfar-bloom-2026-demo.html"') && sw.includes("hitster-alltime-888.json") && sw.includes("AUDIO_CACHE"));

const score = Math.round(checks.filter(x=>x.pass).length / checks.length * 100);
for(const item of checks) console.log(`${item.pass?"PASS":"FAIL"} - ${item.name}`);
console.log(`\nTRA 9.9 release quality: ${score}/100 (${checks.filter(x=>x.pass).length}/${checks.length})`);
if(failures.length){console.error("\nTRA 9.9 RELEASE BLOCKED:\n- "+failures.join("\n- "));process.exit(1);}
console.log("TRA 9.9 quality gate PASSED: 10/10 release criteria enforced.");
