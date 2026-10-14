import { chromium } from 'playwright';

async function checkCursors() {
  const browser = await chromium.launch();
  const page1 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const page2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page1.goto('https://www.gmrsports.in/india-capitals', { waitUntil: 'load' });
  await page2.goto('https://gmr.surface.fan-os.net/indiaCapitals', { waitUntil: 'load' });

  const card1 = page1.locator('.landing-news .first-list article').first();
  const card2 = page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article').first();

  const title1 = page1.locator('.landing-news .first-list article .article-title').first();
  const title2 = page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article').first().locator('p.body_lg_bold, p').first();

  const more1 = page1.locator('.landing-news').getByRole('link', { name: 'More' }).first();
  const more2 = page2.locator('section').filter({ hasText: 'News' }).getByRole('link', { name: 'More' }).first();

  console.log('Site 1 card cursor:', await card1.evaluate(el => getComputedStyle(el).cursor));
  console.log('Site 2 card cursor:', await card2.evaluate(el => getComputedStyle(el).cursor));

  console.log('Site 1 title cursor:', await title1.evaluate(el => getComputedStyle(el).cursor));
  console.log('Site 2 title cursor:', await title2.evaluate(el => getComputedStyle(el).cursor));

  console.log('Site 1 more cursor:', await more1.evaluate(el => getComputedStyle(el).cursor));
  console.log('Site 2 more cursor:', await more2.evaluate(el => getComputedStyle(el).cursor));

  await browser.close();
}
checkCursors();
