// TRA Chess runtime upgrade: Ant / Anti — Chess Queen 100/100
// Loads the canonical games.js and applies the 100/100 counter-attack profile before execution.

const response = await fetch("./games.js", { cache: "no-store" });
if (!response.ok) throw new Error(`Failed to load games.js: ${response.status}`);
let source = await response.text();

const patches = [
  {
    from: `    style:"balanced-tactical"\n  }\n};`,
    to: `    style:"balanced-tactical"\n  },\n  anti: {\n    name:"אנט / אנטי ♛", strength:100, delay:650, depth:3, noise:0, blunderRate:0,\n    description:"מלכת השחמט — מלכת תגובת הנגד המושלמת. מזהה איום, סופגת לחץ כשצריך והופכת את מהלך היריב להזדמנות נגדית מדויקת.",\n    style:"perfect-counter"\n  }\n};`
  },
  {
    from: `  return s;\n}\n\nfunction orderedMoves`,
    to: `  if(profile.style==="perfect-counter"){\n    const history=game.history({verbose:true});\n    const last=history[history.length-1];\n    if(move.captured)s+=pieceValue[move.captured]*0.18+55;\n    if(san.includes("+"))s+=80;\n    if(san.includes("#"))s+=100000;\n    if(last&&move.to===last.to)s+=45;\n    if(last?.captured&&move.captured)s+=35;\n    if(san.includes("O-O"))s+=25;\n  }\n  return s;\n}\n\nfunction orderedMoves`
  },
  {
    from: `const budget={nodes:0,max:profile.strength>=80?9000:profile.strength>=60?3500:1200};`,
    to: `const budget={nodes:0,max:profile.strength>=100?32000:profile.strength>=80?9000:profile.strength>=60?3500:1200};`
  }
];

for (const patch of patches) {
  if (!source.includes(patch.from)) {
    throw new Error("TRA Chess upgrade patch target not found");
  }
  source = source.replace(patch.from, patch.to);
}

const blobUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
try {
  await import(blobUrl);
} finally {
  URL.revokeObjectURL(blobUrl);
}
