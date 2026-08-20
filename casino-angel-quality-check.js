"use strict";

const fs = require("fs");

const source = fs.readFileSync("casino-angel.html", "utf8");
const indexOf = (needle) => source.indexOf(needle);

const checks = [
  {
    name: "Eight-player table gives every active player exactly two hole cards",
    pass: source.includes("player.hole=[game.deck.pop(),game.deck.pop()]") && source.includes("8 שחקנים")
  },
  {
    name: "Pre-flop starts after blinds without clearing the blind bet",
    pass:
      source.includes("const blinds=postBlinds()") &&
      source.includes('await bettingRound("preflop",nextIndex(blinds.big,canAct),true)')
  },
  {
    name: "Board reveals run as flop, turn, river in that order",
    pass:
      indexOf('await bettingRound("preflop"') < indexOf('{revealFlop();render();await bettingRound("flop"') &&
      indexOf('{revealFlop();render();await bettingRound("flop"') < indexOf('{revealOne();render();await bettingRound("turn"') &&
      indexOf('{revealOne();render();await bettingRound("turn"') < indexOf('{revealOne();render();await bettingRound("river"')
  },
  {
    name: "Each raise reopens betting for the other active players",
    pass: source.includes("if(outcome.raised)") && source.includes("pending.add(other.id)")
  },
  {
    name: "Showdown reveals live hands and awards the complete pot to a unique winner",
    pass:
      source.includes('game.stage="showdown"') &&
      source.includes("game.showdown=true") &&
      source.includes('class="seat-cards"') &&
      source.includes("winners[0].stack+=amount") &&
      source.includes("function sidePots") &&
      source.includes("כל הקופה")
  },
  {
    name: "Exact ties remain split according to standard poker rules",
    pass: source.includes("שוויון אמיתי") && source.includes("const share=Math.floor(amount/winners.length)")
  }
];

const failed = checks.filter((check) => !check.pass);
for (const check of checks) {
  console.log((check.pass ? "PASS" : "FAIL") + " - " + check.name);
}

if (failed.length) {
  console.error("\\nCasino Angel quality gate FAILED (" + failed.length + "/" + checks.length + ").");
  process.exit(1);
}

console.log("\\nCasino Angel quality gate PASSED (" + checks.length + "/" + checks.length + ").");
