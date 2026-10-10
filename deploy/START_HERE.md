# Start here: this release needs an Nginx routing change

**Uploading the ZIP, rebuilding React and restarting FastAPI are not enough.** The observed public site still serves a small static CRA shell while the backend renderer on port 8018 supplies the correct content. Until the public virtual host proxies page requests to that backend, the live SEO repair is not deployed.

This package does not access SSH or change the live server. The instructions target `/var/www/erfreelancers`, `erfreelancers.service` and `127.0.0.1:8018`; verify these against the existing VPS first.

## Release gates

| Gate | Required result |
|---|---|
| Build | React build succeeds with the supplied lockfile; the backend's configured build directory contains it |
| Direct backend | `bash deploy/preflight.sh` exits 0 |
| Nginx configuration | Existing ER Freelancers HTTPS host routes public HTML, robots and sitemaps to FastAPI; `nginx -t` succeeds |
| Public release | `bash deploy/verify_release.sh` exits 0, including comparison with the direct backend |
| Customer checks | Globe, location selection, mobile navigation, login, uploads and a saved test enquiry work |

**A nonzero exit is a failed gate. Do not report deployment complete, resubmit the sitemap as a fix, or ignore the failure.** JSON reports identify the failed checks. No script here changes Nginx, publishes content, submits to Google or mutates the database.

## Run on the VPS, in this order

1. Read `DEPLOYMENT.md` in this folder. Inspect the service and the existing domain-specific virtual host. Make the protected application/configuration/database backups described there.
2. Install the corrected files through your existing release workflow while preserving production `.env`, uploads and MongoDB data. Do not reset or reseed the database.
3. Use the supplied frontend lockfile and build. Stop immediately if any command fails:

   ```bash
   set -euo pipefail
   cd /var/www/erfreelancers/frontend
   npm ci
   REACT_APP_SITE_URL=https://erfreelancers.com REACT_APP_BACKEND_URL= npm run build
   test -f build/index.html
   cd /var/www/erfreelancers
   sudo systemctl restart erfreelancers.service
   sudo systemctl is-active --quiet erfreelancers.service
   bash deploy/preflight.sh
   ```

4. Install the small include file, then **edit the existing HTTPS virtual host** using `nginx-existing-vhost-snippet.conf`:

   ```bash
   sudo install -m 644 /var/www/erfreelancers/deploy/nginx-public-proxy.inc /etc/nginx/snippets/erfreelancers-public-proxy.conf
   ```

   Replace its existing catch-all `location /`; also replace any old exact robots/sitemap locations. Do not append duplicate locations. Preserve SSL/certbot directives, `/api/`, `/static/`, uploads/media aliases, other hosts and any existing limits. The optional full `nginx-erfreelancers.conf` is a reference, not an overwrite command.
5. Test and reload only if valid:

   ```bash
   set -euo pipefail
   sudo nginx -t
   sudo systemctl reload nginx
   cd /var/www/erfreelancers
   bash deploy/verify_release.sh
   ```

6. Check customer flows and application logs. Only after the public gate passes, submit the canonical `/sitemap.xml` in Search Console and inspect priority URLs.

## If the backend passes but the public site fails

This is an incomplete public deployment, often due to the wrong or unchanged virtual host. Inspect the active configuration with `sudo nginx -T` locally. Find the `server_name erfreelancers.com` HTTPS block and check whether public paths still use `try_files ... /index.html`, an inherited SPA error page, an exact `location = /`, old static robots/sitemaps or another matching server block. Also check for a CDN caching old HTML. Do not share the complete configuration publicly if it contains sensitive information.

The required live homepage response contains one H1, `script#page-data` with `kind: "home"`, its own canonical and matching `X-Robots-Tag`. A 200 response, a browser screenshot, the React `build/index.html` file, or a successful `/api/health` response alone does not prove the renderer is publicly connected.

## URL migration in this release

- The directory remains `/locations/`.
- Individual location pages move from `/locations/india/delhi/` to `/india/delhi/`.
- Individual service/location pages move from `/locations/india/delhi/freelance-web-developer/` to `/india/delhi/freelance-web-developer/`.
- Valid old paths get a single backend-issued **301**, preserving query parameters. Do not add a blanket Nginx `/locations/` rewrite; it would incorrectly redirect invalid locations and could break the directory.
- Synthetic/unknown places stay **404**. Existing review-required landing pages stay **noindex** until properly approved; they are not a failed deployment just because they are not indexable.

`preflight.sh` and `verify_release.sh` exercise these differences. The verifier deliberately tests a pending landing page by comparing its real status/robots with the API instead of demanding `index` for every URL.

## Useful logs and rollback

```bash
sudo journalctl -u erfreelancers.service -n 100 --no-pager
sudo journalctl -u erfreelancers.service -f
```

If critical flows fail, follow the rollback section of `DEPLOYMENT.md`. Restore the recorded previous code/build and only this site's backed-up Nginx configuration; test before reload. Keep current MongoDB data and newly received enquiries. Never restore an old database merely to undo an HTML routing change.
