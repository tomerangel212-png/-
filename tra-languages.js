/* TRA Languages view/controller. Content lives in data/languages/. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const data = window.TRALanguagesData;
  const store = data.createStore(window.fetch ? window.fetch.bind(window) : null);
  const mapKey = 'traLanguagesSoundMap'; // Keep the existing user archive, without migration/deletion.
  let catalog = null, manifest = null, pack = null, request = 0;
  let i = 0, score = 0, answered = false, lives = 3, streak = 0, finished = false;

  function hud() {
    $('gameScore').textContent = score;
    $('gameStreak').textContent = streak;
    $('gameLives').textContent = lives;
  }
  function shuffle(values) {
    const result = values.slice();
    for (let n = result.length - 1; n > 0; n--) {
      const j = Math.floor(Math.random() * (n + 1));
      [result[n], result[j]] = [result[j], result[n]];
    }
    return result;
  }
  function lesson() {
    const q = pack.items[i];
    answered = false;
    $('next').disabled = true;
    $('next').textContent = 'הַבָּא / Next';
    $('speak').disabled = pack.speechTag === null;
    $('feedback').textContent = '';
    $('step').textContent = 'שָׁלָב ' + (i + 1) + ' / ' + pack.items.length;
    $('word').textContent = q[0];
    $('word').lang = pack.speechTag || '';
    $('word').dir = 'auto';
    $('prompt').textContent = 'מַה הַמַּשְׁמָעוּת?';
    const other = pack.items.map(item => item[1]).filter((x, n, all) => x !== q[1] && all.indexOf(x) === n);
    const choices = shuffle([q[1]].concat(shuffle(other).slice(0, 2)));
    $('choices').textContent = '';
    choices.forEach(value => {
      const button = document.createElement('button');
      button.className = 'choice';
      button.textContent = value;
      button.lang = pack.translationLanguage;
      button.dir = 'auto';
      button.onclick = () => answer(button, value === q[1]);
      $('choices').appendChild(button);
    });
    $('progress').max = pack.items.length;
    $('progress').value = i;
  }
  function startPack(value) {
    pack = value;
    i = score = streak = 0;
    lives = 3;
    finished = false;
    hud(); lesson();
  }
  function answer(button, correct) {
    if (!pack || answered || finished) return;
    answered = true;
    button.classList.add(correct ? 'ok' : 'bad');
    if (correct) {
      score += 10; streak++;
      $('feedback').textContent = '✓ נָכוֹן / Correct · +10';
    } else {
      lives = Math.max(0, lives - 1); streak = 0;
      $('feedback').textContent = 'לֹא הַפַּעַם — הַתְּשׁוּבָה: ' + pack.items[i][1];
    }
    hud();
    $('next').disabled = false;
    if (lives === 0) $('next').textContent = 'מִשְׂחָק חָדָשׁ / New game';
  }
  $('next').onclick = () => {
    if (!pack || (!answered && !finished)) return;
    if (lives === 0 || finished) { startPack(pack); return; }
    i++;
    if (i < pack.items.length) { lesson(); return; }
    finished = true;
    $('choices').textContent = '';
    $('word').textContent = 'הַמִּשְׂחָק הֻשְׁלַם 🎵';
    $('word').lang = 'he';
    $('prompt').textContent = 'Score: ' + score + ' · Streak: ' + streak + ' · Lives: ' + lives;
    $('progress').value = pack.items.length;
    $('speak').disabled = true;
    $('next').textContent = 'מִשְׂחָק חָדָשׁ / New game';
    try { localStorage.setItem('traLanguagesLastScore', String(score)); }
    catch (_) { $('feedback').textContent = 'הַמִּשְׂחָק הֻשְׁלַם, אַךְ הַצִּיּוּן לֹא נִשְׁמַר בַּמַּכְשִׁיר.'; }
  };
  $('speak').onclick = () => {
    if (!pack || finished || !pack.speechTag) return;
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      $('feedback').textContent = 'הַקְרָאָה אֵינָהּ זְמִינָה בַּמַּכְשִׁיר הַזֶּה.';
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new window.SpeechSynthesisUtterance(pack.items[i][0]);
      const token = request;
      utterance.lang = pack.speechTag;
      utterance.onerror = event => {
        if (token === request && event.error !== 'canceled' && event.error !== 'interrupted')
          $('feedback').textContent = 'הַהַקְרָאָה נִכְשְׁלָה. אֶפְשָׁר לְהַמְשִׁיךְ בְּלִי קוֹל.';
      };
      window.speechSynthesis.speak(utterance);
    } catch (_) { $('feedback').textContent = 'הַהַקְרָאָה נִכְשְׁלָה. אֶפְשָׁר לְהַמְשִׁיךְ בְּלִי קוֹל.'; }
  };
  function loadLesson() {
    const token = ++request, id = $('lang').value;
    pack = null;
    $('choices').textContent = $('word').textContent = $('feedback').textContent = '';
    $('step').textContent = $('prompt').textContent = '';
    $('next').disabled = $('speak').disabled = true;
    $('lesson').setAttribute('aria-busy', 'true');
    $('retryLesson').hidden = true;
    $('loadStatus').textContent = 'טְעִינַת שִׁעוּר / Loading lesson…';
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    return store.pack(id).then(value => {
      if (token !== request) return; // A slower old selection must not replace a newer one.
      startPack(value);
      $('lesson').setAttribute('aria-busy', 'false');
      $('loadStatus').textContent = 'הַשִּׁעוּר מוּכָן / Lesson ready';
    }).catch(() => {
      if (token !== request) return;
      $('lesson').setAttribute('aria-busy', 'false');
      $('loadStatus').textContent = 'טְעִינַת הַשִּׁעוּר נִכְשְׁלָה. נַסֵּה שׁוּב אוֹ בְּחַר שָׂפָה אַחֶרֶת.';
      $('retryLesson').hidden = false;
    });
  }
  function initLessons() {
    $('retryLesson').hidden = true;
    return store.manifest().then(value => {
      manifest = value;
      $('lang').textContent = '';
      manifest.packs.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id; option.textContent = p.label;
        $('lang').appendChild(option);
      });
      $('lang').disabled = false;
      renderCatalog();
      return loadLesson();
    }).catch(() => {
      $('loadStatus').textContent = 'רְשִׁימַת הַשִּׁעוּרִים לֹא נִטְעֲנָה. נַסֵּה שׁוּב.';
      $('lesson').setAttribute('aria-busy', 'false');
      $('retryLesson').hidden = false;
    });
  }
  $('lang').onchange = loadLesson;
  $('retryLesson').onclick = () => manifest ? loadLesson() : initLessons();

  function renderCatalog() {
    if (!catalog) return;
    const counts = data.coverage(catalog);
    $('catalogStatus').lang = 'en'; $('catalogStatus').dir = 'ltr';
    $('catalogStatus').textContent = counts.language + ' languages · ' + counts.macrolanguage +
      ' macrolanguages · ' + counts.locale + ' regional locales · ' + counts.dialect +
      ' dialects · ' + counts.accent + ' accents' + (manifest ? ' · ' + manifest.packs.length + ' lesson packs' : '');
    const query = $('catalogSearch').value.trim().toLowerCase();
    const matches = catalog.entities.filter(e => [e.name, e.id, e.bcp47 || '', e.kind].join(' ').toLowerCase().includes(query));
    $('catalogMatches').textContent = 'Showing ' + Math.min(50, matches.length) + ' / ' + matches.length;
    $('catalogMatches').dir = 'ltr'; $('catalogMatches').lang = 'en';
    $('catalogResults').textContent = '';
    matches.slice(0, 50).forEach(e => {
      const li = document.createElement('li');
      const playable = manifest && manifest.packs.some(p => p.entityId === e.id);
      li.textContent = e.name + ' · ' + e.id + ' · ' + (e.bcp47 || 'No registered tag recorded') + ' · ' + e.kind +
        (manifest ? (playable ? ' · Lesson pack available. ' : ' · Catalog only. ') : ' · Lesson availability not loaded. ');
      li.lang = 'en'; li.dir = 'ltr';
      const source = catalog.sources.find(s => s.id === e.refs[0].sourceId);
      const a = document.createElement('a');
      a.href = source.url; a.textContent = 'Source'; a.title = source.title + ' — ' + e.refs[0].record;
      li.appendChild(a); $('catalogResults').appendChild(li);
    });
  }
  function suggestCatalogIds() {
    if (!catalog) return;
    const query = $('mapEntityId').value.trim().toLowerCase();
    $('catalogIds').textContent = '';
    catalog.entities.filter(e => (e.id + ' ' + e.name).toLowerCase().includes(query)).slice(0, 50).forEach(e => {
      const option = document.createElement('option');
      option.value = e.id; option.label = e.name;
      $('catalogIds').appendChild(option);
    });
  }
  $('mapEntityId').oninput = suggestCatalogIds;
  function loadCatalog() {
    $('retryCatalog').hidden = true;
    return store.catalog().then(value => {
      catalog = value;
      $('catalogSearch').disabled = false;
      suggestCatalogIds();
      renderCatalog();
    }).catch(() => {
      $('catalogStatus').textContent = 'טְעִינַת הַקָּטָלוֹג נִכְשְׁלָה. הַשִּׁעוּרִים וְהַמַּפָּה הָאִישִׁית נִפְרָדִים מִמֶּנּוּ.';
      $('retryCatalog').hidden = false;
    });
  }
  $('retryCatalog').onclick = loadCatalog;
  $('catalogSearch').oninput = renderCatalog;

  function readRows() {
    try {
      const rows = JSON.parse(localStorage.getItem(mapKey) || '[]');
      if (!Array.isArray(rows) || rows.some(r => !r || typeof r !== 'object' || Array.isArray(r))) throw new Error('Invalid archive');
      return rows;
    } catch (_) {
      $('mapStatus').textContent = 'לֹא נִתָּן לִקְרֹא אֶת הַמַּפָּה. הַנְּתוּנִים לֹא נִמְחֲקוּ וְלֹא יִדָּרְסוּ.';
      return null;
    }
  }
  function renderMap() {
    const rows = readRows();
    if (rows === null) return;
    $('soundMap').textContent = '';
    if (!rows.length) { $('soundMap').textContent = 'עֲדַיִן לֹא נוֹסְפוּ יְחִידוֹת אִישִׁיּוֹת.'; return; }
    const list = document.createElement('ol');
    rows.forEach(r => {
      const li = document.createElement('li');
      // Stored/free-text fields are text, never executable HTML.
      li.textContent = [r.g, r.seq, '/' + (r.ipa || '') + '/', r.word, r.lang, r.dialect,
        r.category || 'language', '#' + (r.count == null ? 1 : r.count), r.catalogId || ''].join(' · ');
      list.appendChild(li);
    });
    $('soundMap').appendChild(list);
  }
  $('addSound').onclick = () => {
    const rows = readRows();
    if (rows === null) return;
    const catalogId = $('mapEntityId').value.trim();
    if (catalogId && (!catalog || !catalog.entities.some(e => e.id === catalogId))) {
      $('mapStatus').textContent = 'הַמַּזְהֵה לֹא נִמְצָא בַּקָּטָלוֹג. בְּחַר מַזְהֵה קַיָּם אוֹ הַשְׁאֵר אֶת הַשָּׂדֶה רֵיק.'; return;
    }
    const count = Number($('catalogCount').value);
    if (!$('catalogCount').value.trim() || !Number.isSafeInteger(count) || count < 0) {
      $('mapStatus').textContent = 'הַזֵּן מִסְפָּר שָׁלֵם שֶׁאֵינוֹ שְׁלִילִי.'; return;
    }
    rows.push({lang: $('mapLanguage').value, dialect: $('mapDialect').value, g: $('grapheme').value,
      seq: $('sequence').value, ipa: $('ipa').value, word: $('exampleWord').value,
      category: $('catalogCategory').value, count: count, archive: true, model: 'TRa Languages',
      learning: 'recall', adaptation: 'extensible', catalogId: catalogId || null, provenance: 'user-supplied'});
    try {
      localStorage.setItem(mapKey, JSON.stringify(rows));
      $('mapStatus').textContent = 'נִשְׁמַר בַּמַּפָּה הָאִישִׁית בִּלְבַד.';
      renderMap();
    } catch (_) { $('mapStatus').textContent = 'הַשְּׁמִירָה נִכְשְׁלָה. הָרְשׁוּמָה הַחֲדָשָׁה לֹא נִשְׁמְרָה.'; }
  };
  // Personal notes remain usable even if the catalog or lesson service cannot load.
  renderMap(); hud(); loadCatalog(); initLessons();
}());
