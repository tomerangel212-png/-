"use strict";
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const core = require('./hitster-personal-core.js');
const source = fs.readFileSync('hitster-personal.js', 'utf8');
const songs = ['One', 'Two', 'Three', 'Four', 'Five'].map(title => ({title, artist: 'Artist'}));
function boot(setup, scores, blocked = false) {
  const nodes = new Map();
  const window = {TRAPersonal: core};
  vm.runInNewContext(source, {
    window, Intl, console,
    document: {getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, {value: '', addEventListener() {}, focus() {}});
      return nodes.get(id);
    }},
    localStorage: {getItem(key) {
      if (blocked) throw Error('storage unavailable');
      return key === 'tra-personal-five-v1' ? setup : scores;
    }},
    fetch: () => new Promise(() => {})
  });
  return {nodes, scores: window.TRA_PERSONAL_CONFIG.listenScores};
}
for (const raw of ['null', '[]', '42', '"text"', '{bad']) {
  const result = boot(raw, raw);
  assert.equal(result.nodes.get('song-0').value, 'לו יהי');
  assert.equal(result.scores['team-1'], 0);
}
for (const badSong of [null, {title: 42}, {title: 'Valid', artist: {}}, {title: ''}]) {
  const invalid = songs.slice(); invalid[0] = badSong;
  assert.ok(core.validateSongs(invalid));
  assert.equal(boot(JSON.stringify({songs: invalid}), '{}').nodes.get('song-0').value, 'לו יהי');
}
const validSetup = JSON.stringify({name: 'Player', songs});
const preserved = boot(validSetup, '{bad');
assert.equal(preserved.nodes.get('nickname').value, 'Player');
assert.equal(preserved.nodes.get('song-0').value, 'One');
assert.equal(preserved.scores['team-1'], 0);
assert.equal(boot('{bad', '{"team-1":7}').scores['team-1'], 7);
assert.equal(boot(validSetup, '{"team-1":3}').scores['team-1'], 3);
assert.equal(boot(null, null, true).nodes.get('song-0').value, 'לו יהי');
console.log('PASS: setup starts with malformed or blocked storage; invalid songs fall back; valid settings and scores survive independently.');
