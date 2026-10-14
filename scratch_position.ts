import { chromium } from 'playwright';

async function checkTC11() {
  const browser = await chromium.launch();
  const page1 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const page2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page1.goto('https://www.gmrsports.in/india-capitals', { waitUntil: 'domcontentloaded' });
  await page2.goto('https://gmr.surface.fan-os.net/indiaCapitals', { waitUntil: 'domcontentloaded' });

  const el1 = page1.locator('.landing-news .first-list article .article-title').first();
  const el2 = page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article').first().locator('p.body_lg_bold, p').first();

  await el1.waitFor({ state: 'visible' });
  await el2.waitFor({ state: 'visible' });

  console.log('Site 1 position:', await el1.evaluate(e => getComputedStyle(e).getPropertyValue('position')));
  console.log('Site 2 position:', await el2.evaluate(e => getComputedStyle(e).getPropertyValue('position')));
  console.log('Site 2 outerHTML:', await el2.evaluate(e => e.outerHTML));
  console.log('Site 2 parent:', await el2.evaluate(e => e.parentElement?.outerHTML?.slice(0, 200)));

  await browser.close();
}
checkTC11();
