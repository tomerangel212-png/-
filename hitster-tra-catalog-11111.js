"use strict";

// HITSTER TRA — Master Catalog 11,111
// This file defines the capacity and validation model only.
// It does NOT pretend that 11,111 songs are verified.
// A row becomes playable only after title, artist, releaseYear, era and audioSource are verified.

const HITSTER_CATALOG_TARGET = 11111;

const HITSTER_CATALOG_11111 = Object.freeze(Array.from({ length: HITSTER_CATALOG_TARGET }, (_, index) => {
  const rank = index + 1;
  return Object.freeze({
    id: `HT${String(rank).padStart(5, "0")}`,
    rank,
    title: null,
    artist: null,
    releaseYear: null,
    era: null,
    audioSource: null,
    status: "unverified-slot",
  });
}));

function catalog11111Report(catalog = HITSTER_CATALOG_11111) {
  const ids = new Set();
  let duplicateIds = 0;
  let verified = 0;
  let playable = 0;

  for (const row of catalog) {
    if (ids.has(row.id)) duplicateIds += 1;
    ids.add(row.id);

    const metadataVerified = Boolean(
      row.title &&
      row.artist &&
      Number.isInteger(row.releaseYear) &&
      row.era &&
      row.status === "verified"
    );

    if (metadataVerified) verified += 1;
    if (metadataVerified && row.audioSource) playable += 1;
  }

  const indexed = catalog.length;
  return Object.freeze({
    target: HITSTER_CATALOG_TARGET,
    indexed,
    duplicateIds,
    verified,
    playable,
    capacityReady: indexed === HITSTER_CATALOG_TARGET && duplicateIds === 0,
    productionReady: playable === HITSTER_CATALOG_TARGET,
  });
}

const api = { HITSTER_CATALOG_TARGET, HITSTER_CATALOG_11111, catalog11111Report };
if (typeof window !== "undefined") window.HITSTER_TRA_CATALOG_11111 = api;
if (typeof module !== "undefined" && module.exports) module.exports = api;
