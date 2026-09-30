"use strict";
// Hydrate chart candidates from an exported official Apple Music catalog response.
// Usage: node build-hitster-israeli-previews.js catalog.json [candidates.json] [output.json]
// No positional matching: every preview must match both the title and performer.
const fs=require("fs"),vm=require("vm"),assert=require("node:assert/strict");
const [catalogFile,cardsFile="hitster-israeli-annual.json",outputFile="hitster-israeli-preview-manifest.json"]=process.argv.slice(2);
if(!catalogFile)throw Error("Provide an official Apple Music catalog JSON export.");
const raw=JSON.parse(fs.readFileSync(catalogFile,"utf8"));
const songs=Array.isArray(raw)?raw:raw.body?.results || raw.data;
assert.ok(Array.isArray(songs));
const payload=JSON.parse(fs.readFileSync(cardsFile,"utf8")),cards=Array.isArray(payload)?payload:payload.cards;
const engine=fs.readFileSync("hitster-original.js","utf8"),context={language:"he"};vm.createContext(context);
for(const [start,end]of [["  function normalize(","  function createInitialState("],["  function overlapScore(","  function fetchWithTimeout("],["  function catalogTitle(","  async function lookupPreviewInCountry("]]){
 const a=engine.indexOf(start),b=engine.indexOf(end,a);assert.ok(a>=0&&b>a);vm.runInContext(engine.slice(a,b),context);
}
const previews={};
for(const card of cards){
 let best=null,score=0;
 for(const song of songs){
  const a=song.attributes;
  if(!a?.previews?.[0]?.url || !a.name || !a.artistName)continue;
  if(/karaoke|tribute|instrumental|remix|רמיקס|\blive\b|לייב|בהופעה|קריוקי/i.test(a.name+" "+a.albumName))continue;
  const title=context.previewTitleMatch(card,a.name),artist=context.previewArtistMatch(card,a.artistName),value=title*72+artist*28;
  if(title>=.8&&artist>=.5&&value>score){best=song;score=value;}
 }
 if(best){const a=best.attributes;previews[card.id]={url:a.previews[0].url,trackId:Number(best.id),title:a.name,artist:a.artistName,album:a.albumName,storefront:"IL",audioLocale:a.audioLocale||""};}
}
fs.writeFileSync(outputFile,JSON.stringify({schemaVersion:1,generatedAt:new Date().toISOString(),source:"Apple Music catalog, IL storefront, Hebrew locale; title and artist identity checked",cardsChecked:cards.length,previews},null,2)+"\n");
console.log(`Matched ${Object.keys(previews).length}/${cards.length} candidates to official previews.`);
