#!/usr/bin/env bash
# Read-only direct-backend acceptance. No deployment or database writes.
set -euo pipefail
task_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
task_backend=${ER_BACKEND_ORIGIN:-http://127.0.0.1:8018}
task_canonical=${ER_CANONICAL_ORIGIN:-https://erfreelancers.com}
task_report=${ER_PREFLIGHT_REPORT:-/tmp/erfreelancers-preflight.json}
cd "$task_root"
python3 scripts/verify_live_seo.py "$task_backend" \
  --canonical-origin "$task_canonical" --skip-redirect-checks \
  --regression --strict --max-pages 12 --workers 4 --output "$task_report"
printf '%s\n' 'DIRECT BACKEND PASSED. Public deployment is not yet proven.'
