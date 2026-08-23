#!/usr/bin/env python3
"""Build and verify the deterministic offline catalog for every TRA web page.

The browser consumes ``offline-catalog.js`` through the service worker.  The
same inventory is written as JSON for dashboards and as a small tab-separated
file for the independent C++ verifier.  No network call is made here: streaming
links are reported as online-only dependencies instead of being copied.
"""

from __future__ import annotations

import argparse
import hashlib
import html as html_lib
import json
import re
import sys
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Iterable
from urllib.parse import unquote, urlsplit


SCHEMA_VERSION = 1
GENERATED = {
    PurePosixPath("offline-manifest.json"),
    PurePosixPath("offline-catalog.js"),
    PurePosixPath("offline-manifest.tsv"),
}
EXCLUDED_PARTS = {".git", ".github", "tools", "node_modules"}
PUBLIC_SUFFIXES = {
    ".css", ".gif", ".htm", ".html", ".ico", ".jpeg", ".jpg", ".js",
    ".json", ".m4a", ".md", ".mp3", ".mp4", ".ogg", ".otf", ".png",
    ".svg", ".txt", ".ttf", ".wav", ".webm", ".webmanifest", ".webp",
    ".woff", ".woff2",
}
SKIP_PUBLIC_NAMES = {"site-smoke-check.js"}
URL_RE = re.compile(r"https?://[^\s\"'<>`)]+", re.IGNORECASE)
HTML_REF_RE = re.compile(r"\b(?:href|src)\s*=\s*(?:\"([^\"]*)\"|'([^']*)')", re.IGNORECASE)
CSS_REF_RE = re.compile(r"url\(\s*(?:\"([^\"]*)\"|'([^']*)'|([^\s)]+))\s*\)", re.IGNORECASE)
JS_REF_RE = re.compile(
    r"(?:importScripts\s*\(\s*|(?:import|export)\s+(?:[^;]*?\s+from\s+)?|fetch\s*\(\s*)[\"']([^\"']+)[\"']",
    re.IGNORECASE,
)
TITLE_RE = re.compile(r"<title[^>]*>\s*(.*?)\s*</title>", re.IGNORECASE | re.DOTALL)


@dataclass(frozen=True)
class Asset:
    path: PurePosixPath
    size: int
    sha256: str

    @property
    def cache_path(self) -> str:
        return "./" + self.path.as_posix()


def posix_path(path: Path, root: Path) -> PurePosixPath:
    return PurePosixPath(path.relative_to(root).as_posix())


def should_include(path: PurePosixPath) -> bool:
    if any(part in EXCLUDED_PARTS for part in path.parts):
        return False
    if path in GENERATED or path.name in SKIP_PUBLIC_NAMES:
        return False
    if path.name.endswith("-check.js") or path.name.startswith("build-"):
        return False
    return path.suffix.lower() in PUBLIC_SUFFIXES


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def fnv1a64(data: bytes) -> str:
    value = 0xCBF29CE484222325
    for byte in data:
        value ^= byte
        value = (value * 0x100000001B3) & 0xFFFFFFFFFFFFFFFF
    return f"{value:016x}"


def collect_assets(root: Path) -> list[Asset]:
    assets: list[Asset] = []
    for file_path in sorted(path for path in root.rglob("*") if path.is_file()):
        relative = posix_path(file_path, root)
        if not should_include(relative):
            continue
        data = file_path.read_bytes()
        assets.append(Asset(relative, len(data), sha256_bytes(data)))
    return assets


def cache_paths(assets: Iterable[Asset]) -> list[str]:
    paths = {asset.cache_path for asset in assets}
    # A request to a Pages directory is not the same cache key as index.html.
    for asset in assets:
        if asset.path.name == "index.html":
            parent = asset.path.parent
            paths.add("./" if str(parent) == "." else f"./{parent.as_posix()}/")
    paths.update("./" + generated.as_posix() for generated in GENERATED)
    return sorted(paths)


def html_pages(root: Path, assets: Iterable[Asset]) -> list[dict[str, str]]:
    pages: list[dict[str, str]] = []
    for asset in assets:
        if asset.path.suffix.lower() not in {".html", ".htm"}:
            continue
        if asset.path.name == "404.html":
            continue
        source = (root / asset.path).read_text(encoding="utf-8", errors="replace")
        match = TITLE_RE.search(source)
        title = html_lib.unescape(re.sub(r"\s+", " ", match.group(1)).strip()) if match else asset.path.stem
        route = "./" if asset.path.name == "index.html" else asset.cache_path
        if asset.path.name == "index.html" and asset.path.parent != PurePosixPath("."):
            route = f"./{asset.path.parent.as_posix()}/"
        section = "archive" if asset.path.parts[0] == "versions" else "site"
        pages.append({"path": asset.cache_path, "route": route, "title": title, "section": section})
    return sorted(pages, key=lambda item: (item["section"], item["title"], item["path"]))


def is_external(value: str) -> bool:
    return bool(re.match(r"^(?:https?:)?//", value, flags=re.IGNORECASE))


def local_reference_path(value: str, source: PurePosixPath) -> PurePosixPath | None:
    value = html_lib.unescape(value).strip().split("#", 1)[0].split("?", 1)[0]
    if not value or value.startswith(("#", "data:", "mailto:", "tel:", "javascript:")) or is_external(value):
        return None
    decoded = unquote(value)
    candidate = PurePosixPath(decoded)
    if candidate.is_absolute():
        candidate = PurePosixPath(*candidate.parts[1:])
    else:
        candidate = source.parent / candidate
    normalized = PurePosixPath(*[part for part in candidate.parts if part not in {"."}])
    if ".." in normalized.parts:
        return None
    return normalized


def referenced_values(source: str, suffix: str) -> list[str]:
    values: list[str] = []
    if suffix in {".html", ".htm"}:
        values.extend(next(group for group in match.groups() if group is not None) for match in HTML_REF_RE.finditer(source))
    elif suffix == ".css":
        values.extend(next(group for group in match.groups() if group is not None) for match in CSS_REF_RE.finditer(source))
    elif suffix in {".js", ".mjs"}:
        values.extend(match.group(1) for match in JS_REF_RE.finditer(source))
    return values


def validate_local_references(root: Path, assets: Iterable[Asset]) -> list[str]:
    errors: list[str] = []
    for asset in assets:
        if asset.path.suffix.lower() not in {".html", ".htm", ".css", ".js", ".mjs"}:
            continue
        source = (root / asset.path).read_text(encoding="utf-8", errors="replace")
        for value in referenced_values(source, asset.path.suffix.lower()):
            target = local_reference_path(value, asset.path)
            if target is None:
                continue
            if target in GENERATED:
                continue
            disk_path = root / target
            if disk_path.is_dir():
                disk_path /= "index.html"
            if not disk_path.is_file():
                errors.append(f"{asset.path.as_posix()}: missing local reference {value!r}")
    return sorted(set(errors))


def service_for_host(host: str) -> str:
    host = host.lower()
    if "spotify" in host:
        return "Spotify"
    if "apple.com" in host or "itunes.apple.com" in host:
        return "Apple Music"
    if "github" in host:
        return "GitHub"
    if "replit" in host:
        return "Replit"
    if "posthog" in host:
        return "PostHog"
    if "jsdelivr" in host or "unpkg" in host:
        return "CDN"
    return "External"


def external_dependencies(root: Path, assets: Iterable[Asset]) -> list[dict[str, object]]:
    groups: dict[str, dict[str, object]] = defaultdict(lambda: {"count": 0, "files": set(), "examples": set()})
    for asset in assets:
        if asset.path.suffix.lower() not in {".html", ".htm", ".css", ".js", ".mjs", ".json"}:
            continue
        source = (root / asset.path).read_text(encoding="utf-8", errors="replace")
        for value in URL_RE.findall(source):
            parsed = urlsplit(value)
            host = parsed.netloc.lower()
            if not host:
                continue
            group = groups[host]
            group["count"] = int(group["count"]) + 1
            group["files"].add(asset.path.as_posix())
            group["examples"].add(value)
    result = []
    for host, group in sorted(groups.items()):
        result.append(
            {
                "host": host,
                "service": service_for_host(host),
                "references": group["count"],
                "sourceFiles": sorted(group["files"]),
                "examples": sorted(group["examples"])[:3],
                "offlineMode": "metadata only; open when online",
            }
        )
    return result


def build_outputs(root: Path, github_repository: str) -> dict[PurePosixPath, str]:
    assets = collect_assets(root)
    errors = validate_local_references(root, assets)
    if errors:
        raise ValueError("\n".join(errors))
    source_fingerprint = "\n".join(f"{asset.path.as_posix()}\0{asset.sha256}" for asset in assets)
    revision = hashlib.sha256(source_fingerprint.encode("utf-8")).hexdigest()[:16]
    files = cache_paths(assets)
    pages = html_pages(root, assets)
    dependencies = external_dependencies(root, assets)
    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "project": "TRA",
        "cacheRevision": revision,
        "cacheFiles": files,
        "pages": pages,
        "coverage": {
            "cachedFiles": len(files),
            "trackedPages": len(pages),
            "localReferencesChecked": True,
            "externalDependencyGroups": len(dependencies),
        },
        "externalDependencies": dependencies,
        "integrations": {
            "Data Analytics": "offline-manifest.json is the source for coverage metrics and quality checks",
            "GitHub": {"repository": f"https://github.com/{github_repository}", "mode": "source and CI"},
            "Replit": {"mode": "no TRA app is configured; keep as an optional development mirror"},
            "Spotify": {"mode": "online-only links and embeds are preserved; audio is not copied"},
            "Apple Music": {"mode": "online-only catalog links are preserved; audio is not copied"},
        },
        "offlineLimits": [
            "Spotify and Apple Music playback needs their apps or network access.",
            "Only media files committed to this repository are cached for offline use.",
            "Open the hub once online to install or refresh the service-worker cache.",
        ],
    }
    catalog = {
        "schemaVersion": SCHEMA_VERSION,
        "revision": revision,
        "files": files,
        "pages": pages,
        "coverage": manifest["coverage"],
        "integrations": manifest["integrations"],
    }
    manifest_text = json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    catalog_text = (
        "/* Generated by tools/tra_offline_build.py. Do not edit manually. */\n"
        f"globalThis.TRA_OFFLINE_CATALOG = Object.freeze({json.dumps(catalog, ensure_ascii=False, separators=(',', ':'))});\n"
    )
    content: dict[PurePosixPath, bytes] = {asset.path: (root / asset.path).read_bytes() for asset in assets}
    content[PurePosixPath("offline-manifest.json")] = manifest_text.encode("utf-8")
    content[PurePosixPath("offline-catalog.js")] = catalog_text.encode("utf-8")
    lines = ["# TRA offline manifest v1", f"# cache_revision\t{revision}", "# path\tbytes\tfnv1a64"]
    for cache_path in files:
        path = PurePosixPath(cache_path.removeprefix("./"))
        # Directory aliases (for example ./links/) and the TSV itself do not
        # have a single file body to hash.
        if path not in content:
            continue
        data = content[path]
        lines.append(f"{path.as_posix()}\t{len(data)}\t{fnv1a64(data)}")
    tsv_text = "\n".join(lines) + "\n"
    return {
        PurePosixPath("offline-manifest.json"): manifest_text,
        PurePosixPath("offline-catalog.js"): catalog_text,
        PurePosixPath("offline-manifest.tsv"): tsv_text,
    }


def write_outputs(root: Path, outputs: dict[PurePosixPath, str]) -> None:
    for relative, content in outputs.items():
        (root / relative).write_text(content, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Build or check TRA's offline service-worker catalog.")
    parser.add_argument("--root", type=Path, default=Path.cwd(), help="repository root (defaults to cwd)")
    parser.add_argument("--check", action="store_true", help="fail when generated files are stale")
    parser.add_argument("--github-repository", default="tomerangel212-png/-", help="repository shown in the integration manifest")
    args = parser.parse_args()
    root = args.root.resolve()
    try:
        outputs = build_outputs(root, args.github_repository)
    except ValueError as error:
        print("Offline manifest validation FAILED:", file=sys.stderr)
        print(error, file=sys.stderr)
        return 1
    stale = []
    for relative, expected in outputs.items():
        actual_path = root / relative
        actual = actual_path.read_text(encoding="utf-8") if actual_path.exists() else None
        if actual != expected:
            stale.append(relative.as_posix())
    if args.check:
        if stale:
            print("Offline manifest is stale: " + ", ".join(stale), file=sys.stderr)
            print("Run: python3 tools/tra_offline_build.py", file=sys.stderr)
            return 1
        print(f"TRA offline manifest PASSED: {len(outputs)} generated files are current.")
        return 0
    write_outputs(root, outputs)
    manifest = json.loads(outputs[PurePosixPath("offline-manifest.json")])
    print(
        "TRA offline manifest built: "
        f"{manifest['coverage']['trackedPages']} pages · {manifest['coverage']['cachedFiles']} cache entries · "
        f"revision {manifest['cacheRevision']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
