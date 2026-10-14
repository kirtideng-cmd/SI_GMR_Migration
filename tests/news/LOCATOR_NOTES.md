# News Section Playwright Locator Notes

This document describes the verified Playwright locators for both Site 1 (Source: `https://www.gmrsports.in/india-capitals`) and Site 2 (Migrated: `https://gmr.surface.fan-os.net/indiaCapitals`).

All locators prioritize accessibility and semantic structure (`getByRole`, `getByText`, and stable scoped structural selectors).

---

## 1. Section Container
- **Element Under Test**: News section container
- **Site 1 Locator**: `page1.locator('.landing-news').first()`
- **Site 2 Locator**: `page2.locator('section').filter({ has: page2.locator('.template-header', { hasText: 'News' }) }).first()` (or `page2.locator('section').filter({ hasText: 'News' }).nth(1)`)
- **Notes**: Site 1 wraps the section in `.landing-news`. On Site 2, the sticky navigation tabs above also contain text "NEWS", so scoping using `.filter({ has: page2.locator('.template-header', { hasText: 'News' }) })` accurately targets the News card section without collision.

---

## 2. Header & Navigation
- **Element Under Test**: Section heading (News)
  - **Site 1**: `page1.locator('.landing-news .title').first()`
  - **Site 2**: `page2.locator('section').filter({ hasText: 'News' }).locator('.template-header').getByText('News', { exact: true }).first()`

- **Element Under Test**: Header wrapper
  - **Site 1**: `page1.locator('.landing-news .waf-head').first()`
  - **Site 2**: `page2.locator('section').filter({ hasText: 'News' }).locator('.template-header').first()`
  - **Notes**: Wraps the heading on the left and the "More" button on the right.

- **Element Under Test**: "More" button
  - **Site 1**: `page1.locator('.landing-news').getByRole('link', { name: 'More' }).first()`
  - **Site 2**: `page2.locator('section').filter({ hasText: 'News' }).getByRole('link', { name: 'More' }).first()`

---

## 3. Big Cards (Featured Articles)
- **Element Under Test**: Big cards container
  - **Site 1**: `page1.locator('.landing-news .first-list').first()`
  - **Site 2**: `page2.locator('section').filter({ hasText: 'News' }).locator('.template-body').first()`

- **Element Under Test**: Big card (first and second)
  - **Site 1**: `page1.locator('.landing-news .first-list article')` (`.first()` and `.nth(1)`)
  - **Site 2**: `page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article')` (`.first()` and `.nth(1)`)
  - **Notes**: Site 1 separates big cards into `.first-list`. Site 2 uses a 4-column CSS grid where the first two articles each span 2 columns.

- **Element Under Test**: Big card image
  - **Site 1**: `page1.locator('.landing-news .first-list article img').first()`
  - **Site 2**: `page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article img').first()`

- **Element Under Test**: Big card title
  - **Site 1**: `page1.locator('.landing-news .first-list article .article-title').first()`
  - **Site 2**: `page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article').first().locator('p.body_lg_bold, p').first()`

---

## 4. Small Cards (Secondary Articles)
- **Element Under Test**: Small cards container
  - **Site 1**: `page1.locator('.landing-news .second-list').first()`
  - **Site 2**: `page2.locator('section').filter({ hasText: 'News' }).locator('.template-body').first()`

- **Element Under Test**: Small card (all four)
  - **Site 1**: `page1.locator('.landing-news .second-list article')` (indices 0 to 3)
  - **Site 2**: `page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article')` (indices 2 to 5)

- **Element Under Test**: Small card image
  - **Site 1**: `page1.locator('.landing-news .second-list article img').first()`
  - **Site 2**: `page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article').nth(2).locator('img').first()`

- **Element Under Test**: Small card title
  - **Site 1**: `page1.locator('.landing-news .second-list article .article-title').first()`
  - **Site 2**: `page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article').nth(2).locator('p.h2_bold, p').first()`

---

## 5. Category Label & Card Overlays
- **Element Under Test**: Category label (News)
  - **Site 1**: `page1.locator('.landing-news article .meta-category').first()`
  - **Site 2**: `page2.locator('section').filter({ hasText: 'News' }).locator('.template-body article .badge-site').first()`

---

## 6. Scroll-To-Top Button
- **Element Under Test**: Scroll-to-top button
  - **Site 1**: `page1.locator('.btn-top-scroll, button[aria-label="back to top"]').first()`
  - **Site 2**: `page2.locator('.fx-scroll-top-btn, button[aria-label="Scroll to top"]').first()`
  - **Notes**: On Site 2, this button is hidden (`opacity: 0` / `display: none`) upon initial page load. It becomes visible after the user scrolls down (e.g. `await page.mouse.wheel(0, 1500)`).
