"use strict";

const { HITSTER_CATALOG_1000, catalog1000Report } = require("./hitster-tra-catalog-1000.js");
const report = catalog1000Report(HITSTER_CATALOG_1000);

console.log(`HITSTER TRA catalog: ${report.indexed}/1000`);
console.log(`A=${report.counts.A} B=${report.counts.B} C=${report.counts.C}`);
console.log(`duplicate IDs=${report.duplicateIds}`);
console.log(`productionReady=${report.productionReady}`);

if (!report.ok) {
  console.error("HITSTER TRA catalog gate FAILED");
  process.exit(1);
}
console.log("HITSTER TRA catalog gate PASSED: 1000/1000, A700/B200/C100");
