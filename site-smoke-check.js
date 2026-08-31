"use strict";

const fs = require("fs");
const requiredFiles = [
  "index.html","games.html","games.js","games-hub.js",
  "hitster.html","hitster-mobile.html","hitster-888.html","hitster-888-en.html","hitster-kfar-bloom-2026-demo.html","hitster-tra-tokens.html",
  "hitster-original.js","hitster-alltime-888.json","hitster-888-check.js",
  "casino-angel.html","connect-talk.html","music-drive.html","music-editor.html",
  "links/index.html","links.html","tree.html","linktree.html","tomer-links.html",
  "app.js","styles.css","manifest.webmanifest","sw.js"
];
const failures = [];
const read = file => fs.readFileSync(file, "utf8");
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`missing required production file: ${file}`);
  else if (fs.statSync(file).size === 0) failures.push(`empty production file: ${file}`);
}
for (const file of requiredFiles.filter(file => file.endsWith(".html") && fs.existsSync(file))) {
  const source = read(file);
  if (!/<!doctype html>/i.test(source)) failures.push(`${file}: missing doctype`);
  if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(source)) failures.push(`${file}: missing language`);
  if (!/<title>\s*\S[\s\S]*?<\/title>/i.test(source)) failures.push(`${file}: missing title`);
  if (!/<meta\b[^>]*\bname=["']viewport["']/i.test(source)) failures.push(`${file}: missing viewport`);
}
if (fs.existsSync("hitster.html")) {
  const hub = read("hitster.html");
  for (const route of ['href="hitster-mobile.html"','href="hitster-mobile.html?lang=en"','href="hitster-mobile.html?entry=kfar-bloom"']) if (!hub.includes(route)) failures.push(`hitster.html: missing mobile route ${route}`);
  if (!hub.includes("888 קלפי A-list") || !hub.includes("שנת מצעד")) failures.push("hitster.html: annual 888 copy missing");
}
if (fs.existsSync("hitster-mobile.html")) {
  const mobile = read("hitster-mobile.html");
  if (!mobile.includes('allow="autoplay"') || !mobile.includes('id="game"') || !mobile.includes('params.get("entry")') || !mobile.includes('frame.addEventListener("load"')) failures.push("hitster-mobile.html: mobile frame/bootstrap incomplete");
  if (mobile.includes("next.click()") || mobile.includes("play.click()")) failures.push("hitster-mobile.html: mobile wrapper bypasses Continue/Reset flow");
  if (!mobile.includes('"hitster-888.html"') || !mobile.includes('"hitster-888-en.html"')) failures.push("hitster-mobile.html: annual game routes missing");
}
if (fs.existsSync("hitster-888.html")) {
  const page = read("hitster-888.html");
  if (!page.includes('src="hitster-original.js')) failures.push("hitster-888.html: annual runtime missing");
  if (!/id=["']audio["'][^>]*preload=["']metadata["']/i.test(page) || !/id=["']audio["'][^>]*playsinline/i.test(page)) failures.push("hitster-888.html: mobile audio element incomplete");
  if (page.includes("1950–2023")) failures.push("hitster-888.html: chart range leaked before reveal");
}
if (fs.existsSync("hitster-888-en.html") && !read("hitster-888-en.html").includes('<html lang="en" dir="ltr">')) failures.push("hitster English: language/direction missing");
if (fs.existsSync("sw.js")) {
  const sw = read("sw.js");
  if (!sw.includes("hitster-alltime-888.json") || sw.includes("hitster-hebrew-alist-888.json")) failures.push("sw.js: offline deck configuration is stale");
  if (!sw.includes('"./hitster-mobile.html"')) failures.push("sw.js: mobile HITSTER route is not cached");
}
if (fs.existsSync("games.html") && !read("games.html").includes('href="hitster.html"')) failures.push("games.html: HITSTER hub route missing");
if (failures.length) {
  console.error("SITE SMOKE CHECK FAILED:\n" + failures.map(item => `- ${item}`).join("\n"));
  process.exit(1);
}
console.log("SITE SMOKE CHECK PASSED: annual HITSTER assets, Kfar Blum mobile start flow, audio entry, and routes are present.");
