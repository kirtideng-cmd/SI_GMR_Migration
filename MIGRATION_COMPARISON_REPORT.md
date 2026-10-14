# Website Migration Comparative Analysis Report
**Target Section**: News Section  
**Source Site (Site 1)**: [https://www.gmrsports.in/india-capitals](https://www.gmrsports.in/india-capitals)  
**Migrated Site (Site 2)**: [https://gmr.surface.fan-os.net/indiaCapitals](https://gmr.surface.fan-os.net/indiaCapitals)  
**Viewport**: `1440 × 900` (Desktop, Zoom 100%)  
**Generated On**: October 14, 2026  

---

## Executive Summary

This report consolidates two comparative audit streams performed on the **News** component migration:
1. **Spatial Layout & Gap Blueprint Report** ([`blueprint/gap-blueprint.html`](file:///c:/Users/Kirti.Deng/Desktop/Sports%20Interactive/TestScripts/blueprint/gap-blueprint.html)): Real rendered space and bounding-box measurements across all elements, gutter margins, row spacings, and inner card gaps.
2. **CSS Computed Style Diff Report** ([`diff-report.html`](file:///c:/Users/Kirti.Deng/Desktop/Sports%20Interactive/TestScripts/diff-report.html)): Element-by-element computed style analysis across typography, color palettes, borders, padding, and dimensional sizing.

### High-Level Statistics

| Audit Category | Total Evaluated | Matched / Passing | Differences / Mismatches | Health / Match Rate |
| :--- | :---: | :---: | :---: | :---: |
| **Spatial Gaps & Gutters** | 11 measurements | 4 | 7 | **36.4% Match** |
| **UI Components (CSS Styles)** | 9 elements | 0 | 9 (80 style diffs) | **0% Exact Match** |
| **Grand Total Style Differences** | 80 properties | - | 80 | - |

---

## Part 1: Visual Gap Blueprint & Spacing Analysis

All gap measurements reflect **real rendered coordinates** (`boundingBox()`) rather than CSS `gap` rules, accurately capturing whitespace whether created by margins, paddings, flex alignments, or CSS grid gutters.

### Visual Evidence & Artifacts
- **Site 1 Annotated Blueprint**: [`blueprint/site1-gaps.png`](file:///c:/Users/Kirti.Deng/Desktop/Sports%20Interactive/TestScripts/blueprint/site1-gaps.png)
- **Site 2 Annotated Blueprint**: [`blueprint/site2-gaps.png`](file:///c:/Users/Kirti.Deng/Desktop/Sports%20Interactive/TestScripts/blueprint/site2-gaps.png)
- **Interactive Blueprint Report**: [`blueprint/gap-blueprint.html`](file:///c:/Users/Kirti.Deng/Desktop/Sports%20Interactive/TestScripts/blueprint/gap-blueprint.html)

### Measured Gaps Summary Table

| # | Gap Description | Direction | Site 1 (Source) | Site 2 (Migrated) | Difference | Status | Root Cause / Layout Impact |
| :-: | :--- | :-: | :-: | :-: | :-: | :-: | :--- |
| **1** | **Left Gutter** (Viewport edge to News content) | Horizontal | `165.0px` | `120.0px` | **-45.0px** | ⚠️ **MISMATCH** | Site 2 container has wider content bounds (`1200px` vs `1110px`), reducing side margins. |
| **2** | **Right Gutter** (News content to Viewport edge) | Horizontal | `165.0px` | `120.0px` | **-45.0px** | ⚠️ **MISMATCH** | Content is centered on both, but Site 2 content spans wider across desktop screens. |
| **3** | **Heading Bottom to Top of Big Cards** | Vertical | `15.0px` | `0.0px` | **-15.0px** | ⚠️ **MISMATCH** | On Site 2, big cards immediately touch the header wrapper with zero margin-top. |
| **4** | **Horizontal Gap between Big Cards** | Horizontal | `15.0px` | `16.0px` | **+1.0px** | ✅ **MATCH** | Within ±1px tolerance. Site 2 grid uses `gap: 16px` vs Site 1 margin `15px`. |
| **5** | **Vertical Gap between Big & Small Card Rows** | Vertical | `30.0px` | `16.0px` | **-14.0px** | ⚠️ **MISMATCH** | Site 1 has `30px` separation between lists; Site 2 uniform grid uses `16px`. |
| **6a** | **Horizontal Gap: Small Card 1 – 2** | Horizontal | `15.0px` | `16.0px` | **+1.0px** | ✅ **MATCH** | Within ±1px tolerance. |
| **6b** | **Horizontal Gap: Small Card 2 – 3** | Horizontal | `15.0px` | `16.0px` | **+1.0px** | ✅ **MATCH** | Within ±1px tolerance. |
| **6c** | **Horizontal Gap: Small Card 3 – 4** | Horizontal | `15.0px` | `16.0px` | **+1.0px** | ✅ **MATCH** | Within ±1px tolerance. |
| **7** | **Small Card Image Bottom to Title Top** | Vertical | `7.5px` | `0.0px` | **-7.5px** | ⚠️ **MISMATCH** | Site 2 card text directly abuts image bottom without vertical spacing. |
| **8** | **Small Card Title Bottom to Category Label Top** | Vertical | `13.0px` | `0.0px` | **-13.0px** | ⚠️ **MISMATCH** | Site 1 has `10px` margin + `3px` line spacing; Site 2 label touches title bottom. |
| **9** | **Bottom of Small Cards to Section End** | Vertical | `30.0px` | `32.0px` | **+2.0px** | ⚠️ **MISMATCH** | Site 2 section padding bottom is `32px` vs Site 1's `30px`. |

---

## Part 2: CSS Computed Style Differences (Detailed Breakdown)

Computed style differences extracted across all 9 UI elements in the News section. All differences reflect values computed in the browser engine at `1440px` desktop width.

### Summary of Differences by Element

| Element Under Test | Differences Count | Primary Divergences |
| :--- | :---: | :--- |
| **1. Section Heading ("News")** | 4 | Color (`#00327a` vs `#00248f`), Height (`28px` vs `56px`) |
| **2. "More" Button** | 9 | Font-weight, padding, border radius (`5px` vs `8px`), background color |
| **3. Big Card Container** | 9 | Dimensions (`547.5px` vs `592px`), typography, position mode |
| **4. Big Card Title** | 6 | Font-size (`20px` vs `16px`), font-weight (`600` vs `700`), width |
| **5. Small Card Container** | 9 | Dimensions (`266.25px` vs `288px`), margins, typography |
| **6. Small Card Title** | 8 | Font-size (`14px` vs `18px`), font-weight (`600` vs `700`), height |
| **7. Category Label ("News")** | 8 | Font-size, font-weight (`400` vs `700`), color transparency |
| **8. Card Image** | 9 | Image sizing (`547.5×308px` vs `592×254px`), `object-fit` (`fill` vs `contain`) |
| **9. Scroll-to-Top Button** | 18 | **Missing completely** on Site 2 DOM (`NOT FOUND`) |
| **Total Differences** | **80** | |

---

### Detailed Element Diff Tables

#### 1. Section Heading (`News`)
- **Site 1 Locator**: `page1.locator('.landing-news .title').first()`
- **Site 2 Locator**: `page2.locator('section').filter({ has: page2.locator('.template-header', { hasText: 'News' }) }).locator('.template-header').getByText('News', { exact: true }).first()`

| Property | Site 1 (Source) | Site 2 (Migrated) | Difference |
| :--- | :--- | :--- | :--- |
| `color` | `rgb(0, 50, 122)` | `rgb(0, 36, 143)` | Changed (dark navy `#00327a` to royal blue `#00248f`) |
| `border` | `0px none rgb(0, 50, 122)` | `0px solid rgb(0, 36, 143)` | Changed |
| `width` | `52.48px` | `53.17px` | `+0.69px` |
| `height` | `28px` | `56px` | `+28.00px` (due to line-height/padding on Site 2) |

---

#### 2. "More" Button
- **Site 1 Locator**: `page1.locator('.landing-news').getByRole('link', { name: 'More' }).first()`
- **Site 2 Locator**: `page2.locator('section').filter({ has: page2.locator('.template-header', { hasText: 'News' }) }).getByRole('link', { name: 'More' }).first()`

| Property | Site 1 (Source) | Site 2 (Migrated) | Difference |
| :--- | :--- | :--- | :--- |
| `font-weight` | `600` | `700` | `+100` (Semi-bold to Bold) |
| `line-height` | `18px` | `20px` | `+2.00px` |
| `color` | `rgb(225, 10, 21)` | `rgb(221, 8, 22)` | Changed (Subtle red shift) |
| `padding` | `7.5px` | `4px 8px` | `top -3.5px, right +0.5px, bottom -3.5px, left +0.5px` |
| `border` | `1px solid rgb(225, 10, 21)` | `2px solid rgb(235, 20, 20)` | Border doubled from `1px` to `2px` |
| `border-radius` | `5px` | `8px` | `+3.00px` (More rounded on Site 2) |
| `background` | `rgba(0, 0, 0, 0)` (Transparent) | `rgb(242, 242, 242)` (Light grey) | Changed from transparent to solid background |
| `width` | `50px` | `49.97px` | `-0.03px` |
| `height` | `25px` | `32px` | `+7.00px` |

---

#### 3. Big Card (Featured Article Card)
- **Site 1 Locator**: `page1.locator('.landing-news .first-list article').first()`
- **Site 2 Locator**: `page2.locator('section').filter({ has: page2.locator('.template-header', { hasText: 'News' }) }).locator('.template-body article').first()`

| Property | Site 1 (Source) | Site 2 (Migrated) | Difference |
| :--- | :--- | :--- | :--- |
| `font-size` | `14px` | `16px` | `+2.00px` |
| `line-height` | `normal` | `24px` | Changed |
| `color` | `rgb(0, 50, 122)` | `rgb(0, 0, 0)` | Changed from navy blue to pure black |
| `font-family` | `manrope` | `ui-sans-serif, system-ui, sans-serif, ...` | Changed from custom font to system stack |
| `margin` | `7.5px` | `0px` | `-7.50px` |
| `border` | `0px none rgb(0, 50, 122)` | `0px solid rgb(0, 0, 0)` | Changed |
| `position` | `static` | `relative` | Changed |
| `width` | `547.5px` | `592px` | `+44.50px` (Site 2 card is significantly wider) |
| `height` | `307.97px` | `253.7px` | `-54.27px` (Site 2 card is shorter) |

---

#### 4. Big Card Title
- **Site 1 Locator**: `page1.locator('.landing-news .first-list article .article-title').first()`
- **Site 2 Locator**: `page2.locator('section').filter({ has: page2.locator('.template-header', { hasText: 'News' }) }).locator('.template-body article').first().locator('p.body_lg_bold, p').first()`

| Property | Site 1 (Source) | Site 2 (Migrated) | Difference |
| :--- | :--- | :--- | :--- |
| `font-size` | `20px` | `16px` | **-4.00px** (Substantially smaller on Site 2) |
| `font-weight` | `600` | `700` | `+100` |
| `line-height` | `normal` | `26px` | Changed |
| `border` | `0px none rgb(255, 255, 255)` | `0px solid rgb(255, 255, 255)` | Changed |
| `width` | `517.5px` | `592px` | `+74.50px` |
| `height` | `54px` | `52px` | `-2.00px` |

---

#### 5. Small Card (Secondary Article Card)
- **Site 1 Locator**: `page1.locator('.landing-news .second-list article').first()`
- **Site 2 Locator**: `page2.locator('section').filter({ has: page2.locator('.template-header', { hasText: 'News' }) }).locator('.template-body article').nth(2)`

| Property | Site 1 (Source) | Site 2 (Migrated) | Difference |
| :--- | :--- | :--- | :--- |
| `font-size` | `14px` | `16px` | `+2.00px` |
| `line-height` | `normal` | `24px` | Changed |
| `color` | `rgb(0, 50, 122)` | `rgb(0, 0, 0)` | Changed from navy blue to pure black |
| `font-family` | `manrope` | `ui-sans-serif, system-ui, sans-serif, ...` | Changed |
| `margin` | `7.5px 7.5px 15px` | `0px` | `top -7.5px, right -7.5px, bottom -15px, left -7.5px` |
| `border` | `0px none rgb(0, 50, 122)` | `0px solid rgb(0, 0, 0)` | Changed |
| `position` | `static` | `relative` | Changed |
| `width` | `266.25px` | `288px` | `+21.75px` (Wider on Site 2) |
| `height` | `224.27px` | `195.42px` | `-28.85px` (Shorter on Site 2) |

---

#### 6. Small Card Title
- **Site 1 Locator**: `page1.locator('.landing-news .second-list article .article-title').first()`
- **Site 2 Locator**: `page2.locator('section').filter({ has: page2.locator('.template-header', { hasText: 'News' }) }).locator('.template-body article').nth(2).locator('p.h2_bold, p').first()`

| Property | Site 1 (Source) | Site 2 (Migrated) | Difference |
| :--- | :--- | :--- | :--- |
| `font-size` | `14px` | `18px` | **+4.00px** (Site 2 small card title is larger!) |
| `font-weight` | `600` | `700` | `+100` |
| `line-height` | `normal` | `24px` | Changed |
| `color` | `rgb(0, 2, 13)` | `rgb(26, 26, 26)` | Changed (Near-black `#00020d` to `#1a1a1a`) |
| `margin` | `0px 0px 10px` | `0px` | `bottom -10px` (Site 2 lacks title bottom margin) |
| `border` | `0px none rgb(0, 2, 13)` | `0px solid rgb(26, 26, 26)` | Changed |
| `width` | `266.25px` | `288px` | `+21.75px` |
| `height` | `38px` | `48px` | `+10.00px` |

---

#### 7. Category Label / Badge
- **Site 1 Locator**: `page1.locator('.landing-news .second-list article .meta-category').first()`
- **Site 2 Locator**: `page2.locator('section').filter({ has: page2.locator('.template-header', { hasText: 'News' }) }).locator('.template-body article').nth(2).locator('.badge-site, span').first()`

| Property | Site 1 (Source) | Site 2 (Migrated) | Difference |
| :--- | :--- | :--- | :--- |
| `font-size` | `11px` | `12px` | `+1.00px` |
| `font-weight` | `400` | `700` | `+300` (Regular to Bold) |
| `line-height` | `13.2px` | `16px` | `+2.80px` |
| `color` | `rgba(255, 255, 255, 0.5)` | `rgb(175, 184, 197)` | Changed from semi-transparent white to opaque muted slate |
| `border` | `0px none rgba(255, 255, 255, 0.5)` | `0px solid rgb(175, 184, 197)` | Changed |
| `position` | `static` | `relative` | Changed |
| `width` | `100%` | `31.91px` | Changed (Full-width inline container vs auto badge) |
| `height` | `auto` | `16px` | Changed |

---

#### 8. Card Image
- **Site 1 Locator**: `page1.locator('.landing-news .first-list article img').first()`
- **Site 2 Locator**: `page2.locator('section').filter({ has: page2.locator('.template-header', { hasText: 'News' }) }).locator('.template-body article img').first()`

| Property | Site 1 (Source) | Site 2 (Migrated) | Difference |
| :--- | :--- | :--- | :--- |
| `font-size` | `12px` | `16px` | `+4.00px` |
| `line-height` | `normal` | `24px` | Changed |
| `color` | `rgba(0, 50, 122, 0.7)` | `rgb(0, 0, 0)` | Changed |
| `font-family` | `manrope` | `ui-sans-serif, system-ui, sans-serif, ...` | Changed |
| `border` | `0px none rgba(0, 50, 122, 0.7)` | `0px solid rgb(0, 0, 0)` | Changed |
| `position` | `absolute` | `static` | Changed (Site 1 positions image absolute in card) |
| `width` | `547.5px` | `592px` | `+44.50px` |
| `height` | `307.97px` | `253.7px` | `-54.27px` |
| `object-fit` | `fill` | `contain` | **Changed (`fill` stretches, `contain` pillarboxes)** |

---

#### 9. Scroll-to-Top Floating Button
- **Site 1 Locator**: `page1.locator('.back-to-top, .scroll-to-top, a[href="#top"]').first()`
- **Site 2 Locator**: Attempted identical selector and `button:has-text("Top")`

| Property | Site 1 (Source) | Site 2 (Migrated) | Difference |
| :--- | :--- | :--- | :--- |
| *All 18 CSS Properties* | Present (e.g., `40×40px`, yellow-orange `#f5a500`, fixed bottom-right) | **NOT FOUND** | ❌ **Component missing from Site 2 DOM** |

---

## Part 3: Architecture & Engineering Takeaways

### 1. Grid vs Flexbox Layout Discrepancies
- **Site 1**: Built using a traditional 2-row container approach (`.first-list` containing 2 big cards, `.second-list` containing 4 small cards) separated with `margin-bottom: 30px`.
- **Site 2**: Built using a single Next.js CSS Grid (`grid-template-columns: repeat(4, 1fr)` with uniform `gap: 16px`).
  - The big cards span `col-span-2`, giving them a gap of `16px` (matches Site 1's `15px`).
  - However, the vertical gap between row 1 and row 2 is constrained to `16px` (grid row-gap), losing Site 1's `30px` section rhythm.

### 2. Inverted Title Hierarchy
- **Site 1**: Big Card Title is **`20px`**, Small Card Title is **`14px`** (Clear visual hierarchy: big cards are 42% larger).
- **Site 2**: Big Card Title is **`16px`**, Small Card Title is **`18px`** (Inverted hierarchy: small card titles are actually larger than featured card titles!).

### 3. Missing Inner Spacing & Padding
- **Site 2** small cards have completely eliminated bottom margins between the image, the title, and the category badge (`0px` vs `7.5px` and `13px`), causing text elements to collide visually.

### 4. Image Aspect Ratios and Sizing
- **Site 1**: Big images render at `547.5 × 308px` (16:9 ratio, `1.77`).
- **Site 2**: Big images render at `592 × 253.7px` (21:9 wide cinema ratio, `2.33`), combined with `object-fit: contain` which creates black/empty side bars rather than edge-to-edge fills.

### 5. Font Stack Divergence
- **Site 1** loads and applies the custom `manrope` font family across all cards and text.
- **Site 2** falls back to default `ui-sans-serif, system-ui, sans-serif` system fonts, altering character widths, letter-spacing, and line heights throughout.

---

## Part 4: Recommended Action Items for Remediation

1. **Restore Section Rhythm**:
   - Set row gap between big and small cards to `30px` (or use two separate grid rows).
   - Add `15px` margin-bottom to the header wrapper to separate the "News" heading from the big cards.
2. **Fix Typography Hierarchy**:
   - Increase Big Card Title to `20px` / `line-height: 28px`.
   - Reduce Small Card Title to `14px` / `line-height: 20px`.
   - Import and apply `Manrope` font-family on Site 2.
3. **Inner Card Spacing**:
   - Add `margin-top: 8px` on the small card title.
   - Add `margin-top: 10px` on the category badge.
4. **Image Ratio**:
   - Adjust big card aspect ratio to `16:9` (`592px × 333px`) and use `object-fit: cover` or `fill`.
5. **Component Parity**:
   - Re-introduce the floating scroll-to-top button on Site 2.
