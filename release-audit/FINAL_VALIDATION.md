# Final release validation

Status: **local release checks passed; ready for deployment verification**.

| Check | Result |
|---|---|
| Production build (`CI=true npm run build`) | Passed; no ESLint warnings |
| TypeScript (`tsc --noEmit`) | Passed |
| Backend regression suite with configured two workers | 24 passed |
| Frontend metadata/URL regression suite | 13 passed |
| All URLs discovered in the isolated sitemap inventory | 948 checked across 6 sitemap files |
| Strict HTTP and 23 release-regression cases | 0 failed checks; 0 warnings |
| Chromium built-site routes | 13 passed; 0 JavaScript errors |
| Browser behavior regressions | 6 passed |
| Mobile overflow on checked home/detail views | None |
| Globe bottom city buttons | 0; map pins retained |
| Simulated visitor location | London, United Kingdom; nearest London hub selected |
| Mobile enquiry in isolated database | Saved once; HTTP 201 |
| Authenticated editorial approval and withdrawal | Passed; publication/noindex changes correctly |

## Failures this release specifically prevents

- A metadata network failure, invalid JSON or an incomplete response marking the homepage `noindex`.
- Missing robots metadata silently making unknown/private/draft pages indexable.
- Static Nginx fallback being accepted as a successful public deployment.
- Valid old location URLs losing their matching destination or redirecting through multiple hops.
- Invalid synthetic zones returning a successful homepage response.
- Legacy published database records becoming inaccessible solely because their URL prefix changed.
- An older published record overriding a newer draft at the same canonical URL.
- Sitemap, schema and internal-link references using inconsistent location URL formats.
- Invalid homepage/signup pagination displaying the home/signup UI under a 404 response.
- Location/coverage cards inferring onsite permission from a freelancer's address alone.

The HTTP verifier's API/bootstrap comparison excludes only transient preview `generatedAt` and `lastModifiedAt` fields when the page explicitly has pending editorial review. Published timestamps, content, robots directives, status and all other fields remain compared. Its separate fixtures reject static-shell and warning-only deployments.

## Scope and practical limits

These checks ran against the built application and an isolated in-memory MongoDB database. No production data, live SMTP/WhatsApp delivery or Google account was used. The crawl covered all 948 URLs in that test sitemap inventory; it is not a crawl of every production URL or an assertion that all 51,004 URLs from Search Console should be indexed.

The inherited Python test libraries emitted four deprecation warnings. The Node build tool emitted an `fs.F_OK` deprecation, and the environment emitted an npm proxy-configuration notice. These did not fail the build or tests; no unrelated dependency upgrades were introduced just to suppress them.

Deployment remains necessary. Follow `deploy/START_HERE.md`, apply the Nginx merge to the existing virtual host, run `nginx -t`, then require both `deploy/preflight.sh` and `deploy/verify_release.sh` to exit 0. Live SSL/domain routing, uploads, account workflows, third-party integrations and Search Console's live URL test require verification on the actual server.

The raw location import is preserved. Synthetic zones remain excluded; the remaining named locations are not certified as independently verified. Draft and unreviewed generated landing pages remain non-indexable. Google decides indexing and rankings.

## Evidence

- `final_http_results.json`: complete strict crawl and HTTP regression results.
- `final_browser_results.json`: route metadata, mobile/globe checks and simulated API failures.
- `final_publication_test.json`: authenticated approval/withdrawal outcome.
- `final_validation.json`: machine-readable summary.
- `previous-release/`: historical evidence from the earlier package, not the current result.
