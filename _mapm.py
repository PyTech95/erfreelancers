import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--no-sandbox"], executable_path="/usr/bin/google-chrome")
        ctx = await b.new_context(viewport={"width":390,"height":844},
            geolocation={"latitude":19.076,"longitude":72.8777}, permissions=["geolocation"])
        pg = await ctx.new_page()
        await pg.goto("https://deploy-hub-266.preview.emergentagent.com/", wait_until="domcontentloaded", timeout=60000)
        await pg.wait_for_selector('[data-testid="world-map-svg"]', timeout=45000)
        await pg.eval_on_selector('[data-testid="world-map-heading"]', "el=>el.scrollIntoView({block:'start'})")
        await pg.wait_for_timeout(2500)
        vw = await pg.evaluate("document.documentElement.clientWidth")
        off = await pg.evaluate("()=>[...document.querySelectorAll('#world-map *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,4).map(e=>e.className||e.tagName)")
        print("VW", vw, "OVERFLOW", off)
        await pg.screenshot(path="/app/_map_m.png", full_page=False)
        await b.close()

asyncio.run(main())
