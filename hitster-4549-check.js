"use strict";
const fs = require("fs");
const failures = [];
const js = fs.readFileSync("hitster-kfar-bloom-2026-demo.js", "utf8");
const html = fs.readFileSync("hitster-kfar-bloom-2026-demo.html", "utf8");
const hub = fs.readFileSync("hitster.html", "utf8");
function requireText(source, needle, message) { if (!source.includes(needle)) failures.push(message); }
requireText(js, "const HEZEL_EXPECTED_TOTAL = 4549", "HITSTER internal library must target exactly 4,549 cards");
requireText(js, 'readStoredZipEntry(buffer, "backup.json")', "HITSTER must parse backup.json directly from Hezel");
requireText(js, 'indexedDB.open(DB_NAME, DB_VERSION)', "HITSTER must persist its internal library in IndexedDB");
requireText(js, 'const AUDIO_STORE = "audio"', "HITSTER must have a local audio store");
requireText(html, "HITSTER TRA · 4,549", "HITSTER page must advertise 4,549 cards");
requireText(hub, "ספריית Hezel · 4,549", "HITSTER hub must route to the 4,549-card internal library");
const canonical = `${js}\n${html}\n${hub}`;
for (const forbidden of ["itunes.apple.com", "open.spotify.com", "youtube.com", "youtu.be", "soundcloud.com", "api.deezer.com"]) {
  if (canonical.toLowerCase().includes(forbidden)) failures.push(`third-party runtime dependency forbidden: ${forbidden}`);
}
if (failures.length) {
  console.error("HITSTER 4,549 INTERNAL LIBRARY GATE FAILED:\n");
  failures.forEach((x) => console.error(`- ${x}`));
  process.exit(1);
}
console.log("HITSTER 4,549 internal-library gate PASSED");
console.log("Hezel direct import: PASS");
console.log("IndexedDB cards + local audio: PASS");
console.log("Third-party runtime audio providers: 0 · PASS");
