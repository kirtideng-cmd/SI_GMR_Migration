import * as fs from 'fs';
import * as path from 'path';

interface TestCase {
  _rowNumber: number;
  'TC ID': string;
  Section: string;
  'Test Case': string;
  'Element Under Test': string;
  CSS Properties: string;
  'Test Steps': string;
  'Expected Result': string;
}

const tcs: TestCase[] = JSON.parse(fs.readFileSync('manual-testcases/parsed_test_cases.json', 'utf-8'));

function kebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function expandProperties(propsStr: string): string[] {
  const raw = propsStr.split(',').map((p) => p.trim()).filter(Boolean);
  const result: string[] = [];
  for (const p of raw) {
    if (p === 'padding') {
      result.push('padding-top', 'padding-right', 'padding-bottom', 'padding-left');
    } else if (p === 'margin') {
      result.push('margin-top', 'margin-right', 'margin-bottom', 'margin-left');
    } else if (p === 'border-radius') {
      result.push('border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius');
    } else if (p === 'border') {
      result.push('border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width');
    } else {
      result.push(p);
    }
  }
  // Deduplicate
  return Array.from(new Set(result));
}

const READ_STYLE_SNIPPET = `async (el, p) => {
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        const start = Date.now();
        let v = getComputedStyle(el).getPropertyValue(p) || (getComputedStyle(el) as any)[p] || '';
        while (!v && Date.now() - start < 3000) {
          await new Promise((r) => setTimeout(r, 50));
          v = getComputedStyle(el).getPropertyValue(p) || (getComputedStyle(el) as any)[p] || '';
        }
        return v;
      }`;

// Generate code for each test case
for (const tc of tcs) {
  const id = tc['TC ID'];
  const nameKebab = kebabCase(tc['Test Case']);
  const filename = `${id}-${nameKebab}.spec.ts`;
  const filePath = path.join('tests', 'flat', 'news', filename);

  const stepLines = tc['Test Steps']
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  let content = '';

  if (id === 'TC35') {
    // Template D - No horizontal scroll
    content = `import { test, expect } from '@playwright/test';

test('${id} - ${tc['Test Case']}', async ({ browser }) => {
  // Expected: ${tc['Expected Result']}
  const SITE1_URL = process.env.SITE1_URL;
  const SITE2_URL = process.env.SITE2_URL;
  if (!SITE1_URL || !SITE2_URL) throw new Error('Set SITE1_URL and SITE2_URL environment variables');

  const WIDTHS = [1440, 768, 375];
  const rows: { property: string; site1: string; site2: string; diff: string }[] = [];

  test.info().annotations.push(
    { type: 'section', description: '${tc.Section}' },
    { type: 'element', description: '${tc['Element Under Test']}' },
  );

  const context1 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const context2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  const news1 = page1.locator('.landing-news').first();
  const news2 = page2.locator('section').filter({ hasText: 'News' }).first();

  await test.step('${stepLines[0] || '1. Open Site 1 in Chrome, viewport 1440x900, zoom 100%.'}', async () => {
    await page1.goto(SITE1_URL, { waitUntil: 'domcontentloaded' });
    await page1.waitForLoadState('load');
  });

  await test.step('${stepLines[1] || '2. Wait until the News section is visible.'}', async () => {
    await expect(news1, 'Site 1: News section NOT FOUND').toBeVisible();
  });

  await test.step('${stepLines[2] || '3. Repeat the check at 1440, 768 and 375 px widths.'}', async () => {
    for (const w of WIDTHS) {
      await page1.setViewportSize({ width: w, height: 900 });
      const scrollWidth1 = await page1.evaluate(() => document.documentElement.scrollWidth);
      expect.soft(scrollWidth1, \`Site 1 scrollWidth at \${w}px\`).toBeLessThanOrEqual(w);
    }
  });

  await test.step('${stepLines[3] || '4. Check document.documentElement.scrollWidth <= window.innerWidth.'}', async () => {
    await page2.goto(SITE2_URL, { waitUntil: 'domcontentloaded' });
    await page2.waitForLoadState('load');
    await expect(news2, 'Site 2: News section NOT FOUND').toBeVisible();
  });

  await test.step('${stepLines[4] || '5. Read computed values of overflow-x, max-width, scrollWidth on page body.'}', async () => {
    for (const w of WIDTHS) {
      await page2.setViewportSize({ width: w, height: 900 });
      const scrollWidth2 = await page2.evaluate(() => document.documentElement.scrollWidth);
      expect.soft(scrollWidth2, \`Site 2 scrollWidth at \${w}px\`).toBeLessThanOrEqual(w);
    }
  });

  await test.step('${stepLines[5] || '6. Repeat steps 1-5 on Site 2.'}', async () => {
    // Reset to 1440 to read body styles
    await page1.setViewportSize({ width: 1440, height: 900 });
    await page2.setViewportSize({ width: 1440, height: 900 });
    const overflow1 = await page1.evaluate(() => getComputedStyle(document.body).overflowX);
    const overflow2 = await page2.evaluate(() => getComputedStyle(document.body).overflowX);
    expect.soft(overflow2, 'overflow-x').toBe(overflow1);
    rows.push({ property: 'overflow-x', site1: overflow1, site2: overflow2, diff: overflow1 === overflow2 ? '0' : 'changed' });
  });

  await test.step('${stepLines[6] || '7. Compare Site 1 and Site 2 results and record them.'}', async () => {
    const sw1 = await page1.evaluate(() => document.documentElement.scrollWidth);
    const sw2 = await page2.evaluate(() => document.documentElement.scrollWidth);
    const diff = sw2 - sw1;
    rows.push({ property: 'scrollWidth', site1: \`\${sw1}px\`, site2: \`\${sw2}px\`, diff: \`\${diff >= 0 ? '+' : ''}\${diff}px\` });
  });

  console.table(rows);
  await test.info().attach('css-diff', { body: JSON.stringify(rows, null, 2), contentType: 'application/json' });
  await context1.close();
  await context2.close();
});
`;
  } else if (id === 'TC29' || id === 'TC30' || id === 'TC31') {
    // Template B - Hover tests
    let loc1Code = `page1.locator('.landing-news .first-list article').first()`;
    let loc2Code = `page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article').first()`;
    if (id === 'TC30') {
      loc1Code = `page1.locator('.landing-news .first-list article .article-title').first()`;
      loc2Code = `page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article').first().locator('p.body_lg_bold, p').first()`;
    } else if (id === 'TC31') {
      loc1Code = `page1.locator('.landing-news').getByRole('link', { name: 'More' }).first()`;
      loc2Code = `page2.locator('section').filter({ hasText: 'News' }).getByRole('link', { name: 'More' }).first()`;
    }

    const props = expandProperties(tc['CSS Properties']);

    content = `import { test, expect } from '@playwright/test';

test('${id} - ${tc['Test Case']}', async ({ browser }) => {
  // Expected: ${tc['Expected Result']}
  const SITE1_URL = process.env.SITE1_URL;
  const SITE2_URL = process.env.SITE2_URL;
  if (!SITE1_URL || !SITE2_URL) throw new Error('Set SITE1_URL and SITE2_URL environment variables');
  const VIEWPORT = { width: 1440, height: 900 };
  const TOLERANCE_PX = 1;
  const PROPS = ${JSON.stringify(props)};
  const values1: Record<string, string> = {};
  const values2: Record<string, string> = {};
  const rows: { property: string; site1: string; site2: string; diff: string }[] = [];

  test.info().annotations.push(
    { type: 'section', description: '${tc.Section}' },
    { type: 'element', description: '${tc['Element Under Test']}' },
  );

  const context1 = await browser.newContext({ viewport: VIEWPORT });
  const context2 = await browser.newContext({ viewport: VIEWPORT });
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  const news1 = page1.locator('.landing-news').first();
  const news2 = page2.locator('section').filter({ hasText: 'News' }).first();
  const el1 = ${loc1Code};
  const el2 = ${loc2Code};

  await test.step('${stepLines[0] || '1. Open Site 1 in Chrome, viewport 1440x900, zoom 100%.'}', async () => {
    await page1.goto(SITE1_URL, { waitUntil: 'domcontentloaded' });
    await page1.waitForLoadState('load');
  });
  await test.step('${stepLines[1] || '2. Wait until the News section is visible.'}', async () => {
    await expect(news1, 'Site 1: News section NOT FOUND').toBeVisible();
  });
  await test.step('${stepLines[2] || '3. Locate: ' + tc['Element Under Test'] + '.'}', async () => {
    await expect(el1, 'Site 1: ${tc['Element Under Test']} NOT FOUND').toBeVisible();
  });
  await test.step('${stepLines[3] || '4. Hover over the element.'}', async () => {
    await el1.hover();
    await el1.evaluate(async (el) => {
      await new Promise((r) => setTimeout(r, 50));
      await Promise.all(el.getAnimations().map((a) => a.finished));
    });
    for (const prop of PROPS) {
      values1[prop] = await el1.evaluate(${READ_STYLE_SNIPPET}, prop);
    }
    await page1.mouse.move(0, 0);
  });
  await test.step('${stepLines[4] || '5. Read the computed values of: ' + props.join(', ') + ' on hover.'}', async () => {
    // Already read values1 on hover above
  });
  await test.step('${stepLines[5] || '6. Repeat steps 1-5 on Site 2 with the same viewport and zoom.'}', async () => {
    await page2.goto(SITE2_URL, { waitUntil: 'domcontentloaded' });
    await page2.waitForLoadState('load');
    await expect(news2, 'Site 2: News section NOT FOUND').toBeVisible();
    await expect(el2, 'Site 2: ${tc['Element Under Test']} NOT FOUND').toBeVisible();
    await el2.hover();
    await el2.evaluate(async (el) => {
      await new Promise((r) => setTimeout(r, 50));
      await Promise.all(el.getAnimations().map((a) => a.finished));
    });
    for (const prop of PROPS) {
      values2[prop] = await el2.evaluate(${READ_STYLE_SNIPPET}, prop);
    }
    await page2.mouse.move(0, 0);
  });
  await test.step('${stepLines[6] || '7. Repeat steps on Site 2 and compare.'}', async () => {
    for (const prop of PROPS) {
      const v1 = values1[prop] || '';
      const v2 = values2[prop] || '';
      const isPx = /^-?\\d+(\\.\\d+)?px$/.test(v1.trim()) && /^-?\\d+(\\.\\d+)?px$/.test(v2.trim());
      let diff = v1 === v2 ? '0' : 'changed';
      if (isPx) {
        const d = parseFloat(v2) - parseFloat(v1);
        diff = \`\${d >= 0 ? '+' : ''}\${d.toFixed(2)}px\`;
        expect.soft(Math.abs(d), \`\${prop}: Site 1 \${v1} vs Site 2 \${v2}\`).toBeLessThanOrEqual(TOLERANCE_PX);
      } else {
        expect.soft(v2.trim().toLowerCase(), \`\${prop}: Site 1 \${v1} vs Site 2 \${v2}\`).toBe(v1.trim().toLowerCase());
      }
      rows.push({ property: prop, site1: v1, site2: v2, diff });
    }
  });

  console.table(rows);
  await test.info().attach('css-diff', { body: JSON.stringify(rows, null, 2), contentType: 'application/json' });
  await context1.close();
  await context2.close();
});
`;
  } else if (id === 'TC33' || id === 'TC34' || id === 'TC36') {
    // Template C - Responsive tests
    const width = id === 'TC33' ? 768 : 375;
    const height = id === 'TC33' ? 1024 : 812;
    const props = expandProperties(tc['CSS Properties']);

    let loc1Code = `page1.locator('.landing-news .second-list').first()`;
    let loc2Code = `page2.locator('section').filter({ hasText: 'News' }).locator('.template-body').first()`;
    if (id === 'TC34') {
      loc1Code = `page1.locator('.landing-news').first()`;
      loc2Code = `page2.locator('section').filter({ hasText: 'News' }).locator('.template-body').first()`;
    } else if (id === 'TC36') {
      loc1Code = `page1.locator('.landing-news .title').first()`;
      loc2Code = `page2.locator('section').filter({ hasText: 'News' }).locator('.template-header').getByText('News', { exact: true }).first()`;
    }

    content = `import { test, expect } from '@playwright/test';

test('${id} - ${tc['Test Case']}', async ({ browser }) => {
  // Expected: ${tc['Expected Result']}
  const SITE1_URL = process.env.SITE1_URL;
  const SITE2_URL = process.env.SITE2_URL;
  if (!SITE1_URL || !SITE2_URL) throw new Error('Set SITE1_URL and SITE2_URL environment variables');
  const RESP_VIEWPORT = { width: ${width}, height: ${height} };
  const TOLERANCE_PX = 1;
  const PROPS = ${JSON.stringify(props)};
  const values1: Record<string, string> = {};
  const values2: Record<string, string> = {};
  const rows: { property: string; site1: string; site2: string; diff: string }[] = [];

  test.info().annotations.push(
    { type: 'section', description: '${tc.Section}' },
    { type: 'element', description: '${tc['Element Under Test']}' },
  );

  const context1 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const context2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  const news1 = page1.locator('.landing-news').first();
  const news2 = page2.locator('section').filter({ hasText: 'News' }).first();
  const el1 = ${loc1Code};
  const el2 = ${loc2Code};

  await test.step('${stepLines[0] || '1. Open Site 1 in Chrome, viewport 1440x900, zoom 100%.'}', async () => {
    await page1.goto(SITE1_URL, { waitUntil: 'domcontentloaded' });
    await page1.waitForLoadState('load');
  });
  await test.step('${stepLines[1] || '2. Wait until the News section is visible.'}', async () => {
    await expect(news1, 'Site 1: News section NOT FOUND').toBeVisible();
  });
  await test.step('${stepLines[2] || `3. Resize the viewport to ${width}x${height}.`}', async () => {
    await page1.setViewportSize(RESP_VIEWPORT);
    await expect(el1, 'Site 1: ${tc['Element Under Test']} NOT FOUND').toBeVisible();
  });
  await test.step('${stepLines[3] || '4. Read the computed values.'}', async () => {
    for (const prop of PROPS) {
      values1[prop] = await el1.evaluate(${READ_STYLE_SNIPPET}, prop);
    }
  });
  await test.step('${stepLines[4] || '5. Repeat steps on Site 2 with the same viewport.'}', async () => {
    await page2.goto(SITE2_URL, { waitUntil: 'domcontentloaded' });
    await page2.waitForLoadState('load');
    await expect(news2, 'Site 2: News section NOT FOUND').toBeVisible();
    await page2.setViewportSize(RESP_VIEWPORT);
    await expect(el2, 'Site 2: ${tc['Element Under Test']} NOT FOUND').toBeVisible();
    for (const prop of PROPS) {
      values2[prop] = await el2.evaluate(${READ_STYLE_SNIPPET}, prop);
    }
  });
  await test.step('${stepLines[5] || '6. Compare Site 1 and Site 2 values and record them.'}', async () => {
    for (const prop of PROPS) {
      const v1 = values1[prop] || '';
      const v2 = values2[prop] || '';
      const isPx = /^-?\\d+(\\.\\d+)?px$/.test(v1.trim()) && /^-?\\d+(\\.\\d+)?px$/.test(v2.trim());
      let diff = v1 === v2 ? '0' : 'changed';
      if (isPx) {
        const d = parseFloat(v2) - parseFloat(v1);
        diff = \`\${d >= 0 ? '+' : ''}\${d.toFixed(2)}px\`;
        expect.soft(Math.abs(d), \`\${prop}: Site 1 \${v1} vs Site 2 \${v2}\`).toBeLessThanOrEqual(TOLERANCE_PX);
      } else {
        expect.soft(v2.trim().toLowerCase(), \`\${prop}: Site 1 \${v1} vs Site 2 \${v2}\`).toBe(v1.trim().toLowerCase());
      }
      rows.push({ property: prop, site1: v1, site2: v2, diff });
    }
  });

  console.table(rows);
  await test.info().attach('css-diff', { body: JSON.stringify(rows, null, 2), contentType: 'application/json' });
  await context1.close();
  await context2.close();
});
`;
  } else {
    // Template A - Standard Style test
    let loc1Code = `page1.locator('.landing-news').first()`;
    let loc2Code = `page2.locator('section').filter({ hasText: 'News' }).first()`;
    let scrollBeforeCheck = false;

    const elName = tc['Element Under Test'].toLowerCase();
    if (elName.includes('section container')) {
      loc1Code = `page1.locator('.landing-news').first()`;
      loc2Code = `page2.locator('section').filter({ hasText: 'News' }).first()`;
    } else if (elName.includes('heading')) {
      loc1Code = `page1.locator('.landing-news .title').first()`;
      loc2Code = `page2.locator('section').filter({ hasText: 'News' }).locator('.template-header').getByText('News', { exact: true }).first()`;
    } else if (elName.includes('header wrapper')) {
      loc1Code = `page1.locator('.landing-news .waf-head').first()`;
      loc2Code = `page2.locator('section').filter({ hasText: 'News' }).locator('.template-header').first()`;
    } else if (elName.includes('more button')) {
      loc1Code = `page1.locator('.landing-news').getByRole('link', { name: 'More' }).first()`;
      loc2Code = `page2.locator('section').filter({ hasText: 'News' }).getByRole('link', { name: 'More' }).first()`;
    } else if (elName.includes('big card (first and second)')) {
      loc1Code = `page1.locator('.landing-news .first-list article').first()`;
      loc2Code = `page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article').first()`;
    } else if (elName.includes('big cards container')) {
      loc1Code = `page1.locator('.landing-news .first-list').first()`;
      loc2Code = `page2.locator('section').filter({ hasText: 'News' }).locator('.template-body').first()`;
    } else if (elName.includes('big card image')) {
      loc1Code = `page1.locator('.landing-news .first-list article img').first()`;
      loc2Code = `page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article img').first()`;
    } else if (elName.includes('big card title')) {
      loc1Code = `page1.locator('.landing-news .first-list article .article-title').first()`;
      loc2Code = `page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article').first().locator('p.body_lg_bold, p').first()`;
    } else if (elName.includes('small cards container')) {
      loc1Code = `page1.locator('.landing-news .second-list').first()`;
      loc2Code = `page2.locator('section').filter({ hasText: 'News' }).locator('.template-body').first()`;
    } else if (elName.includes('small card (all four)')) {
      loc1Code = `page1.locator('.landing-news .second-list article').first()`;
      loc2Code = `page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article').nth(2)`;
    } else if (elName.includes('small card image')) {
      loc1Code = `page1.locator('.landing-news .second-list article img').first()`;
      loc2Code = `page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article img').nth(2)`;
    } else if (elName.includes('small card title')) {
      loc1Code = `page1.locator('.landing-news .second-list article .article-title').first()`;
      loc2Code = `page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article').nth(2).locator('p.h2_bold, p').first()`;
    } else if (elName.includes('cards container')) {
      loc1Code = `page1.locator('.landing-news').first()`;
      loc2Code = `page2.locator('section').filter({ hasText: 'News' }).locator('.template-body').first()`;
    } else if (elName.includes('category label')) {
      loc1Code = `page1.locator('.landing-news article .meta-category').first()`;
      loc2Code = `page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article .badge-site').first()`;
    } else if (elName.includes('scroll-to-top')) {
      loc1Code = `page1.locator('.btn-top-scroll, button[aria-label="back to top"]').first()`;
      loc2Code = `page2.locator('.fx-scroll-top-btn, button[aria-label="Scroll to top"]').first()`;
      scrollBeforeCheck = true;
    }

    const props = expandProperties(tc['CSS Properties']);

    let extraAssertions = '';
    if (id === 'TC07') {
      extraAssertions = `
    // Assert equal width within each site for first and second card
    const b1_1 = await page1.locator('.landing-news .first-list article').first().boundingBox();
    const b1_2 = await page1.locator('.landing-news .first-list article').nth(1).boundingBox();
    if (b1_1 && b1_2) expect.soft(Math.abs(b1_2.width - b1_1.width), 'Site 1: Big card 1 vs card 2 width').toBeLessThanOrEqual(TOLERANCE_PX);

    const b2_1 = await page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article').first().boundingBox();
    const b2_2 = await page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article').nth(1).boundingBox();
    if (b2_1 && b2_2) expect.soft(Math.abs(b2_2.width - b2_1.width), 'Site 2: Big card 1 vs card 2 width').toBeLessThanOrEqual(TOLERANCE_PX);
`;
    } else if (id === 'TC08') {
      extraAssertions = `
    // Assert equal height within each site for first and second card
    const b1_1 = await page1.locator('.landing-news .first-list article').first().boundingBox();
    const b1_2 = await page1.locator('.landing-news .first-list article').nth(1).boundingBox();
    if (b1_1 && b1_2) expect.soft(Math.abs(b1_2.height - b1_1.height), 'Site 1: Big card 1 vs card 2 height').toBeLessThanOrEqual(TOLERANCE_PX);

    const b2_1 = await page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article').first().boundingBox();
    const b2_2 = await page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article').nth(1).boundingBox();
    if (b2_1 && b2_2) expect.soft(Math.abs(b2_2.height - b2_1.height), 'Site 2: Big card 1 vs card 2 height').toBeLessThanOrEqual(TOLERANCE_PX);
`;
    } else if (id === 'TC16') {
      extraAssertions = `
    // Assert equal width across all 4 small cards within each site
    const s1_cards = page1.locator('.landing-news .second-list article');
    const s1_box0 = await s1_cards.nth(0).boundingBox();
    for (let i = 1; i < 4; i++) {
      const b = await s1_cards.nth(i).boundingBox();
      if (s1_box0 && b) expect.soft(Math.abs(b.width - s1_box0.width), \`Site 1: Small card \${i} width\`).toBeLessThanOrEqual(TOLERANCE_PX);
    }
    const s2_cards = page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article');
    const s2_box2 = await s2_cards.nth(2).boundingBox();
    for (let i = 3; i <= 5; i++) {
      const b = await s2_cards.nth(i).boundingBox();
      if (s2_box2 && b) expect.soft(Math.abs(b.width - s2_box2.width), \`Site 2: Small card \${i} width\`).toBeLessThanOrEqual(TOLERANCE_PX);
    }
`;
    } else if (id === 'TC18') {
      extraAssertions = `
    // Assert equal image height across all 4 small cards within each site
    const s1_imgs = page1.locator('.landing-news .second-list article img');
    const s1_box0 = await s1_imgs.nth(0).boundingBox();
    for (let i = 1; i < 4; i++) {
      const b = await s1_imgs.nth(i).boundingBox();
      if (s1_box0 && b) expect.soft(Math.abs(b.height - s1_box0.height), \`Site 1: Small image \${i} height\`).toBeLessThanOrEqual(TOLERANCE_PX);
    }
    const s2_imgs = page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article img');
    const s2_box2 = await s2_imgs.nth(2).boundingBox();
    for (let i = 3; i <= 5; i++) {
      const b = await s2_imgs.nth(i).boundingBox();
      if (s2_box2 && b) expect.soft(Math.abs(b.height - s2_box2.height), \`Site 2: Small image \${i} height\`).toBeLessThanOrEqual(TOLERANCE_PX);
    }
`;
    }

    content = `import { test, expect } from '@playwright/test';

test('${id} - ${tc['Test Case']}', async ({ browser }) => {
  // Expected: ${tc['Expected Result']}
  const SITE1_URL = process.env.SITE1_URL;
  const SITE2_URL = process.env.SITE2_URL;
  if (!SITE1_URL || !SITE2_URL) throw new Error('Set SITE1_URL and SITE2_URL environment variables');
  const VIEWPORT = { width: 1440, height: 900 };
  const TOLERANCE_PX = 1;
  const PROPS = ${JSON.stringify(props)};
  const values1: Record<string, string> = {};
  const values2: Record<string, string> = {};
  const rows: { property: string; site1: string; site2: string; diff: string }[] = [];

  test.info().annotations.push(
    { type: 'section', description: '${tc.Section}' },
    { type: 'element', description: '${tc['Element Under Test']}' },
  );

  const context1 = await browser.newContext({ viewport: VIEWPORT });
  const context2 = await browser.newContext({ viewport: VIEWPORT });
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  const news1 = page1.locator('.landing-news').first();
  const news2 = page2.locator('section').filter({ hasText: 'News' }).first();
  const el1 = ${loc1Code};
  const el2 = ${loc2Code};

  await test.step('${stepLines[0] || '1. Open Site 1 in Chrome, viewport 1440x900, zoom 100%.'}', async () => {
    await page1.goto(SITE1_URL, { waitUntil: 'domcontentloaded' });
    await page1.waitForLoadState('load');
  });
  await test.step('${stepLines[1] || '2. Wait until the News section is visible.'}', async () => {
    await expect(news1, 'Site 1: News section NOT FOUND').toBeVisible();
    ${scrollBeforeCheck ? 'await page1.mouse.wheel(0, 1500);' : ''}
  });
  await test.step('${stepLines[2] || '3. Locate: ' + tc['Element Under Test'] + '.'}', async () => {
    await expect(el1, 'Site 1: ${tc['Element Under Test']} NOT FOUND').toBeVisible();
  });
  await test.step('${stepLines[3] || '4. Read the computed values of: ' + props.join(', ') + '.'}', async () => {
    for (const prop of PROPS) {
      values1[prop] = await el1.evaluate(${READ_STYLE_SNIPPET}, prop);
    }
  });
  await test.step('${stepLines[4] || '5. Repeat steps 1-4 on Site 2 with the same viewport and zoom.'}', async () => {
    await page2.goto(SITE2_URL, { waitUntil: 'domcontentloaded' });
    await page2.waitForLoadState('load');
    await expect(news2, 'Site 2: News section NOT FOUND').toBeVisible();
    ${scrollBeforeCheck ? 'await page2.mouse.wheel(0, 1500);' : ''}
    await expect(el2, 'Site 2: ${tc['Element Under Test']} NOT FOUND').toBeVisible();
    for (const prop of PROPS) {
      values2[prop] = await el2.evaluate(${READ_STYLE_SNIPPET}, prop);
    }
  });
  await test.step('${stepLines[5] || '6. Compare Site 1 and Site 2 values and record them.'}', async () => {
    for (const prop of PROPS) {
      const v1 = values1[prop] || '';
      const v2 = values2[prop] || '';
      const isPx = /^-?\\d+(\\.\\d+)?px$/.test(v1.trim()) && /^-?\\d+(\\.\\d+)?px$/.test(v2.trim());
      let diff = v1 === v2 ? '0' : 'changed';
      if (isPx) {
        const d = parseFloat(v2) - parseFloat(v1);
        diff = \`\${d >= 0 ? '+' : ''}\${d.toFixed(2)}px\`;
        expect.soft(Math.abs(d), \`\${prop}: Site 1 \${v1} vs Site 2 \${v2}\`).toBeLessThanOrEqual(TOLERANCE_PX);
      } else {
        expect.soft(v2.trim().toLowerCase(), \`\${prop}: Site 1 \${v1} vs Site 2 \${v2}\`).toBe(v1.trim().toLowerCase());
      }
      rows.push({ property: prop, site1: v1, site2: v2, diff });
    }
    ${extraAssertions}
  });

  console.table(rows);
  await test.info().attach('css-diff', { body: JSON.stringify(rows, null, 2), contentType: 'application/json' });
  await context1.close();
  await context2.close();
});
`;
  }

  fs.writeFileSync(filePath, content, 'utf-8');
}

console.log(`Generated ${tcs.length} test spec files in tests/flat/news/`);
