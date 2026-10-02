"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync(__dirname + "/hitster-original.js", "utf8");
function part(a,b) { const start=source.indexOf(a); assert.ok(start>=0); const end=source.indexOf(b,start); assert.ok(end>start); return source.slice(start,end); }
const cards=Array.from({length:40},(_,i)=>({id:"card-"+i,artist:i%2?"עומר אדם":"יעל נעים",title:"song "+i,chartYear:1980+i}));
const context={deck:cards,deckById:Object.fromEntries(cards.map(c=>[c.id,c])),TEAM_DEFS:[{id:"one",he:"One"},{id:"two",he:"Two"}],WIN_CARDS:10,START_STARS:5,MAX_STARS:10,language:"he",shuffle:a=>a.slice().reverse(),state:null};
vm.createContext(context);
vm.runInContext(part("  function normalize(", "  function track(")+part("  function createInitialState(", "  function teamName(")+part("  function sanitizeState(", "  function restore(")+part("  function canChooseStartingTeam(", "  function nextTeamId("),context);
for(const count of [2,5,10]){
 const teams=Array.from({length:count},(_,i)=>({id:"team-"+i,name:"Group "+i}));
 const game=context.createInitialState(teams); context.seedOpeningCards(game); context.state=game;
 assert.equal(game.teams.length,count);
 assert.ok(game.teams.every(t=>t.timeline.length===1&&t.stars===5));
 assert.equal(new Set(game.teams.flatMap(t=>t.timeline)).size,count,"opening cards are unique across teams");
 assert.equal(game.used.length,count,"opening cards cannot be drawn again");
 assert.equal(context.canChooseStartingTeam(),true,"starting-team selection remains available");
 const saved=JSON.stringify(game);
 context.seedOpeningCards(game); assert.equal(JSON.stringify(game),saved,"seeding is idempotent");
 assert.equal(JSON.stringify(context.sanitizeState(JSON.parse(saved))),saved,"resume preserves exact opening cards");
 game.used.push("card-0"); assert.equal(context.canChooseStartingTeam(),false,"first played round locks initial team selection");
}
const names=context.artistSuggestions(cards.concat([{artist:"עומר אדם"},{artist:"<script>artist</script>"}]));
assert.equal(names.filter(x=>x==="עומר אדם").length,1);
assert.equal(names.filter(x=>x==="יעל נעים").length,1);
assert.equal(names.length,3,"suggestions depend on the whole deck, not the current card");
for(const name of ["hitster-888.html","hitster-888-en.html"]){
 const html=fs.readFileSync(__dirname+"/"+name,"utf8");
 assert.match(html, /list="artist-suggestions"/);
 assert.match(html, /<datalist id="artist-suggestions">/);
}
console.log("Opening card and artist suggestions OK: 2/5/10 teams, uniqueness, resume, no repeated opening cards, starting team selection and deduplicated names.");

