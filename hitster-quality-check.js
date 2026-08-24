"use strict";

const fs = require("fs");

const payload = JSON.parse(fs.readFileSync("hitster-hebrew-alist-888.json", "utf8"));
const TARGET_PER_ERA = 222;
const TARGET_TOTAL = 888;
const ranges = {
  "1980–1989": [1980, 1989],
  "1990–1999": [1990, 1999],
  "2000–2009": [2000, 2009],
  "2010–2020": [2010, 2020],
};
const failures = [];
const identities = new Set();
let total = 0;

for (const [era, [start, end]] of Object.entries(ranges)) {
  const cards = payload?.eras?.[era];
  if (!Array.isArray(cards) || cards.length !== TARGET_PER_ERA) {
    failures.push(`${era}: expected exactly ${TARGET_PER_ERA} cards`);
    continue;
  }
  for (const [title, artist, year] of cards) {
    total += 1;
    if (!String(title || "").trim() || !String(artist || "").trim()) failures.push(`${era}: missing title or artist`);
    if (!Number.isInteger(year) || year < start || year > end) failures.push(`${title}: invalid year ${year} for ${era}`);
    const identity = `${String(title).normalize("NFKC").trim().toLocaleLowerCase("he")}::${String(artist).normalize("NFKC").trim().toLocaleLowerCase("he")}::${year}`;
    if (identities.has(identity)) failures.push(`${title}: unintended duplicate title/artist/year`);
    identities.add(identity);
  }
}

if (total !== TARGET_TOTAL) failures.push(`Expected ${TARGET_TOTAL} cards, got ${total}`);
if (identities.size !== TARGET_TOTAL) failures.push(`Expected ${TARGET_TOTAL} unique cards, got ${identities.size}`);

if (failures.length) {
  console.error("\nHITSTER TRA RELEASE BLOCKED — 888-card gate failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`HITSTER TRA quality gate passed: ${total}/${TARGET_TOTAL} verified cards have valid fields and era classification.`);
console.log("888 = 222×4: PASS");
console.log("Duplicate identity guard: PASS");
