import { test, expect } from '@playwright/test';

test('TC35 - No horizontal scroll at any width', async ({ browser }) => {
  // Expected: No horizontal scrollbar at 1440, 768 and 375px.
  const SITE1_URL = process.env.SITE1_URL;
  const SITE2_URL = process.env.SITE2_URL;
  if (!SITE1_URL || !SITE2_URL) throw new Error('Set SITE1_URL and SITE2_URL environment variables');

  const WIDTHS = [1440, 768, 375];
  const rows: { property: string; site1: string; site2: string; diff: string }[] = [];

  test.info().annotations.push(
    { type: 'section', description: 'Responsive' },
    { type: 'element', description: 'Page body' },
  );

  const context1 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const context2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  const news1 = page1.locator('.landing-news').first();
  const news2 = page2.locator('section').filter({ hasText: 'News' }).first();

  await test.step('1. Open Site 1 in Chrome, viewport 1440x900, zoom 100%.', async () => {
    await page1.goto(SITE1_URL, { waitUntil: 'domcontentloaded' });
    await page1.waitForLoadState('load');
  });

  await test.step('2. Wait until the News section is visible.', async () => {
    await expect(news1, 'Site 1: News section NOT FOUND').toBeVisible();
  });

  await test.step('3. Repeat the check at 1440, 768 and 375 px widths (resize each time).', async () => {
    for (const w of WIDTHS) {
      await page1.setViewportSize({ width: w, height: 900 });
      const scrollWidth1 = await page1.evaluate(() => document.documentElement.scrollWidth);
      expect.soft(scrollWidth1, `Site 1 scrollWidth at ${w}px`).toBeLessThanOrEqual(w);
    }
  });

  await test.step('4. At each width, check document.documentElement.scrollWidth <= window.innerWidth.', async () => {
    await page2.goto(SITE2_URL, { waitUntil: 'domcontentloaded' });
    await page2.waitForLoadState('load');
    await expect(news2, 'Site 2: News section NOT FOUND').toBeVisible();
  });

  await test.step('5. Also read the computed values of: overflow-x, max-width, scrollWidth on the page body.', async () => {
    for (const w of WIDTHS) {
      await page2.setViewportSize({ width: w, height: 900 });
      const scrollWidth2 = await page2.evaluate(() => document.documentElement.scrollWidth);
      expect.soft(scrollWidth2, `Site 2 scrollWidth at ${w}px`).toBeLessThanOrEqual(w);
    }
  });

  await test.step('6. Repeat steps 1-5 on Site 2.', async () => {
    // Reset to 1440 to read body styles
    await page1.setViewportSize({ width: 1440, height: 900 });
    await page2.setViewportSize({ width: 1440, height: 900 });
    const overflow1 = await page1.evaluate(() => getComputedStyle(document.body).overflowX);
    const overflow2 = await page2.evaluate(() => getComputedStyle(document.body).overflowX);
    expect.soft(overflow2, 'overflow-x').toBe(overflow1);
    rows.push({ property: 'overflow-x', site1: overflow1, site2: overflow2, diff: overflow1 === overflow2 ? '0' : 'changed' });
  });

  await test.step('7. Compare Site 1 and Site 2 results and record them.', async () => {
    const sw1 = await page1.evaluate(() => document.documentElement.scrollWidth);
    const sw2 = await page2.evaluate(() => document.documentElement.scrollWidth);
    const diff = sw2 - sw1;
    rows.push({ property: 'scrollWidth', site1: `${sw1}px`, site2: `${sw2}px`, diff: `${diff >= 0 ? '+' : ''}${diff}px` });
  });

  console.table(rows);
  await test.info().attach('css-diff', { body: JSON.stringify(rows, null, 2), contentType: 'application/json' });
  await context1.close();
  await context2.close();
});
