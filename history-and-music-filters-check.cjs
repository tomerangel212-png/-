const fs = require('node:fs'), assert = require('node:assert/strict');
const {JSDOM} = require(process.env.TRA_CHESS_TEST_PREFIX + '/node_modules/jsdom');
async function open(cards, query = '') {
  const dom = new JSDOM(fs.readFileSync('history-and-music-catalog.html', 'utf8'), {url:'https://example.test/history-and-music-catalog.html' + query, runScripts:'outside-only'});
  dom.window.fetch = async file => ({ok:true, json:async () => file === 'hitster-alltime-888.json' ? {cards} : {entries:[]}});
  dom.window.eval(fs.readFileSync('history-and-music.js','utf8'));
  await new Promise(resolve => setTimeout(resolve, 0));
  return dom;
}
(async () => {
 const cards = JSON.parse(fs.readFileSync('hitster-alltime-888.json','utf8')).cards;
 const dom = await open(cards), d = dom.window.document;
 const change = (id,value) => { d.getElementById(id).value=value; d.getElementById(id).dispatchEvent(new dom.window.Event('change')); };
 const counts = new Map(); cards.forEach(s=>counts.set(s.artist,(counts.get(s.artist)||0)+1));
 for (const [artist,count] of counts) {
   change('artist',artist);
   assert.equal(d.querySelectorAll('#music-results article').length,Math.min(count,24));
   for(const h of d.querySelectorAll('#music-results h3')) assert.equal(h.textContent,artist);
 }
 d.getElementById('reset-filters').click();
 assert.equal(d.getElementById('artist').value,'');
 change('language','__unclassified__');change('genre','__unclassified__');
 assert.match(d.getElementById('music-count').textContent,/^888 /);
 change('artist',cards[0].artist);change('decade','1950');
 const url=new URL(d.getElementById('catalog-view-link').href);
 assert.equal(url.searchParams.get('artist'),cards[0].artist);
 const restored=await open(cards,url.search);
 assert.equal(restored.window.document.getElementById('artist').value,cards[0].artist);
 assert.equal(restored.window.document.getElementById('decade').value,'1950');
 restored.window.close();dom.window.close();
 const fixture=[
   {title:'Song <one>',artist:'A & B',chartYear:2001,language:'Hebrew',genre:'Jazz'},
   {title:'Song two',artist:'A & B',chartYear:2002,language:'English',genre:'Rock'},
   {title:'Song three',artist:'C',chartYear:1998},
 ];
 const known=await open(fixture,'?artist=A%20%26%20B&decade=2000&language=Hebrew&genre=Jazz&q=one');
 assert.equal(known.window.document.querySelectorAll('#music-results article').length,1);
 assert.equal(known.window.document.querySelector('#music-results h3').textContent,'A & B');
 assert.equal(known.window.document.querySelector('#music-results article p:not(.badge)').textContent,'Song <one>');
 known.window.document.getElementById('reset-filters').click();
 assert.equal(known.window.document.querySelectorAll('#music-results article').length,3);
 known.window.close();
 const invalid=await open(fixture,'?genre=Invented');assert.equal(invalid.window.document.getElementById('genre').value,'');invalid.window.close();
 console.log('PASS all '+counts.size+' artist filters, missing metadata, combined filters, artist-first display, URL round-trip, reset and invalid URL values');
})().catch(error=>{console.error(error);process.exitCode=1});
