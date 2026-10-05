"use strict";
// Executes the production handlers with simulated DOM/media, never claims device audibility.
const assert = require("node:assert/strict");
const { harness, settle, deck } = require("./hitster-audio-regression.cjs");

(async () => {
  const runs = Number(process.env.TRA_FAIR_RUNS || 400);
  assert.ok(Number.isInteger(runs) && runs > 0);
  for (let run = 0; run < runs; run++) {
    const standard = run % 10 === 0;
    const count = standard ? 5 : 2 + run % 9, start = Math.floor(run / 9) % count;
    const trigger = Math.floor(run / 17) % count;
    const language = run % 2 ? "en" : "he";
    let teams = Array.from({ length: count }, (_, i) => ({ id: "team-" + i, he: "קבוצה " + i, en: "Team " + i }));
    const config = standard ? null : { teams, cards: [] };
    let h = await harness({ personalConfig: config, language });
    let state = h.state();
    if (standard) teams = state.teams.map(team => ({ id: team.id, [language]: h.window.test.name(team.id) }));
    state.roundStartTeamId = teams[start].id;
    state.activeTeamId = teams[start].id;
    state.teams.forEach((team, i) => { team.timeline = deck.cards.slice(i * 9, i * 9 + 9).map(c => c.id); });
    state.used = state.teams.flatMap(t => t.timeline);
    let cursor = 120, expected = [], returned = [];
    for (let turn = 0; turn < count; turn++) {
      const index = (start + turn) % count;
      assert.equal(state.activeTeamId, teams[index].id, "Turn order honors the chosen starting team");
      const success = turn >= trigger && (turn === trigger || (run + turn) % 3 === 0);
      const card = deck.cards[cursor++];
      state.current = card.id;
      state.used.push(card.id);
      state.currentYearRevealed = true;
      state.currentPlacementCorrect = success;
      if (success) {
        expected.push(teams[index][language]);
        if ((run + turn) % 2) {
          state.currentYearRevealed = false;
          state.currentSolutionRevealed = false;
          h.window.test.free();
        } else h.window.test.add();
      } else h.window.test.wrong();
      returned.push(teams[index].id);
      await settle();
      if (turn < count - 1) {
        assert.equal(state.winnerTeamId, null, "No early winner or skipped final turns");
        assert.equal(h.alerts.length, 0, "No premature victory popup");
      }
      if (turn === trigger && turn < count - 1) {
        // Reload mid-final-round: remaining teams retain their opportunity.
        h = await harness({ personalConfig: config, language, savedState: state });
        state = h.state();
        assert.equal(state.roundStartTeamId, teams[start].id);
        assert.equal(state.winnerTeamId, null);
        assert.equal(new Set(state.used).size, state.used.length);
      }
    }
    assert.equal(new Set(returned).size, count, "Every team gets exactly one turn");
    assert.ok(state.winnerTeamId, "Round completion declares a winner");
    assert.equal(h.alerts.length, 1, "One victory popup per completed round");
    for (const name of expected) assert.ok(h.alerts[0].includes(name), "Every tied winner is named");
    const winners = state.teams.filter(t => t.timeline.length >= 10);
    assert.equal(winners.length, expected.length);
    assert.ok(h.nodes.get("winner-banner").textContent.includes(expected[0]));
    assert.equal(new Set(state.teams.flatMap(t => t.timeline)).size, state.teams.reduce((n, t) => n + t.timeline.length, 0));
    assert.ok(state.teams.every(t => t.stars >= 0 && t.stars <= 10));
    const snapshot = JSON.stringify(state);
    h.click("play-clip"); await settle();
    assert.equal(JSON.stringify(state), snapshot, "Completed games cannot consume a new card");
    const restored = await harness({ personalConfig: config, language, savedState: state });
    assert.ok(restored.state().winnerTeamId, "Completed games stay completed after reload");
    assert.equal(restored.alerts.length, 0, "Reload does not duplicate the victory popup");
    h.window.test.reset(true); await settle();
    assert.equal(h.state().winnerTeamId, null);
    assert.equal(h.state().used.length, 0);
    assert.ok(h.state().teams.every(t => t.stars === 5 && t.timeline.length === 0));
  }
  const legacy = await harness();
  const save = legacy.state();
  save.activeTeamId = save.teams[2].id;
  delete save.roundStartTeamId;
  const migrated = await harness({ savedState: save });
  assert.equal(migrated.state().roundStartTeamId, save.activeTeamId, "Legacy saves start a complete fair round from the saved active team");
  console.log(`PASS: ${runs}/${runs} fair-round scenarios; 2–10 teams, alternate starting teams, Hebrew/English, ties, missed final turns, free cards, reload, reset and global uniqueness.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
