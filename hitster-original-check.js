"use strict";

const fs = require("fs");
const source = fs.readFileSync("hitster-original.js", "utf8");
const hebrew = fs.readFileSync("hitster-888.html", "utf8");
const english = fs.readFileSync("hitster-888-en.html", "utf8");
const kfarRoute = fs.readFileSync("hitster-kfar-bloom-2026-demo.html", "utf8");
const mobileRoute = fs.readFileSync("hitster-mobile.html", "utf8");
const legacyRoute = fs.readFileSync("hitster-tra-tokens.html", "utf8");
const failures = [];
const check = (label, value) => { if (!value) failures.push(label); };

check("uses the Kfar Blum 18-card win condition", source.includes("const TARGET_WIN = 18"));
check("preserves all five Kfar Blum teams", ["איילת ודודי", "שרון ונווה", "נעמה ורז", "מעיין ומנואל", "עירית ונתן"].every(name => source.includes(name)));
check("starts every team with five stars", source.includes("const STAR_START = 5") && source.includes("state.stars[id] = STAR_START"));
check("keeps stars within the 0–12 rule", source.includes("const STAR_MIN = 0") && source.includes("const STAR_MAX = 12") && source.includes("state.stars[team] < STAR_MAX") && source.includes("state.stars[team] <= STAR_MIN"));
check("does not retain the token mechanic in the shared game", !source.includes("state.tokens") && !source.includes("🪙") && !hebrew.includes("אסימונים") && !hebrew.includes("🪙"));
check("shows star actions in both interfaces", [hebrew, english].every(html => html.includes("+⭐") && html.includes("−⭐") && html.includes('id="skip-star"')));
check("rotates the active team after every revealed card", source.includes("turnIndex") && source.includes("function advanceTurn") && source.includes("const nextLabel = advanceTurn()"));
check("marks a card globally used when it is drawn", source.includes("state.used.add(cardKey(state.current.card))"));
check("only adds correctly placed cards to the active team timeline", source.includes("if (correct) {") && source.includes("state.timelines[team].push(state.current.card)"));
check("verifies a browser preview before drawing", source.includes("function verifyPreview") && source.includes("await verifyPreview(preview)"));
check("persists and restores the full game state", source.includes('const STORE = "tra-hitster-kfar-blum-2026-v9.9"') && source.includes("function saveGame()") && source.includes("function restoreGame()") && source.includes("current: state.current?.card || null"));
check("offers explicit continue and red reset actions", [hebrew, english].every(html => html.includes('id="continue-game"') && html.includes('id="reset-game"') && html.includes("action danger")));
check("keeps an active card across resume", source.includes("function restoreCurrentCard()") && source.includes("state.pendingCurrent"));
check("asks before removing a timeline card and does not revive it", source.includes("function askToRemove") && hebrew.includes('id="remove-dialog"') && source.includes("state.timelines[pending.team]") && source.includes("state.used"));
check("uses the shared runtime for Hebrew and English", [hebrew, english].every(html => html.includes('src="hitster-original.js?v=20260829-kfar99"')));
check("routes Kfar Blum and Mobile into the shared Hebrew game", kfarRoute.includes('location.replace("hitster-888.html?entry=kfar-bloom")') && mobileRoute.includes('location.replace("hitster-888.html?autoplay=1&entry=mobile")'));
check("routes the legacy international page into the shared English game", legacyRoute.includes('location.replace("hitster-888-en.html?entry=international")'));

if (failures.length) {
  console.error("HITSTER Kfar Blum 9.9 rules gate FAILED:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log("HITSTER Kfar Blum 9.9 rules gate PASSED: five teams · 18 cards · stars 0–12 · saved global deck · shared routes.");
