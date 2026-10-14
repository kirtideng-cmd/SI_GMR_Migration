import { chromium } from 'playwright';

async function testNetworkIdle() {
  const browser = await chromium.launch();
  const page1 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const page2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('Testing page1 networkidle...');
  try {
    const t0 = Date.now();
    await page1.goto('https://www.gmrsports.in/india-capitals', { waitUntil: 'load', timeout: 30000 });
    await page1.waitForLoadState('networkidle', { timeout: 10000 });
    console.log('page1 networkidle reached in', Date.now() - t0, 'ms');
  } catch (e: any) {
    console.log('page1 networkidle failed:', e.message);
  }

  console.log('Testing page2 networkidle...');
  try {
    const t0 = Date.now();
    await page2.goto('https://gmr.surface.fan-os.net/indiaCapitals', { waitUntil: 'load', timeout: 30000 });
    await page2.waitForLoadState('networkidle', { timeout: 10000 });
    console.log('page2 networkidle reached in', Date.now() - t0, 'ms');
  } catch (e: any) {
    console.log('page2 networkidle failed:', e.message);
  }

  await browser.close();
}
testNetworkIdle();
