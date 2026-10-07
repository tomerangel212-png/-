'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const privatePaths = ['TRA-ART-TRY.md', 'TRA_PRINCIPLES.json', 'tra-art-try.html'];
for (const path of privatePaths) assert(!fs.existsSync(path), `${path} must stay outside public source and output`);
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    if (['.git','node_modules'].includes(entry.name)) continue;
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(path);
    else if (path.endsWith('.html')) {
      const html = fs.readFileSync(path, 'utf8');
      assert(!/href=["'][^"']*(?:tra-art-try\.html|TRA_PRINCIPLES\.json|TRA-ART-TRY\.md)/i.test(html), `Private document link in ${path}`);
    }
  }
}
walk('.');
const catalog = JSON.parse(fs.readFileSync('tra212/catalog.json','utf8'));
assert(!catalog.records.some(r => r.section === 'constitution'));
const supplement = JSON.parse(fs.readFileSync('tra212/additions-2026-10-06.json','utf8'));
assert(!supplement.records.some(r => /knowledge-preservation|budget-50-20-030/.test(r.id)));
assert(!fs.readFileSync('docs/ai/tasks/ORIENTATION-KNOWLEDGE.md','utf8').includes('## Knowledge preservation'));
console.log('PASS: private documents absent; public navigation and catalog exclude constitution.');
