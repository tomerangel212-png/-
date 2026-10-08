"use strict";

// Only explicitly reviewed public paths may enter the Pages artifact.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const ROOT = path.resolve(__dirname, "..");
const PRIVATE_NAMES = new Set(["TRA_PRINCIPLES.json", "TRA-ART-TRY.md", "tra-art-try.html"]);

function publicFiles(root) {
  const files = fs.readFileSync(path.join(root, ".github/pages-public-files.txt"), "utf8")
    .split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith("#"));
  assert(files.length && new Set(files).size === files.length, "Public manifest is empty or has duplicates");
  for (const file of files) {
    const parts = file.split("/");
    assert(!file.includes("\\") && parts.every(part => part && !part.startsWith(".")), `Unsafe public path: ${file}`);
    assert(!parts.some(part => PRIVATE_NAMES.has(part)), `Private file in public manifest: ${file}`);
  }
  return files;
}

function regularFile(root, file) {
  let current = root;
  for (const part of file.split("/")) {
    current = path.join(current, part);
    assert(!fs.lstatSync(current).isSymbolicLink(), `Symlink is not a public file: ${file}`);
  }
  assert(fs.statSync(current).isFile(), `Not a regular public file: ${file}`);
  return current;
}

function verify(output, root = ROOT) {
  const expected = new Set(publicFiles(root));
  const found = new Set();
  function walk(directory, prefix = "") {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
      const relative = prefix + entry.name;
      assert(!PRIVATE_NAMES.has(entry.name), `Private file in Pages staging: ${relative}`);
      assert(!entry.name.startsWith(".") && !entry.isSymbolicLink(), `Hidden file or symlink in Pages staging: ${relative}`);
      if (entry.isDirectory()) walk(path.join(directory, entry.name), relative + "/");
      else {
        assert(entry.isFile() && expected.has(relative), `Unapproved Pages file: ${relative}`);
        assert(fs.readFileSync(path.join(output, relative)).equals(fs.readFileSync(regularFile(root, relative))), `Staged file differs from source: ${relative}`);
        found.add(relative);
      }
    }
  }
  assert(fs.lstatSync(output).isDirectory() && !fs.lstatSync(output).isSymbolicLink(), "Staging must be a real directory");
  walk(output);
  assert.deepEqual([...found].sort(), [...expected].sort(), "Public files missing from Pages staging");
  return found.size;
}

function stage(output, root = ROOT) {
  root = fs.realpathSync(root);
  output = path.resolve(output);
  // Require a fresh directory: never merge with stale output or erase source files.
  assert(!fs.existsSync(output), "Staging directory must not already exist");
  fs.mkdirSync(output, {recursive: true});
  for (const file of publicFiles(root)) {
    const source = regularFile(root, file);
    const destination = path.join(output, file);
    fs.mkdirSync(path.dirname(destination), {recursive: true});
    fs.copyFileSync(source, destination);
  }
  return verify(output, root);
}

module.exports = {stage, verify, publicFiles};
if (require.main === module) {
  const args = process.argv.slice(2);
  const checking = args[0] === "--verify";
  assert(args.length === (checking ? 2 : 1), "Usage: node scripts/stage-pages.cjs [--verify] OUTPUT");
  const output = path.resolve(args[checking ? 1 : 0]);
  const count = checking ? verify(output) : stage(output);
  console.log(`Pages staging ${checking ? "verified" : "created"}: ${count} public files; all three private paths excluded.`);
}
