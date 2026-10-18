# SEO + GEO release (October 2026) — branch `seo-content-phone-update`

## हिंदी में सार (Summary in Hindi)

**Google में सिर्फ 2 पेज इंडेक्स होने की असली वजह:** लाइव सर्वर (Nginx) हर URL पर वही 1.9 KB का खाली React shell भेजता है, जिसमें canonical = होमपेज था। और `/sitemaps/sitemap-*.xml` फाइलें XML की जगह HTML लौटाती हैं, इसलिए Google आपके एक भी पेज का URL sitemap से पढ़ ही नहीं पा रहा था। Google को हर पेज होमपेज की कॉपी दिखता था।

**इस ब्रांच में क्या बदला:**

1. **2,842 नए service × location पेज इंडेक्स होने लायक** — 43 देश, 126 शहर और Delhi / Noida / Gurugram के 34 इलाके। हर पेज में उस देश का privacy law (आधिकारिक स्रोत के साथ), payment methods, भाषाएँ, marketplaces, शहर की प्रोफ़ाइल और IST से time-zone overlap (IANA डेटा से कैलकुलेट) है। 50,000 पतले पेजों की जगह ~3,000 उपयोगी पेज।
2. बाकी ~720 छोटे इलाकों के पेज `noindex` रहते हैं और sitemap में नहीं हैं (thin/duplicate content से बचने के लिए)।
3. FAQPage, Service (areaServed City/Country), BreadcrumbList (Home › देश › शहर › सेवा) schema; og:image; हर पेज का अपना canonical।
4. टूटे हुए URL ठीक: `/brazil/s-o-paulo/` → `/brazil/sao-paulo/`, `/colombia/bogot-/` → `/colombia/bogota/` (57 लोकेशन, पुराने URL पर 301)।
5. नया फोन नंबर **+91 88007 74388** हर जगह (header, footer, WhatsApp, schema, chat)।
6. पुराना "ER" लोगो वापस, नया og-image।
7. रेपो से एडमिन पासवर्ड हटाया गया — **लेकिन यह git history में अभी भी है, इसलिए सर्वर पर पासवर्ड बदलना ज़रूरी है।**
8. Nginx न बदल पाएं तो `scripts/prerender_static.py` — यह हर पेज की असली HTML फाइल बना देता है ताकि मौजूदा Nginx भी सही पेज भेजे।

**आपको सर्वर पर क्या करना है (क्रम से):** नीचे "Deploy steps" देखें। सबसे ज़रूरी: Nginx बदलाव (या prerender script), पासवर्ड + JWT_SECRET बदलना, GitHub repo को private करना, फिर Search Console में sitemap दोबारा submit करना।

---

## Why only two pages were indexed

Checked on the live site before this release:

| Request | Live response | Effect |
|---|---|---|
| Any page URL, e.g. `/india/delhi/freelance-web-developer/` | the static React `build/index.html` (1,873 bytes), `<link rel="canonical" href="https://erfreelancers.com/">`, status 200 | Google sees every URL as a copy of the homepage and folds it into `/` |
| Non-existent URL | same shell, status 200 | soft 404s |
| `/sitemap.xml` | valid sitemap index | — |
| `/sitemaps/sitemap-*.xml` | **HTML shell instead of XML** | Google cannot read a single page URL from the sitemaps |
| `/api/public-page?path=…` | correct page data | the backend renderer works; it is just not connected |

The renderer on port 8018 already produced correct HTML. Nginx never sent page requests to it. That is still the main fix (Step 3 below).

## What this branch changes

### Content: market-facts landing pages (`backend/market_content.py`, `backend/data/market_facts.json`)

- A reviewed dataset (`reviewed: 2026-10-17`) covers 43 countries: privacy law, compliance notes, payment methods, marketplaces, channels, languages, currency, domain and dialling code. It also covers 127 city profiles, 34 Delhi NCR neighbourhood profiles, 22 industries and 14 service angles.
- `data/privacy_sources.json` (when present) adds an official source link for each privacy law.
- Time-zone overlap and a suggested call window are calculated from the IANA database. The site does not state them as a claim.
- Pages say "practical delivery guidance, not legal advice". The repository's existing banned-claims list still applies: no ratings, guarantees or fake counts.

### Indexing scope (`LANDING_INDEX_SCOPE`, default `country-city-ncr`)

| Scope | Indexable service × location pages |
|---|---|
| `country-city-ncr` (default) | countries, cities, and neighbourhoods of `ONSITE_CITY_IDS` (Delhi, Noida, Gurugram) → **2,842** |
| `country-city` | countries and cities only |
| `all` | every public location (not recommended: thin neighbourhood pages) |
| `none` | previous behaviour: generated pages stay `noindex` until approved in admin |

Other rules:

- A page approved in the admin review workflow always wins.
- A page rejected there (`editorialReview.approved = false`) always stays `noindex` and out of the sitemap.
- Location hub pages follow the same scope.

### Sitemaps

Sitemaps now hold about 3,068 URLs:

- core 9
- services 14
- location hubs 203
- `sitemap-landing-1.xml` 2,842
- approved database pages, freelancer profiles and blog posts, as before

### HTML / structured data

- Breadcrumbs follow geography: Home › Country › City › Service, in HTML, React and JSON-LD.
- FAQPage schema on landing and location pages.
- Service schema with `areaServed` set to City or Country.
- Organization schema with logo and phone.
- `og:image` and `summary_large_image` Twitter card.
- Section bodies render bullet lists (`<ul>`) and cited source links.
- The static `public/index.html` no longer carries `canonical`, `robots` or `og:url`. If the shell is ever served for a deep URL, it can no longer canonicalise that URL to the homepage.

### URLs

57 location slugs mangled by the original import were cleaned (`s-o-paulo`, `bogot-`, `-stermalm`, trailing hyphens). Old URLs return one 301, and their old slugs stay as aliases. The raw `locations.json` is unchanged.

### Phone, brand, security

- **Phone:** +91 88007 74388 (`+918800774388`, `wa.me/918800774388`) everywhere.
- **Brand:** the original "ER" monogram logo, PNG icons and a new `og-image.png`.
- **Security:** test files and reports no longer contain the admin password. They read `ADMIN_EMAIL` / `ADMIN_PASSWORD` from the environment.

## Deploy steps

### 1. Rotate credentials

The admin password was committed to a public repository, and it is still in git history.

1. On the VPS, edit the backend `.env`:
   - set a new `ADMIN_PASSWORD`;
   - set a new long random `JWT_SECRET` (for example from `openssl rand -hex 32`).
2. Restart the service. `seed_admin` re-hashes the new password on start, and the new `JWT_SECRET` signs out every old session.
3. In GitHub, go to **Settings → General → Danger zone → Change visibility** and make the repository private.

### 2. Pull this branch, build and restart

```bash
cd /var/www/erfreelancers
git fetch origin && git checkout seo-content-phone-update && git pull
backend/venv/bin/pip install -r backend/requirements.txt     # tzdata is required for time zones
cd frontend && npm ci && REACT_APP_SITE_URL=https://erfreelancers.com REACT_APP_BACKEND_URL= npm run build && cd ..
sudo systemctl restart erfreelancers.service
bash deploy/preflight.sh
```

Optional `.env` settings, with their defaults:

```
LANDING_INDEX_SCOPE=country-city-ncr
ONSITE_CITY_IDS=loc-city-in-delhi,loc-city-in-noida,loc-city-in-gurugram
PRODUCTION_CANONICAL_DOMAIN=https://erfreelancers.com
```

### 3. Connect Nginx to the renderer (the real fix)

Follow `deploy/START_HERE.md` steps 4–5. They do three things:

- install `nginx-public-proxy.inc` as a snippet;
- replace the catch-all `location /` and the robots/sitemap locations in the existing HTTPS host;
- run `nginx -t`, reload Nginx, then run `bash deploy/verify_release.sh`.

Check afterwards:

```bash
curl -s https://erfreelancers.com/sitemaps/sitemap-landing-1.xml | head -3                 # must be XML, not <!doctype html>
curl -s https://erfreelancers.com/india/delhi/freelance-web-developer/ | grep -o '<link rel="canonical"[^>]*>'
curl -s -o /dev/null -w '%{http_code}\n' https://erfreelancers.com/this-does-not-exist/   # must be 404
```

### 3b. Fallback if Nginx cannot be changed yet

```bash
cd /var/www/erfreelancers
backend/venv/bin/python scripts/prerender_static.py
```

The script writes the following into `frontend/build/`, so the existing static `try_files` config serves real pages:

- server-rendered HTML for every sitemap URL;
- real XML sitemaps;
- `robots.txt`;
- redirect stubs for the old slugs.

Limitations and maintenance:

- Re-run the script after every `npm run build` and after content changes.
- Static files cannot return 404 or 301. Unknown URLs still get the homepage file, and `verify_release.sh` reports those checks as failed.
- Switch to the proxy as soon as possible.

### 4. Search Console

1. In Search Console, open **Sitemaps** and remove any old sitemap entries. Then submit `https://erfreelancers.com/sitemap.xml`.
2. Use **URL Inspection → Test live URL** on a few pages, for example:
   - `/india/delhi/freelance-web-developer/`
   - `/united-kingdom/london/freelance-seo-expert/`
   - `/united-arab-emirates/`

   The rendered HTML must show the page's own H1 and canonical. Request indexing for about 10 key URLs.
3. Expect indexing over several weeks; 3,000 URLs are not crawled at once.
   - "Discovered – currently not indexed" in the first weeks is normal.
   - "Duplicate, Google chose different canonical" on some city pages within one country means those pages need more city-specific material: real projects, testimonials with permission, or local photos.

## Content maintenance

- **Review cycle.** Review `backend/data/market_facts.json` and `privacy_sources.json` every 6–12 months, because laws and payment providers change. Update `"reviewed"`; the sitemap `lastmod` follows it.
- **Adding a country or city.** Add its facts or profile. Countries without facts are never indexable.
- **Raising quality further.** Add real case studies and client reviews per city through the admin page workflow. An approved database page replaces the generated one.
