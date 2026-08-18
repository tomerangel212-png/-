"use strict";

const fs = require("fs");
const vm = require("vm");

const source = fs.readFileSync("app.js", "utf8");
const match = source.match(/const songs = (\[[\s\S]*?\n\]);\n\nconst teams =/);
if (!match) throw new Error("HITSTER quality gate: could not locate songs dataset in app.js");

const songs = vm.runInNewContext(match[1], Object.create(null), { timeout: 1000 });
const allowedEras = [
  [1960, 1969, "1960–1969"],
  [1970, 1979, "1970–1979"],
  [1980, 1989, "1980–1989"],
  [1990, 1999, "1990–1999"],
  [2000, 2009, "2000–2009"],
  [2010, 2019, "2010–2019"],
  [2020, 2026, "2020–2026"],
];

const failures = [];
const identities = new Set();

function fail(index, message) {
  failures.push(`Card ${index + 1}: ${message}`);
}

songs.forEach((song, index) => {
  if (!song || typeof song !== "object") return fail(index, "card is not an object");
  if (!String(song.title || "").trim()) fail(index, "missing title");
  if (!String(song.artist || "").trim()) fail(index, "missing artist");
  if (!Number.isInteger(song.year)) fail(index, "year must be an integer");
  if (!String(song.era || "").trim()) fail(index, "missing era");
  if (!String(song.url || "").startsWith("https://music.apple.com/")) fail(index, "Apple Music URL is missing or invalid");

  if (Number.isInteger(song.year)) {
    const expected = allowedEras.find(([start, end]) => song.year >= start && song.year <= end);
    if (!expected) fail(index, `year ${song.year} is outside the supported 1960–2026 range`);
    else if (song.era !== expected[2]) fail(index, `year ${song.year} must be in ${expected[2]}, not ${song.era}`);

    if (song.era === "1960–1969" && (song.year < 1960 || song.year > 1969)) {
      fail(index, "1960–1969 regression guard triggered");
    }
  }

  const identity = `${String(song.title).trim().toLocaleLowerCase("he")}::${String(song.artist).trim().toLocaleLowerCase("he")}::${song.year}`;
  if (identities.has(identity)) fail(index, "unintended duplicate title/artist/year");
  identities.add(identity);
});

if (!songs.length) failures.push("Dataset is empty");

if (failures.length) {
  console.error("\nHITSTER TRA RELEASE BLOCKED — Zero Wrong Cards gate failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`HITSTER TRA quality gate passed: ${songs.length}/${songs.length} cards have valid required fields and decade classification.`);
console.log("1960–1969 regression guard: PASS");
console.log("Duplicate identity guard: PASS");
