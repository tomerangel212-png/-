"use strict";

const assert = require("node:assert/strict");
const core = require("./games-core.js");

const deck = core.createDobbleDeck();
assert.equal(deck.length, 57, "Dobble must use a projective plane of order 7");
assert.equal(core.SYMBOLS.length, 57, "every card symbol needs a display glyph");
assert.equal(new Set(core.SYMBOLS).size, 57, "visible Dobble symbols must be distinct");
assert.equal(core.validateDobbleDeck(deck), true, "deck structure and pair intersections must be valid");
const appearances = Array(57).fill(0);
for (const card of deck) {
  assert.equal(card.length, 8, "every card has eight symbols");
  for (const symbol of card) appearances[symbol] += 1;
}
assert(appearances.every(count => count === 8), "each symbol must appear on eight cards");

const memory = new Map();
const storage = { getItem: key => memory.get(key) || null, setItem: (key, value) => memory.set(key, value) };
const initial = core.createAlchemyState();
initial.score = 2;
initial.guesses = 4;
initial.discoveries[3] = { prompt: "מים + קור", answer: "קרח", method: "guess" };
assert.equal(core.saveAlchemyState(storage, "alchemy-test", initial, 12), true);
const restored = core.loadAlchemyState(storage, "alchemy-test", 12);
assert.equal(restored.score, 2, "Alchemy score survives reload");
assert.equal(restored.guesses, 4, "Alchemy guess count survives reload");
assert.equal(restored.discoveries[3].answer, "קרח", "discovery book survives reload");
memory.set("alchemy-test", "not json");
assert.deepEqual(core.loadAlchemyState(storage, "alchemy-test", 12), core.createAlchemyState(), "corrupt state safely falls back to a fresh game");
assert.equal(core.saveAlchemyState({ setItem() { throw new Error("quota"); } }, "alchemy-test", initial, 12), false, "storage failures are contained");

console.log("TRA Games core PASSED: 57-card Dobble design + saved Alchemy progress and failure recovery.");
