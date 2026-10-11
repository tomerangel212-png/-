(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  let songs = [], entries = [], songLimit = 24, historyLimit = 30, localUrl = null;
  const norm = value => String(value || '').normalize('NFKC').toLowerCase();
  function link(label, url) { const a = document.createElement('a'); a.textContent = label; a.href = url; return a; }
  function renderMusic() {
    const query = norm($('music-search').value), decade = $('decade').value;
    const selected = songs.filter(song => norm(song.title + ' ' + song.artist).includes(query) && (!decade || Math.floor(song.chartYear / 10) * 10 === Number(decade)));
    $('music-results').replaceChildren();
    selected.slice(0, songLimit).forEach(song => {
      const card = document.createElement('article'), title = document.createElement('h3'), artist = document.createElement('p'), year = document.createElement('p'), actions = document.createElement('div');
      card.className = 'card'; title.textContent = song.title; artist.textContent = song.artist; year.className = 'badge'; year.textContent = 'שנת מצעד · ' + song.chartYear; actions.className = 'actions';
      actions.append(link('חיפוש ב־Apple Music', 'https://music.apple.com/il/search?term=' + encodeURIComponent(song.title + ' ' + song.artist)));
      if (typeof song.sourceUrl === 'string' && song.sourceUrl.startsWith('https://en.wikipedia.org/')) actions.append(link('מקור הרשומה', song.sourceUrl));
      card.append(year, title, artist, actions); $('music-results').append(card);
    });
    $('music-count').textContent = selected.length + ' שירים נמצאו · מוצגים ' + Math.min(songLimit, selected.length);
    $('more-music').hidden = selected.length <= songLimit;
  }
  function renderHistory() {
    const query = norm($('history-search').value), selected = entries.filter(entry => norm(entry.title + ' ' + entry.date + ' ' + entry.sha).includes(query));
    $('history-results').replaceChildren();
    selected.slice(0, historyLimit).forEach(entry => {
      const li = document.createElement('li'), time = document.createElement('time'), title = document.createElement('p');
      time.dateTime = entry.date; time.textContent = entry.date; time.className = 'badge'; title.textContent = entry.title; title.dir = 'auto';
      li.append(time, title);
      if (entry.published) li.append(link('שינוי בקוד · ' + entry.sha.slice(0, 7), 'https://github.com/tomerangel212-png/-/commit/' + entry.sha));
      else { const status = document.createElement('span'); status.className = 'muted'; status.textContent = 'קומיט מקומי בעת צילום המצב · ' + entry.sha.slice(0, 7); li.append(status); }
      $('history-results').append(li);
    });
    $('history-count').textContent = selected.length + ' שינויים מתועדים · מוצגים ' + Math.min(historyLimit, selected.length) + ' · מהחדש לישן';
    $('more-history').hidden = selected.length <= historyLimit;
  }
  $('music-search').oninput = $('decade').onchange = () => { songLimit = 24; renderMusic(); };
  $('history-search').oninput = () => { historyLimit = 30; renderHistory(); };
  $('more-music').onclick = () => { songLimit += 24; renderMusic(); };
  $('more-history').onclick = () => { historyLimit += 30; renderHistory(); };
  $('open-player').onclick = () => {
    $('local-audio').pause();
    const frame = document.createElement('iframe'); frame.src = 'hitster-mobile.html'; frame.title = 'HITSTER TRA — נגן ומשחק'; frame.allow = 'autoplay';
    $('player-host').replaceChildren(frame); $('open-player').textContent = 'טעינת HITSTER מחדש';
  };
  $('local-file').onchange = () => {
    const audio = $('local-audio'), file = $('local-file').files[0];
    if (!file) return;
    audio.pause(); if (localUrl) URL.revokeObjectURL(localUrl);
    $('player-host').replaceChildren(); $('open-player').textContent = 'פתיחת HITSTER והנגן';
    localUrl = URL.createObjectURL(file); audio.src = localUrl; audio.load(); $('local-name').textContent = file.name;
    $('audio-status').textContent = 'הקובץ מוכן. לחצו על נגן.';
  };
  $('local-audio').addEventListener('play', () => { $('player-host').replaceChildren(); $('open-player').textContent = 'פתיחת HITSTER והנגן'; });
  $('local-audio').onerror = () => { $('audio-status').textContent = 'המכשיר לא הצליח לנגן את הקובץ. נסו קובץ שמע בפורמט נתמך.'; };
  window.addEventListener('pagehide', () => { $('local-audio').pause(); if (localUrl) URL.revokeObjectURL(localUrl); });
  fetch('hitster-alltime-888.json').then(response => { if (!response.ok) throw Error(); return response.json(); }).then(data => {
    if (!Array.isArray(data.cards)) throw Error();
    songs = data.cards.filter(song => song && song.title && song.artist && Number.isInteger(song.chartYear) && !/michael jackson|eyal golan|אייל גולן/i.test(song.artist));
    [...new Set(songs.map(song => Math.floor(song.chartYear / 10) * 10))].sort().forEach(decade => { const option = document.createElement('option'); option.value = decade; option.textContent = decade + '–' + (decade + 9); $('decade').append(option); });
    renderMusic();
  }).catch(() => { $('music-count').textContent = 'הקטלוג לא נטען. אפשר לפתוח את HITSTER מהקישור למעלה ולנסות לרענן.'; });
  fetch('tra-history-data.json').then(response => { if (!response.ok) throw Error(); return response.json(); }).then(data => {
    if (!Array.isArray(data.entries)) throw Error();
    entries = data.entries.filter(entry => /^[a-f0-9]{40}$/.test(entry.sha) && /^\d{4}-\d{2}-\d{2}$/.test(entry.date) && typeof entry.title === 'string').reverse(); renderHistory();
  }).catch(() => { $('history-count').textContent = 'התיעוד לא נטען. היסטוריית GitHub זמינה בקישור שבהמשך.'; });
})();
