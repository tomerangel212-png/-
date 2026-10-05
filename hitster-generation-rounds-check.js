"use strict";

const assert = require("node:assert/strict");
const { createGenerationRounds, validateGenerationDeck } = require("./hitster-generation-rounds.js");

const cards = [
  { title: "שיר ילדים א", artist: "אמן א", year: 1978, audience: "children" },
  { title: "שיר ילדים ב", artist: "אמן ב", year: 1981, audience: "ילדים" },
  { title: "שיר מבוגרים א", artist: "אמן ג", year: 1995, audience: "adults" },
  { title: "שיר מבוגרים ב", artist: "אמן ד", year: 2005, audience: "מבוגרים" },
  { title: "שיר ותיקים א", artist: "אמן ה", year: 1967, audience: "elders" },
  { title: "שיר ותיקים ב", artist: "אמן ו", year: 1970, audience: "זקנים" },
];

assert.equal(validateGenerationDeck(cards).ok, true);
const game = createGenerationRounds({ cards, quotaPerStage: 2 });
assert.equal(game.currentStage().id, "children");
assert.equal(game.canAnswer("adults"), false);
assert.equal(game.acceptAnswer({ responderAudience: "adults", correct: true }).counted, false);
assert.equal(game.acceptAnswer({ responderAudience: "children", correct: true }).advanced, false);
assert.equal(game.acceptAnswer({ responderAudience: "ילדים", correct: true }).advanced, true);
assert.equal(game.currentStage().id, "adults");
assert.equal(game.acceptAnswer({ responderAudience: "adults", correct: true }).advanced, false);
assert.equal(game.acceptAnswer({ responderAudience: "מבוגרים", correct: true }).advanced, true);
assert.equal(game.currentStage().id, "elders");
assert.equal(game.acceptAnswer({ responderAudience: "children", correct: true }).counted, false);
assert.equal(game.acceptAnswer({ responderAudience: "elders", correct: true }).finished, false);
assert.equal(game.acceptAnswer({ responderAudience: "זקנים", correct: true }).finished, true);

const replay = createGenerationRounds({ cards, quotaPerStage: 2, restoredState: game.serialize() });
assert.equal(replay.isFinished(), true);
assert.equal(replay.draw().reason, "game-finished");
console.log("Generation rounds: all checks passed");

