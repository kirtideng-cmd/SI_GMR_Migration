---
name: news-css-flat-tests
description: Converts the manual News section CSS test cases (Excel sheet) into flat, one-file-per-test-case Playwright TypeScript specs that compare two sites, then runs all of them and reports results. Use when asked to automate, generate or run the News CSS test cases from the manual test case workbook.
---

# News CSS manual test cases -> flat Playwright tests

Turn every row of the manual test case workbook into its own self-contained Playwright
spec file, run them all, and report which CSS properties differ between Site 1 and Site 2.

## Inputs (ask only if missing)
- Manual test case workbook (.xlsx), sheet "News CSS Test Cases". Columns used:
  TC ID, Section, Test Case, Element Under Test, CSS Properties, Test Steps, Expected Result.
- `SITE1_URL` and `SITE2_URL` (read from environment variables inside every test).

Never overwrite the original workbook. Treat it as read-only input.

## Hard rules
1. **One test case = one spec file = one `test()`.** 34 rows means 34 files. No file holds two cases.
2. **Flat.** Everything the test needs is inside that one file: URLs, viewport, tolerance,
   property list, locators, steps, comparison logic and assertions.
   - No page objects, no helper or utility modules, no shared fixtures, no custom
     reporters, no imports other than `@playwright/test`.
   - Do not use, read, copy from or import any existing `compare.ts` or similar comparison script.
   - Small inline arrow functions or loops inside the test body are fine.
3. **Playwright methods only.** Use `page.goto`, `page.locator`, `getByRole`, `getByText`,
   `getByAltText`, `locator.filter`, `locator.nth`, `locator.hover`, `locator.evaluate`,
   `locator.boundingBox`, `page.setViewportSize`, `page.evaluate`, `test.step`, and
   Playwright assertions (`expect(locator).toBeVisible()`, `toHaveCSS()`, `expect.soft`).
   No Selenium, Cypress, Puppeteer or raw `document.querySelector` outside `evaluate`.
4. **No fixed sleeps.** Never use `waitForTimeout`. Rely on auto-waiting, web-first
   assertions (they retry) and `locator.waitFor()`.
5. **Steps are preserved.** Each line of the "Test Steps" cell becomes one `await test.step('<step text>', ...)`.
6. **Soft assertions for property checks.** Use `expect.soft` so one run reports every
   differing property instead of stopping at the first.
7. **Never weaken tests to get a pass.** No `test.skip`, `test.fixme`, `.only`, `try/catch`
   that swallows failures, raised tolerance, or removed properties. A real CSS difference
   is a legitimate FAIL.
8. **A missing element is a FAIL**, with a clear message like `Site 2: Scroll-to-top button NOT FOUND`.
   Do not skip the test and do not report it as a CSS difference.

## Anti-loop rules (important)
- **If a test case fails because the CSS really differs between the two sites, do NOT force it
  to pass.** Do not edit the assertions, tolerance, properties, locators or expected values
  to make it green. Do not re-run it repeatedly hoping for a different result.
- Record the failure (TC ID and the differing properties with Site 1, Site 2 and Diff values)
  and **move on to the next test case immediately.**
- A CSS-difference failure is a valid, final result. It is never a reason to retry or "fix" the test.
- Only a **locator or setup problem** (element NOT FOUND, wrong element matched, timeout waiting
  for the page) may be fixed, and at most **2 attempts per test**. If it is still failing after
  2 attempts, mark it as "Locator issue - needs manual check" in the summary and move on.
- Never run the same failing test more than 3 times in total in this session.
- Never get stuck on one test case. Always finish generating and running all the others first.

## Workflow

### Step 1 - Set up (only what is missing)
- If there is no Playwright project: `npm init -y`, `npm i -D @playwright/test typescript`,
  `npx playwright install chromium`.
- Create `playwright.config.ts` if absent (config only, not test code):

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/news',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'results/report.json' }]],
  use: {
    headless: true,
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

### Step 2 - Read the workbook
Read every data row (skip the header). Keep the TC ID, Section, Test Case, Element Under
Test, CSS Properties, Test Steps and Expected Result for each. Confirm the row count
before generating anything.

### Step 3 - Discover locators on both live sites
The two sites have different DOM and class names, so each test needs its own locator for
Site 1 (`loc1`) and Site 2 (`loc2`).
- Open both sites in the browser tool (or `npx playwright codegen <url>`) and find stable locators.
- Preference order: `getByRole` > `getByText` / `getByAltText` > `locator('section').filter({ has: ... })`
  > a stable `data-*` attribute > structural `locator('section').nth(n)`.
- Avoid utility-class selectors (Tailwind-style names such as `pt-spacing_0`, `flex-col`)
  and long generated class chains. They break easily.
- Check that every locator resolves to exactly the intended element (use `.first()` or
  `.nth()` deliberately and comment why).
- Save findings in `tests/news/LOCATOR_NOTES.md` for humans. The tests do not import it;
  each test still hardcodes its own locators.

Elements to locate on each site: News section container, section heading, "More" button,
header wrapper, big card (two), big card image, big card title, small card (four), small
card image, small card title, category label ("News"), cards containers, scroll-to-top
button (may only appear after scrolling, so scroll first with `page.mouse.wheel` and wait for it).

### Step 4 - Generate one spec per test case
- Path and name: `tests/news/<TC-ID>-<kebab-case-test-case>.spec.ts`,
  e.g. `tests/news/TC09-gap-between-the-two-cards.spec.ts`.
- Test title starts with the TC ID: `test('TC09 - Gap between the two cards', ...)`.
- Put Section and Element as annotations, and the Expected Result as a comment.
- Pick the template below by test type:

| Test type | Test cases | Template |
|---|---|---|
| Style | most cases | A |
| Hover | cases that say hover | B |
| Responsive | tablet / mobile / font scaling | C |
| No horizontal scroll | the overflow-x case | D |

Extra comparisons when the case wording says "equal", "same" or "all":
also assert equality **within each site** (e.g. both big cards have the same width and the
four small cards have the same height, using `boundingBox()`), in addition to Site 1 vs Site 2.

Comparison rules (inline in every test):
- Numeric px values: pass if `|site2 - site1| <= TOLERANCE_PX` (1px). Diff shown as `+x.xxpx` or `-x.xxpx`.
- All other values (color, font-family, position, display, object-fit...): must be exactly
  equal, asserted with `toHaveCSS` on Site 2 using the Site 1 value. Diff shown as `changed`.
- Do not compare `border-style` or border color when the border width is 0px (invisible).
  Compare `border-width` instead, or skip those sub-properties, and say so in a comment.
- Multi-value properties (padding, margin, border-radius): read the longhand properties
  (`padding-top`, `padding-right`...) so each side is compared separately.
- Element missing on a site: fail with the NOT FOUND message from rule 8.

#### Template A - style test (copy and adapt)
```ts
import { test, expect } from '@playwright/test';

test('TC09 - Gap between the two cards', async ({ browser }) => {
  // Expected: Gap between the two cards is identical on both sites (+/-1px).
  const SITE1_URL = process.env.SITE1_URL;
  const SITE2_URL = process.env.SITE2_URL;
  if (!SITE1_URL || !SITE2_URL) throw new Error('Set SITE1_URL and SITE2_URL environment variables');
  const VIEWPORT = { width: 1440, height: 900 };
  const TOLERANCE_PX = 1;
  const PROPS = ['column-gap', 'row-gap'];
  const values1: Record<string, string> = {};
  const values2: Record<string, string> = {};
  const rows: { property: string; site1: string; site2: string; diff: string }[] = [];

  test.info().annotations.push(
    { type: 'section', description: 'Big cards' },
    { type: 'element', description: 'Big cards container' },
  );

  const context1 = await browser.newContext({ viewport: VIEWPORT });
  const context2 = await browser.newContext({ viewport: VIEWPORT });
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  // Locators (site specific)
  const news1 = page1.getByText('News', { exact: true }).first();
  const news2 = page2.getByText('News', { exact: true }).first();
  const el1 = page1.locator('REPLACE_WITH_SITE1_LOCATOR');
  const el2 = page2.locator('REPLACE_WITH_SITE2_LOCATOR');

  await test.step('1. Open Site 1 in Chrome, viewport 1440x900, zoom 100%.', async () => {
    await page1.goto(SITE1_URL);
  });
  await test.step('2. Wait until the News section is visible.', async () => {
    await expect(news1, 'Site 1: News section NOT FOUND').toBeVisible();
  });
  await test.step('3. Locate: Big cards container.', async () => {
    await expect(el1, 'Site 1: Big cards container NOT FOUND').toBeVisible();
  });
  await test.step('4. Read the computed values of: column-gap, row-gap.', async () => {
    for (const prop of PROPS) {
      values1[prop] = await el1.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);
    }
  });
  await test.step('5. Repeat steps 1-4 on Site 2 with the same viewport and zoom.', async () => {
    await page2.goto(SITE2_URL);
    await expect(news2, 'Site 2: News section NOT FOUND').toBeVisible();
    await expect(el2, 'Site 2: Big cards container NOT FOUND').toBeVisible();
    for (const prop of PROPS) {
      values2[prop] = await el2.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);
    }
  });
  await test.step('6. Compare Site 1 and Site 2 values and record them.', async () => {
    for (const prop of PROPS) {
      const v1 = values1[prop];
      const v2 = values2[prop];
      const isPx = /^-?\d+(\.\d+)?px$/.test(v1.trim()) && /^-?\d+(\.\d+)?px$/.test(v2.trim());
      let diff = v1 === v2 ? '0' : 'changed';
      if (isPx) {
        const d = parseFloat(v2) - parseFloat(v1);
        diff = `${d >= 0 ? '+' : ''}${d.toFixed(2)}px`;
        expect.soft(Math.abs(d), `${prop}: Site 1 ${v1} vs Site 2 ${v2}`).toBeLessThanOrEqual(TOLERANCE_PX);
      } else {
        await expect.soft(el2, `${prop}: Site 1 ${v1}`).toHaveCSS(prop, v1);
      }
      rows.push({ property: prop, site1: v1, site2: v2, diff });
    }
  });

  console.table(rows);
  await test.info().attach('css-diff', { body: JSON.stringify(rows, null, 2), contentType: 'application/json' });
  await context1.close();
  await context2.close();
});
```

#### Template B - hover test
Same as A, but in the read step on each site, before reading:
```ts
await el1.hover();
// wait for CSS transitions to finish, no fixed sleep
await el1.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
// read hover values, then:
await page1.mouse.move(0, 0); // move away
```
Add a final check that the non-hover style returns after moving the mouse away.

#### Template C - responsive test
Same as A, but step 3 is `await page1.setViewportSize({ width: 768, height: 1024 })` (or
`375 x 812`), then wait for the element to be visible again before reading. Do the same
on Site 2 with the same size. For "2 per row" or "1 column" cases, also assert layout with
`boundingBox()`: count how many cards share the same `y` value in a row.
For the font-scaling case, read `font-size` at 1440 and at 375 on each site and assert
the 375 value is less than or equal to the 1440 value, and that Site 1 and Site 2 match.

#### Template D - no horizontal scroll
For each width in `[1440, 768, 375]` on each site:
```ts
await page.setViewportSize({ width, height: 900 });
const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
expect.soft(scrollWidth, `Site X at ${width}px`).toBeLessThanOrEqual(width);
```

### Step 5 - Run everything
- `SITE1_URL=<url1> SITE2_URL=<url2> npx playwright test`
  (on Windows PowerShell set `$env:SITE1_URL` and `$env:SITE2_URL` first).
- Run all spec files, not a sample.
- If a test fails because of a locator problem (NOT FOUND, wrong element, timeout), fix the
  locator in that file and re-run only that file. Maximum 2 fix attempts per test, then
  mark it "Locator issue - needs manual check" and move on.
- If a test fails because the CSS values really differ, leave it as FAIL, note it, and move
  on to the next test case. Do not edit the test and do not re-run it (see Anti-loop rules).

### Step 6 - Report
1. Collect results from `results/report.json`. Match each test to its TC ID by the title prefix.
   For each test, decode the `css-diff` attachment to get the Property | Site 1 | Site 2 | Diff rows.
2. Write `results/summary.md` with:
   - Totals: Passed, Failed, Not found (locator issues), Total.
   - A table: TC ID | Test Case | Status | Number of differing properties.
   - For every FAIL, a table of only the differing rows: Property | Site 1 | Site 2 | Diff.
3. Write a **copy** of the workbook named `News_CSS_Test_Cases_Results.xlsx` and fill, for each
   TC ID: Site 1 Value, Site 2 Value (short summary of the differing values), Status
   (Pass or Fail) and Remarks. Keep every other cell as it was.
4. Final message to the user: counts, the list of failed TC IDs with their top differences,
   any locators that needed fixing, and the paths of the generated files.

## Final checklist (verify before finishing)
- [ ] Number of spec files equals the number of workbook rows, each TC ID appears once.
- [ ] Each spec imports only from `@playwright/test`.
- [ ] No `waitForTimeout`, `test.skip`, `test.fixme`, `.only`, or empty `catch`.
- [ ] Each "Test Steps" line appears as a `test.step`.
- [ ] Every test attaches `css-diff` and prints `console.table`.
- [ ] No reference to any existing `compare.ts`.
- [ ] Every test was actually executed, and the summary numbers match the Playwright run.
- [ ] No test was edited or re-run just because its CSS values differed (anti-loop rules respected).
