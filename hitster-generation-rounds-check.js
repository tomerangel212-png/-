'use strict';
const assert=require('node:assert/strict'),core=require('./hitster-generation-rounds.js');
const real=require('./hitster-generations-data.json').cards;
assert.equal(real.length,54);assert.equal(core.validateGenerationDeck(real).ok,true);
for(const stage of core.GENERATION_STAGES)assert.equal(real.filter(c=>c.audience===stage.id).length,18);
const g=core.createGenerationRounds({cards:real,quotaPerStage:3});
assert.equal(g.acceptAnswer({responderAudience:'children',correct:true}).reason,'no-card');
const seen=new Set();
for(const stage of ['children','adults','elders']){
 assert.equal(g.currentStage().id,stage);
 const wrong=g.draw(()=>0);assert.equal(wrong.card.audience,stage);seen.add(wrong.card.id);
 assert.equal(g.draw().reason,'answer-pending');
 assert.equal(g.acceptAnswer({responderAudience:stage==='children'?'adults':'children',correct:true}).reason,'wrong-generation');
 assert.equal(g.currentCard().id,wrong.card.id);
 assert.equal(g.acceptAnswer({responderAudience:stage,correct:false}).counted,false);
 for(let i=0;i<3;i++){
  const c=g.draw(()=>0).card;assert.equal(c.audience,stage);assert.ok(!seen.has(c.id));seen.add(c.id);
  const resumed=core.createGenerationRounds({cards:real,quotaPerStage:3,restoredState:g.serialize()});assert.equal(resumed.currentCard().id,c.id);
  assert.equal(resumed.draw().reason,'answer-pending');
  const r=g.acceptAnswer({responderAudience:stage,correct:true});assert.equal(r.counted,true);
  assert.equal(g.acceptAnswer({responderAudience:stage,correct:true}).counted,false,'Cannot double count or count without card');
 }
}
assert.equal(g.isFinished(),true);assert.equal(g.draw().reason,'game-finished');
assert.equal(core.createGenerationRounds({cards:real,quotaPerStage:3,restoredState:g.serialize()}).isFinished(),true);
const technical=core.createGenerationRounds({cards:real,quotaPerStage:3});const first=technical.draw(()=>0).card;technical.skipUnavailable();assert.notEqual(technical.draw(()=>0).card.id,first.id);assert.equal(technical.serialize().completedByStage.children,0);
const exhausted=core.createGenerationRounds({cards:real,quotaPerStage:3});while(exhausted.availableCards().length){exhausted.draw();exhausted.skipUnavailable();}assert.equal(exhausted.draw().reason,'stage-deck-empty');assert.equal(exhausted.finishEmptyStage(),true);assert.equal(exhausted.currentStage().id,'adults');assert.equal(exhausted.serialize().completedByStage.children,0);
assert.equal(core.validateGenerationDeck([]).ok,false);assert.equal(core.validateGenerationDeck([...real,{...real[0],id:'different'}]).ok,false);
const malformed=core.createGenerationRounds({cards:real,restoredState:{stageIndex:1.3,current:real[20].id,used:['bad'],completedByStage:{children:1.5}}});assert.equal(malformed.currentStage().id,'children');assert.equal(malformed.currentCard(),null);
console.log('PASS: 54 sourced cards; stage eligibility, pending-card lock, one answer per card, no repeats, save/resume, end state, unavailable audio, exhaustion and corrupt saves.');
