"use strict";

// HITSTER TRA — Kfar Bloom 2026 — Master Catalog 1000
// Source pool: a public collection of ~1,000 Israeli songs split into 5 x 200-song playlists.
// IMPORTANT: This file indexes 1,000 sourced song slots. A slot becomes Production-ready only
// after title, artist, releaseYear and era are independently verified.

const HITSTER_SOURCE_PLAYLISTS = [
  "PLsLeaTfKv4pjZnXVCgFnXr1lYhrIkIztH",
  "PLsLeaTfKv4pgynEsgYWiEzrgP12oWBfUB",
  "PLsLeaTfKv4pgAojxHxAqeYZY5_YZnYpiI",
  "PLsLeaTfKv4phr-aigxx54SwVqLSiyqMjw",
  "PLsLeaTfKv4phc4aAByQXMtZAzcTs87v_k",
];

export const HITSTER_TIER_TARGETS = Object.freeze({ A: 700, B: 200, C: 100 });

export const HITSTER_CATALOG_1000 = Object.freeze(Array.from({ length: 1000 }, (_, index) => {
  const rank = index + 1;
  const tier = rank <= 700 ? "A" : rank <= 900 ? "B" : "C";
  const sourcePart = Math.floor(index / 200) + 1;
  const sourcePosition = (index % 200) + 1;
  return Object.freeze({
    id: `HT${String(rank).padStart(4, "0")}`,
    rank,
    tier,
    sourcePool: "Baba-Mail: 1,000 Israeli songs",
    sourcePart,
    sourcePosition,
    sourcePlaylistId: HITSTER_SOURCE_PLAYLISTS[sourcePart - 1],
    title: null,
    artist: null,
    releaseYear: null,
    era: null,
    status: "source-indexed",
  });
}));

export function catalog1000Report(catalog = HITSTER_CATALOG_1000) {
  const counts = { A: 0, B: 0, C: 0 };
  const ids = new Set();
  let duplicateIds = 0;
  let productionReady = 0;
  for (const row of catalog) {
    if (counts[row.tier] !== undefined) counts[row.tier] += 1;
    if (ids.has(row.id)) duplicateIds += 1;
    ids.add(row.id);
    if (row.title && row.artist && Number.isInteger(row.releaseYear) && row.era && row.status === "verified") productionReady += 1;
  }
  const indexed = catalog.length;
  const tierCountsValid = counts.A === 700 && counts.B === 200 && counts.C === 100;
  return Object.freeze({ indexed, counts, duplicateIds, tierCountsValid, productionReady, ok: indexed === 1000 && tierCountsValid && duplicateIds === 0 });
}
