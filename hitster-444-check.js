"use strict";

const fs = require("fs");

const base = JSON.parse(fs.readFileSync("hitster-kfar-bloom-2026-demo-data.json", "utf8"));
const expansion = JSON.parse(fs.readFileSync("hitster-expansion-444.json", "utf8"));
const html = fs.readFileSync("hitster-kfar-bloom-2026-demo.html", "utf8");
const js = fs.readFileSync("hitster-kfar-bloom-2026-demo.js", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");

const ranges = {
  "1960–1969": [1960, 1969], "1970–1979": [1970, 1979], "1980–1989": [1980, 1989],
  "1990–1999": [1990, 1999], "2000–2009": [2000, 2009], "2010–2019": [2010, 2019], "2020–2026": [2020, 2026],
};
const targets = {
  "1960–1969": 64, "1970–1979": 64, "1980–1989": 64,
  "1990–1999": 63, "2000–2009": 63, "2010–2019": 63, "2020–2026": 63,
};
const blocked = new Set(["michael jackson", "אייל גולן", "eyal golan"]);
const norm = value => String(value || "").trim().toLocaleLowerCase("he");
const key = card => `${norm(card[0])}|${norm(card[1])}|${card[2]}`;
const valid = (card, era) => Array.isArray(card) && card.length === 3 && card[0] && card[1] && Number.isInteger(card[2]) && card[2] >= ranges[era][0] && card[2] <= ranges[era][1];

const merged = {};
const seen = new Set();
for (const era of Object.keys(ranges)) {
  merged[era] = [];
  for (const card of (base[era] || [])) {
    if (!valid(card, era) || blocked.has(norm(card[1]))) continue;
    const id = key(card);
    if (seen.has(id)) continue;
    seen.add(id);
    merged[era].push(card);
  }
  for (const card of (expansion[era] || [])) {
    if (merged[era].length >= targets[era]) break;
    if (!valid(card, era) || blocked.has(norm(card[1]))) continue;
    const id = key(card);
    if (seen.has(id)) continue;
    seen.add(id);
    merged[era].push(card);
  }
  if (merged[era].length !== targets[era]) {
    throw new Error(`${era}: expected ${targets[era]} cards after merge, got ${merged[era].length}`);
  }
}

const total = Object.values(merged).reduce((sum, cards) => sum + cards.length, 0);
if (total !== 444) throw new Error(`Expected 444 HITSTER cards, got ${total}`);
if (seen.size !== 444) throw new Error(`Expected 444 unique identities, got ${seen.size}`);
if (!html.includes('id="new-game"') || !html.includes("444 קלפי שירים")) throw new Error("New Game button or 444-card UI missing");
if (!js.includes("function newGame()") || !js.includes("TARGET_TOTAL = 444")) throw new Error("New Game reset or 444 target missing in JS");
if (!sw.includes("hitster-expansion-444.json")) throw new Error("444-card expansion is not cached for offline use");

console.log("HITSTER 444 gate PASSED");
for (const era of Object.keys(merged)) console.log(`${era}: ${merged[era].length}`);
console.log(`Total: ${total}/444 unique cards`);
console.log("New Game timeline reset: PASS");
console.log("Offline expansion cache: PASS");
