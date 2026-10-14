import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface GapMeasurement {
  num: string;
  name: string;
  site1Px: number | 'NOT FOUND';
  site2Px: number | 'NOT FOUND';
  diff: string;
  status: 'MATCH' | 'MISMATCH' | 'NOT FOUND';
  box1?: { x: number; y: number; width: number; height: number };
  box2?: { x: number; y: number; width: number; height: number };
  direction: 'horizontal' | 'vertical';
}

const SITE1_URL = 'https://www.gmrsports.in/india-capitals';
const SITE2_URL = 'https://gmr.surface.fan-os.net/indiaCapitals';
const VIEWPORT = { width: 1440, height: 900 };

async function main() {
  console.log('=== Starting News Section Gap Blueprint Measurement ===');
  const blueprintDir = path.resolve('blueprint');
  if (!fs.existsSync(blueprintDir)) {
    fs.mkdirSync(blueprintDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const context1 = await browser.newContext({ viewport: VIEWPORT });
    const context2 = await browser.newContext({ viewport: VIEWPORT });
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    console.log(`1. Navigating to Site 1: ${SITE1_URL}`);
    await page1.goto(SITE1_URL, { waitUntil: 'domcontentloaded' });
    await Promise.race([
      page1.waitForLoadState('networkidle'),
      new Promise<void>((r) => setTimeout(r, 6000)),
    ]);

    console.log(`2. Navigating to Site 2: ${SITE2_URL}`);
    await page2.goto(SITE2_URL, { waitUntil: 'domcontentloaded' });
    await Promise.race([
      page2.waitForLoadState('networkidle'),
      new Promise<void>((r) => setTimeout(r, 6000)),
    ]);

    // Trigger scroll animations on Site 1 so .landing-news animates into view (opacity: 1, transform: none)
    console.log('  Triggering scroll animations on Site 1...');
    await page1.evaluate(async () => {
      for (let y = 0; y <= 2200; y += 200) {
        window.scrollTo(0, y);
        window.dispatchEvent(new Event('scroll'));
        await new Promise((r) => setTimeout(r, 50));
      }
      window.scrollTo(0, 0);
      window.dispatchEvent(new Event('scroll'));
    });
    await page1.evaluate(() => {
      const el = document.querySelector('.landing-news') as HTMLElement;
      if (el) {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.transition = 'none';
      }
      document.querySelectorAll('.landing-news *').forEach((c: any) => {
        if (c.style) {
          c.style.opacity = '1';
          c.style.transform = 'none';
        }
      });
    });

    // Locators
    const sec1 = page1.locator('.landing-news').first();
    const sec2 = page2.locator('section').filter({ has: page2.locator('.template-header', { hasText: 'News' }) }).first();

    await sec1.waitFor({ state: 'visible', timeout: 15000 });
    await sec2.waitFor({ state: 'visible', timeout: 15000 });

    // Confirm Site 2 articles are present
    console.log('  Waiting for Site 2 articles to hydrate...');
    const site2Articles = sec2.locator('.template-body article');
    await site2Articles.first().waitFor({ state: 'visible', timeout: 15000 });
    const site2ArticleCount = await site2Articles.count();
    console.log(`  Site 2 articles found: ${site2ArticleCount}`);

    // Confirm Site 1 articles are present
    const site1BigCards = sec1.locator('.first-list article');
    await site1BigCards.first().waitFor({ state: 'visible', timeout: 10000 });
    const site1SmallCards = sec1.locator('.second-list article');
    await site1SmallCards.first().waitFor({ state: 'visible', timeout: 10000 });

    // Ensure both pages are scrolled to top before extracting invariant document boxes
    await page1.evaluate(() => window.scrollTo(0, 0));
    await page2.evaluate(() => window.scrollTo(0, 0));

    // Helper to extract bounding boxes
    async function extractBoxes(page: any, isSite2: boolean) {
      const section = isSite2
        ? page.locator('section').filter({ has: page.locator('.template-header', { hasText: 'News' }) }).first()
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

      const hBox = (await heading.count()) > 0 ? await heading.boundingBox() : null;
      const bc0 = (await bigCards.count()) > 0 ? await bigCards.nth(0).boundingBox() : null;
      const bc1 = (await bigCards.count()) > 1 ? await bigCards.nth(1).boundingBox() : null;

      const scIndexOffset = isSite2 ? 2 : 0;
      const sc0 = (await smallCards.count()) > scIndexOffset ? await smallCards.nth(scIndexOffset).boundingBox() : null;
      const sc1 = (await smallCards.count()) > scIndexOffset + 1 ? await smallCards.nth(scIndexOffset + 1).boundingBox() : null;
      const sc2 = (await smallCards.count()) > scIndexOffset + 2 ? await smallCards.nth(scIndexOffset + 2).boundingBox() : null;
      const sc3 = (await smallCards.count()) > scIndexOffset + 3 ? await smallCards.nth(scIndexOffset + 3).boundingBox() : null;

      // Inside first small card:
      const cardEl = isSite2 ? smallCards.nth(2) : smallCards.nth(0);
      const imgEl = cardEl.locator('img').first();
      const titleEl = isSite2 ? cardEl.locator('p.h2_bold, p').first() : cardEl.locator('.article-title').first();
      const labelEl = isSite2 ? cardEl.locator('.badge-site, span:has-text("News")').first() : cardEl.locator('.meta-category').first();

      const imgBox = (await imgEl.count()) > 0 ? await imgEl.boundingBox() : null;
      const titleBox = (await titleEl.count()) > 0 ? await titleEl.boundingBox() : null;
      const labelBox = (await labelEl.count()) > 0 ? await labelEl.boundingBox() : null;

      const sBox = await section.boundingBox();

      return { sBox, hBox, bc0, bc1, sc0, sc1, sc2, sc3, imgBox, titleBox, labelBox };
    }

    const b1 = await extractBoxes(page1, false);
    const b2 = await extractBoxes(page2, true);

    if (!b1.sBox || !b2.sBox) {
      throw new Error('Could not find News section on one or both sites');
    }

  // Raw Gap Computations
  // 1. Left gutter: page left edge (x=0) to News section content (bc0.x)
  const g1_s1 = b1.bc0 ? b1.bc0.x : 'NOT FOUND';
  const g1_s2 = b2.bc0 ? b2.bc0.x : 'NOT FOUND';

  // 2. Right gutter: News section content to page right edge (1440 - bc1.right)
  const g2_s1 = b1.bc1 ? VIEWPORT.width - (b1.bc1.x + b1.bc1.width) : 'NOT FOUND';
  const g2_s2 = b2.bc1 ? VIEWPORT.width - (b2.bc1.x + b2.bc1.width) : 'NOT FOUND';

  // 3. Heading bottom to top of big cards
  const g3_s1 = b1.hBox && b1.bc0 ? b1.bc0.y - (b1.hBox.y + b1.hBox.height) : 'NOT FOUND';
  const g3_s2 = b2.hBox && b2.bc0 ? b2.bc0.y - (b2.hBox.y + b2.hBox.height) : 'NOT FOUND';

  // 4. Horizontal gap between the two big cards
  const g4_s1 = b1.bc0 && b1.bc1 ? b1.bc1.x - (b1.bc0.x + b1.bc0.width) : 'NOT FOUND';
  const g4_s2 = b2.bc0 && b2.bc1 ? b2.bc1.x - (b2.bc0.x + b2.bc0.width) : 'NOT FOUND';

  // 5. Vertical gap between big cards row and small cards row
  const g5_s1 = b1.bc0 && b1.sc0 ? b1.sc0.y - (b1.bc0.y + b1.bc0.height) : 'NOT FOUND';
  const g5_s2 = b2.bc0 && b2.sc0 ? b2.sc0.y - (b2.bc0.y + b2.bc0.height) : 'NOT FOUND';

  // 6a, 6b, 6c: Horizontal gap between small cards (1-2, 2-3, 3-4)
  const g6a_s1 = b1.sc0 && b1.sc1 ? b1.sc1.x - (b1.sc0.x + b1.sc0.width) : 'NOT FOUND';
  const g6a_s2 = b2.sc0 && b2.sc1 ? b2.sc1.x - (b2.sc0.x + b2.sc0.width) : 'NOT FOUND';

  const g6b_s1 = b1.sc1 && b1.sc2 ? b1.sc2.x - (b1.sc1.x + b1.sc1.width) : 'NOT FOUND';
  const g6b_s2 = b2.sc1 && b2.sc2 ? b2.sc2.x - (b2.sc1.x + b2.sc1.width) : 'NOT FOUND';

  const g6c_s1 = b1.sc2 && b1.sc3 ? b1.sc3.x - (b1.sc2.x + b1.sc2.width) : 'NOT FOUND';
  const g6c_s2 = b2.sc2 && b2.sc3 ? b2.sc3.x - (b2.sc2.x + b2.sc2.width) : 'NOT FOUND';

  // 7. Small card image bottom to its title top
  const g7_s1 = b1.imgBox && b1.titleBox ? b1.titleBox.y - (b1.imgBox.y + b1.imgBox.height) : 'NOT FOUND';
  const g7_s2 = b2.imgBox && b2.titleBox ? b2.titleBox.y - (b2.imgBox.y + b2.imgBox.height) : 'NOT FOUND';

  // 8. Small card title bottom to its "News" label top
  const g8_s1 = b1.titleBox && b1.labelBox ? b1.labelBox.y - (b1.titleBox.y + b1.titleBox.height) : 'NOT FOUND';
  const g8_s2 = b2.titleBox && b2.labelBox ? b2.labelBox.y - (b2.titleBox.y + b2.titleBox.height) : 'NOT FOUND';

  // 9. Bottom of the small cards to the end of the News section
  const sc1MaxBottom = Math.max(
    b1.sc0 ? b1.sc0.y + b1.sc0.height : 0,
    b1.sc1 ? b1.sc1.y + b1.sc1.height : 0,
    b1.sc2 ? b1.sc2.y + b1.sc2.height : 0,
    b1.sc3 ? b1.sc3.y + b1.sc3.height : 0
  );
  const sc2MaxBottom = Math.max(
    b2.sc0 ? b2.sc0.y + b2.sc0.height : 0,
    b2.sc1 ? b2.sc1.y + b2.sc1.height : 0,
    b2.sc2 ? b2.sc2.y + b2.sc2.height : 0,
    b2.sc3 ? b2.sc3.y + b2.sc3.height : 0
  );
  const g9_s1 = b1.sBox && sc1MaxBottom > 0 ? (b1.sBox.y + b1.sBox.height) - sc1MaxBottom : 'NOT FOUND';
  const g9_s2 = b2.sBox && sc2MaxBottom > 0 ? (b2.sBox.y + b2.sBox.height) - sc2MaxBottom : 'NOT FOUND';

  function createGap(
    num: string,
    name: string,
    v1: number | 'NOT FOUND',
    v2: number | 'NOT FOUND',
    direction: 'horizontal' | 'vertical',
    box1?: { x: number; y: number; width: number; height: number },
    box2?: { x: number; y: number; width: number; height: number }
  ): GapMeasurement {
    if (typeof v1 !== 'number' || typeof v2 !== 'number') {
      return { num, name, site1Px: v1, site2Px: v2, diff: 'N/A', status: 'NOT FOUND', direction, box1, box2 };
    }
    const diffNum = v2 - v1;
    const diff = `${diffNum >= 0 ? '+' : ''}${diffNum.toFixed(1)}px`;
    const status = Math.abs(diffNum) <= 1 ? 'MATCH' : 'MISMATCH';
    return {
      num,
      name,
      site1Px: Math.round(v1 * 10) / 10,
      site2Px: Math.round(v2 * 10) / 10,
      diff,
      status,
      direction,
      box1,
      box2,
    };
  }

  const measurements: GapMeasurement[] = [
    createGap(
      '1',
      'Left gutter (Page left edge to News content)',
      g1_s1,
      g1_s2,
      'horizontal',
      b1.bc0 ? { x: 0, y: b1.bc0.y, width: b1.bc0.x, height: b1.bc0.height } : undefined,
      b2.bc0 ? { x: 0, y: b2.bc0.y, width: b2.bc0.x, height: b2.bc0.height } : undefined
    ),
    createGap(
      '2',
      'Right gutter (News content to Page right edge)',
      g2_s1,
      g2_s2,
      'horizontal',
      b1.bc1 ? { x: b1.bc1.x + b1.bc1.width, y: b1.bc1.y, width: VIEWPORT.width - (b1.bc1.x + b1.bc1.width), height: b1.bc1.height } : undefined,
      b2.bc1 ? { x: b2.bc1.x + b2.bc1.width, y: b2.bc1.y, width: VIEWPORT.width - (b2.bc1.x + b2.bc1.width), height: b2.bc1.height } : undefined
    ),
    createGap(
      '3',
      'Heading ("News") bottom to top of big cards',
      g3_s1,
      g3_s2,
      'vertical',
      b1.hBox && b1.bc0 ? { x: b1.hBox.x, y: b1.hBox.y + b1.hBox.height, width: b1.hBox.width, height: b1.bc0.y - (b1.hBox.y + b1.hBox.height) } : undefined,
      b2.hBox && b2.bc0 ? { x: b2.hBox.x, y: b2.hBox.y + b2.hBox.height, width: b2.hBox.width, height: b2.bc0.y - (b2.hBox.y + b2.hBox.height) } : undefined
    ),
    createGap(
      '4',
      'Horizontal gap between the two big cards',
      g4_s1,
      g4_s2,
      'horizontal',
      b1.bc0 && b1.bc1 ? { x: b1.bc0.x + b1.bc0.width, y: b1.bc0.y, width: b1.bc1.x - (b1.bc0.x + b1.bc0.width), height: b1.bc0.height } : undefined,
      b2.bc0 && b2.bc1 ? { x: b2.bc0.x + b2.bc0.width, y: b2.bc0.y, width: b2.bc1.x - (b2.bc0.x + b2.bc0.width), height: b2.bc0.height } : undefined
    ),
    createGap(
      '5',
      'Vertical gap between big cards row and small cards row',
      g5_s1,
      g5_s2,
      'vertical',
      b1.bc0 && b1.sc0 ? { x: b1.bc0.x, y: b1.bc0.y + b1.bc0.height, width: b1.bc1 ? (b1.bc1.x + b1.bc1.width - b1.bc0.x) : b1.bc0.width, height: b1.sc0.y - (b1.bc0.y + b1.bc0.height) } : undefined,
      b2.bc0 && b2.sc0 ? { x: b2.bc0.x, y: b2.bc0.y + b2.bc0.height, width: b2.bc1 ? (b2.bc1.x + b2.bc1.width - b2.bc0.x) : b2.bc0.width, height: b2.sc0.y - (b2.bc0.y + b2.bc0.height) } : undefined
    ),
    createGap(
      '6a',
      'Horizontal gap between small cards (Card 1 - 2)',
      g6a_s1,
      g6a_s2,
      'horizontal',
      b1.sc0 && b1.sc1 ? { x: b1.sc0.x + b1.sc0.width, y: b1.sc0.y, width: b1.sc1.x - (b1.sc0.x + b1.sc0.width), height: b1.sc0.height } : undefined,
      b2.sc0 && b2.sc1 ? { x: b2.sc0.x + b2.sc0.width, y: b2.sc0.y, width: b2.sc1.x - (b2.sc0.x + b2.sc0.width), height: b2.sc0.height } : undefined
    ),
    createGap(
      '6b',
      'Horizontal gap between small cards (Card 2 - 3)',
      g6b_s1,
      g6b_s2,
      'horizontal',
      b1.sc1 && b1.sc2 ? { x: b1.sc1.x + b1.sc1.width, y: b1.sc1.y, width: b1.sc2.x - (b1.sc1.x + b1.sc1.width), height: b1.sc1.height } : undefined,
      b2.sc1 && b2.sc2 ? { x: b2.sc1.x + b2.sc1.width, y: b2.sc1.y, width: b2.sc2.x - (b2.sc1.x + b2.sc1.width), height: b2.sc1.height } : undefined
    ),
    createGap(
      '6c',
      'Horizontal gap between small cards (Card 3 - 4)',
      g6c_s1,
      g6c_s2,
      'horizontal',
      b1.sc2 && b1.sc3 ? { x: b1.sc2.x + b1.sc2.width, y: b1.sc2.y, width: b1.sc3.x - (b1.sc2.x + b1.sc2.width), height: b1.sc2.height } : undefined,
      b2.sc2 && b2.sc3 ? { x: b2.sc2.x + b2.sc2.width, y: b2.sc2.y, width: b2.sc3.x - (b2.sc2.x + b2.sc2.width), height: b2.sc2.height } : undefined
    ),
    createGap(
      '7',
      'Small card image bottom to its title top',
      g7_s1,
      g7_s2,
      'vertical',
      b1.imgBox && b1.titleBox ? { x: b1.imgBox.x, y: b1.imgBox.y + b1.imgBox.height, width: b1.imgBox.width, height: b1.titleBox.y - (b1.imgBox.y + b1.imgBox.height) } : undefined,
      b2.imgBox && b2.titleBox ? { x: b2.imgBox.x, y: b2.imgBox.y + b2.imgBox.height, width: b2.imgBox.width, height: b2.titleBox.y - (b2.imgBox.y + b2.imgBox.height) } : undefined
    ),
    createGap(
      '8',
      'Small card title bottom to its "News" label top',
      g8_s1,
      g8_s2,
      'vertical',
      b1.titleBox && b1.labelBox ? { x: b1.titleBox.x, y: b1.titleBox.y + b1.titleBox.height, width: b1.titleBox.width, height: b1.labelBox.y - (b1.titleBox.y + b1.titleBox.height) } : undefined,
      b2.titleBox && b2.labelBox ? { x: b2.titleBox.x, y: b2.titleBox.y + b2.titleBox.height, width: b2.titleBox.width, height: b2.labelBox.y - (b2.titleBox.y + b2.titleBox.height) } : undefined
    ),
    createGap(
      '9',
      'Bottom of small cards to end of News section',
      g9_s1,
      g9_s2,
      'vertical',
      b1.sBox && sc1MaxBottom > 0 ? { x: b1.sBox.x, y: sc1MaxBottom, width: b1.sBox.width, height: (b1.sBox.y + b1.sBox.height) - sc1MaxBottom } : undefined,
      b2.sBox && sc2MaxBottom > 0 ? { x: b2.sBox.x, y: sc2MaxBottom, width: b2.sBox.width, height: (b2.sBox.y + b2.sBox.height) - sc2MaxBottom } : undefined
    ),
  ];

  console.log('\n--- MEASURED GAPS TABLE ---');
  console.table(
    measurements.map((m) => ({
      '#': m.num,
      Gap: m.name,
      'Site 1 (px)': m.site1Px,
      'Site 2 (px)': m.site2Px,
      Diff: m.diff,
      Status: m.status,
    }))
  );

  const matchedCount = measurements.filter((m) => m.status === 'MATCH').length;
  const mismatchedCount = measurements.filter((m) => m.status === 'MISMATCH').length;
  console.log(`Total: ${measurements.length} | Matched: ${matchedCount} | Mismatched: ${mismatchedCount}`);

  // PART A: Inject Overlay and Capture Annotated Screenshots
  async function injectOverlayAndScreenshot(page: any, boxes: any, isSite2: boolean, outputPath: string) {
    const sBox = boxes.sBox;
    await page.evaluate(
      ({ sBox, boxes, measurements, isSite2 }: any) => {
        const existing = document.getElementById('gap-blueprint-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'gap-blueprint-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = document.documentElement.scrollHeight + 'px';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '999999';
        overlay.style.fontFamily = 'Inter, -apple-system, system-ui, sans-serif';

        // 1. Blue outlines for elements
        const elementBoxes = [
          boxes.hBox,
          boxes.bc0,
          boxes.bc1,
          boxes.sc0,
          boxes.sc1,
          boxes.sc2,
          boxes.sc3,
        ].filter(Boolean);

        for (const el of elementBoxes) {
          const div = document.createElement('div');
          div.style.position = 'absolute';
          div.style.left = el.x + 'px';
          div.style.top = el.y + 'px';
          div.style.width = el.width + 'px';
          div.style.height = el.height + 'px';
          div.style.border = '1.5px solid #2563eb';
          div.style.backgroundColor = 'rgba(37, 99, 235, 0.05)';
          div.style.boxSizing = 'border-box';
          div.style.borderRadius = '4px';
          overlay.appendChild(div);
        }

        // 2. Render each measured gap area
        measurements.forEach((m: any) => {
          const b = isSite2 ? m.box2 : m.box1;
          const pxVal = isSite2 ? m.site2Px : m.site1Px;
          if (!b || typeof pxVal !== 'number') return;

          const isMismatch = m.status === 'MISMATCH';
          const primaryColor = isMismatch ? '#dc2626' : '#ea580c';
          const bgColor = isMismatch ? 'rgba(239, 68, 68, 0.32)' : 'rgba(249, 115, 22, 0.28)';

          const gapDiv = document.createElement('div');
          gapDiv.style.position = 'absolute';
          gapDiv.style.left = b.x + 'px';
          gapDiv.style.top = b.y + 'px';
          // If height/width is 0 or very small, enforce minimal rendering dimension so dimension line/badge is visible
          const renderWidth = Math.max(b.width, 2);
          const renderHeight = Math.max(b.height, 2);
          gapDiv.style.width = renderWidth + 'px';
          gapDiv.style.height = renderHeight + 'px';
          gapDiv.style.backgroundColor = bgColor;
          gapDiv.style.border = `1.5px dashed ${primaryColor}`;
          gapDiv.style.boxSizing = 'border-box';
          gapDiv.style.display = 'flex';
          gapDiv.style.alignItems = 'center';
          gapDiv.style.justifyContent = 'center';

          // Badge
          const badge = document.createElement('div');
          badge.style.position = 'absolute';
          badge.style.backgroundColor = isMismatch ? '#dc2626' : '#ea580c';
          badge.style.color = '#ffffff';
          badge.style.fontSize = '11px';
          badge.style.fontWeight = '700';
          badge.style.padding = '2px 5px';
          badge.style.borderRadius = '4px';
          badge.style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)';
          badge.style.whiteSpace = 'nowrap';
          badge.style.zIndex = '1000';
          badge.innerText = `#${m.num}: ${pxVal}px`;

          // If gap is zero or tiny, position badge slightly outside
          if (b.height <= 4 && m.direction === 'vertical') {
            badge.style.top = '-16px';
          } else if (b.width <= 4 && m.direction === 'horizontal') {
            badge.style.left = '4px';
          }

          gapDiv.appendChild(badge);

          // SVG Dimension Lines with arrows
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('style', `position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: visible;`);
          svg.innerHTML = `
            <defs>
              <marker id="arrow-${m.num}-${isSite2 ? '2' : '1'}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="${primaryColor}" />
              </marker>
            </defs>
          `;

          if (m.direction === 'horizontal' && b.width >= 12) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', '2');
            line.setAttribute('y1', String(renderHeight / 2));
            line.setAttribute('x2', String(renderWidth - 2));
            line.setAttribute('y2', String(renderHeight / 2));
            line.setAttribute('stroke', primaryColor);
            line.setAttribute('stroke-width', '1.5');
            line.setAttribute('marker-start', `url(#arrow-${m.num}-${isSite2 ? '2' : '1'})`);
            line.setAttribute('marker-end', `url(#arrow-${m.num}-${isSite2 ? '2' : '1'})`);
            svg.appendChild(line);
          } else if (m.direction === 'vertical' && b.height >= 12) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', String(renderWidth / 2));
            line.setAttribute('y1', '2');
            line.setAttribute('x2', String(renderWidth / 2));
            line.setAttribute('y2', String(renderHeight - 2));
            line.setAttribute('stroke', primaryColor);
            line.setAttribute('stroke-width', '1.5');
            line.setAttribute('marker-start', `url(#arrow-${m.num}-${isSite2 ? '2' : '1'})`);
            line.setAttribute('marker-end', `url(#arrow-${m.num}-${isSite2 ? '2' : '1'})`);
            svg.appendChild(line);
          }

          gapDiv.appendChild(svg);
          overlay.appendChild(gapDiv);
        });

        document.body.appendChild(overlay);
      },
      { sBox, boxes, measurements, isSite2 }
    );

    // Expand viewport height so Playwright can capture the entire section height without cutting off at 900px
    const neededHeight = Math.ceil(sBox.y + sBox.height + 200);
    await page.setViewportSize({ width: VIEWPORT.width, height: neededHeight });
    await page.waitForTimeout(300);

    // Capture screenshot clipped to the section (full 1440 width)
    const clipY = Math.max(0, sBox.y - 15);
    const clipHeight = sBox.height + 30;
    await page.screenshot({
      clip: { x: 0, y: clipY, width: VIEWPORT.width, height: clipHeight },
      path: outputPath,
    });
    console.log(`Saved screenshot: ${outputPath}`);
  }

  const site1ImgPath = path.join(blueprintDir, 'site1-gaps.png');
  const site2ImgPath = path.join(blueprintDir, 'site2-gaps.png');

  await injectOverlayAndScreenshot(page1, b1, false, site1ImgPath);
  await injectOverlayAndScreenshot(page2, b2, true, site2ImgPath);

  // PART B: Build SVG Wireframe
  function buildWireframeSvg(boxes: any, isSite2: boolean): string {
    const sBox = boxes.sBox;
    const offsetY = sBox.y - 15;
    const svgWidth = 1440;
    const svgHeight = Math.round(sBox.height + 30);

    const relY = (y: number) => Math.round((y - offsetY) * 10) / 10;
    const round = (n: number) => Math.round(n * 10) / 10;

    const rects: string[] = [];

    // Background container
    rects.push(`<rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/>`);

    // Section outline
    rects.push(
      `<rect x="${round(sBox.x)}" y="${relY(sBox.y)}" width="${round(sBox.width)}" height="${round(sBox.height)}" fill="none" stroke="#94a3b8" stroke-dasharray="4 4" stroke-width="1"/>`
    );

    // Elements (Heading, big cards, small cards)
    const elements = [
      { name: 'Heading (News)', b: boxes.hBox },
      { name: 'Big Card 1', b: boxes.bc0 },
      { name: 'Big Card 2', b: boxes.bc1 },
      { name: 'Small Card 1', b: boxes.sc0 },
      { name: 'Small Card 2', b: boxes.sc1 },
      { name: 'Small Card 3', b: boxes.sc2 },
      { name: 'Small Card 4', b: boxes.sc3 },
    ];

    for (const el of elements) {
      if (!el.b) continue;
      rects.push(
        `<g>
          <rect x="${round(el.b.x)}" y="${relY(el.b.y)}" width="${round(el.b.width)}" height="${round(el.b.height)}" fill="#e2e8f0" stroke="#64748b" stroke-width="1.5" rx="4"/>
          <text x="${round(el.b.x + el.b.width / 2)}" y="${relY(el.b.y + el.b.height / 2 + 4)}" font-size="11" font-weight="600" fill="#475569" text-anchor="middle" font-family="system-ui">${el.name}</text>
        </g>`
      );
    }

    // Gap dimension boxes and labels
    const gapElements: string[] = [];
    measurements.forEach((m) => {
      const b = isSite2 ? m.box2 : m.box1;
      const pxVal = isSite2 ? m.site2Px : m.site1Px;
      if (!b || typeof pxVal !== 'number') return;

      const isMismatch = m.status === 'MISMATCH';
      const col = isMismatch ? '#dc2626' : '#ea580c';
      const fillCol = isMismatch ? 'rgba(239, 68, 68, 0.22)' : 'rgba(249, 115, 22, 0.2)';
      const gy = relY(b.y);
      const gw = Math.max(b.width, 2);
      const gh = Math.max(b.height, 2);

      gapElements.push(
        `<rect x="${round(b.x)}" y="${gy}" width="${round(gw)}" height="${round(gh)}" fill="${fillCol}" stroke="${col}" stroke-dasharray="3 3" stroke-width="1.5"/>`
      );

      // Dimension lines
      if (m.direction === 'horizontal' && b.width >= 10) {
        gapElements.push(
          `<line x1="${round(b.x + 2)}" y1="${round(gy + gh / 2)}" x2="${round(b.x + gw - 2)}" y2="${round(gy + gh / 2)}" stroke="${col}" stroke-width="1.5"/>`
        );
      } else if (m.direction === 'vertical' && b.height >= 8) {
        gapElements.push(
          `<line x1="${round(b.x + gw / 2)}" y1="${round(gy + 2)}" x2="${round(b.x + gw / 2)}" y2="${round(gy + gh - 2)}" stroke="${col}" stroke-width="1.5"/>`
        );
      }

      // Badge
      const textX = round(b.x + gw / 2);
      let textY = round(gy + gh / 2 + 4);
      if (b.height <= 6 && m.direction === 'vertical') {
        textY = round(gy - 6);
      }
      gapElements.push(
        `<g>
          <rect x="${round(textX - 28)}" y="${round(textY - 11)}" width="56" height="16" rx="3" fill="${col}"/>
          <text x="${textX}" y="${textY}" fill="#ffffff" font-size="9" font-weight="bold" text-anchor="middle" font-family="system-ui">#${m.num}: ${pxVal}px</text>
        </g>`
      );
    });

    return `<svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" style="background:#fff; border-radius:8px; border:1px solid #e2e8f0; display:block;">
      ${rects.join('\n')}
      ${gapElements.join('\n')}
    </svg>`;
  }

  const wireframeSvg1 = buildWireframeSvg(b1, false);
  const wireframeSvg2 = buildWireframeSvg(b2, true);

  // PART C: Assemble HTML Blueprint Report
  const site1Base64 = fs.readFileSync(site1ImgPath).toString('base64');
  const site2Base64 = fs.readFileSync(site2ImgPath).toString('base64');

  const now = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>News Section Gap Blueprint - Visual Comparison</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --card-border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #38bdf8;
      --orange: #f97316;
      --red: #ef4444;
      --green: #22c55e;
      --blue: #3b82f6;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #f1f5f9;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 32px 24px;
      line-height: 1.5;
    }
    .container {
      max-width: 1480px;
      margin: 0 auto;
    }
    header {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px 32px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .meta-badges {
      display: flex;
      gap: 12px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-vp { background: #e0f2fe; color: #0369a1; }
    .badge-date { background: #f1f5f9; color: #475569; }

    .urls-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      padding-top: 12px;
      border-top: 1px solid #f1f5f9;
      font-size: 13px;
    }
    .url-item strong { color: #475569; margin-right: 6px; }
    .url-item a { color: #2563eb; text-decoration: none; word-break: break-all; }
    .url-item a:hover { text-decoration: underline; }

    /* Summary cards */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .summary-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .summary-card .label {
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .summary-card .value {
      font-size: 32px;
      font-weight: 800;
      margin-top: 4px;
    }
    .card-total .value { color: #0f172a; }
    .card-match .value { color: #16a34a; }
    .card-mismatch .value { color: #dc2626; }

    /* Legend */
    .legend-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 24px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 32px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .legend-title {
      font-weight: 700;
      font-size: 13px;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .legend-items {
      display: flex;
      gap: 24px;
      font-size: 13px;
      align-items: center;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .legend-swatch {
      width: 18px;
      height: 18px;
      border-radius: 4px;
    }
    .swatch-element { border: 2px solid #2563eb; background: rgba(37,99,235,0.1); }
    .swatch-match { border: 2px dashed #ea580c; background: rgba(249,115,22,0.3); }
    .swatch-mismatch { border: 2px dashed #dc2626; background: rgba(239,68,68,0.35); }

    /* Comparison sections */
    .section-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .section-header {
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-header h2 {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
    }
    .section-header .sub {
      font-size: 13px;
      color: #64748b;
    }

    .side-by-side {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .site-col {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
    }
    .site-title {
      font-size: 14px;
      font-weight: 700;
      color: #334155;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .site-tag {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .site1-tag { background: #dbeafe; color: #1e40af; }
    .site2-tag { background: #fef3c7; color: #92400e; }

    .img-preview {
      width: 100%;
      height: auto;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      display: block;
      background: #ffffff;
    }

    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      text-align: left;
    }
    th {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
      padding: 12px 16px;
      border-bottom: 2px solid #e2e8f0;
    }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
    }
    tr.mismatch-row {
      background-color: #fef2f2;
    }
    tr.mismatch-row:hover {
      background-color: #fee2e2;
    }
    tr.match-row:hover {
      background-color: #f8fafc;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      text-align: center;
    }
    .status-match { background: #dcfce7; color: #15803d; }
    .status-mismatch { background: #fee2e2; color: #b91c1c; }

    .diff-badge {
      font-weight: 700;
      font-family: monospace;
    }
    .diff-mismatch { color: #dc2626; }
    .diff-match { color: #16a34a; }

    footer {
      text-align: center;
      color: #94a3b8;
      font-size: 13px;
      margin-top: 32px;
    }
  </style>
</head>
<body>

<div class="container">

  <!-- Header -->
  <header>
    <div class="header-top">
      <div>
        <h1>News Section Gap Blueprint</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Visual comparison of real rendered spacing and bounding box coordinates</p>
      </div>
      <div class="meta-badges">
        <span class="badge badge-vp">Viewport: 1440 × 900</span>
        <span class="badge badge-date">${now}</span>
      </div>
    </div>
    <div class="urls-grid">
      <div class="url-item">
        <strong>Site 1 (Source):</strong>
        <a href="${SITE1_URL}" target="_blank">${SITE1_URL}</a>
      </div>
      <div class="url-item">
        <strong>Site 2 (Migrated):</strong>
        <a href="${SITE2_URL}" target="_blank">${SITE2_URL}</a>
      </div>
    </div>
  </header>

  <!-- Summary Cards -->
  <div class="summary-grid">
    <div class="summary-card card-total">
      <div class="label">Total Gaps Measured</div>
      <div class="value">${measurements.length}</div>
    </div>
    <div class="summary-card card-match">
      <div class="label">Matched (Diff &le; 1px)</div>
      <div class="value">${matchedCount}</div>
    </div>
    <div class="summary-card card-mismatch">
      <div class="label">Mismatched Gaps</div>
      <div class="value">${mismatchedCount}</div>
    </div>
  </div>

  <!-- Legend -->
  <div class="legend-box">
    <div class="legend-title">Legend</div>
    <div class="legend-items">
      <div class="legend-item">
        <div class="legend-swatch swatch-element"></div>
        <span>Elements (Cards, Heading)</span>
      </div>
      <div class="legend-item">
        <div class="legend-swatch swatch-match"></div>
        <span>MATCH (&le; 1px diff)</span>
      </div>
      <div class="legend-item">
        <div class="legend-swatch swatch-mismatch"></div>
        <span>MISMATCH (&gt; 1px diff)</span>
      </div>
    </div>
  </div>

  <!-- Part A: Annotated Screenshots -->
  <div class="section-card">
    <div class="section-header">
      <h2>Part A: Annotated Screenshots with Measured Gap Overlays</h2>
      <div class="sub">Rendered directly from Playwright live browser with SVG dimension arrows and px badges</div>
    </div>
    <div class="side-by-side">
      <div class="site-col">
        <div class="site-title">
          <span>Site 1: Live News Section</span>
          <span class="site-tag site1-tag">Source (1440px)</span>
        </div>
        <img class="img-preview" src="data:image/png;base64,${site1Base64}" alt="Site 1 Annotated Gaps Screenshot" />
      </div>
      <div class="site-col">
        <div class="site-title">
          <span>Site 2: Live News Section</span>
          <span class="site-tag site2-tag">Migrated (1440px)</span>
        </div>
        <img class="img-preview" src="data:image/png;base64,${site2Base64}" alt="Site 2 Annotated Gaps Screenshot" />
      </div>
    </div>
  </div>

  <!-- Part B: Wireframe Blueprint -->
  <div class="section-card">
    <div class="section-header">
      <h2>Part B: Wireframe Blueprints (SVG Geometry)</h2>
      <div class="sub">Simplified structural wireframe scaled to identical 1440px width with rendered dimension lines</div>
    </div>
    <div class="side-by-side">
      <div class="site-col">
        <div class="site-title">
          <span>Site 1 Wireframe Geometry</span>
          <span class="site-tag site1-tag">Source Wireframe</span>
        </div>
        ${wireframeSvg1}
      </div>
      <div class="site-col">
        <div class="site-title">
          <span>Site 2 Wireframe Geometry</span>
          <span class="site-tag site2-tag">Migrated Wireframe</span>
        </div>
        ${wireframeSvg2}
      </div>
    </div>
  </div>

  <!-- Gap Measurement Table -->
  <div class="section-card">
    <div class="section-header">
      <h2>Detailed Gap Measurements & Status</h2>
      <div class="sub">Real bounding box distances (Site 2 minus Site 1). Tolerances: &plusmn;1px = MATCH</div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 50px;">#</th>
          <th>Gap Description</th>
          <th style="width: 140px;">Site 1 (px)</th>
          <th style="width: 140px;">Site 2 (px)</th>
          <th style="width: 140px;">Diff (px)</th>
          <th style="width: 130px; text-align: center;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${measurements
          .map((m) => {
            const isMismatch = m.status === 'MISMATCH';
            return `<tr class="${isMismatch ? 'mismatch-row' : 'match-row'}">
              <td><strong>${m.num}</strong></td>
              <td>${m.name}</td>
              <td><code>${typeof m.site1Px === 'number' ? m.site1Px + 'px' : m.site1Px}</code></td>
              <td><code>${typeof m.site2Px === 'number' ? m.site2Px + 'px' : m.site2Px}</code></td>
              <td class="diff-badge ${isMismatch ? 'diff-mismatch' : 'diff-match'}">${m.diff}</td>
              <td style="text-align: center;">
                <span class="status-badge ${isMismatch ? 'status-mismatch' : 'status-match'}">${m.status}</span>
              </td>
            </tr>`;
          })
          .join('\n')}
      </tbody>
    </table>
  </div>

  <footer>
    Generated by Antigravity Playwright Gap Blueprint Engine &bull; All screenshots embedded as self-contained base64
  </footer>

</div>

</body>
</html>`;

  const htmlPath = path.join(blueprintDir, 'gap-blueprint.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
  console.log(`\nSuccessfully generated: ${htmlPath}`);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
