"use strict";
// Deployment-time public catalog snapshot; never downloads or republishes audio.
const fs = require("node:fs");
const core = require("./hitster-personal-core.js");
const regions = "il eg tr gb us fr de es it ca au br mx ar cl co pe za ng gh ke tz ug in jp kr cn hk tw th vn id my ph sg nz sa ae bh qa om kw jo lb ma tn dz at be bg ch cy cz dk ee fi gr hr hu ie is lt lu lv mt nl no pl pt ro rs se si sk ua am az by kz uz al ba mk me md ge ru bb bm bs bz cr do ec gt hn jm ni pa py sv tt uy ve ag ai aw bo bw cv dm fj gd gy kn ky lc mg ml mo ms mu mz na ne pg sb sn sr sz tc zw vc vg".trim().split(/\s+/).filter(code => /^[a-z]{2}$/.test(code));
const seeds = [
  {title:"לו יהי",artist:""}, {title:"Take on Me",artist:"a-ha"},
  {title:"כוח הכבידה",artist:"שגיב ברייטנר"}, {title:"כולם גנבים",artist:"אושר כהן"},
  {title:"One Last Time",artist:"Ariana Grande"}
];
async function get(url) {
  const response = await fetch(url, {signal:AbortSignal.timeout(6500),headers:{"User-Agent":"TRA-HITSTER/1.0"}});
  if (!response.ok) throw new Error("HTTP "+response.status);
  return response.json();
}
async function build() {
  const output={retrievedAt:new Date().toISOString(),source:"Apple Music most-played country charts",countries:{},seeds:[],unavailable:[]};
  let cursor=0;
  await Promise.all(Array.from({length:8},async()=>{
    while(cursor<regions.length) {
      const country=regions[cursor++];
      try {
        const source="https://rss.marketingtools.apple.com/api/v2/"+country+"/music/most-played/10/songs.json";
        const json=await get(source), rows=json.feed?.results;
        if(!Array.isArray(rows)||rows.length!==10) throw new Error("No complete top ten");
        output.countries[country]={source,updated:json.feed.updated||output.retrievedAt,tracks:rows.map((r,i)=>({id:r.id,title:r.name,artist:r.artistName,rank:i+1,url:r.url,releaseDate:r.releaseDate||""}))};
      } catch(error) { output.unavailable.push(country); }
    }
  }));
  for(const song of seeds) {
    let matched=null;
    for(const country of ["il","us"]) {
      try {
        const data=await get("https://itunes.apple.com/search?media=music&entity=song&limit=25&country="+country+"&term="+encodeURIComponent(song.title+" "+song.artist));
        matched=core.matchSong(song,data.results||[]);
        if(matched) break;
      }catch(error){}
    }
    output.seeds.push({request:song,card:matched?core.catalogCard(matched):null});
  }
  fs.writeFileSync("hitster-world-data.json",JSON.stringify(output,null,2)+"\n");
  console.log("World charts: "+Object.keys(output.countries).length+" verified country top tens; "+output.seeds.filter(x=>x.card).length+"/5 seed recordings matched.");
}
if(require.main===module) build().catch(error=>{console.error(error);process.exitCode=1;});
