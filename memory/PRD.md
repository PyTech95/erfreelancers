# ER Freelancer — Product Requirements & Migration Record

## Original problem statement
User inherited "erfreelancer" (Google AI Studio applet: single Node/Express TS server + Vite React 19 + Tailwind v4, in-memory DB, Gemini chatbot, simulated email, unauthenticated admin) and asked to **deploy it on Emergent** ("deploy here").
Emergent deployment only supports FastAPI + React + MongoDB (or Next.js), routes only `/api/*` to backend, serves frontend statically. Therefore the app was **ported** to the Emergent stack (user skipped clarification; recommended defaults applied).

## Decisions taken (2026-06)
- Backend: Express API → **FastAPI** (`/app/backend`), static seed data exported from TS to JSON (`backend/data/*.json`: 14 services, 3,643 locations, 144 freelancers, business facts).
- Persistence: **MongoDB** for freelancers (seeded, moderation persists), leads, lead_events, outbox, pages (140 pilot pages generated at first boot; pipeline generates more in batches), runs, users, login_attempts.
- Chatbot: Gemini `gemini-3.8-flash` via **Emergent Universal Key** (emergentintegrations, non-streaming to preserve widget JSON contract) with deterministic fallback replies.
- Admin: **JWT login** (single admin from env `ADMIN_EMAIL`/`ADMIN_PASSWORD`, bcrypt, 24h token, brute-force lockout). Protected: leads list/status/assign, freelancer moderation, pipeline run/pause.
- Email: still **SIMULATED** outbox (visible in admin Leads tab). Real provider (Resend/SendGrid) = backlog.
- SEO: server-side meta injection not possible on Emergent → client-side `document.title` + canonical updates, URL deep links (`/locations/<country>/<city>/<service-slug>/`, `/admin`, `/join-as-freelancer/`), sitemaps under `/api/sitemap.xml`, `/api/sitemaps/*`, static `public/robots.txt` + `/api/robots.txt`.
- Frontend: original TSX components moved into CRA/craco frontend (TypeScript enabled, `jsconfig.json` removed), Tailwind v3 with `font-display` (Outfit), `shadow-xs`, `scale-102` shims; all API calls go through `src/api.ts` `apiFetch()` using `REACT_APP_BACKEND_URL` and attaching admin bearer token.

## Architecture
- `backend/server.py` — all public/admin routes (`/api/*`), startup seeding
- `backend/store.py` — JSON data loading, Mongo helpers, lead transaction, pipeline
- `backend/content_builder.py` — deterministic service×location page generator (port of contentBuilder.ts)
- `backend/auth.py` — admin JWT login/me, seeding, `get_current_admin`
- `backend/seo.py` — sitemaps, robots, manifest, audit
- `backend/chat.py` — Gemini chatbot + fallback
- `frontend/src/App.tsx` — view state + deep-link/URL sync + admin gate
- `frontend/src/components/AdminLogin.tsx` — admin login form
- `frontend/src/api.ts` — apiFetch/token helpers

## Env (backend/.env)
MONGO_URL, DB_NAME, CORS_ORIGINS, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NOTIFY_EMAIL, PRODUCTION_CANONICAL_DOMAIN, EMERGENT_LLM_KEY

## Status
- [x] Backend ported & running (health, services, locations, freelancers, leads, chat, pages, pipeline, sitemaps, exports, auth) — curl verified
- [x] Frontend ported, compiles, home + deep link render — screenshot verified
- [x] Full E2E via testing agent — iteration_1: 45/45 backend, all frontend flows pass; fixed inherited bug in ServiceLocationDetail brief form payload (was sending notes/budget → 422)
- [x] Deployment readiness check: pass with query-limit warnings (limits added to leads/events/outbox/freelancers queries)

## Re-import into this workspace (2026-06)
- Uploaded zip (`erfreelancer2-main`) unpacked into `/app`; stack already React+FastAPI+MongoDB (Case A), no port needed.
- Preserved platform `.env`; added backend keys: JWT_SECRET, ADMIN_EMAIL=admin@erfreelancer.com, ADMIN_PASSWORD=Admin@12345, ADMIN_NOTIFY_EMAIL, PRODUCTION_CANONICAL_DOMAIN, EMERGENT_LLM_KEY, SMTP_ENCRYPTION_KEY, SMTP_HOST, SMTP_PORT.
- Fixes to boot in this env: removed stray template `src/App.js`/`App.css` (shadowed `App.tsx`) and leftover `frontend/jsconfig.json` (conflicted with `tsconfig.json`, crashed CRA).
- Deps: base image already ships emergentintegrations/litellm/fastapi/etc.; installed slowapi+limits. Frontend `yarn install` OK.
- Verified: full testing agent E2E (iteration_7) — 42 backend pass / 3 xdist-skipped, all frontend flows pass. Ready for Deploy button.

## Full corpus generation + SEO/GEO hardening (2026-09-21)
- **51,002 pages generated** (3,643 locations × 14 services), all `approved`, via `/app/scripts/generate_all_pages.py` (reuses checkpointed `store.pipeline_run`, ~8s total, batch inserts of 250).
- **Sitemaps rewritten dynamic from MongoDB** (`backend/seo.py`): only approved/resolvable pages listed (no 404 URLs → no soft-404/crawl-budget waste). Index = sitemap-core (real SPA routes only: /, /blog, /join-as-freelancer/) + sitemap-blog (published posts) + 11 page shards × 5000. `approved_page_count` cached 5 min in-memory for crawler traffic. Total public URLs: 51,005.
- **robots.txt** (static `public/robots.txt` + `/api/robots.txt`): correct domain, explicit AI-crawler allows (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended). Deprecated Google sitemap-ping URL removed (retired by Google).
- **GEO**: new `public/llms.txt` describing the platform for answer engines.
- **Per-page SEO**: new `src/lib/seo.ts` `applySeo()` — dynamic title, meta description, canonical (live origin), OG/Twitter, robots meta (`noindex` on /admin). Wired into App.tsx + ServiceLocationDetail (hardcoded erfreelancer.com replaced with `window.location.origin`; JSON-LD now origin-relative).
- **index.html**: robots meta (max-image-preview:large etc.), geo.region/placename/position/ICBM, theme-color, og:image/twitter:image (`public/og-image.jpg`, generated 1200×630), GSC verification placeholder comment.
- Verified: testing agent iteration_8 — 16/16 backend, 100% frontend (dynamic title/desc/canonical/JSON-LD on deep links, admin noindex, enquiry flow regression). SEO audit 100/100 pass.
- **To finish Google indexing after deploy**: attach custom domain → update `PRODUCTION_CANONICAL_DOMAIN` + `public/robots.txt` Sitemap line → verify ownership in Search Console (meta tag placeholder in index.html or drop `google<token>.html` into `frontend/public/`) → submit `/api/sitemap.xml` once → Google discovers/indexes in batches (51k pages index progressively, not instantly).

- **Blog Content Seeded (2026-09-21)**: Seeded 6 authoritative, high-ranking blog articles into `blog_posts` (Direct Freelancer vs Agency, Pricing Guide 2026, Local SEO & GEO Guide, WordPress vs React/FastAPI, 5-Point Handover Checklist, Laxmi Nagar Tech Hub). Sitemaps (`sitemap-blog.xml` & sitemap index) automatically updated to 51,011 total URLs.
- **Deployment Readiness Check**: Passed 100% with 0 blockers (status: `pass`).

## Deployment & Production Domain Next Steps
- P1: Real email delivery for leads (Resend/SendGrid) — currently MOCKED/simulated
- P1: Attach custom domain erfreelancer.com after deploy; Google Search Console verification
- P2: Streaming chatbot responses (SSE)
- P2: Prerender/OG meta per landing page (needs Next.js template if truly required)

## Session update (2026-06) — Deploy hardening + UX enhancements
Re-imported the erfreelancer2 zip into /app, recreated env, and made it production-ready on Emergent.

### Security & reliability hardening (verified, iteration_3: 36/36 backend, all frontend flows)
- CORS locked to CORS_ORIGINS (no wildcard) with explicit origins; credentials mode valid.
- Rate limiting (slowapi, X-Forwarded-For aware) on public writes: /api/leads 20/min, /api/chat/message 30/min, /api/chat/finalize 15/min, /api/freelancers/register 10/min, plus /api/auth/login 10/min on top of the existing Mongo brute-force lockout (5/15min).
- Security headers middleware: HSTS, X-Frame-Options=DENY, X-Content-Type-Options=nosniff, Referrer-Policy, Permissions-Policy.
- Generic 500 handler (logs, never leaks stack traces); FastAPI docs/openapi disabled in prod.
- Env: JWT_SECRET, ADMIN_EMAIL/PASSWORD, ADMIN_NOTIFY_EMAIL, PRODUCTION_CANONICAL_DOMAIN, EMERGENT_LLM_KEY set in backend/.env; MONGO_URL/DB_NAME preserved.
- Fixed frontend boot: removed leftover starter App.js/App.css shadowing App.tsx, removed conflicting jsconfig.json, installed typescript.
- NOTE: on Emergent, MongoDB is managed by the platform (Atlas not required); app has NO disk file uploads (portfolios are seeded data) so Object Storage was not needed. Email/lead delivery remains a SIMULATED outbox (P1 backlog).

### UX enhancements (verified, iteration_4: all 6 items pass)
- 14 AI-generated branded service illustrations (one per S01..S14) on service cards — src/constants/serviceImages.ts + ServicesGrid.tsx.
- WorldwideMap rewritten as an animated auto-rotating 3D globe (d3 geoOrthographic + requestAnimationFrame), drag-to-spin, zoom, region fly-to.
- IP geolocation via ipapi.co: detects visitor location, spins globe to it, pulsing "you are here" marker, highlights nearest hub, "Locate me" button (graceful fallback if IP lookup blocked).
- Hero headline "expertly built." now has a shimmering animated gradient + twinkling sparkles + framer-motion entrance.
- SEO fixed: content_builder titles/descriptions are now service-specific and length-clamped (title <=92, desc <=165). seo/audit: 12/12 pass, score 100, 0 title/desc alerts, 0 duplicates, 0 orphans. Pilot pages re-seeded.

### Credentials
Admin: rajeev.pytech@gmail.com / ErFreelancer@2026Admin (see test_credentials.md).


## Live Website Showcase (2026-09-21)
- Replaced old unverified WorkShowcase with **LiveShowcase** (`frontend/src/components/LiveShowcase.tsx`) on homepage `#work`.
- **123 curated famous live sites** (`frontend/src/data/showcaseData.ts`) across 12 categories (AI, SaaS, E-commerce, Fintech, Media, Design, Dev, Travel, Social, Education, Health, Food): Stripe, Airbnb, Notion, Figma, Netflix, OpenAI, etc.
- **Live screenshots** via WordPress mShots (no API key, always current). A few bot-protected sites (OpenAI, Midjourney) show a challenge page in the thumbnail (third-party limitation); links still open the real site.
- Modern dark section: ambient glows, dot-grid texture, gradient heading, glass category pills, search, framer-motion staggered reveals, hover overlays.
- **Card click → detail modal**: large screenshot, description, tags, "LIVE WEBSITE LINK" box with **Copy link** (clipboard + "Copied!" state) + hint "Copy this link and paste it in your next browser tab to open the full website", **Visit live website** (target=_blank), and "Build something like this" (opens enquiry).
- Verified (headless chromium desktop 1440 + mobile 390): responsive, category filter, search, modal open/close, copy-to-clipboard, live-link target all pass.
