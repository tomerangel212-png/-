(function (root) {
  'use strict';
  const groups = ['children', 'adults', 'seniors'];
  const labels = ['ילדים', 'מבוגרים', 'הגיל השלישי'];
  const norm = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[\u0591-\u05c7]/g, '').replace(/[^\p{L}\p{N}]/gu, '');
  function participantTotal(groupCount) {
    if (!Number.isInteger(groupCount) || groupCount < 4 || groupCount > 20) throw Error('בחרו בין 4 ל־20 קבוצות.');
    return groupCount * 10;
  }
  function participantPlan(groupCount, counts) {
    const total = participantTotal(groupCount);
    if (!Array.isArray(counts) || counts.length !== 3 || counts.some(count => !Number.isInteger(count) || count < 1)) throw Error('הזינו לפחות משתתף אחד בכל קבוצת גיל כדי לשחק בכל שלושת השלבים.');
    if (counts.reduce((sum, count) => sum + count, 0) !== total) throw Error('סכום שלוש קבוצות הגיל צריך להיות ' + total + ' משתתפים.');
    return { groupCount, perGroup: 10, total, counts: counts.slice() };
  }
  function validate(songs, quota) {
    if (!Number.isInteger(quota) || quota < 1 || quota > 10) throw Error('בחרו בין שיר אחד לעשרה שירים בכל שלב.');
    const ids = new Set(), identities = new Set();
    songs.forEach(song => {
      if (!song.id || ids.has(song.id) || !groups.includes(song.group) || !norm(song.title) || !norm(song.artist) || !Number.isInteger(song.year) || song.year < 1800 || song.year > new Date().getFullYear()) throw Error('פרטי שיר חסרים או לא תקינים.');
      const identity = norm(song.title) + '|' + norm(song.artist);
      if (identities.has(identity)) throw Error('אותו שיר ואמן יכולים להופיע פעם אחת בלבד.');
      if (/michaeljackson|eyalgolan|איילגולן/.test(norm(song.artist))) throw Error('האמן הזה מוחרג מהמשחק.');
      ids.add(song.id); identities.add(identity);
    });
    groups.forEach((group, index) => {
      if (songs.filter(song => song.group === group).length < quota) throw Error('הוסיפו לפחות ' + quota + ' שירים לקבוצת ' + labels[index] + '.');
    });
  }
  function create(songs, quota) {
    validate(songs, quota);
    return { version: 1, quota, queue: groups.flatMap(group => songs.filter(song => song.group === group).slice(0, quota).map(song => song.id)), index: 0, scores: [0, 0, 0], answered: false, revealed: false };
  }
  function stage(state) { return Math.min(2, Math.floor(state.index / state.quota)); }
  function done(state) { return state.index >= state.queue.length; }
  function answer(state, song, group, title, artist) {
    if (done(state) || state.answered || state.revealed) throw Error('כבר נענתה או נחשפה השאלה.');
    if (group !== groups[stage(state)]) throw Error('רק ' + labels[stage(state)] + ' יכולים לענות בשלב הזה.');
    if (!norm(title) || !norm(artist)) throw Error('כתבו שם שיר ושם אמן.');
    if (song.id !== state.queue[state.index] || song.group !== group) throw Error('השיר אינו שייך לשלב הנוכחי.');
    const correct = norm(title) === norm(song.title) && norm(artist) === norm(song.artist);
    state.answered = true;
    if (correct) state.scores[stage(state)]++;
    return correct;
  }
  function reveal(state) { if (!done(state)) state.revealed = true; }
  function next(state) {
    if (done(state) || !state.revealed) throw Error('חשפו את הפתרון לפני המעבר לשיר הבא.');
    state.index++; state.answered = false; state.revealed = false;
  }
  function restore(value, songs) {
    if (!value || value.version !== 1) throw Error('שמירה לא תקינה.');
    validate(songs, value.quota);
    if (!Array.isArray(value.queue) || value.queue.length !== value.quota * 3 || new Set(value.queue).size !== value.queue.length || !Number.isInteger(value.index) || value.index < 0 || value.index > value.queue.length || !Array.isArray(value.scores) || value.scores.length !== 3 || value.scores.some(score => !Number.isInteger(score) || score < 0 || score > value.quota) || typeof value.answered !== 'boolean' || typeof value.revealed !== 'boolean') throw Error('שמירה לא תקינה.');
    value.queue.forEach((id, index) => {
      if (!songs.some(song => song.id === id && song.group === groups[Math.floor(index / value.quota)])) throw Error('שיר חסר בשמירה.');
    });
    return value;
  }
  const api = { groups, labels, norm, participantTotal, participantPlan, validate, create, stage, done, answer, reveal, next, restore };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TRAGenerations = api;
})(typeof window === 'undefined' ? globalThis : window);
