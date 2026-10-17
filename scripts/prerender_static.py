#!/usr/bin/env python3
"""Write server-rendered HTML, sitemaps and robots.txt into the React build folder.

WHEN TO USE
    Only as a fallback while the Nginx proxy change in deploy/START_HERE.md cannot be applied.
    With the current static Nginx config every URL returns the same 1.9 KB React shell, and
    /sitemaps/*.xml return HTML, so Google cannot read the site. After this script runs,
    Nginx's existing `try_files $uri $uri/ /index.html` finds a real file for every
    indexable URL: /india/delhi/freelance-web-developer/ -> build/india/delhi/freelance-web-developer/index.html

    The proxy is still the proper fix. Static files cannot return 404 or 301 status codes,
    so unknown URLs keep falling back to the homepage file (the React app then shows its
    not-found page with noindex).

WHAT IT DOES
    1. keeps the untouched React shell as build/app-shell.html (the backend renders from it);
    2. renders every URL listed in the sitemaps to build/<path>/index.html ("/" -> build/index.html);
    3. writes build/sitemap.xml, build/sitemaps/*.xml and build/robots.txt;
    4. removes pages it generated on a previous run that are no longer in the sitemap.

USAGE (on the server, from the repository root, with the backend virtualenv)
    backend/venv/bin/python scripts/prerender_static.py
    backend/venv/bin/python scripts/prerender_static.py --build /var/www/erfreelancers/frontend/build --dry-run

Re-run after every `npm run build` (React empties the build folder) and after content changes
(approved pages, new freelancer profiles, blog posts). It reads MongoDB but never writes to it.
"""
import argparse
import asyncio
import json
import os
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
MANIFEST = ".prerender-manifest.json"


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--build", default=os.getenv("FRONTEND_BUILD_DIR", str(ROOT / "frontend" / "build")),
                        help="React build folder served by Nginx (default: frontend/build)")
    parser.add_argument("--env", default=str(BACKEND / ".env"), help="backend .env file (MONGO_URL, DB_NAME, PRODUCTION_CANONICAL_DOMAIN)")
    parser.add_argument("--concurrency", type=int, default=25)
    parser.add_argument("--dry-run", action="store_true", help="render everything but write nothing")
    return parser.parse_args()


def target_for(build, path):
    return build / "index.html" if path == "/" else build / path.strip("/") / "index.html"


async def render_all(build, concurrency, dry_run):
    import public_site
    import seo

    inventory = await seo.sitemap_inventory()
    paths = list(dict.fromkeys(path for entries in inventory.values() for path, _ in entries))
    written, skipped = [], []
    semaphore = asyncio.Semaphore(concurrency)

    async def one(path):
        async with semaphore:
            data = await public_site.page_data(path, 1)
        if data.get("status") != 200 or data.get("path") != path or "noindex" in data.get("robots", ""):
            skipped.append({"path": path, "status": data.get("status"), "robots": data.get("robots")})
            return
        html = public_site.render_html(data)
        target = target_for(build, path)
        if not dry_run:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(html, encoding="utf-8")
        written.append(str(target.relative_to(build)))

    await asyncio.gather(*(one(path) for path in paths))

    # Old URLs from the original import's mangled slugs (/brazil/s-o-paulo/) get an instant
    # meta-refresh + canonical to the clean URL; with the Nginx proxy the backend sends a real 301.
    import store
    listed = set(paths)
    services = [s["slug"] for s in store.SERVICES if s.get("active", True) is not False]
    for old, new in store.LEGACY_LOCATION_PATHS.items():
        for old_path, new_path in [(old, new), *((f"{old}{slug}/", f"{new}{slug}/") for slug in services)]:
            if new_path not in listed:
                continue
            url = seo.domain() + new_path
            stub = (f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Moved</title>'
                    f'<link rel="canonical" href="{url}">'
                    f'<meta http-equiv="refresh" content="0; url={new_path}"></head>'
                    f'<body><p>This page has moved to <a href="{new_path}">{url}</a>.</p></body></html>')
            target = target_for(build, old_path)
            if not dry_run:
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(stub, encoding="utf-8")
            written.append(str(target.relative_to(build)))

    extra = {"sitemap.xml": (await seo.sitemap_index()).body,
             "robots.txt": (await seo.robots()).body}
    for name in inventory:
        extra[f"sitemaps/{name}"] = (await seo.sitemap_file(name)).body
    for relative, body in extra.items():
        if not dry_run:
            target = build / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(body)
        written.append(relative)
    return sorted(written), skipped, {name: len(entries) for name, entries in inventory.items()}


def main():
    args = parse_args()
    build = Path(args.build).resolve()
    if not (build / "index.html").is_file():
        sys.exit(f"{build}/index.html not found - run `npm run build` in frontend/ first.")

    from dotenv import load_dotenv
    load_dotenv(args.env)
    os.environ["FRONTEND_BUILD_DIR"] = str(build)  # must be set before public_site is imported
    sys.path.insert(0, str(BACKEND))

    shell = build / "app-shell.html"
    index = build / "index.html"
    if not shell.is_file():
        if 'id="page-data"' in index.read_text(encoding="utf-8"):
            sys.exit("build/index.html is already a rendered page and app-shell.html is missing. Run `npm run build` again, then re-run this script.")
        if not args.dry_run:
            shutil.copy2(index, shell)
        print("Saved the React shell as app-shell.html")

    written, skipped, counts = asyncio.run(render_all(build, args.concurrency, args.dry_run))

    manifest_path = build / MANIFEST
    previous = json.loads(manifest_path.read_text()) if manifest_path.is_file() else []
    stale = sorted(set(previous) - set(written))
    if not args.dry_run:
        for relative in stale:
            target = build / relative
            # The manifest lists only files this script wrote, never React assets.
            if target.is_file():
                target.unlink()
                with_parent = target.parent
                while with_parent != build and with_parent.is_dir() and not any(with_parent.iterdir()):
                    with_parent.rmdir()
                    with_parent = with_parent.parent
        manifest_path.write_text(json.dumps(written, indent=0))

    print(json.dumps({"build": str(build), "dryRun": args.dry_run, "sitemaps": counts,
                      "filesWritten": len(written), "staleRemoved": len(stale) if not args.dry_run else 0,
                      "skipped": skipped[:20], "skippedCount": len(skipped)}, indent=2))
    if skipped:
        print("Skipped URLs are listed in a sitemap but did not render as indexable 200 pages - check them.", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
