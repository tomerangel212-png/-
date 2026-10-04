// © 2026 Tomer Rafael Angel. All rights reserved.
// Run: node hitster-star-values-check.mjs
// Specification tests only; these do not certify live scoring or playback.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const spec = JSON.parse(readFileSync(new URL('./HITSTER_STAR_VALUES.json', import.meta.url), 'utf8'));
const expected = [10, 20, 50, 100, 500, 1000, 5000, 10000, null, 100000];

function validate(data) {
  assert.equal(data.schemaVersion, 1);
  assert.equal(data.tierCount, 10);
  assert.equal(data.tiers.length, 10);
  const levels = new Set();
  for (const tier of data.tiers) {
    assert.ok(Number.isInteger(tier.level) && tier.level >= 1 && tier.level <= 10);
    assert.ok(!levels.has(tier.level), 'Duplicate star level');
    levels.add(tier.level);
    assert.ok(tier.confirmedValue === null || (Number.isSafeInteger(tier.confirmedValue) && tier.confirmedValue > 0), 'Invalid star value');
    if (tier.confirmedValue === null) assert.ok(tier.status.startsWith('pending'), 'An unknown value must remain pending');
  }
  assert.equal(data.runtimeEnabled, false, 'Do not enable scoring from a specification-only change');
  assert.equal(data.integration.mode, 'documentation_only_not_loaded_by_game');
  return true;
}
const copy = () => JSON.parse(JSON.stringify(spec));

test('specification has exactly ten unique numbered levels', () => assert.ok(validate(spec)));
test('latest unambiguous approved values are preserved', () => {
  assert.deepEqual(spec.tiers.map(t => t.confirmedValue), expected);
});
test('level four is explicitly confirmed as 100, not still a proposal', () => {
  const tier = spec.tiers.find(t => t.level === 4);
  assert.equal(tier.confirmedValue, 100);
  assert.equal(tier.proposedValue, null);
  assert.equal(tier.status, 'confirmed_in_latest_approval');
});
test('level nine is not silently changed to zero, 999, 990, or 50000', () => {
  const tier = spec.tiers.find(t => t.level === 9);
  assert.equal(tier.confirmedValue, null);
  assert.equal(tier.lastExplicitValue, 50000);
  assert.equal(tier.status, 'pending_exact_level_9_value');
});
test('both ambiguous numeric corrections remain explicitly unassigned', () => {
  for (const value of [990, 999]) {
    const input = spec.unresolvedInputs.find(x => x.value === value);
    assert.ok(input);
    assert.equal(input.assignedLevel, null);
  }
});
test('historical named stars are not automatically mapped to tiers', () => {
  for (const name of ['happy', 'sad']) {
    assert.equal(spec.priorNamedStars[name].lastExplicitValue, 10000);
    assert.equal(spec.priorNamedStars[name].assignedLevel, null);
  }
});
test('saved games, existing token balances, and win conditions remain protected', () => {
  for (const name of ['preserveSavedGames', 'preserveExistingTokenBalance', 'preserveCurrentScoringAndWinConditions']) assert.equal(spec.integration[name], true);
});
test('unapproved earning, spending, and final-score formulas remain unset', () => {
  for (const name of ['awardRules', 'redemptionRules', 'finalScoreFormula']) assert.equal(spec.integration[name], null);
});
test('validation rejects duplicate or out-of-range levels', () => {
  for (const level of [1, 0, 11, 1.5]) {
    const changed = copy(); changed.tiers[1].level = level;
    assert.throws(() => validate(changed));
  }
});
test('validation rejects strings, fractions, negative values, zero, and unsafe numbers', () => {
  for (const value of ['100', 1.5, -1, 0, Number.MAX_SAFE_INTEGER + 1]) {
    const changed = copy(); changed.tiers[3].confirmedValue = value;
    assert.throws(() => validate(changed));
  }
});
test('validation rejects an unknown value labeled as confirmed', () => {
  const changed = copy(); changed.tiers[8].status = 'confirmed_in_latest_approval';
  assert.throws(() => validate(changed));
});
test('validation rejects accidental runtime activation', () => {
  const changed = copy(); changed.runtimeEnabled = true;
  assert.throws(() => validate(changed));
});
