"""One-off bulk generation of the full service x location page corpus via the existing pipeline."""
import asyncio
import sys
import time
from pathlib import Path

sys.path.insert(0, '/app/backend')
from dotenv import load_dotenv
load_dotenv(Path('/app/backend') / '.env')

import store


async def main():
    total_target = len(store.LOCATIONS) * len(store.SERVICES)
    start = time.time()
    print(f"TARGET {total_target} pages ({len(store.LOCATIONS)} locations x {len(store.SERVICES)} services)", flush=True)
    while True:
        status = await store.pipeline_run(5000)
        elapsed = time.time() - start
        print(f"PROGRESS {status['generatedSoFar']}/{status['totalTarget']} "
              f"status={status['status']} elapsed={elapsed:.0f}s", flush=True)
        if status['generatedSoFar'] >= total_target or status['status'] == 'completed':
            break
        await asyncio.sleep(0.2)
    final = await store.db.pages.count_documents({})
    approved = await store.db.pages.count_documents({'lifecycleState': 'approved'})
    dupes = final - approved
    print(f"DONE pages={final} approved={approved} non_approved={dupes} elapsed={time.time() - start:.0f}s", flush=True)


asyncio.run(main())
