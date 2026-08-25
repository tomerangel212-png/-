#!/usr/bin/env node
"use strict";

// Verifies every checked-in HTML document, including preserved historical pages.
// This is deliberately static: application-specific behavior remains covered by
// the focused TRA/HITSTER/Station quality gates.
const fs = require("fs");
const path = require("path");

const root = path.resolve(process.argv[2] || ".");
const ignoredDirectories = new Set([".git", ".github", "node_modules"]);
const failures = [];
const files = new Set();

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (entry.isFile()) files.add(toPosix(path.relative(root, absolute)));
  }
}

function stripQueryAndHash(value) {
  return String(value).split(/[?#]/, 1)[0];
}

function isExternal(value) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value);
}

function normalizeSitePath(value) {
  const normalized = path.posix.normalize(value).replace(/^\.\//, "").replace(/\/+$/, "");
  return normalized === "." ? "" : normalized;
}

function candidatesFor(reference, baseDirectory) {
  const clean = stripQueryAndHash(reference).trim();
  if (!clean || isExternal(clean) || clean.includes("{{")) return [];
  const joined = clean.startsWith("/")
    ? clean.replace(/^\/+/, "")
    : path.posix.join(baseDirectory, clean);
  const resolved = normalizeSitePath(joined);
  if (resolved === ".." || resolved.startsWith("../")) return ["__ESCAPES_SITE_ROOT__"];
  const candidates = [resolved];
  if (!path.posix.extname(resolved) || clean.endsWith("/")) {
    candidates.push(resolved ? `${resolved}/index.html` : "index.html");
  }
  return [...new Set(candidates)];
}

function localBaseDirectory(documentPath, source) {
  const normalBase = path.posix.dirname(documentPath) === "." ? "" : path.posix.dirname(documentPath);
  const baseMatch = source.match(/<base\b[^>]*\bhref=["']([^"']+)["'][^>]*>/i);
  if (!baseMatch) return normalBase;
  const candidates = candidatesFor(baseMatch[1], normalBase);
  if (!candidates.length || candidates[0] === "__ESCAPES_SITE_ROOT__") {
    failures.push(`${documentPath}: invalid local <base href>`);
    return normalBase;
  }
  const base = candidates[0];
  return path.posix.extname(base) ? path.posix.dirname(base) : base;
}

function validateDocument(documentPath) {
  const source = fs.readFileSync(path.join(root, documentPath), "utf8");
  const htmlTag = source.match(/<html\b[^>]*>/i)?.[0] || "";
  if (!/<!doctype html>/i.test(source)) failures.push(`${documentPath}: missing <!doctype html>`);
  if (!/\blang=["'][^"']+["']/i.test(htmlTag)) failures.push(`${documentPath}: missing document language`);
  if (!/\bdir=["'][^"']+["']/i.test(htmlTag)) failures.push(`${documentPath}: missing text direction`);
  if (!/<title>\s*\S[\s\S]*?<\/title>/i.test(source)) failures.push(`${documentPath}: missing non-empty <title>`);
  if (!/<meta\b[^>]*\bname=["']viewport["']/i.test(source)) failures.push(`${documentPath}: missing viewport meta`);

  const baseDirectory = localBaseDirectory(documentPath, source);
  const sourceWithoutBase = source.replace(/<base\b[^>]*>/gi, "");
  for (const match of sourceWithoutBase.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    const reference = match[1];
    const candidates = candidatesFor(reference, baseDirectory);
    if (!candidates.length) continue;
    if (candidates[0] === "__ESCAPES_SITE_ROOT__" || !candidates.some(candidate => files.has(candidate))) {
      failures.push(`${documentPath}: unresolved local reference ${reference}`);
    }
  }
}

walk(root);
const htmlFiles = [...files].filter(file => file.endsWith(".html")).sort();
if (!htmlFiles.length) failures.push("No HTML documents found to audit");
for (const documentPath of htmlFiles) validateDocument(documentPath);

if (failures.length) {
  console.error("SITE ROUTE INTEGRITY CHECK FAILED:\n");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`SITE ROUTE INTEGRITY CHECK PASSED: ${htmlFiles.length} HTML documents and local references are valid.`);
