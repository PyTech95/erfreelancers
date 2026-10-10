# Deploy the SEO and homepage fixes

**Read `START_HERE.md` first.** The public renderer requires an actual Nginx page-routing change. Both `preflight.sh` and `verify_release.sh` must pass; a successful backend check alone does not mean the live site is fixed.

This package updates the existing React/FastAPI/MongoDB application. It is prepared for the known VPS layout `/var/www/erfreelancers`, the existing `erfreelancers.service`, and backend port `8018`. Verify these on the server first. No production deployment or Google indexing has been performed by preparing this package.

The important deployment change is that Nginx must send public page requests to FastAPI. Serving `frontend/build/index.html` as a universal SPA fallback would retain the original empty HTML and soft-404 problem, even after uploading the updated code.

## 1. Inspect and back up the current installation

Run these commands on the VPS as an administrator. Do not paste secrets into chat or public logs.

```bash
cd /var/www/erfreelancers
systemctl cat erfreelancers.service
systemctl status erfreelancers.service --no-pager
ls -l /etc/nginx/sites-enabled
sudo nginx -t
```

Confirm the unit's working directory, virtual environment path, listening address/port, and startup command. Record the actual Nginx file for this domain. Confirm which names the current certificate covers with `sudo certbot certificates`; the example configuration requires both `erfreelancers.com` and `www.erfreelancers.com`. Use the actual certificate paths if they differ.

Before replacing code, create a protected backup of the existing application, environment files, uploads, service unit, and active Nginx configuration. Back up MongoDB with the existing authenticated backup process and verify the resulting backup is readable. Keep these backups outside the web root. A filesystem copy of application code is not a database backup.

For example, after confirming the paths:

```bash
sudo install -d -m 700 /var/backups/erfreelancers
backup_stamp=$(date -u +%Y%m%dT%H%M%SZ)
sudo tar --exclude=node_modules --exclude=venv --exclude=.venv \
  -czf "/var/backups/erfreelancers/app-${backup_stamp}.tar.gz" \
  -C /var/www erfreelancers
sudo chmod 600 "/var/backups/erfreelancers/app-${backup_stamp}.tar.gz"
sudo cp -a /etc/nginx/sites-available/ACTUAL_EXISTING_SITE_FILE \
  "/var/backups/erfreelancers/nginx-${backup_stamp}.conf"
```

`ACTUAL_EXISTING_SITE_FILE` is a placeholder: replace it with the file identified above. Do not run the command unchanged.

## 2. Stage the code while preserving production data

Upload and extract the corrected ZIP into a staging directory first. Compare it with the installed application. Copy the corrected source and deployment files into place only after the backups are complete. Never overwrite production `.env` files, uploads, MongoDB data, or the service unit blindly. Do not run database reset, reseed, synthetic-page generation, or content-regeneration scripts as part of this deployment.

If the VPS is maintained through Git, commit the corrected files to the intended repository and use the existing Git deployment workflow instead of combining an untracked ZIP overwrite with a pull. Keep one clear source of deployed code.

In the existing `backend/.env`, preserve all database names, credentials, integrations and application secrets. Set or update only the canonical-origin setting for this release:

```dotenv
PRODUCTION_CANONICAL_DOMAIN=https://erfreelancers.com
```

Retain the existing allowed CORS origins, with `https://erfreelancers.com` included if the application uses cross-origin calls. The website uses the same origin for normal `/api` requests. Do not set an unrelated preview URL as the production backend URL when building the frontend.

## 3. Install and build

Use the existing supported Python environment. This release includes a tested npm package-lock.json and .npmrc for the existing CRA dependencies. Retain the supplied lockfile. Install from the lockfile where one is included; do not resolve unrelated upgrades during deployment.

```bash
set -euo pipefail
cd /var/www/erfreelancers/frontend
npm ci
REACT_APP_SITE_URL=https://erfreelancers.com REACT_APP_BACKEND_URL= npm run build
test -f build/index.html
```

If the frontend is already built in a prepared release, verify the supplied `frontend/build/index.html` and its referenced assets are present. FastAPI needs the entire build directory, not only its index file.

The SEO renderer uses the existing FastAPI stack. No mandatory Python dependency was added by this SEO release. Keep the existing working environment. Only if a dependency is missing, install it into the virtual environment actually used by the service; do not create a second unrelated environment. For a service using `/var/www/erfreelancers/backend/venv`, the command would be:

```bash
/var/www/erfreelancers/backend/venv/bin/python -m pip install \
  -r /var/www/erfreelancers/backend/requirements.txt
```

Substitute the environment path found in `systemctl cat`. Keep the service bound to `127.0.0.1:8018`, with Nginx providing HTTPS. Uvicorn should trust proxy headers only from the loopback proxy (for example `--proxy-headers --forwarded-allow-ips=127.0.0.1`). Do not replace an otherwise working unit just to change unrelated settings.

## 4. Restart and check the application before changing Nginx

```bash
sudo systemctl restart erfreelancers.service
sudo systemctl status erfreelancers.service --no-pager
sudo journalctl -u erfreelancers.service -n 80 --no-pager
curl -fsS http://127.0.0.1:8018/api/health
curl -fsS http://127.0.0.1:8018/ -o /tmp/erfreelancers-home.html
curl -fsS http://127.0.0.1:8018/sitemap.xml -o /tmp/erfreelancers-sitemap.xml
```

Inspect `/tmp/erfreelancers-home.html`: it must contain the homepage heading, meaningful public content, canonical metadata and JSON-LD without executing JavaScript. The sitemap must be XML. An application startup error, a blank SPA response or missing frontend assets is a deployment blocker.

Run the included read-only verifier against the backend:

```bash
cd /var/www/erfreelancers
python3 scripts/verify_live_seo.py http://127.0.0.1:8018 \
  --canonical-origin https://erfreelancers.com \
  --skip-redirect-checks --regression --strict \
  --output /tmp/erfreelancers-backend-seo.json
```

When a canonical origin differs from the base URL, the verifier fetches the canonical paths through the supplied base URL. This allows checking the new backend before changing public routing.

## 5. Install the reviewed Nginx configuration

Use the minimal `deploy/nginx-existing-vhost-snippet.conf` to edit the existing ER Freelancers HTTPS host. Preserve SSL/certbot directives, required certificate renewal challenge locations, `/api/`, `/static/`, uploads/media storage aliases, limits and other hosts. Replace the existing `location /` and any old exact robots/sitemap locations; do not append duplicate location blocks. Remove a conflicting exact `location = /` if it still serves the static CRA shell. The full `deploy/nginx-erfreelancers.conf` is a reference only, not an instruction to overwrite the live configuration.

```bash
cd /var/www/erfreelancers
sudo install -m 644 deploy/nginx-public-proxy.inc /etc/nginx/snippets/erfreelancers-public-proxy.conf
# Now edit ONLY the actual existing ER Freelancers HTTPS virtual host.
# Merge the reviewed locations from deploy/nginx-existing-vhost-snippet.conf.
sudo nginx -t
```

**Only if the configuration test succeeds:**

```bash
sudo systemctl reload nginx
```

If `nginx -t` fails, restore the backed-up configuration and test again. Do not reload a failed configuration. Verify the current certificate-renewal method after modifying the HTTP server block; a webroot ACME challenge needs its existing exception preserved.

## 6. Verify the public site

```bash
cd /var/www/erfreelancers
python3 scripts/verify_live_seo.py https://erfreelancers.com \
  --backend-url http://127.0.0.1:8018 --regression --strict \
  --max-pages 12 --workers 4 \
  --output /tmp/erfreelancers-live-seo.json
```

The verifier checks real HTTP responses, server-delivered content, metadata, schema JSON, robots rules, sitemap structure, canonical hosts, sampled pages, redirects, and a nonexistent URL. Its JSON report identifies the number of pages actually checked. A passing sample is not a full crawl, a guarantee that Google indexed the site, or an SEO percentage score. Use `--max-pages` for a larger deliberate crawl and `--path /a/specific/page` to include a page of concern.

The required regression mode also rejects a static CRA shell, checks `script#page-data` against the initial H1/canonical/robots and page-data API, compares public responses with the direct backend, checks built JS/CSS delivery, tests invalid/synthetic route 404s, and requires valid legacy `/locations/{country}/...` URLs to redirect once with HTTP 301 to the new `/{country}/...` route. The directory `/locations/` remains unchanged. Strict mode exits nonzero for either errors or warnings. Do not pipe the verifier into another command and accidentally hide its exit status.

Also check the browser on desktop and mobile: homepage/globe; the removed text list below the map; right-side location selection and manual selection; service/detail pages; navigation; login; and a test enquiry that is saved once. Check live logs while testing:

```bash
sudo journalctl -u erfreelancers.service -f
```

This update preserves existing database records. Previously generated location copy and registered-profile claims still need review before broad publication. Do not describe the existing page count, generated profiles or indexing status as verified unless supported by the corresponding live evidence.

## 7. Google Search Console follow-up

After the public verification passes, submit `https://erfreelancers.com/sitemap.xml` in the correct Search Console property. Inspect the homepage, one service page and a genuinely useful published location page using **Test live URL**. Confirm Google can retrieve the rendered page, its selected canonical is appropriate, and no accidental `noindex`/robots rule blocks it. Request indexing for a small number of repaired priority pages, then monitor Page indexing and Crawl stats over time.

Save the actual exclusion reasons and example URLs from Search Console. The source ZIP and public HTTP checks cannot reveal every account-only indexing reason, Google-selected canonical, crawl history or manual-action report. Sitemaps and successful live URL tests do not prove indexing. Ordinary service/location pages are not eligible for Google's job/live-stream Indexing API.

## Rollback

If the application or critical workflows fail after release, restore the backed-up source/build and the previous Nginx configuration, then restart the application, run `nginx -t`, and reload Nginx only after success. Keep the existing MongoDB data in place unless there was an independently verified database problem and an explicit restore decision. Never roll back enquiries received after the deployment by blindly restoring an old database backup.

For a routing-only rollback, set these two values to the exact paths recorded during backup, then restore only this site's previous configuration:

```bash
set -euo pipefail
task_nginx_backup=/var/backups/erfreelancers/nginx-REPLACE_WITH_RECORDED_TIMESTAMP.conf
task_nginx_active=/etc/nginx/sites-available/REPLACE_WITH_ACTUAL_SITE_FILE
test -f "$task_nginx_backup"
test -f "$task_nginx_active"
sudo cp -a "$task_nginx_backup" "$task_nginx_active"
sudo nginx -t
sudo systemctl reload nginx
```

For a code rollback, use the recorded previous Git revision/release in your existing deployment workflow. For a ZIP installation, first extract the protected backup into a separate recovery directory and copy back only the previous code/build after comparison; do not extract blindly over the running application, `.env` or uploads. Once the previous code/build is restored:

```bash
set -euo pipefail
sudo systemctl restart erfreelancers.service
sudo systemctl is-active --quiet erfreelancers.service
curl --fail --show-error --silent http://127.0.0.1:8018/api/health
sudo nginx -t
sudo systemctl reload nginx
```

The previous release may have the original SEO limitations; rollback restores service availability, not completion of this repair. Resolve the failed gate before retrying the corrected release.
