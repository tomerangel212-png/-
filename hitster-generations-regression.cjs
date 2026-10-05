"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { harness, settle } = require("./hitster-audio-regression.cjs");
const configContext = { window: {} };
vm.runInNewContext(fs.readFileSync("hitster-generations.js", "utf8"), configContext);
const cfg = configContext.window.TRA_GENERATIONS_CONFIG;
const isChild = card => cfg.childrenIds.includes(card.id) || cfg.children.some(c => c.id === card.id);
async function authorize(h) {
  h.nodes.get("generation-confirm").checked = true;
  h.nodes.get("generation-confirm").emit("change");
}
(async () => {
  for (const language of ["he", "en"]) {
    const h = await harness({ generations: true, language });
    h.click("continue-game");
    for (let turn = 0; turn < 15; turn++) {
      const card = h.window.test.staged();
      assert.ok(card, "Each stage prepares audio");
      if (turn < 5) assert.ok(isChild(card), "Children receive children's songs even if recorded in 1978");
      else if (turn < 10) assert.ok(cfg.adultIds.includes(card.id));
      else assert.ok(cfg.olderIds.includes(card.id));
      h.click("play-clip"); await settle();
      h.click("generation-next");
      assert.equal(h.state().generationStage, Math.min(2, Math.floor(turn / 5)), "Active cards cannot cross stages");
      assert.equal(h.nodes.get("generation-confirm").checked, false);
      assert.equal(h.nodes.get("reveal-year").disabled, true);
      h.click("reveal-year");
      assert.equal(h.state().currentYearRevealed, false, "Handler itself rejects unconfirmed answers");
      h.window.test.free();
      assert.equal(h.state().current, card.id, "Free card cannot bypass host confirmation");
      await authorize(h);
      h.click("reveal-year");
      assert.equal(h.state().currentYearRevealed, true);
      if (h.state().currentPlacementCorrect) h.window.test.add();
      else h.window.test.wrong();
      await settle();
      assert.equal(h.state().generationTurns, turn + 1);
      if (turn === 4 || turn === 9) {
        assert.equal(h.state().generationStage, turn === 4 ? 0 : 1, "Stage waits for the host");
        h.click("generation-next"); await settle();
      }
      assert.equal(new Set(h.state().used).size, h.state().used.length);
    }
    assert.ok(h.stores.has("hitster-tra-generations-v1"));
    assert.equal(h.stores.has("hitster-tra-annual-888-v1"), false);
    const saved = JSON.parse(JSON.stringify(h.state()));
    const restored = await harness({ generations: true, language, savedState: saved });
    assert.equal(restored.state().generationTurns, 15);
    assert.equal(restored.state().generationStage, 2);
    assert.deepEqual(JSON.parse(JSON.stringify(restored.state().used)), saved.used);
    assert.equal(restored.nodes.get("generation-confirm").checked, false);
    restored.window.test.reset(true); await settle();
    assert.equal(restored.state().generationTurns, 0);
    assert.ok(isChild(restored.window.test.staged()));
    const skip = await harness({ generations: true, language });
    skip.click("play-clip"); await settle();
    skip.click("skip-card"); await settle();
    assert.equal(skip.state().generationTurns, 0, "Replacement keeps the same stage and turn");
    const offline = await harness({ generations: true, offline: true, language, cacheIds: [cfg.childrenIds[0]] });
    assert.equal(offline.window.test.staged().id, cfg.childrenIds[0]);
    const unavailable = await harness({ generations: true, offline: true, language });
    assert.equal(unavailable.window.test.staged(), null, "Missing audio never falls back to another generation");
    assert.equal(unavailable.state().generationTurns, 0);
    const early = await harness({ generations: true, language });
    early.state().teams[0].timeline = cfg.children.map(c => c.id).concat(cfg.childrenIds);
    early.state().activeTeamId = early.state().teams[4].id;
    early.window.test.finish(true); await settle();
    assert.equal(early.state().winnerTeamId, null, "Ten cards cannot end the game before all three generations play");
  }
  console.log("PASS: Three Generations, both languages: correct pools, full-round transitions, host gating, no repeats, replacement, independent saves, reload, reset and offline/no-audio handling.");
})().catch(error => { console.error(error); process.exitCode = 1; });
