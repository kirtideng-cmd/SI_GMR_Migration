import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://gmr.surface.fan-os.net/indiaCapitals', { waitUntil: 'domcontentloaded' });
  const moreBtn = page.locator('section').filter({ hasText: 'News' }).getByRole('link', { name: 'More' }).first();
  await moreBtn.waitFor({ state: 'visible' });
  const html = await moreBtn.evaluate(el => el.outerHTML);
  const cursor = await moreBtn.evaluate(el => getComputedStyle(el).cursor);
  const cursorProp = await moreBtn.evaluate(el => getComputedStyle(el).getPropertyValue('cursor'));
  console.log({ html, cursor, cursorProp });
  await browser.close();
}
main().catch(console.error);
