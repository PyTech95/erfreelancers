import asyncio
from playwright.async_api import async_playwright

URL = "https://deploy-hub-266.preview.emergentagent.com/"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--no-sandbox"], executable_path="/usr/bin/google-chrome")
        ctx = await b.new_context(
            viewport={"width":1440,"height":900},
            geolocation={"latitude":13.0827,"longitude":80.2707},  # Chennai
            permissions=["geolocation"],
        )
        pg = await ctx.new_page()
        await pg.goto(URL, wait_until="domcontentloaded", timeout=60000)
        await pg.wait_for_selector('[data-testid="world-map-svg"]', timeout=45000)
        await pg.eval_on_selector('[data-testid="world-map-heading"]', "el=>el.scrollIntoView({block:'center'})")
        pins = await pg.eval_on_selector_all('[data-testid^="map-pin-"]', "els=>els.length")
        print("PINS visible (front hemisphere):", pins)
        # trigger precise geolocation
        await pg.click('[data-testid="map-use-precise"]')
        await pg.wait_for_timeout(4000)
        badge = await pg.text_content('[data-testid="map-detected-badge"]')
        print("BADGE:", (badge or "").strip())
        # nearby panel
        try:
            await pg.wait_for_selector('[data-testid="map-nearby-panel"]', timeout=6000)
            chips = await pg.eval_on_selector_all('[data-testid^="map-nearby-"]', "els=>els.map(e=>e.textContent.trim())")
            print("NEARBY chips:", chips)
        except Exception as e:
            print("nearby panel FAIL", e)
        active = await pg.text_content('[data-testid="map-active-location"]')
        print("ACTIVE (nearest):", (active or "").strip())
        await pg.wait_for_timeout(6000)  # let globe finish flying + pins render
        await pg.eval_on_selector('[data-testid="world-map-heading"]', "el=>el.scrollIntoView({block:'start'})")
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path="/app/_map.png", full_page=False)
        await b.close()

asyncio.run(main())
