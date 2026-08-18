"use strict";

const { HITSTER_CATALOG_TARGET, HITSTER_CATALOG_11111, catalog11111Report } = require("./hitster-tra-catalog-11111.js");
const report = catalog11111Report(HITSTER_CATALOG_11111);

console.log(`HITSTER TRA catalog capacity: ${report.indexed}/${HITSTER_CATALOG_TARGET}`);
console.log(`duplicate IDs=${report.duplicateIds}`);
console.log(`verified=${report.verified}`);
console.log(`playable=${report.playable}`);
console.log(`capacityReady=${report.capacityReady}`);
console.log(`productionReady=${report.productionReady}`);

if (!report.capacityReady) {
  console.error("HITSTER TRA 11,111 capacity gate FAILED");
  process.exit(1);
}

console.log("HITSTER TRA capacity gate PASSED: 11,111/11,111 unique catalog slots");
console.log("Note: production readiness remains separate and requires every song to be independently verified.");
