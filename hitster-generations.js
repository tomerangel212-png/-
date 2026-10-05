(function () {
  'use strict';
  const core = window.TRAGenerations, $ = id => document.getElementById(id);
  let db, songs = [], state = null, plan = null, busy = false, sourceId = null, sourceUrl = null, timer = null;
  const audio = $('audio');
  function message(value) { $('status').textContent = value; }
  function stop() { clearTimeout(timer); audio.pause(); try { audio.currentTime = 0; } catch (_) {} }
  function current() { return state && songs.find(song => song.id === state.queue[state.index]); }
  function save() {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('session', 'readwrite');
      tx.objectStore('session').put({ songs, state, plan }, 'current');
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error || Error('השמירה בוטלה.'));
    });
  }
  async function change(action) {
    if (busy) return;
    busy = true;
    const previousSongs = songs.slice(), previousState = state && JSON.parse(JSON.stringify(state)), previousPlan = plan;
    try { await action(); await save(); render(); }
    catch (error) { songs = previousSongs; state = previousState; plan = previousPlan; render(); message(error.message || 'לא ניתן לשמור. הפעולה לא בוצעה.'); }
    finally { busy = false; }
  }
  function eligibility() {
    const active = state && !core.done(state);
    const allowed = active && $('respondent').value === core.groups[core.stage(state)];
    $('submit-answer').disabled = !allowed || state.answered || state.revealed;
    if (active && $('respondent').value && !allowed) message('בשלב הזה רק ' + core.labels[core.stage(state)] + ' יכולים לענות.');
  }
  function renderSetup() {
    $('songs').replaceChildren();
    songs.forEach(song => {
      const li = document.createElement('li'), remove = document.createElement('button');
      li.textContent = core.labels[core.groups.indexOf(song.group)] + ' · ' + song.title + ' — ' + song.artist + ' (' + song.year + ')';
      remove.type = 'button'; remove.className = 'secondary'; remove.textContent = 'הסר';
      remove.onclick = () => change(() => { if (!state && window.confirm('להסיר את השיר מהחפיסה הזו?')) songs = songs.filter(item => item.id !== song.id); });
      li.append(remove); $('songs').append(li);
    });
    $('counts').textContent = core.groups.map((group, index) => core.labels[index] + ': ' + songs.filter(song => song.group === group).length).join(' · ');
    renderParticipants();
    try { core.validate(songs, Number($('quota').value)); readPlan(); $('start').disabled = false; }
    catch (_) { $('start').disabled = true; }
  }
  function readPlan() {
    return core.participantPlan(Number($('group-count').value), core.groups.map(group => Number($('count-' + group).value)));
  }
  function renderParticipants() {
    try {
      const count = Number($('group-count').value), total = core.participantTotal(count);
      $('participant-total').textContent = count + ' קבוצות × 10 = ' + total + ' משתתפים';
      const entered = core.groups.reduce((sum, group) => sum + Number($('count-' + group).value || 0), 0);
      $('participant-validation').textContent = 'שויכו ' + entered + ' מתוך ' + total + ' משתתפים.';
      try { readPlan(); $('participant-validation').textContent += ' החלוקה מלאה.'; }
      catch (_) { $('participant-validation').textContent += ' נדרשת חלוקה מלאה עם לפחות משתתף אחד בכל שלב.'; }
    } catch (error) { $('participant-total').textContent = ''; $('participant-validation').textContent = error.message; }
  }
  function render() {
    const finished = state && core.done(state), active = state && !finished;
    $('setup').hidden = Boolean(state); $('game').hidden = !active; $('summary').hidden = !finished; $('restart').hidden = !state;
    core.groups.forEach((_, i) => { if (active && i === core.stage(state)) $('stage-' + i).setAttribute('aria-current', 'step'); else $('stage-' + i).removeAttribute('aria-current'); });
    if (!state) { stop(); renderSetup(); return; }
    if (finished) {
      stop(); $('scores').replaceChildren();
      state.scores.forEach((score, i) => { const li = document.createElement('li'); li.textContent = core.labels[i] + ': ' + score + ' מתוך ' + state.quota; $('scores').append(li); });
      return;
    }
    const index = core.stage(state), song = current();
    $('stage-title').textContent = 'שלב ' + (index + 1) + ' · שירי ' + core.labels[index];
    $('who').textContent = 'עכשיו רק ' + core.labels[index] + ' יכולים לענות.';
    $('progress').textContent = 'שיר ' + ((state.index % state.quota) + 1) + ' מתוך ' + state.quota + ' בשלב';
    $('participant-summary').textContent = plan ? plan.groupCount + ' קבוצות · ' + plan.total + ' משתתפים בסך הכול · ' + plan.counts[index] + ' רשאים לענות בשלב הזה' : 'משחק שמור מהגרסה הקודמת — טרם הוגדרה חלוקת משתתפים.';
    if (sourceId !== song.id) {
      stop(); if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      sourceUrl = URL.createObjectURL(song.audio); sourceId = song.id; audio.src = sourceUrl; audio.load();
      $('answer-form').reset(); $('answer-result').textContent = '';
    }
    $('solution').hidden = !state.revealed;
    $('solution').textContent = state.revealed ? song.title + ' — ' + song.artist + ' · ' + song.year : '';
    $('reveal').disabled = state.revealed; $('next').disabled = !state.revealed;
    const lastInStage = (state.index + 1) % state.quota === 0;
    $('next').textContent = state.index + 1 === state.queue.length ? 'לסיכום המשחק' : lastInStage ? 'לשלב ' + core.labels[index + 1] : 'לשיר הבא';
    $('answer-title').disabled = $('answer-artist').disabled = state.answered || state.revealed;
    eligibility();
  }
  $('song-year').max = String(new Date().getFullYear());
  $('quota').onchange = renderSetup;
  ['group-count', 'count-children', 'count-adults', 'count-seniors'].forEach(id => { $(id).oninput = renderSetup; });
  for (let count = 4; count <= 20; count++) {
    const row = document.createElement('tr');
    [count, core.participantTotal(count)].forEach(value => { const cell = document.createElement('td'); cell.textContent = value; row.append(cell); });
    $('participant-series').append(row);
  }
  $('song-form').onsubmit = event => {
    event.preventDefault();
    change(() => {
      if (state) throw Error('לא ניתן לשנות חפיסה בזמן משחק.');
      const file = $('song-audio').files[0];
      if (!file || !file.size || file.size > 20 * 1024 * 1024 || (file.type && !file.type.startsWith('audio/'))) throw Error('בחרו קובץ שמע תקין, עד 20MB.');
      if (songs.reduce((sum, song) => sum + song.audio.size, 0) + file.size > 100 * 1024 * 1024) throw Error('החפיסה מוגבלת ל־100MB במכשיר הזה.');
      const song = { id: 'song-' + Date.now() + '-' + Math.random().toString(36).slice(2), group: $('song-group').value, title: $('song-title').value.trim(), artist: $('song-artist').value.trim(), year: Number($('song-year').value), audio: file };
      if (!core.norm(song.title) || !core.norm(song.artist) || !Number.isInteger(song.year) || song.year < 1800 || song.year > new Date().getFullYear()) throw Error('בדקו את שם השיר, האמן ושנת ההקלטה.');
      if (/michaeljackson|eyalgolan|איילגולן/.test(core.norm(song.artist))) throw Error('האמן הזה מוחרג מהמשחק.');
      if (songs.some(old => core.norm(old.title) === core.norm(song.title) && core.norm(old.artist) === core.norm(song.artist))) throw Error('השיר הזה כבר בחפיסה.');
      songs = songs.concat(song); message('השיר נוסף לחפיסה.');
    });
  };
  $('start').onclick = () => change(() => { plan = readPlan(); state = core.create(songs, Number($('quota').value)); sourceId = null; message('מתחילים בילדים.'); });
  $('respondent').onchange = eligibility;
  $('answer-form').onsubmit = event => {
    event.preventDefault();
    change(() => {
      const correct = core.answer(state, current(), $('respondent').value, $('answer-title').value, $('answer-artist').value);
      $('answer-result').textContent = correct ? 'נכון! נקודה לקבוצה.' : 'הזיהוי אינו תואם. אפשר לחשוף את הפתרון.';
      message(correct ? 'התשובה התקבלה.' : 'הניסיון נוצל.');
    });
  };
  $('reveal').onclick = () => change(() => { core.reveal(state); stop(); message('הפתרון נחשף.'); });
  $('next').onclick = () => change(() => { core.next(state); message(core.done(state) ? 'המשחק הסתיים.' : 'התור הבא מוכן.'); });
  $('restart').onclick = () => {
    if (window.confirm('להתחיל משחק חדש במצב שלושת הדורות? הניקוד במצב הזה יתאפס והשירים יישמרו.')) change(() => { stop(); state = null; sourceId = null; message('השירים נשמרו. אפשר לערוך ולהתחיל מחדש.'); });
  };
  $('play').onclick = async () => {
    if (!state || core.done(state)) return;
    const expected = sourceId;
    stop();
    try { await audio.play(); if (sourceId === expected) { timer = setTimeout(stop, 30000); message('מקשיבים — רק קבוצת השלב עונה.'); } }
    catch (_) { message('לא ניתן לנגן את הקובץ. נסו שוב או השתמשו בקובץ שמע בפורמט שנתמך במכשיר.'); }
  };
  $('stop').onclick = stop;
  audio.ontimeupdate = () => { if (audio.currentTime >= 30) stop(); };
  audio.onended = () => clearTimeout(timer);
  audio.onerror = () => message('קובץ השמע לא נתמך או אינו זמין במכשיר.');
  window.addEventListener('pagehide', stop);
  (async function init() {
    try {
      db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('tra-hitster-generations-v1', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('session');
        request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
      });
      const saved = await new Promise((resolve, reject) => {
        const request = db.transaction('session').objectStore('session').get('current');
        request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
      });
      if (saved) {
        if (!Array.isArray(saved.songs) || saved.songs.some(song => !(song.audio instanceof Blob))) throw Error('לא ניתן לקרוא את קובצי השמע השמורים.');
        songs = saved.songs; state = saved.state ? core.restore(saved.state, songs) : null;
        plan = saved.plan ? core.participantPlan(saved.plan.groupCount, saved.plan.counts) : null;
        if (plan) {
          $('group-count').value = plan.groupCount;
          core.groups.forEach((group, i) => { $('count-' + group).value = plan.counts[i]; });
        }
      }
      render(); message(state ? 'המשחק השמור נטען.' : 'הוסיפו שירים לכל אחד משלושת השלבים.');
    } catch (_) { message('לא ניתן לפתוח את השמירה המקומית. נסו דפדפן שמאפשר אחסון מקומי; לא שינינו את השמירה הקיימת.'); }
  })();
})();
