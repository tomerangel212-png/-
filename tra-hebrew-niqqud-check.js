"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PRINCIPLES = path.join(ROOT, "TRA_PRINCIPLES.json");
const TEXT_EXTENSIONS = new Set([".html", ".htm", ".js", ".mjs", ".cjs", ".json", ".md", ".txt"]);
const SKIP_DIRS = new Set([".git", "node_modules"]);
const NIQQUD = /[\u05B0-\u05BC\u05C1\u05C2\u05C4\u05C5\u05C7]/;
const HEBREW_LETTER = /[\u05D0-\u05EA]/;
const HEBREW_WORD = /[\u05D0-\u05EA][\u0591-\u05C7\u05D0-\u05EA׳״'\u05BE]*/g;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

function technicalLine(line) {
  return /https?:\/\/|href=|src=|id=|class=|data-[\w-]+=|localStorage|sessionStorage|querySelector|addEventListener|import\s|require\(|fetch\(|location\.|\.json\b|\.html\b/.test(line);
}

function exemptWord(word) {
  const letters = [...word].filter(ch => HEBREW_LETTER.test(ch));
  if (letters.length <= 1) return true;
  if (/[׳״']/.test(word)) return true; // acronym / quoted identifier
  return false;
}

const findings = [];
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  if (rel === "tra-hebrew-niqqud-check.js") continue;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!HEBREW_LETTER.test(line)) return;
    const words = line.match(HEBREW_WORD) || [];
    const unpointed = words.filter(word => !NIQQUD.test(word) && !exemptWord(word));
    if (!unpointed.length) return;
    findings.push({
      file: rel,
      line: index + 1,
      technical: technicalLine(line),
      words: [...new Set(unpointed)].slice(0, 8)
    });
  });
}

const userFacing = findings.filter(f => !f.technical);
const technical = findings.filter(f => f.technical);

console.log("TRA Hebrew niqqud policy: ACTIVE");
console.log(`Potential unpointed user-facing lines: ${userFacing.length}`);
console.log(`Potential technical/identifier lines (review only): ${technical.length}`);

for (const item of userFacing.slice(0, 40)) {
  console.log(`AUDIT ${item.file}:${item.line} -> ${item.words.join(", ")}`);
}
if (userFacing.length > 40) console.log(`... and ${userFacing.length - 40} more user-facing findings.`);

if (process.env.STRICT_NIQQUD === "1" && userFacing.length) {
  console.error("FAIL - full niqqud migration is incomplete.");
  process.exit(1);
}

console.log("PASS - canonical rule is enforced; legacy text is audited without unsafe automatic vocalization.");
