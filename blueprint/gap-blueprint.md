# News Section Gap Blueprint - Visual Comparison Report

**Description**: Visual comparison and real rendered gap measurement report showing how spacing in the News section is mismatched between Site 1 and Site 2.  
**Source Site (Site 1)**: [https://www.gmrsports.in/india-capitals](https://www.gmrsports.in/india-capitals)  
**Migrated Site (Site 2)**: [https://gmr.surface.fan-os.net/indiaCapitals](https://gmr.surface.fan-os.net/indiaCapitals)  
**Viewport**: `1440 × 900` (Zoom 100%)  
**HTML Blueprint File**: [`blueprint/gap-blueprint.html`](file:///c:/Users/Kirti.Deng/Desktop/Sports%20Interactive/TestScripts/blueprint/gap-blueprint.html)  

---

## Executive Summary

- **Total Gaps Measured**: 11
- **Matched (Tolerance ±1px)**: 4 (36.4%)
- **Mismatched**: 7 (63.6%)
- **Measurement Methodology**: Measured using real rendered bounding-box (`boundingBox()`) coordinates in Playwright, bypassing CSS `gap` property differences (e.g. margin vs flex vs grid).

---

## Annotated Visual Screenshots

| Site 1: Source (`https://www.gmrsports.in/india-capitals`) | Site 2: Migrated (`https://gmr.surface.fan-os.net/indiaCapitals`) |
| :---: | :---: |
| [`blueprint/site1-gaps.png`](file:///c:/Users/Kirti.Deng/Desktop/Sports%20Interactive/TestScripts/blueprint/site1-gaps.png) | [`blueprint/site2-gaps.png`](file:///c:/Users/Kirti.Deng/Desktop/Sports%20Interactive/TestScripts/blueprint/site2-gaps.png) |

---

## Measured Gaps Table

| # | Gap Description | Site 1 (px) | Site 2 (px) | Diff | Status | Root Cause & Impact |
| :-: | :--- | :-: | :-: | :-: | :-: | :--- |
| **1** | **Left gutter** (Page left edge to News content) | `165.0px` | `120.0px` | `-45.0px` | ⚠️ **MISMATCH** | Content container on Site 2 is wider (`1200px` vs `1110px`), reducing side gutters. |
| **2** | **Right gutter** (News content to Page right edge) | `165.0px` | `120.0px` | `-45.0px` | ⚠️ **MISMATCH** | Symmetric with left gutter; content is centered but wider on Site 2. |
| **3** | **Heading ("News") bottom to top of big cards** | `15.0px` | `0.0px` | `-15.0px` | ⚠️ **MISMATCH** | On Site 2, big cards touch the heading wrapper directly with zero vertical separation. |
| **4** | **Horizontal gap between the two big cards** | `15.0px` | `16.0px` | `+1.0px` | ✅ **MATCH** | Within ±1px tolerance. Site 2 grid gap is `16px` vs Site 1's `15px`. |
| **5** | **Vertical gap between big cards row & small cards row** | `30.0px` | `16.0px` | `-14.0px` | ⚠️ **MISMATCH** | Site 1 separates lists with `30px`; Site 2 uniform grid uses `16px`, compressing row spacing by almost half. |
| **6a** | **Horizontal gap between small cards (Card 1 - 2)** | `15.0px` | `16.0px` | `+1.0px` | ✅ **MATCH** | Within ±1px tolerance. |
| **6b** | **Horizontal gap between small cards (Card 2 - 3)** | `15.0px` | `16.0px` | `+1.0px` | ✅ **MATCH** | Within ±1px tolerance. |
| **6c** | **Horizontal gap between small cards (Card 3 - 4)** | `15.0px` | `16.0px` | `+1.0px` | ✅ **MATCH** | Within ±1px tolerance. |
| **7** | **Small card image bottom to its title top** | `7.5px` | `0.0px` | `-7.5px` | ⚠️ **MISMATCH** | Site 2 title text is attached directly to the bottom of the image with zero margin/padding. |
| **8** | **Small card title bottom to its "News" label top** | `13.0px` | `0.0px` | `-13.0px` | ⚠️ **MISMATCH** | Site 1 has `10px` title margin + line height; Site 2 label touches title text with zero gap. |
| **9** | **Bottom of small cards to end of News section** | `30.0px` | `32.0px` | `+2.0px` | ⚠️ **MISMATCH** | Site 2 bottom padding is `32px` vs Site 1's `30px`. |

---

## Key Spacing Findings

1. **Outer Content Bounds**:
   - Site 1 content area width: `1110px` (`1440 - 165 - 165 = 1110px`).
   - Site 2 content area width: `1200px` (`1440 - 120 - 120 = 1200px`).
   - Site 2 is `90px` wider in total content span on desktop.

2. **Row Rhythm Compression**:
   - Site 1 has two separate visual rhythms: a tight `15px` horizontal element gap and an airy `30px` vertical section rhythm (heading-to-cards, row-to-row, cards-to-footer).
   - Site 2 flattened everything into a uniform `16px` grid gap, causing vertical elements to feel cramped.

3. **Card Internal Collisions**:
   - Site 2 cards completely lack internal vertical spacing between child elements (image → title is `0px`, title → category badge is `0px`), causing text and badges to crowd together.
