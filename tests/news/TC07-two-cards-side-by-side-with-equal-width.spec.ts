import { test, expect } from '@playwright/test';

test('TC07 - Two cards side by side with equal width', async ({ browser }) => {
  // Expected: Both cards have the same width on each site and match across sites. Values of display, grid-template-columns, width match on both sites (numeric tolerance +/-1px).
  const SITE1_URL = process.env.SITE1_URL;
  const SITE2_URL = process.env.SITE2_URL;
  if (!SITE1_URL || !SITE2_URL) throw new Error('Set SITE1_URL and SITE2_URL environment variables');
  const VIEWPORT = { width: 1440, height: 900 };
  const TOLERANCE_PX = 1;
  const PROPS = ["display","grid-template-columns","width"];
  const values1: Record<string, string> = {};
  const values2: Record<string, string> = {};
  const rows: { property: string; site1: string; site2: string; diff: string }[] = [];

  test.info().annotations.push(
    { type: 'section', description: 'Big cards' },
    { type: 'element', description: 'Big card (first and second)' },
  );

  const context1 = await browser.newContext({ viewport: VIEWPORT });
  const context2 = await browser.newContext({ viewport: VIEWPORT });
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  const news1 = page1.locator('.landing-news').first();
  const news2 = page2.locator('section').filter({ hasText: 'News' }).first();
  const el1 = page1.locator('.landing-news .first-list article').first();
  const el2 = page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article').first();

  await test.step('1. Open Site 1 in Chrome, viewport 1440x900, zoom 100%.', async () => {
    await page1.goto(SITE1_URL, { waitUntil: 'domcontentloaded' });
    await page1.waitForLoadState('load');
  });
  await test.step('2. Wait until the News section is visible.', async () => {
    await expect(news1, 'Site 1: News section NOT FOUND').toBeVisible();
    
  });
  await test.step('3. Locate: Big card (first and second).', async () => {
    await expect(el1, 'Site 1: Big card (first and second) NOT FOUND').toBeVisible();
  });
  await test.step('4. Read the computed values of: display, grid-template-columns, width (DevTools Computed tab or getComputedStyle).', async () => {
    for (const prop of PROPS) {
      values1[prop] = await el1.evaluate(async (el, p) => {
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        const start = Date.now();
        let v = getComputedStyle(el).getPropertyValue(p) || (getComputedStyle(el) as any)[p] || '';
        while (!v && Date.now() - start < 3000) {
          await new Promise((r) => setTimeout(r, 50));
          v = getComputedStyle(el).getPropertyValue(p) || (getComputedStyle(el) as any)[p] || '';
        }
        return v;
      }, prop);
    }
  });
  await test.step('5. Repeat steps 1-4 on Site 2 with the same viewport and zoom.', async () => {
    await page2.goto(SITE2_URL, { waitUntil: 'domcontentloaded' });
    await page2.waitForLoadState('load');
    await expect(news2, 'Site 2: News section NOT FOUND').toBeVisible();
    
    await expect(el2, 'Site 2: Big card (first and second) NOT FOUND').toBeVisible();
    for (const prop of PROPS) {
      values2[prop] = await el2.evaluate(async (el, p) => {
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        const start = Date.now();
        let v = getComputedStyle(el).getPropertyValue(p) || (getComputedStyle(el) as any)[p] || '';
        while (!v && Date.now() - start < 3000) {
          await new Promise((r) => setTimeout(r, 50));
          v = getComputedStyle(el).getPropertyValue(p) || (getComputedStyle(el) as any)[p] || '';
        }
        return v;
      }, prop);
    }
  });
  await test.step('6. Compare Site 1 and Site 2 values and record them.', async () => {
    for (const prop of PROPS) {
      const v1 = values1[prop] || '';
      const v2 = values2[prop] || '';
      const isPx = /^-?\d+(\.\d+)?px$/.test(v1.trim()) && /^-?\d+(\.\d+)?px$/.test(v2.trim());
      let diff = v1 === v2 ? '0' : 'changed';
      if (isPx) {
        const d = parseFloat(v2) - parseFloat(v1);
        diff = `${d >= 0 ? '+' : ''}${d.toFixed(2)}px`;
        expect.soft(Math.abs(d), `${prop}: Site 1 ${v1} vs Site 2 ${v2}`).toBeLessThanOrEqual(TOLERANCE_PX);
      } else {
        expect.soft(v2.trim().toLowerCase(), `${prop}: Site 1 ${v1} vs Site 2 ${v2}`).toBe(v1.trim().toLowerCase());
      }
      rows.push({ property: prop, site1: v1, site2: v2, diff });
    }
    
    // Assert equal width within each site for first and second card
    const b1_1 = await page1.locator('.landing-news .first-list article').first().boundingBox();
    const b1_2 = await page1.locator('.landing-news .first-list article').nth(1).boundingBox();
    if (b1_1 && b1_2) expect.soft(Math.abs(b1_2.width - b1_1.width), 'Site 1: Big card 1 vs card 2 width').toBeLessThanOrEqual(TOLERANCE_PX);

    const b2_1 = await page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article').first().boundingBox();
    const b2_2 = await page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article').nth(1).boundingBox();
    if (b2_1 && b2_2) expect.soft(Math.abs(b2_2.width - b2_1.width), 'Site 2: Big card 1 vs card 2 width').toBeLessThanOrEqual(TOLERANCE_PX);

  });

  console.table(rows);
  await test.info().attach('css-diff', { body: JSON.stringify(rows, null, 2), contentType: 'application/json' });
  await context1.close();
  await context2.close();
});
