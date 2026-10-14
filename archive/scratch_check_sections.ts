import { chromium } from 'playwright';

async function checkSections() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://gmr.surface.fan-os.net/indiaCapitals');
  
  const sections = page.locator('section').filter({ hasText: 'News' });
  const count = await sections.count();
  console.log('Sections with News count:', count);
  for (let i = 0; i < count; i++) {
    const sec = sections.nth(i);
    const text = await sec.evaluate(el => el.textContent?.slice(0, 100));
    const moreCount = await sec.getByRole('link', { name: 'More' }).count();
    console.log(`Section ${i}: moreCount=${moreCount}, text=${text?.replace(/\s+/g, ' ')}`);
  }

  // Also check all links with name 'More'
  const moreLinks = page.getByRole('link', { name: 'More' });
  const moreCount = await moreLinks.count();
  console.log('All More links count:', moreCount);
  for (let i = 0; i < moreCount; i++) {
    const link = moreLinks.nth(i);
    const href = await link.getAttribute('href');
    const parentTag = await link.evaluate(el => el.parentElement?.tagName + '.' + el.parentElement?.className);
    console.log(`More link ${i}: href=${href}, parent=${parentTag}`);
  }

  await browser.close();
}
checkSections();
