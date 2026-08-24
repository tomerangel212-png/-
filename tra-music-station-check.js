"use strict";
const fs=require("fs");
const base=JSON.parse(fs.readFileSync("tra-music-station.json","utf8"));
const extra=JSON.parse(fs.readFileSync("tra-music-station-extra-555.json","utf8"));
const required=["ישראלי","פופ","רוק","אמריקאי","בריטי"];
const expected={IL:333,US:333,UK:333};
if(!base||base.target!==444||!base.groups)throw new Error("station base 444 schema missing");
if(!extra||extra.target!==555||!extra.groups)throw new Error("station extra 555 schema missing");
const tracks=[];
for(const data of [base,extra]){
  for(const [region,groups] of Object.entries(data.groups)){
    if(!expected[region])throw new Error(`unexpected region ${region}`);
    if(!Array.isArray(groups))throw new Error(`groups missing for ${region}`);
    for(const group of groups){
      if(!group.artist||!Array.isArray(group.genres)||!group.genres.length||!Array.isArray(group.songs))throw new Error(`invalid group ${JSON.stringify(group)}`);
      for(const title of group.songs){tracks.push({title,artist:group.artist,region,genres:group.genres});}
    }
  }
}
if(tracks.length!==999)throw new Error(`expected exactly 999 tracks, got ${tracks.length}`);
const seen=new Set();
for(const t of tracks){
  if(!t.title||!t.artist)throw new Error(`invalid track ${JSON.stringify(t)}`);
  const k=`${t.artist.normalize("NFKC").toLowerCase()}|${t.title.normalize("NFKC").toLowerCase()}`;
  if(seen.has(k))throw new Error(`duplicate ${k}`);seen.add(k);
  if(!t.genres.includes("פופ")&&!t.genres.includes("רוק"))throw new Error(`track must be pop or rock: ${t.artist} — ${t.title}`);
}
for(const [region,count] of Object.entries(expected)){
  const actual=tracks.filter(t=>t.region===region).length;
  if(actual!==count)throw new Error(`${region}: expected ${count}, got ${actual}`);
}
for(const tag of required){if(!tracks.some(t=>t.genres.includes(tag)))throw new Error(`missing station category: ${tag}`);}
for(const data of [base,extra]){
  const ids=data.preverifiedAppleMusicIds||{};
  for(const [pair,id] of Object.entries(ids)){if(!/^\d+$/.test(String(id)))throw new Error(`invalid Apple Music id for ${pair}`);}
}
if(!fs.existsSync("tra-music-station.html"))throw new Error("station HTML missing");
const html=fs.readFileSync("tra-music-station.html","utf8");
for(const needle of ["999 שירים","333","tra-music-station-extra-555.json","resolveApple","scoreCandidate","itunes.apple.com/search","itunes.apple.com/lookup","selectPlayable","stationRunning","advanceAfterPlayback","30000","previewUrl","בלי להציג מועמדים שנפסלו"]){if(!html.includes(needle))throw new Error(`station HTML missing ${needle}`);}
if(html.includes("return draw("))throw new Error("station must not recursively flash rejected candidates");
if(!html.includes('addEventListener("ended"'))throw new Error("station must advance when preview ends");
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
if(!scripts.length)throw new Error("station inline runtime missing");
for(const script of scripts)new Function(script);
const games=fs.readFileSync("games.html","utf8");
if(!games.includes("TRA Station · 999")||!games.includes('href="tra-music-station.html"'))throw new Error("TRA Games does not advertise Station 999");
const sw=fs.readFileSync("sw.js","utf8");
if(!sw.includes("tra-music-station.html")||!sw.includes("tra-music-station.json")||!sw.includes("tra-music-station-extra-555.json")||!sw.includes("station-999"))throw new Error("PWA cache not refreshed for Station 999");
console.log(`TRA Station 999 OK: ${tracks.length} unique songs · IL 333 · US 333 · UK 333 · 30s sequential preview flow enabled.`);
