"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {execFileSync} = require("node:child_process");
const {stage, verify, publicFiles} = require("./stage-pages.cjs");
const ROOT = path.resolve(__dirname, "..");
const PRIVATE = ["TRA_PRINCIPLES.json", "TRA-ART-TRY.md", "tra-art-try.html"];

function fixture(t) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "tra-pages-test-"));
  t.after(() => fs.rmSync(temp, {recursive: true, force: true}));
  const source = path.join(temp, "source");
  const output = path.join(temp, "public");
  fs.mkdirSync(path.join(source, ".github"), {recursive: true});
  fs.writeFileSync(path.join(source, ".github/pages-public-files.txt"), "index.html\nassets/data.json\n");
  fs.mkdirSync(path.join(source, "assets"));
  fs.writeFileSync(path.join(source, "index.html"), "public page");
  fs.writeFileSync(path.join(source, "assets/data.json"), '{"generated":true}');
  return {temp, source, output};
}

test("only approved files are staged, even when private files and build debris exist", t => {
  const {temp, source, output} = fixture(t);
  for (const name of [...PRIVATE, "private-notes.json", ".env", "hitster-personal-mobile.png"]) {
    fs.writeFileSync(path.join(source, name), "must never publish");
  }
  stage(output, source);
  assert.equal(verify(output, source), 2);
  for (const name of PRIVATE) assert(!fs.existsSync(path.join(output, name)));
  assert.throws(() => stage(output, source), /must not already exist/);
  // Reproduce upload-pages-artifact@v4's Linux archive, including dereferencing.
  const archive = path.join(temp, "artifact.tar");
  execFileSync("tar", ["--dereference", "--hard-dereference", "--directory", output, "-cf", archive,
    "--exclude=.git", "--exclude=.github", "--exclude=.[^/]*", "."]);
  const entries = execFileSync("tar", ["-tf", archive], {encoding: "utf8"}).trim().split("\n").sort();
  assert.deepEqual(entries, ["./", "./assets/", "./assets/data.json", "./index.html"]);
});

test("pre-upload verification rejects each private path and unexpected files", t => {
  const {source, output} = fixture(t);
  stage(output, source);
  for (const name of [...PRIVATE, "unreviewed.json", ".hidden"]) {
    const file = path.join(output, name);
    fs.writeFileSync(file, "not public");
    assert.throws(() => verify(output, source), /Private file|Unapproved|Hidden/);
    fs.unlinkSync(file);
  }
  fs.writeFileSync(path.join(output, "assets", PRIVATE[0]), "nested private file");
  assert.throws(() => verify(output, source), /Private file/);
});

test("manifest cannot approve private names, traversal or hidden files", t => {
  const {source} = fixture(t);
  for (const name of [...PRIVATE, "assets/" + PRIVATE[0], "../outside", "/absolute", "a/../b", ".env"]) {
    fs.writeFileSync(path.join(source, ".github/pages-public-files.txt"), name + "\n");
    assert.throws(() => publicFiles(source), /Private file|Unsafe public path/);
  }
});

test("missing files, changed bytes and symlinks fail closed", t => {
  const {source, output} = fixture(t);
  stage(output, source);
  const staged = path.join(output, "index.html");
  fs.writeFileSync(staged, "different content");
  assert.throws(() => verify(output, source), /differs from source/);
  fs.unlinkSync(staged);
  assert.throws(() => verify(output, source), /missing/);
  fs.symlinkSync(path.join(source, "index.html"), staged);
  assert.throws(() => verify(output, source), /symlink/);
  fs.unlinkSync(path.join(source, "index.html"));
  fs.symlinkSync(path.join(source, "assets/data.json"), path.join(source, "index.html"));
  assert.throws(() => stage(path.join(path.dirname(output), "second"), source), /Symlink/);
});

test("real site preserves every HTML route, linked assets and service-worker cache", t => {
  const {temp} = fixture(t);
  const output = path.join(temp, "site");
  stage(output);
  const manifest = new Set(publicFiles(ROOT));
  const tracked = execFileSync("git", ["ls-files"], {cwd: ROOT, encoding: "utf8"}).trim().split("\n");
  for (const file of tracked.filter(file => file.endsWith(".html"))) {
    if (!PRIVATE.includes(path.basename(file))) assert(manifest.has(file), `HTML route omitted: ${file}`);
  }
  const sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
  const cacheBlock = sw.match(/const STATIC_ASSETS\s*=\s*\[([\s\S]*?)\]/);
  assert(cacheBlock, "Service-worker asset list must be checked");
  for (const [, file] of cacheBlock[1].matchAll(/["']\.\/([^"']*)["']/g)) {
    assert(manifest.has(file || "index.html"), `Offline asset omitted: ${file}`);
  }
  assert(manifest.has("TRA_VERSION_HISTORY.md"), "Runtime history badge target");
  assert(manifest.has("hitster-world-data.json"), "Deployment-generated chart snapshot");
  execFileSync(process.execPath, [path.join(ROOT, "site-route-integrity-check.js"), output]);
});
