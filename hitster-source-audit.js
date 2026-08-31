"use strict";
const fs=require('fs');
const deck=JSON.parse(fs.readFileSync('hitster-alltime-888.json','utf8'));
const normalize=v=>String(v||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim();
const words=v=>normalize(v).split(' ').filter(x=>x.length>1);
const coverage=(needle,hay)=>{const w=words(needle);if(!w.length)return 1;const h=new Set(words(hay));return w.filter(x=>h.has(x)).length/w.length};
const decode=s=>s.replace(/&amp;/g,'&').replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/&nbsp;/g,' ').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)));
const strip=html=>decode(html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' '));
async function get(url,attempt=1){const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),15000);try{const r=await fetch(url,{headers:{'user-agent':'TRA-Catalog-Audit/1.0'},signal:ctl.signal});if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.text()}catch(e){if(attempt<3){await new Promise(r=>setTimeout(r,800*attempt));return get(url,attempt+1)}throw e}finally{clearTimeout(timer)}}
(async()=>{
 if(deck.total!==888||deck.cards.length!==888)throw new Error('Deck is not exactly 888 cards.');
 const groups=new Map();for(const c of deck.cards){if(!groups.has(c.sourceUrl))groups.set(c.sourceUrl,[]);groups.get(c.sourceUrl).push(c)}
 const entries=[...groups.entries()];let cursor=0,verified=0;const failures=[];
 async function worker(){while(cursor<entries.length){const idx=cursor++;const [url,cards]=entries[idx];try{const year=cards[0].chartYear;if(!url.includes(String(year)))failures.push(`${year}: source URL does not contain chart year`);const text=normalize(strip(await get(url)));for(const c of cards){const titleOk=text.includes(normalize(c.title))||coverage(c.title,text)>=0.8;const artistOk=text.includes(normalize(c.artist))||coverage(c.artist,text)>=0.5;if(!titleOk||!artistOk)failures.push(`${c.id}: ${c.title} — ${c.artist} missing from ${url}`);else verified++}console.log(`SOURCE ${year}: ${cards.length} cards checked`)}catch(e){failures.push(`${url}: ${e.message}`)}}}
 await Promise.all(Array.from({length:5},worker));
 if(failures.length){console.error(`HITSTER source audit FAILED (${verified}/888 verified)\n`+failures.map(x=>'- '+x).join('\n'));process.exit(1)}
 console.log(`HITSTER source audit PASSED: ${verified}/888 cards found on their declared chart-year source pages across ${entries.length} sources.`)
})().catch(e=>{console.error(e);process.exit(1)});