"use strict";
const fs=require("fs");
const registry=JSON.parse(fs.readFileSync("TRA_PRINCIPLES.json","utf8"));
const constitution=fs.readFileSync("TRA-ART-TRY.md","utf8");
const principle=(registry.principles||[]).find(item=>item.id==="color-palette-principle");
const failed=[];
const check=(name,ok)=>{console.log((ok?"PASS":"FAIL")+" - "+name);if(!ok)failed.push(name);};
const versionParts=String(registry.registry_version||"").split(".").map(Number);
const versionAtLeastPalette=versionParts.length===3&&versionParts.every(Number.isInteger)&&(versionParts[0]>1||(versionParts[0]===1&&versionParts[1]>=5));
check("registry version includes palette principle",versionAtLeastPalette&&Boolean(principle));
check("palette defines green yellow red semantics",Boolean(principle&&principle.he.includes("יָרוֹק")&&principle.he.includes("צָהֹב")&&principle.he.includes("אָדֹם")));
check("palette forbids cosmetic green",Boolean(principle&&principle.he.includes("קוֹסְמֶטִית")));
check("palette is not a judgment of people",Boolean(principle&&principle.he.includes("לְעוֹלָם לֹא אֶת עֶרְכּוֹ שֶׁל אָדָם")));
check("palette requires non-color accessibility signal",Boolean(principle&&principle.he.includes("לֹא מִסְתַּמְּכִים עַל צֶבַע בִּלְבַד")));
check("constitution documents palette principle",constitution.includes("## עֶקְרוֹן פָּלֶטַת הַצְּבָעִים")&&constitution.includes("**כְּלַל נְגִישׁוּת:**")&&constitution.includes("**כְּלַל אֱמֶת:**"));
if(failed.length){console.error("TRA color palette gate FAILED ("+failed.length+")\n- "+failed.join("\n- "));process.exit(1);}
console.log("TRA color palette gate PASSED.");
