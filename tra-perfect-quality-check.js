"use strict";

const fs = require("fs");
const read = path => fs.readFileSync(path, "utf8");
const failures = [];
const checks = [];
const check = (name, pass) => {
  const ok = Boolean(pass);
  checks.push({name, pass: ok});
  if (!ok) failures.push(name);
};

const version = JSON.parse(read("TRA_VERSION.json"));
const quality = JSON.parse(read("TRA_QUALITY.json"));
const registry = JSON.parse(read("TRA_PRINCIPLES.json"));
const sw = read("sw.js");
const qualityLayer = read("tra-quality.js");
const qualityWorkflow = read(".github/workflows/quality.yml");
const pagesWorkflow = read(".github/workflows/pages.yml");

const perfect = quality.perfect_scale || {};
const dimensions = Array.isArray(quality.dimensions) ? quality.dimensions : [];
const principles = Array.isArray(registry.principles) ? registry.principles : [];
const dimensionWeight = dimensions.reduce((sum, item) => sum + Number(item.weight || 0), 0);
const dimensionTarget = dimensions.reduce((sum, item) => sum + Number(item.target || 0), 0);
const ids = principles.map(item => item.id);
const requiredPrinciples = [
  "purpose-relevance-quality","music-culture-society-reality","mental-health-access",
  "reality-no-invention","past-behind","preserve-every-version","source-preserve-improve",
  "reference-without-copying","measured-not-decorative","accuracy-before-expansion",
  "offline-parity","every-device-eligible","simple-for-every-generation",
  "minimum-effort-maximum-result","fair-neutral-systems","respectful-disagreement",
  "privacy-security-consent","publish-only-after-green","no-empty-experience",
  "human-approval-before-release","authorized-integrations-only"
];

check("Legacy 10/10 quality contract remains preserved", version.quality_target === "10/10" && quality.target === 10);
check("Legacy 999/1000 excellence contract remains preserved", version.excellence_target === "999/1000");
check("Perfect target is exact", version.perfect_target === "9999999999/9999999999" && perfect.label === "9999999999/9999999999");
check("Perfect numerator and denominator are exact", perfect.numerator === 9999999999 && perfect.denominator === 9999999999 && perfect.target === 9999999999);
check("Perfect target is not falsely claimed", perfect.achieved === false && perfect.current_score === null && version.perfect_target_status === "aspirational-until-evidence-complete");
check("Dimension weights total exactly 9,999,999,999", dimensionWeight === 9999999999 && dimensionTarget === 9999999999);
check("Every dimension has a hard gate", dimensions.length >= 9 && dimensions.every(item => item.id && item.label_he && item.weight > 0 && item.target === item.weight && item.gate));
check("Principle registry has unique identifiers", ids.length >= 21 && new Set(ids).size === ids.length);
check("All required historical principles are registered", requiredPrinciples.every(id => ids.includes(id)));
check("Human approval is enforced in governance", registry.governance?.human_approval_required_for?.includes("merge") && registry.governance?.human_approval_required_for?.includes("publish"));
check("Permission and security bypass is forbidden", registry.governance?.authorized_integrations_only === true && registry.governance?.bypass_permissions_or_security === false);
check("Perfect contract is available offline", sw.includes('"./TRA_PRINCIPLES.json"') && sw.includes('"./TRA_PERFECT_QUALITY.md"'));
check("Universal quality layer exposes the target", qualityLayer.includes('dataset.traPerfectTarget = "9999999999/9999999999"'));
check("PR quality workflow runs the perfect contract gate", qualityWorkflow.includes("node tra-perfect-quality-check.js"));
check("Publish workflow runs the perfect contract gate", pagesWorkflow.includes("node tra-perfect-quality-check.js"));

for (const item of checks) console.log(`${item.pass ? "PASS" : "FAIL"} - ${item.name}`);
if (failures.length) {
  console.error("\nTRA PERFECT TARGET CONTRACT BLOCKED:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log(`\nTRA perfect target contract PASSED: ${checks.length}/${checks.length} checks.`);
console.log("Target registered: 9,999,999,999/9,999,999,999. Achievement remains evidence-gated.");
