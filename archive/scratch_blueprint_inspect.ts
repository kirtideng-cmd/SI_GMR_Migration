import { chromium } from 'playwright';

async function inspectLayout() {
  const browser = await chromium.launch();
  const page1 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const page2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('Loading Site 1...');
  await page1.goto('https://www.gmrsports.in/india-capitals', { waitUntil: 'domcontentloaded' });
  await page1.waitForLoadState('load');

  console.log('Loading Site 2...');
  await page2.goto('https://gmr.surface.fan-os.net/indiaCapitals', { waitUntil: 'domcontentloaded' });
  await page2.waitForLoadState('load');

  // Wait for images
  await page1.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll('.landing-news img')) as HTMLImageElement[];
    await Promise.all(imgs.map(i => i.complete ? Promise.resolve() : new Promise(r => { i.onload = r; i.onerror = r; })));
  });
  await page2.evaluate(async () => {
    const sec = document.querySelector('section');
    const imgs = Array.from(document.querySelectorAll('img')) as HTMLImageElement[];
    await Promise.all(imgs.map(i => i.complete ? Promise.resolve() : new Promise(r => { i.onload = r; i.onerror = r; })));
  });

  async function getBoxes(page: any, isSite2: boolean) {
    const section = isSite2 
      ? page.locator('section').filter({ hasText: 'News' }).first()
      : page.locator('.landing-news').first();
    const heading = isSite2
      ? section.locator('.template-header').getByText('News', { exact: true }).first()
      : section.locator('.title').first();
    const bigCards = isSite2
      ? section.locator('.template-body article')
      : section.locator('.first-list article');
    const smallCards = isSite2
      ? section.locator('.template-body article')
      : section.locator('.second-list article');

    const sBox = await section.boundingBox();
    const hBox = await heading.boundingBox();
    
    const bc0 = isSite2 ? await bigCards.nth(0).boundingBox() : await bigCards.nth(0).boundingBox();
    const bc1 = isSite2 ? await bigCards.nth(1).boundingBox() : await bigCards.nth(1).boundingBox();

    const sc0 = isSite2 ? await smallCards.nth(2).boundingBox() : await smallCards.nth(0).boundingBox();
    const sc1 = isSite2 ? await smallCards.nth(3).boundingBox() : await smallCards.nth(1).boundingBox();
    const sc2 = isSite2 ? await smallCards.nth(4).boundingBox() : await smallCards.nth(2).boundingBox();
    const sc3 = isSite2 ? await smallCards.nth(5).boundingBox() : await smallCards.nth(3).boundingBox();

    // Inside first small card:
    const cardEl = isSite2 ? smallCards.nth(2) : smallCards.nth(0);
    const imgEl = cardEl.locator('img').first();
    const titleEl = isSite2 ? cardEl.locator('p.h2_bold, p').first() : cardEl.locator('.article-title').first();
    const labelEl = isSite2 ? cardEl.locator('.badge-site').first() : cardEl.locator('.meta-category').first();

    const imgBox = await imgEl.boundingBox();
    const titleBox = await titleEl.boundingBox();
    const labelBox = (await labelEl.count() > 0) ? await labelEl.boundingBox() : null;

    return { sBox, hBox, bc0, bc1, sc0, sc1, sc2, sc3, imgBox, titleBox, labelBox };
  }

  const s1 = await getBoxes(page1, false);
  const s2 = await getBoxes(page2, true);

  console.log('SITE 1:', JSON.stringify(s1, null, 2));
  console.log('SITE 2:', JSON.stringify(s2, null, 2));

  await browser.close();
}
inspectLayout().catch(console.error);
