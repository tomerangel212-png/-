import assert from 'node:assert/strict';
import {
  STAR_TIERS, NAMED_STAR_VALUES, DECLARED_GAME_VALUE, INTEGRATION_STATUS,
  UnconfirmedStarValueError, getStarTier, getStarValue, calculateAwardPoints,
} from './hitster-star-economy.mjs';

let passed = 0;
function test(name, run) {
  run();
  passed += 1;
  console.log(`PASS ${name}`);
}

test('ten numbered levels', () => {
  assert.equal(STAR_TIERS.length, 10);
  assert.deepEqual(STAR_TIERS.map(t => t.level), [1,2,3,4,5,6,7,8,9,10]);
});
test('confirmed values and level four correction', () => {
  assert.deepEqual(STAR_TIERS.map(t => t.points), [10,20,50,100,500,1000,5000,10000,null,100000]);
  assert.equal(getStarValue(4), 100);
});
test('level nine conflicts remain visible and unresolved', () => {
  assert.equal(getStarTier(9).status, 'unresolved');
  assert.deepEqual(getStarTier(9).alternatives, [50000,999,990]);
});
test('unresolved value cannot be used or treated as zero', () => {
  assert.throws(() => getStarValue(9), UnconfirmedStarValueError);
  assert.throws(() => calculateAwardPoints([{level:9,quantity:0}]), UnconfirmedStarValueError);
  assert.throws(() => calculateAwardPoints([{level:9,quantity:1}]), UnconfirmedStarValueError);
});
test('invalid levels rejected', () => {
  for (const level of [0,-1,11,1.5,'4',null,NaN,Infinity]) {
    assert.throws(() => getStarTier(level), RangeError);
  }
});
test('named stars kept separate', () => {
  assert.equal(NAMED_STAR_VALUES.happy, 10000);
  assert.equal(NAMED_STAR_VALUES.sad, 10000);
  assert.ok(STAR_TIERS.every(t => !('namedStar' in t)));
});
test('game value remains ten million, not ten thousand', () => {
  assert.equal(DECLARED_GAME_VALUE, 10000000);
});
test('no silent changes to legacy game', () => {
  assert.equal(INTEGRATION_STATUS.enabled, false);
  assert.equal(INTEGRATION_STATUS.legacyTokensChanged, false);
  assert.equal(INTEGRATION_STATUS.winnerRulesChanged, false);
});
test('empty awards produce zero', () => assert.equal(calculateAwardPoints([]), 0));
test('confirmed award sums', () => {
  assert.equal(calculateAwardPoints([{level:1,quantity:2},{level:5,quantity:1},{level:10,quantity:1}]),100520);
  assert.equal(calculateAwardPoints([{level:7,quantity:1},{level:8,quantity:1}]),15000);
});
test('invalid quantities rejected', () => {
  for (const quantity of [-1,1.5,'2',null,NaN,Infinity,Number.MAX_SAFE_INTEGER+1]) {
    assert.throws(() => calculateAwardPoints([{level:1,quantity}]), RangeError);
  }
});
test('invalid award inputs rejected', () => {
  for (const awards of [null,{},'stars']) assert.throws(() => calculateAwardPoints(awards), TypeError);
  for (const award of [null,[],1,'star']) assert.throws(() => calculateAwardPoints([award]), TypeError);
});
test('multiplication overflow rejected', () => {
  assert.throws(() => calculateAwardPoints([{level:10,quantity:Number.MAX_SAFE_INTEGER}]), RangeError);
});
test('addition overflow rejected', () => {
  assert.throws(() => calculateAwardPoints([{level:1,quantity:Math.floor(Number.MAX_SAFE_INTEGER/10)},{level:1,quantity:1}]), RangeError);
});
test('inputs never mutated', () => {
  const award = Object.freeze({level:4,quantity:2});
  const awards = Object.freeze([award]);
  assert.equal(calculateAwardPoints(awards), 200);
  assert.deepEqual(awards, [{level:4,quantity:2}]);
});
test('configuration is read-only', () => {
  assert.throws(() => {STAR_TIERS[3].points=999;}, TypeError);
  assert.throws(() => {STAR_TIERS[8].alternatives.push(123);}, TypeError);
  assert.throws(() => {NAMED_STAR_VALUES.happy=0;}, TypeError);
});
console.log(`\n${passed}/${passed} star-registry tests passed. No browser or deployment claim.`);
