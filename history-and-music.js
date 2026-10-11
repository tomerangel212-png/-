(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  let songs = [], entries = [], songLimit = 24, historyLimit = 30, localUrl = null;
  const norm = value => String(value || '').normalize('NFKC').toLowerCase();
  function link(label, url) { const a = document.createElement('a'); a.textContent = label; a.href = url; return a; }
  const filterIds = ['artist', 'decade', 'language', 'genre'];
  const unknown = '__unclassified__';
  const metadata = (song, field) => typeof song[field] === 'string' && song[field].trim() ? song[field].trim() : unknown;
  function syncViewLink() {
    const url = new URL(location.href);
    for (const id of ['music-search', ...filterIds]) {
      const key = id === 'music-search' ? 'q' : id, value = $(id).value;
      if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
    }
    url.hash = 'music'; $('catalog-view-link').href = url.href;
  }
  function restoreView() {
    const params = new URL(location.href).searchParams;
    $('music-search').value = params.get('q') || '';
    for (const id of filterIds) {
      const value = params.get(id) || '';
      $(id).value = Array.from($(id).options).some(option => option.value === value) ? value : '';
    }
    songLimit = 24; renderMusic();
  }
  function populateFilter(id, values) {
    const counts = new Map(); values.forEach(value => counts.set(value, (counts.get(value) || 0) + 1));
    Array.from(counts.keys()).sort((a, b) => String(a).localeCompare(String(b), 'he')).forEach(value => {
      const option = document.createElement('option'); option.value = value;
      const label = value === unknown ? 'לֹא סֻוַּג' : id === 'decade' ? value + '–' + (Number(value) + 9) : value;
      option.textContent = label + ' (' + counts.get(value) + ')'; $(id).append(option);
    });
  }
  function renderMusic() {
    const query = norm($('music-search').value), decade = $('decade').value;
    const selected = songs.filter(song => norm(song.title + ' ' + song.artist).includes(query)
      && (!decade || Math.floor(song.chartYear / 10) * 10 === Number(decade))
      && (!$('artist').value || song.artist === $('artist').value)
      && (!$('language').value || metadata(song, 'language') === $('language').value)
      && (!$('genre').value || metadata(song, 'genre') === $('genre').value));
    $('music-results').replaceChildren();
    selected.slice(0, songLimit).forEach(song => {
      const card = document.createElement('article'), title = document.createElement('h3'), artist = document.createElement('p'), year = document.createElement('p'), actions = document.createElement('div');
      card.className = 'card'; title.textContent = song.artist; title.dir = 'auto'; artist.textContent = song.title; artist.dir = 'auto'; year.className = 'badge'; year.textContent = 'שנת מצעד · ' + song.chartYear; actions.className = 'actions';
      actions.append(link('חיפוש ב־Apple Music', 'https://music.apple.com/il/search?term=' + encodeURIComponent(song.title + ' ' + song.artist)));
      if (typeof song.sourceUrl === 'string' && song.sourceUrl.startsWith('https://en.wikipedia.org/')) actions.append(link('מקור הרשומה', song.sourceUrl));
      card.append(year, title, artist, actions); $('music-results').append(card);
    });
    $('music-count').textContent = selected.length + ' שירים נמצאו · מוצגים ' + Math.min(songLimit, selected.length);
    $('more-music').hidden = selected.length <= songLimit;
    syncViewLink();
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
  const updateFilters = () => { songLimit = 24; renderMusic(); };
  $('music-search').oninput = updateFilters;
  filterIds.forEach(id => { $(id).onchange = updateFilters; });
  $('reset-filters').onclick = () => { $('music-search').value = ''; filterIds.forEach(id => { $(id).value = ''; }); updateFilters(); };
  window.addEventListener('popstate', restoreView);
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
  window.addEventListener('pagehide', event => { $('local-audio').pause(); if (!event.persisted && localUrl) URL.revokeObjectURL(localUrl); });
  fetch('hitster-alltime-888.json').then(response => { if (!response.ok) throw Error(); return response.json(); }).then(data => {
    if (!Array.isArray(data.cards)) throw Error();
    songs = data.cards.filter(song => song && song.title && song.artist && Number.isInteger(song.chartYear) && !/michael jackson|eyal golan|אייל גולן/i.test(song.artist));
    populateFilter('artist', songs.map(song => song.artist));
    populateFilter('decade', songs.map(song => Math.floor(song.chartYear / 10) * 10));
    populateFilter('language', songs.map(song => metadata(song, 'language')));
    populateFilter('genre', songs.map(song => metadata(song, 'genre')));
    const missingLanguage = songs.filter(song => metadata(song, 'language') === unknown).length;
    const missingGenre = songs.filter(song => metadata(song, 'genre') === unknown).length;
    $('metadata-note').textContent = 'שָׂפָה לֹא סֻוְּגָה: ' + missingLanguage + ' · סִגְנוֹן לֹא סֻוַּג: ' + missingGenre + '. הַסִּנּוּן מְבֻסָּס עַל הַמֵּידָע הַמְּתֹעָד בַּמַּאֲגָר.';
    restoreView();
  }).catch(() => { $('music-count').textContent = 'הקטלוג לא נטען. אפשר לפתוח את HITSTER מהקישור למעלה ולנסות לרענן.'; });
  fetch('tra-history-data.json').then(response => { if (!response.ok) throw Error(); return response.json(); }).then(data => {
    if (!Array.isArray(data.entries)) throw Error();
    entries = data.entries.filter(entry => /^[a-f0-9]{40}$/.test(entry.sha) && /^\d{4}-\d{2}-\d{2}$/.test(entry.date) && typeof entry.title === 'string').reverse(); renderHistory();
  }).catch(() => { $('history-count').textContent = 'התיעוד לא נטען. היסטוריית GitHub זמינה בקישור שבהמשך.'; });
})();
