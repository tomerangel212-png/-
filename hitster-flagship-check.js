"use strict";

// Every HITSTER entry point must resolve to the Kfar Blum 2026 flagship runtime.
const fs = require("fs");
const routes = [
  "hitster.html",
  "hitster-mobile.html",
  "hitster-888.html",
  "hitster-888-en.html",
  "hitster-kfar-bloom-2026-demo.html",
  "hitster-tra-tokens.html",
];
const errors = [];
for (const file of routes) {
  const text = fs.readFileSync(file, "utf8");
  if (!["hitster-888.html", "hitster-888-en.html"].includes(file) && !/hitster-(?:mobile|888|888-en)\.html/.test(text)) errors.push(`${file}: missing canonical HITSTER route`);
  if (/hitster-(?:tokens|kfar-bloom-2026-demo)\.js/.test(text)) errors.push(`${file}: legacy runtime referenced`);
}
for (const file of ["hitster-888.html", "hitster-888-en.html"]) {
  const text = fs.readFileSync(file, "utf8");
  for (const required of ["kfar-blum-888-audio30-v3", "30", "18", "5", "10"]) {
    if (!text.includes(required)) errors.push(`${file}: flagship contract missing ${required}`);
  }
}
const runtime = fs.readFileSync("hitster-original.js", "utf8");
for (const required of ["PREVIEW_SECONDS = 30", "ruleset: \"kfar-blum-18\"", "function primeNextCard", "audio.play()", "keepSource: true"]) {
  if (!runtime.includes(required)) errors.push(`hitster-original.js: flagship runtime missing ${required}`);
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`HITSTER flagship contract OK — ${routes.length} routes share Kfar Blum 2026 runtime.`);
