"use strict";

const fs = require("fs");

const requiredFiles = [
  "index.html",
  "games.html",
  "games.js",
  "casino-angel.html",
  "connect-talk.html",
  "links/index.html",
  "tra-dashboard/index.html",
  "app.js",
  "styles.css",
  "manifest.webmanifest",
  "sw.js",
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`missing required production file: ${file}`);
  else if (fs.statSync(file).size === 0) failures.push(`empty production file: ${file}`);
}

const htmlFiles = requiredFiles.filter((file) => file.endsWith(".html"));
for (const file of htmlFiles) {
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, "utf8");
  if (!/<html[\s>]/i.test(source)) failures.push(`${file}: missing <html>`);
  if (!/<title>[^<]+<\/title>/i.test(source)) failures.push(`${file}: missing non-empty <title>`);
  if (!/<meta[^>]+name=["']viewport["']/i.test(source)) failures.push(`${file}: missing viewport meta`);
}

if (failures.length) {
  console.error("TRA production smoke check FAILED:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`TRA production smoke check PASSED: ${requiredFiles.length}/${requiredFiles.length} required files present and non-empty.`);
console.log(`HTML baseline PASSED: ${htmlFiles.length}/${htmlFiles.length} pages have html/title/viewport.`);
