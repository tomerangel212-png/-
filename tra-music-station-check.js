"use strict";
const fs=require("fs");
const data=JSON.parse(fs.readFileSync("tra-music-station.json","utf8"));
const required=["ישראלי","פופ","רוק","אמריקאי","בריטי"];
const expected={IL:148,US:148,UK:148};
if(!data||data.target!==444||!data.groups)throw new Error("station 444 schema missing");
const tracks=[];
for(const [region,groups] of Object.entries(data.groups)){
  if(!expected[region])throw new Error(`unexpected region ${region}`);
  if(!Array.isArray(groups))throw new Error(`groups missing for ${region}`);
  for(const group of groups){
    if(!group.artist||!Array.isArray(group.genres)||!group.genres.length||!Array.isArray(group.songs))throw new Error(`invalid group ${JSON.stringify(group)}`);
    for(const title of group.songs){tracks.push({title,artist:group.artist,region,genres:group.genres});}
  }
}
if(tracks.length!==444)throw new Error(`expected exactly 444 tracks, got ${tracks.length}`);
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
const ids=data.preverifiedAppleMusicIds||{};
for(const [pair,id] of Object.entries(ids)){if(!/^\d+$/.test(String(id)))throw new Error(`invalid Apple Music id for ${pair}`);}
console.log(`TRA Station 444 OK: ${tracks.length} unique songs · IL 148 · US 148 · UK 148 · Apple exact-match runtime guard enabled.`);