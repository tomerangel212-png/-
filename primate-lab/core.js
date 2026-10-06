/* Original TRA mechanics. Pure functions used by the app and by tests. */
(function (root, factory) {
  const api = factory(); if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TRACore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const ORIGINAL = 'ב נ נננ. נננננ נננ הההההה';
  const ALPHABET = 'אבגדהוזחטיךכלםמןנסעףפץצקרשת';
  const pentatonic = [0, 2, 4, 7, 9];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function hash(text) { let n = 2166136261; for (const ch of Array.from(text)) { n ^= ch.codePointAt(0); n = Math.imul(n, 16777619); } return n >>> 0; }
  function tokens(raw) {
    if (typeof raw !== 'string') throw Error('Text must be a string');
    return Array.from(raw).map((ch, index) => {
      const cp = ch.codePointAt(0);
      let kind = 'tone';
      if (/\s/.test(ch)) kind = 'space';
      else if ((cp >= 0x591 && cp <= 0x5bd) || cp === 0x5bf || (cp >= 0x5c1 && cp <= 0x5c7) || (cp >= 0x300 && cp <= 0x36f)) kind = 'mark';
      else if (/[.,!?;:…־—–\-"'״׳()\[\]{}]/.test(ch)) kind = 'punctuation';
      let midi = 60; let wave = 'sine';
      if (ch === 'ב') { midi = 48; wave = 'triangle'; }
      else if (ch === 'נ' || ch === 'ן') { midi = 62; wave = 'sine'; }
      else if (ch === 'ה') { midi = 69; wave = 'sine'; }
      else { const a = ALPHABET.indexOf(ch); const idx = a >= 0 ? a : cp % 25; midi = 48 + pentatonic[idx % 5] + 12 * Math.floor(idx / 5); }
      const label = ch === ' ' ? 'רֶוַח' : ch === '\n' ? 'שׁוּרָה' : ch === '\t' ? 'טַאב' : kind === 'mark' ? 'סִימָן' : ch;
      return {ch, index, cp, code:'U+' + cp.toString(16).toUpperCase().padStart(4,'0'), kind, midi, wave, frequency:440 * Math.pow(2,(midi-69)/12), label};
    });
  }
  function timeline(raw, bpm) {
    const beat = 60 / clamp(Number(bpm) || 90, 45, 180); let time = 0;
    return tokens(raw).map(t => { const duration = beat * (t.kind === 'punctuation' ? 1 : t.kind === 'mark' ? .125 : .5); const e = Object.assign({},t,{time,duration}); time += duration; return e; });
  }
  function nodes(seed) {
    const xs = [300,435,240,390,175,335,440,260,160,320,445,270,330];
    const jitter = (hash(String(seed)) % 25) - 12;
    return xs.map((x,i) => ({x:clamp(x + (i ? jitter : 0),90,510),y:545-i*170,index:i}));
  }
  function aim(from, target, gravity=850) { const t = .78; return {vx:(target.x-from.x)/t,vy:(target.y-from.y)/t-gravity*t/2}; }
  function segmentDistance(ax,ay,bx,by,x,y) { const dx=bx-ax,dy=by-ay; const t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1); return Math.hypot(x-(ax+t*dx),y-(ay+t*dy)); }
  function newState() { return {schema:1,species:'chimp',bpm:90,volume:.22,draft:ORIGINAL,revisions:[],notes:[],learned:[],runs:{},rawInputs:[{raw:'אני עזור מעבדה',role:'source'},{raw:'עוזר',role:'correction'},{raw:'כל',role:'source'},{raw:'אות חשובה',role:'source'}]}; }
  function validateState(s) {
    if (!s || s.schema !== 1 || !['chimp','baboon','gorilla'].includes(s.species) || typeof s.draft !== 'string' || s.draft.length>8000 || !Array.isArray(s.revisions) || !Array.isArray(s.notes) || !Array.isArray(s.learned) || !s.runs || typeof s.runs!=='object' || Array.isArray(s.runs)) throw Error('Invalid backup');
    const out = newState(); out.species=s.species; out.draft=s.draft; out.bpm=clamp(Number(s.bpm)||90,45,180);out.volume=clamp(Number(s.volume)||0,.0,.5);
    if(s.revisions.length>5000||s.notes.length>5000||s.learned.length>100) throw Error('Backup too large');
    function record(r, note) { if (!r||typeof r.id!=='string'||!r.id.length||r.id.length>160||typeof r.raw!=='string'||r.raw.length>8000||typeof r.at!=='string'||!Number.isFinite(Date.parse(r.at))) throw Error('Invalid record'); const v={id:r.id,raw:r.raw,at:r.at};if(note){if(typeof r.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!['chimp','baboon','gorilla'].includes(r.species))throw Error('Invalid note');v.date=r.date;v.species=r.species;}return v; }
    out.revisions=s.revisions.map(r=>record(r,false));out.notes=s.notes.map(r=>record(r,true));
    out.learned=s.learned.filter(x=>typeof x==='string'&&/^(chimp|gorilla|baboon)-[0-2]$/.test(x));
    for(const k of ['chimp','gorilla','baboon']) { const r=s.runs[k];if(r){if(typeof r.seed!=='string'||r.seed.length>40)throw Error('Invalid run');out.runs[k]={seed:r.seed,peg:clamp(Math.floor(Number(r.peg)||0),0,12),shots:clamp(Math.floor(Number(r.shots)||0),0,100000),misses:clamp(Math.floor(Number(r.misses)||0),0,100000),complete:r.complete===true};} }
    return out;
  }
  function merge(a,b) { const out=validateState(a),incoming=validateState(b);function add(existing,extra){const ids=new Set(existing.map(r=>r.id));for(const r of extra){const same=existing.find(x=>x.id===r.id);if(same&&JSON.stringify(same)===JSON.stringify(r))continue;const q=Object.assign({},r);if(ids.has(q.id))q.id=q.id+'-import-'+hash(JSON.stringify(r));if(!ids.has(q.id)){existing.push(q);ids.add(q.id);}}return existing;}
    out.revisions=add(out.revisions,incoming.revisions);out.notes=add(out.notes,incoming.notes);out.learned=Array.from(new Set(out.learned.concat(incoming.learned)));if(incoming.draft!==out.draft&&!out.revisions.some(r=>r.raw===incoming.draft))out.revisions.push({id:'import-draft-'+hash(incoming.draft)+'-'+Date.now(),at:new Date().toISOString(),raw:incoming.draft});return out;
  }
  return {ORIGINAL,tokens,timeline,nodes,aim,segmentDistance,clamp,hash,newState,validateState,merge};
});
