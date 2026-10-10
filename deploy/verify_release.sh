#!/usr/bin/env bash
# Run on the VPS after Nginx reload. Read-only; requires the backend loopback URL.
set -euo pipefail
task_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
task_public=${ER_PUBLIC_ORIGIN:-https://erfreelancers.com}
task_canonical=${ER_CANONICAL_ORIGIN:-https://erfreelancers.com}
task_backend=${ER_BACKEND_ORIGIN:-http://127.0.0.1:8018}
task_report=${ER_RELEASE_REPORT:-/tmp/erfreelancers-release.json}
cd "$task_root"
python3 scripts/verify_live_seo.py "$task_public" \
  --canonical-origin "$task_canonical" --backend-url "$task_backend" \
  --regression --strict --max-pages 12 --workers 4 --output "$task_report"
printf '%s\n' 'PUBLIC ROUTING PASSED. Complete browser/customer-flow checks before closing the release.'
