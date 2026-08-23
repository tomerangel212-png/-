"use strict";
const fs=require("fs");
const data=JSON.parse(fs.readFileSync("tra-music-station.json","utf8"));
const required=["ישראלי","פופ","רוק","אמריקאי","בריטי"];
if(!data||!Array.isArray(data.tracks))throw new Error("station tracks missing");
if(data.tracks.length<25)throw new Error(`expected >=25 tracks, got ${data.tracks.length}`);
const seen=new Set();
for(const t of data.tracks){
  if(!t.title||!t.artist||!Number.isInteger(t.year)||!t.appleMusicId)throw new Error(`invalid track ${JSON.stringify(t)}`);
  const k=`${t.title.toLowerCase()}|${t.artist.toLowerCase()}|${t.year}`;
  if(seen.has(k))throw new Error(`duplicate ${k}`);seen.add(k);
  if(!Array.isArray(t.genres)||!t.genres.length)throw new Error(`missing genres: ${t.title}`);
}
for(const tag of required){if(!data.tracks.some(t=>t.genres.includes(tag)))throw new Error(`missing station category: ${tag}`);}
console.log(`TRA Station OK: ${data.tracks.length} verified seeds · ${required.join(" / ")}`);