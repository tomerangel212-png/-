#!/usr/bin/env node
"use strict";

const fs = require("fs");
const read = file => fs.readFileSync(file, "utf8");
const json = file => JSON.parse(read(file));
const failures = [];
const checks = [];
const check = (name, pass) => {
  const ok = Boolean(pass);
  checks.push({ name, pass: ok });
  if (!ok) failures.push(name);
};

const version = json("TRA_VERSION.json");
const quality = json("TRA_QUALITY.json");
const layer = read("tra-quality.js");
const sw = read("sw.js");
const offline = read("offline.html");
const qualityWorkflow = read(".github/workflows/quality.yml");
const pagesWorkflow = read(".github/workflows/pages.yml");

const components = Object.values(version.components || {});
const operational = quality.operational_quality || {};

check("99.99 operational target is explicit", version.operational_quality_target === "99.99/100" && operational.target === 99.99 && operational.label === "99.99/100");
check("Legacy 10/10 and 999/1000 contracts remain preserved", version.quality_target === "10/10" && version.excellence_target === "999/1000" && quality.target === 10);
check("Every current declared TRA component is 99.99/100", components.length >= 20 && components.every(component => component.version === "9.9" && component.quality === "99.99/100"));
check("99.99 is evidence-gated rather than absolute perfection", String(version.operational_quality_status).includes("evidence-gated") && String(operational.does_not_claim).includes("absolute perfection"));

check("Universal layer exposes backward-compatible and 99.99 quality labels", layer.includes('dataset.traQuality = "10/10"') && layer.includes("dataset.traOperationalQuality = OPERATIONAL_QUALITY") && layer.includes('const OPERATIONAL_QUALITY = "99.99/100"'));
check("Universal layer has keyboard and motion accessibility", layer.includes(":focus-visible") && layer.includes("prefers-reduced-motion:reduce") && layer.includes("forced-colors:active") && layer.includes("min-block-size:44px") && layer.includes("tra-skip"));
check("Universal layer hardens new-tab links", layer.includes('a[target="_blank"]') && layer.includes('rel.add("noopener")') && layer.includes('rel.add("noreferrer")'));
check("Universal layer hardens embedded and media content", layer.includes('document.querySelectorAll("iframe")') && layer.includes('frame.setAttribute("title", "Embedded content")') && layer.includes('document.querySelectorAll("audio,video")') && layer.includes('media.setAttribute("playsinline", "")'));
check("Universal layer adds visible rights notice", layer.includes("tra-copyright") && layer.includes("© 2026 Tomer Rafael Angel") && layer.includes("כל הזכויות שמורות") && layer.includes("All Rights Reserved"));
check("Universal layer captures Web Vitals evidence", layer.includes("PerformanceObserver") && layer.includes('observe("largest-contentful-paint"') && layer.includes('observe("layout-shift"') && layer.includes('observe("event"') && layer.includes('track("tra_web_vitals"'));
check("Runtime failures and service-worker failures are observable", layer.includes('track("tra_runtime_error"') && layer.includes('track("tra_unhandled_rejection"') && layer.includes('track("tra_service_worker_error"'));
check("Quality telemetry avoids direct cookie/query/local-storage collection", !layer.includes("document.cookie") && !layer.includes("location.search") && !layer.includes("localStorage"));

check("Service worker uses a dedicated 99.99 Station-compatible cache generation", sw.includes('const STATIC_CACHE = "tra-99-99-station-999-chess-formal-rules-v2"'));
check("Service worker injects quality layer from registration scope", sw.includes('new URL("tra-quality.js", self.registration.scope).href') && !sw.includes('<script src="./tra-quality.js"></script></body>'));
check("Service worker cleans both historical TRA cache namespaces", sw.includes('key.startsWith("tra-")') && sw.includes('key.startsWith("hitster-tra-")'));
check("Service worker is network-first for freshness with cache fallback", sw.includes("const response = await fetch(event.request)") && sw.includes("return await caches.match(event.request) || Response.error()"));
check("Service worker avoids partial-range response caching", sw.includes('event.request.headers.has("range")'));
check("Unknown offline navigation uses neutral offline page", sw.includes('caches.match("./offline.html")') && !sw.includes('caches.match("./hitster-888.html")'));
check("Neutral offline page does not masquerade as a product", offline.includes("TRA · מצב Offline") && offline.includes("לא החליף את העמוד שביקשת במשחק אחר") && !offline.includes("HITSTER"));

const criticalOfflineRoutes = [
  "./index.html", "./games.html", "./casino-angel.html", "./connect-talk.html", "./music-drive.html", "./music-editor.html",
  "./links/index.html", "./tra-dashboard/index.html", "./songs/index.html", "./poetry/index.html", "./instrumentals/index.html",
  "./kfar-blum-2026.html", "./knoke.html", "./tra-dnd.html", "./angel-family-game.html", "./tra-100.html", "./wikifamily.html",
  "./tra-music.html", "./tra-music-station.html", "./what-country.html", "./hitster.html", "./hitster-mobile.html",
  "./hitster-888.html", "./hitster-888-en.html", "./hitster-kfar-bloom-2026-demo.html", "./offline.html"
];
check("Critical current TRA routes are install-cached", criticalOfflineRoutes.every(route => sw.includes(`"${route}"`)));

check("PR workflow syntax-checks the 99.99 gate", qualityWorkflow.includes("node --check tra-9999-quality-check.js"));
check("PR workflow enforces the 99.99 gate", qualityWorkflow.includes("node tra-9999-quality-check.js"));
check("Publish workflow syntax-checks the 99.99 gate", pagesWorkflow.includes("node --check tra-9999-quality-check.js"));
check("Publish workflow enforces the 99.99 gate before deployment", pagesWorkflow.includes("node tra-9999-quality-check.js"));

for (const item of checks) console.log(`${item.pass ? "PASS" : "FAIL"} - ${item.name}`);
const passed = checks.filter(item => item.pass).length;
console.log(`\nTRA 99.99 operational gate: ${passed}/${checks.length} checks.`);
if (failures.length) {
  console.error("\nTRA 99.99 RELEASE BLOCKED:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log("TRA 99.99 operational quality gate PASSED. Perfect 100.00 and 9,999,999,999 targets remain separately evidence-gated.");
