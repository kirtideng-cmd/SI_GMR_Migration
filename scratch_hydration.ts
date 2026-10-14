import { chromium } from 'playwright';

async function checkHydration() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://gmr.surface.fan-os.net/indiaCapitals');

  const nextData = await page.evaluate(() => {
    return {
      hasReact: !!(window as any).__NEXT_DATA__ || !!(window as any).next,
      readyState: document.readyState,
      scripts: Array.from(document.scripts).map(s => s.src).filter(s => s.includes('_next')),
    };
  });
  console.log('Next.js info:', nextData.hasReact, nextData.readyState, 'scripts:', nextData.scripts.length);
  await browser.close();
}
checkHydration();
