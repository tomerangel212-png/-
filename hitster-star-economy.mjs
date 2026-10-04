/**
 * TRA / Kfar Blum: star-value registry, not a replacement game engine.
 * Values come from the 2026-10-04 conversation. Conflicting tier 9 stays unset.
 * No automatic awards, token conversion, winner changes, persistence or tracking.
 * © 2026 Tomer Rafael Angel. All rights reserved.
 */
export const STAR_ECONOMY_VERSION = 1;
export const DECLARED_GAME_VALUE = 10_000_000;

const confirmedValues = [10, 20, 50, 100, 500, 1_000, 5_000, 10_000, null, 100_000];
export const STAR_TIERS = Object.freeze(confirmedValues.map((points, index) => Object.freeze({
  id: `star-${index + 1}`,
  level: index + 1,
  points,
  status: points === null ? 'unresolved' : 'confirmed',
  label: Object.freeze({ he: `כוכב דרגה ${index + 1}`, en: `Star level ${index + 1}` }),
  alternatives: Object.freeze(points === null ? [50_000, 999, 990] : []),
})));

// Earlier named stars are not silently mapped onto numbered tiers.
export const NAMED_STAR_VALUES = Object.freeze({ happy: 10_000, sad: 10_000 });
export const INTEGRATION_STATUS = Object.freeze({
  enabled: false,
  legacyTokensChanged: false,
  winnerRulesChanged: false,
  requiresDecision: Object.freeze(['tier-9-value', 'award-rules', 'endgame-use']),
});

export class UnconfirmedStarValueError extends Error {
  constructor(level) {
    super(`Star level ${level} has no unambiguous confirmed value.`);
    this.name = 'UnconfirmedStarValueError';
    this.level = level;
  }
}

export function getStarTier(level) {
  if (!Number.isInteger(level) || level < 1 || level > STAR_TIERS.length) {
    throw new RangeError('Star level must be an integer from 1 to 10.');
  }
  return STAR_TIERS[level - 1];
}

export function getStarValue(level) {
  const tier = getStarTier(level);
  if (tier.status !== 'confirmed') throw new UnconfirmedStarValueError(level);
  return tier.points;
}

/**
 * Sum explicitly supplied awards only. This is not the balance of legacy tokens.
 * It awards nothing by itself and never decides the winner.
 * @param {Array<{level:number, quantity:number}>} awards
 * @returns {number} Integer points, with safe-integer overflow checks.
 */
export function calculateAwardPoints(awards) {
  if (!Array.isArray(awards)) throw new TypeError('Awards must be an array.');
  return awards.reduce((total, award) => {
    if (!award || typeof award !== 'object' || Array.isArray(award)) {
      throw new TypeError('Each award must be an object with level and quantity.');
    }
    if (!Number.isSafeInteger(award.quantity) || award.quantity < 0) {
      throw new RangeError('Award quantity must be a non-negative safe integer.');
    }
    const points = getStarValue(award.level) * award.quantity;
    const next = total + points;
    if (!Number.isSafeInteger(points) || !Number.isSafeInteger(next)) {
      throw new RangeError('Award total exceeds the safe integer range.');
    }
    return next;
  }, 0);
}
